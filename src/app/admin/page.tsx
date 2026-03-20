import { Users, GraduationCap, Mail, Database, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Admin Dashboard - 통계 및 요약 정보
 */
export default async function AdminDashboardPage() {
  // 통계 데이터 수집 - 전체 사용자 페이지네이션 조회
  const allUsers: { id: string }[] = [];
  let page = 1;
  const perPage = 100;
  let hasMore = true;
  while (hasMore) {
    const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (data.users.length > 0) {
      allUsers.push(...data.users.map(u => ({ id: u.id })));
      page++;
    }
    if (data.users.length < perPage) {
      hasMore = false;
    }
  }

  // 역할별 사용자 수 조회 (user_roles + roles 테이블 기반)
  const { data: roleStats } = await supabaseAdmin
    .from('roles')
    .select(
      `
      name,
      "displayName",
      user_roles(count)
    `
    )
    .order('order');

  // Supabase count queries
  const { count: videosCount } = await supabaseAdmin
    .from('education_videos')
    .select('*', { count: 'exact', head: true });

  const { count: knowhowCount } = await supabaseAdmin
    .from('knowhow_posts')
    .select('*', { count: 'exact', head: true });

  const { count: resourcesCount } = await supabaseAdmin
    .from('resources')
    .select('*', { count: 'exact', head: true });

  const { count: invitationsCount } = await supabaseAdmin
    .from('invitations')
    .select('*', { count: 'exact', head: true });

  const users = allUsers;

  // 역할별 사용자 수 계산 (동적으로 모든 역할 표시)
  const roleCountList: { name: string; displayName: string; count: number }[] = [];
  let assignedUserCount = 0;

  if (roleStats) {
    for (const role of roleStats) {
      const userRolesData = role.user_roles as { count: number }[] | undefined;
      const count = userRolesData?.[0]?.count || 0;
      roleCountList.push({
        name: role.name,
        displayName: role.displayName,
        count,
      });
      assignedUserCount += count;
    }
  }

  // 역할이 없는 사용자 수 (user_roles에 등록되지 않은 사용자)
  const unassignedUserCount = users.length - assignedUserCount;

  const stats = {
    totalUsers: users.length,
    roleCountList,
    unassignedUserCount,
    videosCount: videosCount || 0,
    knowhowCount: knowhowCount || 0,
    resourcesCount: resourcesCount || 0,
    invitationsCount: invitationsCount || 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-gray-600 mt-2">시스템 전체 통계 및 관리</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">전체 사용자</CardTitle>
            <Users className="w-5 h-5 text-[#0052CC]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
            <div className="text-xs text-gray-500 mt-2 space-y-0.5">
              {stats.roleCountList.map(role => (
                <p key={role.name}>
                  {role.displayName}: {role.count}
                </p>
              ))}
              {stats.unassignedUserCount > 0 && (
                <p className="text-gray-400">미지정: {stats.unassignedUserCount}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Education Videos Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">교육 비디오</CardTitle>
            <GraduationCap className="w-5 h-5 text-[#0052CC]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.videosCount}</div>
            <p className="text-xs text-gray-500 mt-2">등록된 비디오 콘텐츠</p>
          </CardContent>
        </Card>

        {/* Knowhow Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">노하우</CardTitle>
            <Database className="w-5 h-5 text-[#0052CC]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.knowhowCount}</div>
            <p className="text-xs text-gray-500 mt-2">노하우 아카이브</p>
          </CardContent>
        </Card>

        {/* Resources Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">자료실</CardTitle>
            <FileText className="w-5 h-5 text-[#0052CC]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.resourcesCount}</div>
            <p className="text-xs text-gray-500 mt-2">다운로드 자료</p>
          </CardContent>
        </Card>

        {/* TODO: 메일링 시스템 도입 후 복원 */}
        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">초대 신청</CardTitle>
            <Mail className="w-5 h-5 text-[#0052CC]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.invitationsCount}</div>
            <p className="text-xs text-gray-500 mt-2">대기 중인 초대</p>
          </CardContent>
        </Card> */}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 작업</CardTitle>
          <CardDescription>자주 사용하는 관리 기능</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <a
              href="/admin/users"
              className="p-4 border border-gray-200 rounded-lg hover:border-[#0052CC] hover:bg-blue-50 transition-colors"
            >
              <Users className="w-8 h-8 text-[#0052CC] mb-2" />
              <h3 className="font-semibold text-gray-900">사용자 관리</h3>
              <p className="text-sm text-gray-600 mt-1">사용자 역할 및 권한 관리</p>
            </a>

            <a
              href="/admin/education/videos"
              className="p-4 border border-gray-200 rounded-lg hover:border-[#0052CC] hover:bg-blue-50 transition-colors"
            >
              <GraduationCap className="w-8 h-8 text-[#0052CC] mb-2" />
              <h3 className="font-semibold text-gray-900">교육 콘텐츠</h3>
              <p className="text-sm text-gray-600 mt-1">비디오, 노하우, 자료 관리</p>
            </a>

            {/* TODO: 메일링 시스템 도입 후 복원 */}
            {/* <a
              href="/admin/invitations"
              className="p-4 border border-gray-200 rounded-lg hover:border-[#0052CC] hover:bg-blue-50 transition-colors"
            >
              <Mail className="w-8 h-8 text-[#0052CC] mb-2" />
              <h3 className="font-semibold text-gray-900">초대 승인</h3>
              <p className="text-sm text-gray-600 mt-1">신규 사용자 초대 승인</p>
            </a> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
