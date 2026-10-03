import { mkdir, writeFile } from "node:fs/promises";
const urls = [
  "https://hassanyousaf.vercel.app/optimized/images/project1.webp",
  "https://hassanyousaf.vercel.app/optimized/images/project2.webp",
  "https://hassanyousaf.vercel.app/optimized/images/oraclex.webp",
  "https://hassanyousaf.vercel.app/optimized/images/content-agent.webp",
  "https://hassanyousaf.vercel.app/optimized/images/research-agent.webp",
  "https://hassanyousaf.vercel.app/optimized/images/obsidian.webp",
  "https://hassanyousaf.vercel.app/optimized/images/project3.webp",
  "https://hassanyousaf.vercel.app/optimized/images/powertrack.webp",
  "https://hassanyousaf.vercel.app/optimized/images/axon.webp",
  "https://hassanyousaf.vercel.app/optimized/images/pulse.webp",
  "https://hassanyousaf.vercel.app/optimized/images/voxalogo.webp",
  "https://hassanyousaf.vercel.app/optimized/images/codex.webp",
  "https://hassanyousaf.vercel.app/optimized/images/lexip.webp",
  "https://hassanyousaf.vercel.app/optimized/images/project4.webp",
  "https://hassanyousaf.vercel.app/optimized/images/project5.webp",
  "https://hassanyousaf.vercel.app/optimized/images/project6.webp",
  "https://hassanyousaf.vercel.app/optimized/images/project7.webp",
  "https://hassanyousaf.vercel.app/optimized/images/project8.webp",
  "https://hassanyousaf.vercel.app/optimized/workflows/newsletter-automation.webp",
  "https://hassanyousaf.vercel.app/optimized/workflows/gmail-organizing-workflow.webp",
  "https://hassanyousaf.vercel.app/optimized/workflows/product-videos-generator.webp",
  "https://hassanyousaf.vercel.app/optimized/workflows/faceless-shorts-uploader-workflow.webp",
  "https://hassanyousaf.vercel.app/optimized/workflows/content-system-workflow-n8n.webp",
  "https://hassanyousaf.vercel.app/optimized/workflows/ai-rag-systempart1.webp",
  "https://hassanyousaf.vercel.app/optimized/workflows/ai-rag-system-part2(uploader).webp",
  "https://hassanyousaf.vercel.app/optimized/workflows/ai-personal-assistant.webp",
  "https://hassanyousaf.vercel.app/optimized/workflows/ai-personal-assistant-part2.webp",
  "https://hassanyousaf.vercel.app/optimized/workflows/ai-personal-assistant-part3.webp",
  "https://hassanyousaf.vercel.app/optimized/workflows/ai-personal-assistant-part4.webp",
  "https://hassanyousaf.vercel.app/optimized/workflows/ai-call-agent.webp",
  "https://hassanyousaf.vercel.app/optimized/workflows/automatic-web-scrapper.webp",
  "https://hassanyousaf.vercel.app/optimized/workflows/discordbot-automation.webp",
  "https://hassanyousaf.vercel.app/optimized/workflows/social-media-uploader.webp",
];
await mkdir("public/assets", { recursive: true });
const results = await Promise.allSettled(
  urls.map(async (url) => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${r.status}: ${url}`);
    const bytes = Buffer.from(await r.arrayBuffer());
    await writeFile(`public/assets/${url.split("/").pop()}`, bytes);
    return bytes.length;
  }),
);
for (const result of results)
  if (result.status === "rejected") console.error(result.reason);
console.log(
  `${results.filter((r) => r.status === "fulfilled").length}/${urls.length} source images downloaded`,
);
if (results.some((r) => r.status === "rejected")) process.exitCode = 1;
