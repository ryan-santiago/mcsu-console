import {
  Briefcase,
  FileText,
  Handshake,
  History,
  Home,
  Inbox,
  KanbanSquare,
  Monitor,
  Settings,
  Shield,
  UserCog,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { NavIcon } from "@/lib/navigation";

const ICONS: Record<NavIcon, LucideIcon> = {
  home: Home,
  inbox: Inbox,
  users: Users,
  briefcase: Briefcase,
  handshake: Handshake,
  kanban: KanbanSquare,
  "file-text": FileText,
  monitor: Monitor,
  "user-cog": UserCog,
  shield: Shield,
  wrench: Wrench,
  history: History,
  settings: Settings,
};

export function NavIconView({ name, className }: { name: NavIcon; className?: string }) {
  const Icon = ICONS[name];
  return <Icon className={className} aria-hidden />;
}
