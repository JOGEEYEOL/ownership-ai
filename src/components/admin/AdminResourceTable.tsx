'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils/date';
import { Edit, Trash2, Download, FileText, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import Link from 'next/link';

interface Resource {
  id: string;
  title: string;
  description: string | null;
  typeId: string | null;
  resourceType?: { id: string; name: string } | null;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  downloadCount: number;
  tags: string[];
  videoId: string | null;
  video?: { id: string; title: string } | null;
  categoryId: string | null;
  category?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface AdminResourceTableProps {
  resources: Resource[];
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminResourceTable({ resources }: AdminResourceTableProps) {
  const router = useRouter();
  const [deletingResources, setDeletingResources] = useState<Set<string>>(new Set());

  const handleDelete = async (resourceId: string, title: string) => {
    if (!confirm(`"${title}" 자료를 삭제하시겠습니까?`)) {
      return;
    }

    setDeletingResources(prev => new Set(prev).add(resourceId));

    try {
      const response = await fetch(`/api/education/resources/${resourceId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to delete resource');
      }

      toast.success('자료 삭제 완료', {
        description: `"${title}" 자료가 삭제되었습니다.`,
      });

      // Refresh server component data
      router.refresh();
    } catch (error) {
      console.error('Delete resource error:', error);
      toast.error('자료 삭제 실패', {
        description: error instanceof Error ? error.message : '다시 시도해주세요.',
      });
    } finally {
      setDeletingResources(prev => {
        const next = new Set(prev);
        next.delete(resourceId);
        return next;
      });
    }
  };

  if (resources.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">자료가 없습니다</h3>
        <p className="text-gray-600 mb-6">첫 번째 교육 자료를 추가해보세요.</p>
        <Link href="/admin/education/resources/new">
          <Button className="bg-[#0052CC] hover:bg-[#003d99]">자료 추가</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>제목</TableHead>
            <TableHead>유형</TableHead>
            <TableHead>카테고리</TableHead>
            <TableHead>연결된 비디오</TableHead>
            <TableHead>파일크기</TableHead>
            <TableHead>다운로드</TableHead>
            <TableHead>생성일</TableHead>
            <TableHead className="text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map(resource => (
            <TableRow key={resource.id}>
              {/* Title */}
              <TableCell className="font-medium max-w-md">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#0052CC] flex-shrink-0" />
                  <div className="truncate">
                    <p className="truncate">{resource.title}</p>
                    {resource.description && (
                      <p className="text-sm text-gray-500 truncate">{resource.description}</p>
                    )}
                  </div>
                </div>
              </TableCell>

              {/* Type */}
              <TableCell>
                {resource.resourceType ? (
                  <Badge className="bg-purple-100 text-purple-800">
                    {resource.resourceType.name}
                  </Badge>
                ) : (
                  <span className="text-gray-400">미분류</span>
                )}
              </TableCell>

              {/* Category */}
              <TableCell>
                {resource.category ? (
                  <Badge className="bg-blue-100 text-blue-800">{resource.category.name}</Badge>
                ) : (
                  <span className="text-gray-400">미분류</span>
                )}
              </TableCell>

              {/* Linked Video */}
              <TableCell>
                {resource.video ? (
                  <Link
                    href={`/education/videos/${resource.video.id}`}
                    className="flex items-center gap-1 text-[#0052CC] hover:underline"
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span className="truncate max-w-[150px]">{resource.video.title}</span>
                  </Link>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>

              {/* File Size */}
              <TableCell className="text-sm text-gray-600">
                {formatFileSize(resource.fileSize)}
              </TableCell>

              {/* Download Count */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-gray-400" />
                  <span>{resource.downloadCount.toLocaleString()}</span>
                </div>
              </TableCell>

              {/* Created At */}
              <TableCell className="text-sm text-gray-600">
                {formatDate(resource.createdAt)}
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/admin/education/resources/${resource.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      수정
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(resource.id, resource.title)}
                    disabled={deletingResources.has(resource.id)}
                    className="text-red-600 hover:text-red-700 hover:border-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    삭제
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
