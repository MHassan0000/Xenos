// Build the no-JavaScript portfolio from the same typed content model as the OS.
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import ts from "typescript";
const projectData = JSON.parse(
  await readFile("src/data/projects.json", "utf8"),
);
const journeyData = JSON.parse(await readFile("src/data/journey.json", "utf8"));
const source = await readFile("src/data/portfolio.ts", "utf8");
const javascript = ts.transpileModule(
  source.replace(/^import .*;\r?\n/gm, ""),
  {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const content = await import(
  "data:text/javascript;base64," +
    Buffer.from(
      `const projectData=${JSON.stringify(projectData)};const journeyData=${JSON.stringify(journeyData)};${javascript}`,
    ).toString("base64")
);
const { profile, projects, journey, skills } = content;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const css = `*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#151b18;color:#dfe9e2;font:16px/1.75 system-ui,sans-serif}a{color:#b6e1c7;text-underline-offset:4px}a:focus-visible{outline:2px solid #b6e1c7;outline-offset:5px}nav{display:flex;gap:24px;align-items:center;flex-wrap:wrap;padding:22px max(24px,calc((100vw - 1000px)/2));border-bottom:1px solid #37493d;background:#1b251f}nav strong{margin-right:auto;letter-spacing:-1px;font-size:22px}main{max-width:1050px;padding:50px 25px;margin:auto}h1{font-size:clamp(35px,6vw,68px);line-height:1.12;letter-spacing:-2.5px;max-width:900px;font-weight:500}h2{font-size:30px;font-weight:500;letter-spacing:-1px}h3{line-height:1.3;font-size:20px;font-weight:500}p{color:#a8bfb0}section{padding:30px 0;border-bottom:1px solid #374b3d;scroll-margin-top:24px}.intro{max-width:700px}.label{font:11px monospace;color:#82ac91;letter-spacing:1.5px}.projects{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.project{background:#1e2a22;border:1px solid #3c5544;border-radius:10px;overflow:hidden;scroll-margin-top:24px}.project img{width:100%;aspect-ratio:1.8;object-fit:cover;display:block}.project article{padding:22px}.project h3{margin:6px 0}.project p{font-size:14px}.tags{display:flex;flex-wrap:wrap;gap:7px;font:11px monospace;margin:18px 0}.tags span{border:1px solid #4d6c56;padding:5px 8px;border-radius:4px;color:#9fc5ac}.links{display:flex;gap:16px;flex-wrap:wrap;font-size:13px}.timeline{display:grid;grid-template-columns:120px 1fr;gap:22px;padding:20px 0}.timeline time{color:#a1c7af}.timeline h3{margin:0}.timeline p{margin-bottom:0}.contact{display:flex;gap:20px;flex-wrap:wrap}footer{margin-top:36px;font-size:13px;color:#7b9b85}summary{cursor:pointer;color:#b6e1c7;margin:15px 0}details img{height:auto;aspect-ratio:auto;margin:12px 0}.button{display:inline-block;padding:10px 18px;border-radius:6px;background:#b6e1c7;color:#18271e;text-decoration:none}.search{width:100%;max-width:520px;border:1px solid #49644f;color:#e5f3e9;background:#203026;padding:13px;font:inherit;border-radius:6px;margin:0 0 25px}[hidden]{display:none!important}@media(max-width:650px){.projects{grid-template-columns:1fr}nav{gap:15px;font-size:13px}main{padding-top:30px}.timeline{grid-template-columns:1fr;gap:8px}h1{font-size:42px;letter-spacing:-1.5px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}`;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(profile.name + " — " + profile.title + ". " + profile.location + ". Explore 29 projects and automation workflows.")}"><meta name="theme-color" content="#151b18"><link rel="icon" href="/favicon.svg"><title>${esc(profile.name)} — Portfolio</title><style>${css}</style><script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "Person", name: profile.name, jobTitle: profile.title, email: profile.email, homeLocation: { "@type": "Place", name: profile.location }, sameAs: profile.social.map((s) => s.url) }).replace(/</g, "\\u003c")}</script></head><body><nav aria-label="Portfolio navigation"><strong>xenos.</strong><a href="#about">About</a><a href="#projects">Projects</a><a href="#resume">Résumé</a><a href="#contact">Contact</a><a href="/">Enter desktop</a></nav><main><section id="about"><span class="label">${esc(profile.location.toUpperCase())} / PERSONAL PORTFOLIO</span><h1>${esc(profile.name)}</h1><h2>${esc(profile.title)}</h2><p class="intro">${esc(profile.bio)}</p><p><a class="button" href="#projects">Explore my work</a></p></section><section id="projects"><span class="label">18 APPLICATIONS / 11 AUTOMATIONS</span><h2>Ideas, out in the wild.</h2><input class="search" type="search" id="filter" aria-label="Search portfolio projects" placeholder="Search projects or technologies"><p id="search-status" aria-live="polite">29 projects</p><div class="projects">${projects.map((p) => `<div class="project" id="${esc(p.id)}" data-search="${esc(`${p.name} ${p.description} ${p.tags.join(" ")} ${p.category}`.toLowerCase())}"><img src="${esc(p.images[0])}" alt="${esc(p.name)} preview" loading="lazy" width="960" height="550"><article><span class="label">${esc(p.category.toUpperCase())}</span><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><div class="tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div><div class="links">${p.demo ? `<a href="${esc(p.demo)}" target="_blank" rel="noreferrer">Live project</a>` : ""}${p.repo ? `<a href="${esc(p.repo)}" target="_blank" rel="noreferrer">Source code</a>` : ""}<a href="/#/project/${esc(p.id)}">Open in Xenos</a><a href="#${esc(p.id)}">Permalink</a></div>${p.images.length > 1 ? `<details><summary>View all workflow diagrams (${p.images.length})</summary>${p.images.map((src, i) => `<a href="${esc(src)}" target="_blank"><img src="${esc(src)}" alt="${esc(p.name)} diagram ${i + 1}" loading="lazy"></a>`).join("")}</details>` : ""}</article></div>`).join("")}</div></section><section id="skills"><span class="label">THE TOOLKIT</span><h2>Tools I work with.</h2>${skills.map((s) => `<h3>${esc(s.name)}</h3><p>${s.items.map(esc).join(" · ")}</p>`).join("")}</section><section id="resume"><span class="label">ENGINEERING JOURNEY</span><h2>The story so far.</h2>${journey.map((j) => `<article class="timeline"><time>${esc(j.year)}</time><div><h3>${esc(j.title)}</h3><p>${esc(j.description)}</p></div></article>`).join("")}<p>This background is based on my published portfolio. <a href="mailto:${esc(profile.email)}">Contact me for a current CV.</a></p></section><section id="contact"><span class="label">START A CONVERSATION</span><h2>Great things start with hello.</h2><p><a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a> · ${esc(profile.location)}</p><div class="contact">${profile.social.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noreferrer">${esc(s.name)}</a>`).join("")}</div></section><footer>© ${new Date().getFullYear()} ${esc(profile.name)} · <a href="/">Return to Xenos desktop</a></footer></main><script>const input=document.getElementById('filter');input.addEventListener('input',()=>{let count=0;for(const card of document.querySelectorAll('[data-search]')){card.hidden=!card.dataset.search.includes(input.value.toLowerCase());if(!card.hidden)count++}document.getElementById('search-status').textContent=count+' projects'});</script></body></html>`;
await mkdir("public", { recursive: true });
await writeFile("public/portfolio.html", html);
try {
  await access("dist/index.html");
  await writeFile("dist/portfolio.html", html);
} catch {
  /* dev generation */
}
console.log(
  `Generated accessible portfolio: ${projects.length} projects, ${journey.length} journey entries.`,
);
