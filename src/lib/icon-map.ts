import {
  // Business
  Briefcase,
  Building2,
  Users,
  UserCheck,
  Handshake,
  Award,
  Trophy,
  Crown,
  // Finance
  DollarSign,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  CreditCard,
  Receipt,
  Coins,
  // Communication
  Mail,
  Phone,
  MessageSquare,
  Send,
  Bell,
  Megaphone,
  // Data
  BarChart,
  BarChart3,
  PieChart,
  LineChart,
  Database,
  Server,
  // Documents
  FileText,
  FileCheck,
  FilePlus,
  Folder,
  ClipboardList,
  BookOpen,
  // Actions
  Search,
  Target,
  Zap,
  Rocket,
  Lightbulb,
  Settings,
  Wrench,
  Shield,
  // Status
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Timer,
  CalendarDays,
  // UI
  Heart,
  Star,
  ThumbsUp,
  Eye,
  Globe,
  Map,
  MapPin,
  Compass,
  // Tech
  Monitor,
  Smartphone,
  Wifi,
  Cloud,
  Lock,
  Key,
  Code,
  Terminal,
  // Extra defaults used by existing sections
  FileX,
  Upload,
  type LucideIcon,
} from 'lucide-react';

/**
 * Map of icon name strings to Lucide icon components.
 * Used by both the IconPicker (admin) and landing section components.
 */
export const iconMap: Record<string, LucideIcon> = {
  // Business
  Briefcase,
  Building2,
  Users,
  UserCheck,
  Handshake,
  Award,
  Trophy,
  Crown,
  // Finance
  DollarSign,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  CreditCard,
  Receipt,
  Coins,
  // Communication
  Mail,
  Phone,
  MessageSquare,
  Send,
  Bell,
  Megaphone,
  // Data
  BarChart,
  BarChart3,
  PieChart,
  LineChart,
  Database,
  Server,
  // Documents
  FileText,
  FileCheck,
  FilePlus,
  Folder,
  ClipboardList,
  BookOpen,
  // Actions
  Search,
  Target,
  Zap,
  Rocket,
  Lightbulb,
  Settings,
  Wrench,
  Shield,
  // Status
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Timer,
  CalendarDays,
  // UI
  Heart,
  Star,
  ThumbsUp,
  Eye,
  Globe,
  Map,
  MapPin,
  Compass,
  // Tech
  Monitor,
  Smartphone,
  Wifi,
  Cloud,
  Lock,
  Key,
  Code,
  Terminal,
  // Extra (used by default sections)
  FileX,
  Upload,
};

/** All available icon names for the picker */
export const iconNames = Object.keys(iconMap);

/** Category groupings for the icon picker UI */
export const iconCategories: { label: string; icons: string[] }[] = [
  {
    label: 'Business',
    icons: [
      'Briefcase',
      'Building2',
      'Users',
      'UserCheck',
      'Handshake',
      'Award',
      'Trophy',
      'Crown',
    ],
  },
  {
    label: 'Finance',
    icons: [
      'DollarSign',
      'TrendingUp',
      'TrendingDown',
      'PiggyBank',
      'Wallet',
      'CreditCard',
      'Receipt',
      'Coins',
    ],
  },
  {
    label: 'Communication',
    icons: ['Mail', 'Phone', 'MessageSquare', 'Send', 'Bell', 'Megaphone'],
  },
  {
    label: 'Data',
    icons: ['BarChart', 'BarChart3', 'PieChart', 'LineChart', 'Database', 'Server'],
  },
  {
    label: 'Documents',
    icons: ['FileText', 'FileCheck', 'FilePlus', 'Folder', 'ClipboardList', 'BookOpen'],
  },
  {
    label: 'Actions',
    icons: ['Search', 'Target', 'Zap', 'Rocket', 'Lightbulb', 'Settings', 'Wrench', 'Shield'],
  },
  {
    label: 'Status',
    icons: [
      'AlertCircle',
      'AlertTriangle',
      'CheckCircle',
      'XCircle',
      'Clock',
      'Timer',
      'CalendarDays',
    ],
  },
  {
    label: 'UI',
    icons: ['Heart', 'Star', 'ThumbsUp', 'Eye', 'Globe', 'Map', 'MapPin', 'Compass'],
  },
  {
    label: 'Tech',
    icons: ['Monitor', 'Smartphone', 'Wifi', 'Cloud', 'Lock', 'Key', 'Code', 'Terminal'],
  },
];

/**
 * Look up a Lucide icon component by name string.
 * Returns the fallback icon if the name is not found.
 */
export function getIconByName(name: string | undefined, fallback: LucideIcon): LucideIcon {
  if (!name) return fallback;
  return iconMap[name] ?? fallback;
}
