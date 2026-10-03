import { useDesktop } from "../../core/context";
import { gameIds, registry } from "../../core/registry";
import { Icon } from "../../components/Icon";
const taglines = [
  "KNEE-DEEP IN THE DEAD",
  "THE CITY IS YOURS",
  "ONE MORE HAND",
  "YOUR NEXT MOVE",
  "JUST ONE MORE TILE",
  "FIND YOUR RHYTHM",
  "THINK BEFORE YOU CLICK",
  "KEEP IT GROWING",
];
export default function Games() {
  const { open } = useDesktop();
  return (
    <div className="games-library scroll-area">
      <header>
        <span className="eyebrow">OFF THE CLOCK</span>
        <h1>A little room to play.</h1>
        <p>Eight familiar escapes. Right here on the desktop.</p>
      </header>
      <div className="game-library-grid">
        {gameIds.map((id, i) => (
          <button
            className={`game-card game-card-${id}`}
            key={id}
            onClick={() => open(id)}
          >
            <div className="game-cover">
              <div className="cover-lines" />
              <Icon name={registry[id].icon} size={42} />
              {id === "doom" && <b>DOOM</b>}
              {id === "2048" && <b>2048</b>}
            </div>
            <div>
              <small>{taglines[i]}</small>
              <strong>
                {registry[id].name}
                <Icon name="play" size={12} />
              </strong>
              <p>{registry[id].description}</p>
            </div>
          </button>
        ))}
      </div>
      <footer>
        <Icon name="keyboard" size={14} />
        Keyboard and touch controls included. Games pause when their window
        loses focus.
      </footer>
    </div>
  );
}
