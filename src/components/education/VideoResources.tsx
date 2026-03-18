'use client';

import { useQuery } from '@tanstack/react-query';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Resource {
  id: string;
  title: string;
  description: string | null;
  typeId: string | null;
  resourceType: { id: string; name: string } | null;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  downloadCount: number;
  tags: string[];
}

interface VideoResourcesProps {
  videoId: string;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function VideoResources({ videoId }: VideoResourcesProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['video-resources', videoId],
    queryFn: async () => {
      const res = await fetch(`/api/education/resources?videoId=${videoId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data as Resource[];
    },
    enabled: !!videoId,
  });

  const handleDownload = async (resource: Resource) => {
    // Increment download count in background
    fetch(`/api/education/resources/${resource.id}/download`).catch(() => {});

    // Open file URL in new tab
    window.open(resource.fileUrl, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            관련 자료
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-12 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return null; // 자료가 없으면 섹션을 표시하지 않음
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Download className="w-5 h-5 text-[#0052CC]" />
          관련 자료 다운로드
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map(resource => (
            <div
              key={resource.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="w-5 h-5 text-gray-600" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{resource.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {resource.resourceType && (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                        {resource.resourceType.name}
                      </Badge>
                    )}
                    {resource.fileSize && (
                      <span className="text-xs text-gray-500">
                        {formatFileSize(resource.fileSize)}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      다운로드 {resource.downloadCount.toLocaleString()}회
                    </span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => handleDownload(resource)}
                className="bg-[#0052CC] hover:bg-[#003d99] ml-4"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                다운로드
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
