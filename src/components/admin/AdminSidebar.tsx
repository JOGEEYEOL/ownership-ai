'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Video,
  BookOpen,
  FileText,
  Mail,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Home,
  Tags,
  Copy,
  Phone,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    label: '대시보드',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: '사용자 관리',
    href: '/admin/users',
    icon: Users,
  },
  {
    label: '교육 센터',
    href: '#education', // 드롭다운 전용 (페이지 없음)
    icon: GraduationCap,
    children: [
      {
        label: '비디오 관리',
        href: '/admin/education/videos',
        icon: Video,
      },
      {
        label: '노하우 관리',
        href: '/admin/education/knowhow',
        icon: BookOpen,
      },
      {
        label: '자료실 관리',
        href: '/admin/education/resources',
        icon: FileText,
      },
    ],
  },
  // TODO: 메일링 시스템 도입 후 복원
  // {
  //   label: '초대 관리',
  //   href: '/admin/invitations',
  //   icon: Mail,
  // },
  {
    label: '설정',
    href: '#settings', // 드롭다운 전용 (페이지 없음)
    icon: Settings,
    children: [
      {
        label: '연락처 설정',
        href: '/admin/settings/contact',
        icon: Phone,
      },
      {
        label: '키워드 관리',
        href: '/admin/settings/keywords',
        icon: Tags,
      },
      {
        label: '탬플릿 관리',
        href: '/admin/settings/copy-templates',
        icon: Copy,
      },
      {
        label: '랜딩페이지 관리',
        href: '/admin/settings/landing',
        icon: Globe,
      },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const toggleMenu = (href: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [href]: !prev[href],
    }));
  };

  // 현재 경로에 해당하는 메뉴를 자동으로 열기
  const isMenuOpen = (item: MenuItem) => {
    if (item.children) {
      // 명시적으로 열린 경우
      if (openMenus[item.href] !== undefined) {
        return openMenus[item.href];
      }
      // 하위 메뉴 중 하나가 활성화된 경우 자동으로 열기
      return item.children.some(child => isActive(child.href));
    }
    return false;
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col sticky top-0 h-screen overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0052CC] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">OA</span>
          </div>
          <div>
            <h1 className="text-lg font-bold">Ownership AI</h1>
            <p className="text-xs text-gray-400">관리자 패널</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map(item => (
          <div key={item.href}>
            {/* Parent Menu Item */}
            {item.children ? (
              // 드롭다운 메뉴 (children이 있는 경우)
              <button
                onClick={() => toggleMenu(item.href)}
                className={cn(
                  'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive(item.href)
                    ? 'bg-[#0052CC] text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {isMenuOpen(item) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              // 일반 링크 (children이 없는 경우)
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive(item.href)
                    ? 'bg-[#0052CC] text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )}

            {/* Children Menu Items */}
            {item.children && isMenuOpen(item) && (
              <div className="ml-4 mt-1 space-y-1">
                {item.children.map(child => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors',
                      isActive(child.href)
                        ? 'bg-[#0052CC] text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    )}
                  >
                    <child.icon className="w-4 h-4" />
                    <span>{child.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#0052CC] hover:text-white transition-colors"
        >
          <Home className="w-5 h-5" />
          <span className="font-medium">대시보드로 이동</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
