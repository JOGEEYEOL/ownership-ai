'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import type { Resource } from '@/hooks/useEducation';
import { useDownloadResource } from '@/hooks/useEducation';

interface ResourceCardProps {
  resource: Resource;
}

/**
 * 자료 카드 컴포넌트
 * - 파일명, 타입, 크기, 다운로드 수 표시
 * - 다운로드 버튼
 */
export function ResourceCard({ resource }: ResourceCardProps) {
  const downloadResource = useDownloadResource();

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '알 수 없음';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  // 다운로드 핸들러
  const handleDownload = () => {
    downloadResource.mutate(resource.id);
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 h-full">
      <CardHeader>
        {/* 타입 */}
        {resource.resourceType && (
          <Badge variant="secondary" className="mb-2 w-fit">
            {resource.resourceType.name}
          </Badge>
        )}

        {/* 제목 */}
        <CardTitle className="text-lg line-clamp-2 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
          {resource.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 설명 */}
        {resource.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{resource.description}</p>
        )}

        {/* 파일 정보 */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>파일명: {resource.fileName}</div>
          <div>크기: {formatFileSize(resource.fileSize)}</div>
          <div>다운로드: {resource.downloadCount.toLocaleString()}회</div>
        </div>

        {/* 태그 */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {resource.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {resource.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{resource.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* 다운로드 버튼 */}
        <Button
          onClick={handleDownload}
          className="w-full bg-[#0052CC] hover:bg-[#0052CC]/90"
          disabled={downloadResource.isPending}
        >
          <Download className="w-4 h-4 mr-2" />
          {downloadResource.isPending ? '다운로드 중...' : '다운로드'}
        </Button>
      </CardContent>
    </Card>
  );
}
