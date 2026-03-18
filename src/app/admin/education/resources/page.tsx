import { FileText, Plus, Download, FolderTree, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminResourceTable } from '@/components/admin/AdminResourceTable';
import { supabaseAdmin } from '@/lib/supabase/admin';
import Link from 'next/link';

/**
 * Admin Education Resources Management Page
 * - List all education resources
 * - Create, Edit, Delete resources
 * - Link resources to videos
 */
export default async function AdminResourcesPage() {
  // Fetch all resources with video and category relations (sorted by createdAt desc)
  const { data: resources } = await supabaseAdmin
    .from('resources')
    .select(
      `
      *,
      video:education_videos!resources_videoId_fkey(id, title),
      category:resource_categories(id, name),
      resourceType:resource_types(id, name)
    `
    )
    .order('createdAt', { ascending: false });

  // Fetch categories for stats
  const { data: categories } = await supabaseAdmin
    .from('resource_categories')
    .select('id, name')
    .order('order', { ascending: true });

  // For each category, count resources and sum downloadCounts
  const categoriesWithStats = await Promise.all(
    (categories || []).map(async cat => {
      const { data: categoryResources } = await supabaseAdmin
        .from('resources')
        .select('downloadCount')
        .eq('categoryId', cat.id);

      return {
        ...cat,
        resources: categoryResources || [],
      };
    })
  );

  // Stats
  const stats = {
    total: resources?.length || 0,
    totalDownloads: (resources || []).reduce((sum, r) => sum + r.downloadCount, 0),
    byCategory: categoriesWithStats.reduce(
      (acc, cat) => {
        acc[cat.name] = {
          count: cat.resources.length,
          downloads: cat.resources.reduce(
            (sum: number, r: { downloadCount: number }) => sum + r.downloadCount,
            0
          ),
        };
        return acc;
      },
      {} as Record<string, { count: number; downloads: number }>
    ),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">자료실 관리</h1>
          <p className="text-gray-600 mt-2">교육 자료 및 템플릿 관리</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/education/resources/types">
            <Button variant="outline">
              <Tag className="w-4 h-4 mr-2" />
              유형 관리
            </Button>
          </Link>
          <Link href="/admin/education/resources/categories">
            <Button variant="outline">
              <FolderTree className="w-4 h-4 mr-2" />
              카테고리 관리
            </Button>
          </Link>
          <Link href="/admin/education/resources/new">
            <Button className="bg-[#0052CC] hover:bg-[#003d99]">
              <Plus className="w-4 h-4 mr-2" />
              자료 추가
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 전체 자료 카드 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 자료</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <FileText className="w-10 h-10 text-[#0052CC]" />
          </div>
        </div>

        {/* 총 다운로드 카드 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 다운로드</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalDownloads.toLocaleString()}
              </p>
            </div>
            <Download className="w-10 h-10 text-green-600" />
          </div>
        </div>

        {/* 카테고리 개수 카드 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">카테고리</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{categoriesWithStats.length}</p>
              <p className="text-xs text-gray-500 mt-1">최대 20개</p>
            </div>
            <FolderTree className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* 카테고리별 상세 통계 - 2열 테이블 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">카테고리별 통계</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽 테이블 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    카테고리
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">자료</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                    다운로드
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">평균</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(stats.byCategory)
                  .slice(0, Math.ceil(Object.keys(stats.byCategory).length / 2))
                  .map(([name, data]) => {
                    const avgDownloads =
                      (data as { count: number; downloads: number }).count > 0
                        ? Math.round(
                            (data as { count: number; downloads: number }).downloads /
                              (data as { count: number; downloads: number }).count
                          )
                        : 0;
                    return (
                      <tr key={name} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{name}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {(data as { count: number; downloads: number }).count}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-[#0052CC] font-semibold">
                          {(
                            data as { count: number; downloads: number }
                          ).downloads.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-600 font-semibold">
                          {avgDownloads.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* 오른쪽 테이블 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    카테고리
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">자료</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                    다운로드
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">평균</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(stats.byCategory)
                  .slice(Math.ceil(Object.keys(stats.byCategory).length / 2))
                  .map(([name, data]) => {
                    const avgDownloads =
                      (data as { count: number; downloads: number }).count > 0
                        ? Math.round(
                            (data as { count: number; downloads: number }).downloads /
                              (data as { count: number; downloads: number }).count
                          )
                        : 0;
                    return (
                      <tr key={name} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{name}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {(data as { count: number; downloads: number }).count}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-[#0052CC] font-semibold">
                          {(
                            data as { count: number; downloads: number }
                          ).downloads.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-600 font-semibold">
                          {avgDownloads.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Resource Table */}
      <AdminResourceTable resources={resources || []} />
    </div>
  );
}
