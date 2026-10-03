import {
  UserRound,
  Folder,
  Files,
  FileText,
  Terminal,
  Settings,
  Mail,
  Cpu,
  StickyNote,
  Image,
  Search,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  Minus,
  Square,
  X,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  Command,
  LayoutGrid,
  Monitor,
  Maximize,
  PanelsTopLeft,
  Code2,
  Smartphone,
  Workflow,
  Globe,
  Github,
  Linkedin,
  CalendarDays,
  RotateCcw,
  Star,
  House,
  Menu,
  PanelLeft,
  Sun,
  Moon,
  Eye,
  Keyboard,
  Info,
  Link,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from "lucide-react";
const icons: Record<string, LucideIcon> = {
  user: UserRound,
  folder: Folder,
  files: Files,
  file: FileText,
  terminal: Terminal,
  settings: Settings,
  mail: Mail,
  cpu: Cpu,
  notes: StickyNote,
  image: Image,
  search: Search,
  right: ChevronRight,
  left: ChevronLeft,
  up: ArrowUp,
  down: ArrowDown,
  minus: Minus,
  square: Square,
  close: X,
  copy: Copy,
  check: Check,
  external: ExternalLink,
  pin: MapPin,
  command: Command,
  grid: LayoutGrid,
  monitor: Monitor,
  fullscreen: Maximize,
  restore: PanelsTopLeft,
  code: Code2,
  phone: Smartphone,
  workflow: Workflow,
  globe: Globe,
  github: Github,
  linkedin: Linkedin,
  calendar: CalendarDays,
  reset: RotateCcw,
  star: Star,
  home: House,
  menu: Menu,
  sidebar: PanelLeft,
  sun: Sun,
  moon: Moon,
  eye: Eye,
  keyboard: Keyboard,
  info: Info,
  link: Link,
  zoomIn: ZoomIn,
  zoomOut: ZoomOut,
};
export function Icon({
  name,
  size = 18,
  ...props
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const C = icons[name] || FileText;
  return <C size={size} strokeWidth={1.65} aria-hidden="true" {...props} />;
}
export function XenosMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path d="M7 8h8l18 24h-8zM25 8h8L15 32H7z" fill="currentColor" />
    </svg>
  );
}
