import {
  Building2,
  Calculator,
  ClipboardList,
  FileText,
  FolderHeart,
  FolderOpen,
  Globe,
  Home,
  Kanban,
  LayoutDashboard,
  LogIn,
  MessageCircle,
  Route,
  Stethoscope,
  UserCheck,
  UserRound,
  Video,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Maps the icon names used in the navigation spec to lucide components. */
const ICONS: Record<string, LucideIcon> = {
  home: Home,
  stethoscope: Stethoscope,
  "building-2": Building2,
  calculator: Calculator,
  route: Route,
  globe: Globe,
  "log-in": LogIn,
  "layout-dashboard": LayoutDashboard,
  "folder-heart": FolderHeart,
  "clipboard-list": ClipboardList,
  video: Video,
  "file-text": FileText,
  "message-circle": MessageCircle,
  "user-check": UserCheck,
  kanban: Kanban,
  "user-round": UserRound,
  "folder-open": FolderOpen,
};

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Home;
  return <Icon className={cn("size-4", className)} aria-hidden="true" />;
}
