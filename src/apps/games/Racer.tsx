import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GameToolbar, bestScore, beep } from "./shared";
import { Icon } from "../../components/Icon";
type Engine = {
  start: () => void;
  stop: () => void;
  reset: () => void;
  keys: Set<string>;
};
export default function Racer({ active }: { active: boolean }) {
  const mount = useRef<HTMLDivElement>(null);
  const engine = useRef<Engine | null>(null);
  const [running, setRunning] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [best, setBest] = useState(() => bestScore("racer"));
  const [error, setError] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = mount.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      setError(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor(0x080912);
    host.append(renderer.domElement);
    renderer.domElement.setAttribute("aria-label", "3D night highway");
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x090c18, 0.012);
    const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 450);
    camera.position.set(0, 4.2, 10);
    camera.lookAt(0, 0.4, -30);
    scene.add(new THREE.HemisphereLight(0x999aca, 0x12111b, 2));
    const sun = new THREE.DirectionalLight(0xbbb8dd, 2.5);
    sun.position.set(10, 25, 15);
    scene.add(sun);
    const materials: THREE.Material[] = [],
      geometries: THREE.BufferGeometry[] = [];
    const mat = (color: number, emissive = 0) => {
      const m = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.55,
        metalness: 0.4,
        emissive,
        emissiveIntensity: 0.8,
      });
      materials.push(m);
      return m;
    };
    const asphalt = mat(0x171822),
      metal = mat(0x3f4050),
      white = mat(0xbfc1d3, 0x525365),
      blue = mat(0x343b71),
      glass = mat(0x101522),
      red = mat(0xaa302e, 0xe63223),
      light = mat(0xf8d9b4, 0xe9c39a);
    function box(
      w: number,
      h: number,
      d: number,
      m: THREE.Material,
      x: number,
      y: number,
      z: number,
      parent: THREE.Object3D = scene,
    ) {
      const geometry = new THREE.BoxGeometry(w, h, d);
      geometries.push(geometry);
      const mesh = new THREE.Mesh(geometry, m);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    }
    box(20, 0.15, 500, asphalt, 0, -0.12, -220);
    box(2, 0.2, 500, metal, -11, 0, -220);
    box(2, 0.2, 500, metal, 11, 0, -220);
    box(0.12, 0.4, 500, white, -10.1, 0.3, -220);
    box(0.12, 0.4, 500, white, 10.1, 0.3, -220);
    const markings: THREE.Mesh[] = [];
    for (let i = 0; i < 45; i++)
      for (const x of [-3.3, 3.3])
        markings.push(box(0.13, 0.03, 3, white, x, 0.02, -i * 11));
    function car(color: THREE.Material) {
      const group = new THREE.Group();
      box(1.65, 0.48, 3.1, color, 0, 0.47, 0, group);
      box(1.35, 0.48, 1.45, glass, 0, 0.94, -0.15, group);
      box(1.7, 0.15, 0.28, color, 0, 0.6, 1.4, group);
      for (const x of [-0.57, 0.57]) {
        box(0.37, 0.14, 0.06, red, x, 0.56, 1.58, group);
        box(0.4, 0.14, 0.06, light, x, 0.55, -1.58, group);
      }
      scene.add(group);
      return group;
    }
    const player = car(blue);
    player.position.set(0, 0, 3);
    const traffic = Array.from({ length: 8 }, (_, i) => {
      const c = car(mat([0x686473, 0x543039, 0x314952, 0x777568][i % 4]));
      c.position.set(
        [-6, 0, 6][Math.floor(Math.random() * 3)],
        0,
        -75 - i * 49,
      );
      return c;
    });
    const scenery: THREE.Group[] = [];
    for (let i = 0; i < 28; i++) {
      const g = new THREE.Group();
      const side = i % 2 ? 1 : -1;
      const h = 8 + Math.random() * 28;
      box(
        8,
        h,
        11,
        mat(0x141624),
        side * (23 + Math.random() * 18),
        h / 2,
        0,
        g,
      );
      for (let j = 0; j < 6; j++)
        box(
          0.15,
          0.5,
          6,
          mat(0x484353, 0x302c44),
          side * (19 + Math.random() * 18),
          2 + j * 3,
          0,
          g,
        );
      box(0.16, 7, 0.16, metal, side * 12, 3.5, 0, g);
      box(2, 0.15, 0.35, light, side * 11.1, 7, 0, g);
      g.position.z = -i * 17;
      scene.add(g);
      scenery.push(g);
    }
    const moonGeo = new THREE.SphereGeometry(3.5, 20, 12);
    geometries.push(moonGeo);
    const moon = new THREE.Mesh(moonGeo, mat(0x8e91b0, 0x5e617e));
    moon.position.set(-55, 44, -200);
    scene.add(moon);
    let frame = 0,
      last = 0,
      distance = 0,
      velocity = 0,
      uiTime = 0,
      alive = true;
    const keys = new Set<string>();
    const render = () => renderer.render(scene, camera);
    function loop(now: number) {
      if (!alive) return;
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;
      const target =
        keys.has("ArrowDown") || keys.has("s")
          ? 22
          : keys.has("ArrowUp") || keys.has("w")
            ? 85
            : 55;
      velocity += (target - velocity) * dt * 1.3;
      const steer =
        (keys.has("ArrowRight") || keys.has("d") ? 1 : 0) -
        (keys.has("ArrowLeft") || keys.has("a") ? 1 : 0);
      player.position.x = THREE.MathUtils.clamp(
        player.position.x + steer * dt * 10,
        -8.5,
        8.5,
      );
      player.rotation.z = THREE.MathUtils.lerp(
        player.rotation.z,
        -steer * 0.045,
        0.1,
      );
      camera.position.x = THREE.MathUtils.lerp(
        camera.position.x,
        player.position.x * 0.18,
        0.035,
      );
      distance += velocity * dt;
      markings.forEach((m) => {
        m.position.z += velocity * dt;
        if (m.position.z > 15) m.position.z -= 495;
      });
      scenery.forEach((g) => {
        g.position.z += velocity * dt;
        if (g.position.z > 25) g.position.z -= 476;
      });
      for (const c of traffic) {
        c.position.z += (velocity - 13) * dt;
        if (c.position.z > 20) {
          c.position.z = -360 - Math.random() * 70;
          c.position.x = [-6, 0, 6][Math.floor(Math.random() * 3)];
        }
        if (
          Math.abs(c.position.z - player.position.z) < 2.6 &&
          Math.abs(c.position.x - player.position.x) < 1.65
        ) {
          setCrashed(true);
          setRunning(false);
          setBest(bestScore("racer", Math.floor(distance)));
          beep(90, 0.25);
          render();
          return;
        }
      }
      uiTime += dt;
      if (uiTime > 0.15) {
        uiTime = 0;
        setScore(Math.floor(distance));
        setSpeed(Math.round(velocity * 2));
      }
      render();
      frame = requestAnimationFrame(loop);
    }
    const api: Engine = {
      keys,
      start: () => {
        cancelAnimationFrame(frame);
        last = performance.now();
        frame = requestAnimationFrame(loop);
      },
      stop: () => {
        cancelAnimationFrame(frame);
        keys.clear();
      },
      reset: () => {
        distance = 0;
        velocity = 0;
        player.position.x = 0;
        traffic.forEach((c, i) => {
          c.position.z = -75 - i * 49;
          c.position.x = [-6, 0, 6][Math.floor(Math.random() * 3)];
        });
        setScore(0);
        setSpeed(0);
        render();
      },
    };
    engine.current = api;
    const resize = () => {
      const w = host.clientWidth,
        h = host.clientHeight;
      if (w && h) {
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        render();
      }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    return () => {
      alive = false;
      api.stop();
      observer.disconnect();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      engine.current = null;
    };
  }, []);
  useEffect(() => {
    if (active && running && !crashed) {
      engine.current?.start();
      root.current?.focus({ preventScroll: true });
    } else engine.current?.stop();
  }, [active, running, crashed]);
  function start() {
    if (crashed) engine.current?.reset();
    setCrashed(false);
    setRunning(true);
  }
  function newGame() {
    engine.current?.reset();
    setCrashed(false);
    setRunning(true);
  }
  function key(e: React.KeyboardEvent, down: boolean) {
    if (
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "a",
        "d",
        "w",
        "s",
      ].includes(e.key)
    ) {
      e.preventDefault();
      e.stopPropagation();
      if (down) engine.current?.keys.add(e.key);
      else engine.current?.keys.delete(e.key);
    }
    if (down && e.key.toLowerCase() === "p") {
      e.preventDefault();
      setRunning((r) => !r);
    }
  }
  return (
    <div
      className="racer-app"
      ref={root}
      tabIndex={0}
      onKeyDown={(e) => key(e, true)}
      onKeyUp={(e) => key(e, false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget))
          engine.current?.keys.clear();
      }}
    >
      <GameToolbar
        title="Night Drive"
        score={`Best ${best.toLocaleString()} m`}
        onNew={newGame}
        paused={!running}
        onPause={() => setRunning((r) => !r)}
      />
      <div className="racer-stage">
        <div className="racer-canvas" ref={mount} />
        <div className="racer-hud">
          <div>
            <strong>{score.toLocaleString()}</strong>
            <span>METERS</span>
          </div>
          <div>
            <strong>{speed}</strong>
            <span>KM/H</span>
          </div>
        </div>
        {(!running || !active || crashed || error) && (
          <div className="racer-overlay">
            <span className="eyebrow">AFTER HOURS / ENDLESS HIGHWAY</span>
            <h1>
              {error
                ? "3D unavailable"
                : crashed
                  ? "End of the road."
                  : score
                    ? "Take a breath."
                    : "NIGHT DRIVE"}
            </h1>
            <p>
              {error
                ? "Your browser could not start WebGL. Try another game from the library."
                : crashed
                  ? `${score.toLocaleString()} meters. Ready for another run?`
                  : "A quiet city. An open road. Just don’t hit the traffic."}
            </p>
            {!error && (
              <button className="button primary" onClick={start}>
                <Icon name="play" size={15} />
                {crashed
                  ? "Drive again"
                  : score
                    ? "Keep driving"
                    : "Start driving"}
              </button>
            )}
            <small>← → steer · ↑ accelerate · ↓ brake · P pause</small>
          </div>
        )}
      </div>
      <div className="racer-controls">
        {[
          ["ArrowLeft", "← Steer"],
          ["ArrowUp", "Accelerate"],
          ["ArrowDown", "Brake"],
          ["ArrowRight", "Steer →"],
        ].map(([k, label]) => (
          <button
            key={k}
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              engine.current?.keys.add(k);
            }}
            onPointerUp={() => engine.current?.keys.delete(k)}
            onPointerCancel={() => engine.current?.keys.delete(k)}
            onLostPointerCapture={() => engine.current?.keys.delete(k)}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter")
                engine.current?.keys.add(k);
            }}
            onKeyUp={() => engine.current?.keys.delete(k)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
