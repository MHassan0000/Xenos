import projectData from "./projects.json";
import journeyData from "./journey.json";
export const profile = {
  name: "Muhammad Hassan Yousaf",
  shortName: "Hassan",
  location: "Lahore, Pakistan",
  title: "Full-stack engineer & AI automation architect",
  intro: "I build full-stack applications and AI-powered automations.",
  welcome:
    "I build thoughtful digital products and systems that make the everyday a little smarter.",
  bio: "I build web and mobile apps, and automate the work around them. For the past six years, I’ve designed interfaces, built backends, and improved products using real user feedback. I focus on accessible interfaces, fast loading, and code that’s easy to maintain.",
  email: "hassanyousaf140@gmail.com",
  social: [
    {
      name: "GitHub",
      label: "MHassan0000",
      url: "https://github.com/MHassan0000",
    },
    {
      name: "LinkedIn",
      label: "m-hassan-yousaf",
      url: "https://www.linkedin.com/in/m-hassan-yousaf/",
    },
    {
      name: "Discord",
      label: "Say hello on Discord",
      url: "https://discordapp.com/users/454533727440076811",
    },
    {
      name: "Synapse Labs",
      label: "Explore the studio",
      url: "https://synapse-labs-rho.vercel.app/",
    },
  ],
  source: "https://hassanyousaf.vercel.app",
};
export interface Project {
  id: string;
  name: string;
  description: string;
  tags: string[];
  images: string[];
  category: string;
  featured: boolean;
  demo?: string | null;
  repo?: string | null;
}
export const projects: Project[] = projectData;
export const journey = journeyData;
export const skills = [
  {
    name: "Web development",
    icon: "code",
    description: "Interfaces, applications & delivery",
    items: [
      "React",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "Tailwind CSS",
      "Node.js",
      "Vite",
      "Vercel",
      "GitHub",
    ],
  },
  {
    name: "App development",
    icon: "phone",
    description: "Native & cross-platform experiences",
    items: [
      "React Native",
      "Flutter",
      "Expo",
      "Dart",
      "Kotlin",
      "Swift",
      "Firebase",
      "Android",
      "iOS",
    ],
  },
  {
    name: "Data & automation",
    icon: "workflow",
    description: "Connected data & intelligent workflows",
    items: [
      "Python",
      "n8n",
      "PostgreSQL",
      "MongoDB",
      "MySQL",
      "Redis",
      "Supabase",
      "Docker",
      "Elasticsearch",
    ],
  },
];
export const categories = [
  "All projects",
  "Featured",
  "AI products",
  "Web & software",
  "Automations",
];
