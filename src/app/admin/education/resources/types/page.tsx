import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ResourceTypeManager } from '@/components/admin/ResourceTypeManager';

/**
 * 자료 유형 관리 페이지
 */
export default function AdminResourceTypesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/education/resources"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          자료실 관리로 돌아가기
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">자료 유형 관리</h1>
        <p className="text-gray-600 mt-2">자료 유형을 추가, 수정, 삭제할 수 있습니다.</p>
      </div>

      {/* Type Manager */}
      <ResourceTypeManager />
    </div>
  );
}
