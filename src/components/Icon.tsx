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
  Gamepad2,
  Skull,
  CarFront,
  Club,
  Crown,
  Blocks,
  Bomb,
  Worm,
  PencilLine,
  Calculator,
  Activity,
  Trash2,
  Music2,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Bell,
  BellOff,
  Power,
  LockKeyhole,
  LogOut,
  Play,
  Pause,
  Save,
  Download,
  Plus,
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
  gamepad: Gamepad2,
  skull: Skull,
  car: CarFront,
  cards: Club,
  chess: Crown,
  blocks: Blocks,
  bomb: Bomb,
  snake: Worm,
  edit: PencilLine,
  calculator: Calculator,
  activity: Activity,
  trash: Trash2,
  music: Music2,
  volume: Volume2,
  mute: VolumeX,
  wifi: Wifi,
  offline: WifiOff,
  bell: Bell,
  dnd: BellOff,
  power: Power,
  lock: LockKeyhole,
  logout: LogOut,
  play: Play,
  pause: Pause,
  save: Save,
  download: Download,
  plus: Plus,
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
export function DesktopMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="11" height="11" rx="3" fill="currentColor" />
      <rect
        x="23"
        y="6"
        width="11"
        height="11"
        rx="3"
        fill="currentColor"
        opacity=".65"
      />
      <rect
        x="6"
        y="23"
        width="11"
        height="11"
        rx="3"
        fill="currentColor"
        opacity=".65"
      />
      <rect x="23" y="23" width="11" height="11" rx="3" fill="currentColor" />
    </svg>
  );
}
