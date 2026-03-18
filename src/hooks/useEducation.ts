import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============================================
// Types
// ============================================

export interface VideoCategory {
  id: string;
  name: string;
  description: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    videos: number;
  };
}

export interface EducationVideo {
  id: string;
  title: string;
  description: string | null;
  category: VideoCategory; // Changed from string to VideoCategory relation
  categoryId: string;
  videoUrl: string;
  videoType: string;
  thumbnailUrl: string | null;
  duration: number | null;
  viewCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface KnowHow {
  id: string;
  title: string;
  content: string;
  categoryId: string | null;
  category: KnowHowCategory | null; // JOIN으로 가져온 category 객체
  author: string | null;
  tags: string[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceCategory {
  id: string;
  name: string;
  description: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    resources: number;
  };
}

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  typeId: string | null;
  resourceType: { id: string; name: string } | null; // resource_types JOIN
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  downloadCount: number;
  tags: string[];
  videoId: string | null; // 연결된 비디오 ID
  categoryId: string | null; // 카테고리 ID
  category: { id: string; name: string } | null; // 카테고리 정보 (JOIN)
  createdAt: string;
  updatedAt: string;
}

interface ListResponse<T> {
  success: boolean;
  data: T[];
  metadata: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface DetailResponse<T> {
  success: boolean;
  data: T;
}

// ============================================
// Education Videos
// ============================================

// 비디오 카테고리 목록 조회
export function useVideoCategories() {
  return useQuery<DetailResponse<VideoCategory[]>>({
    queryKey: ['videoCategories'],
    queryFn: async () => {
      const res = await fetch('/api/education/videos/categories');
      if (!res.ok) throw new Error('Failed to fetch video categories');
      return res.json();
    },
  });
}

export function useEducationVideos(params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append('category', params.category);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  return useQuery<ListResponse<EducationVideo>>({
    queryKey: ['educationVideos', params],
    queryFn: async () => {
      const res = await fetch(`/api/education/videos?${queryParams}`);
      if (!res.ok) throw new Error('Failed to fetch videos');
      return res.json();
    },
  });
}

export function useEducationVideo(id: string) {
  return useQuery<DetailResponse<EducationVideo>>({
    queryKey: ['educationVideo', id],
    queryFn: async () => {
      const res = await fetch(`/api/education/videos/${id}`);
      if (!res.ok) throw new Error('Failed to fetch video');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useIncrementVideoViewCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/education/videos/${id}/view`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to increment view count');
      return res.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['educationVideo', id] });
      queryClient.invalidateQueries({ queryKey: ['educationVideos'] });
    },
  });
}

// ============================================
// KnowHow Archive (아카이브 - 기관 작성 전문 콘텐츠)
// ============================================

export function useKnowHowList(params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append('category', params.category);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  return useQuery<ListResponse<KnowHow>>({
    queryKey: ['knowhow', params],
    queryFn: async () => {
      const res = await fetch(`/api/education/knowhow?${queryParams}`);
      if (!res.ok) throw new Error('Failed to fetch knowhow');
      return res.json();
    },
  });
}

export function useKnowHow(id: string) {
  return useQuery<DetailResponse<KnowHow>>({
    queryKey: ['knowhow', id],
    queryFn: async () => {
      const res = await fetch(`/api/education/knowhow/archive/${id}`);
      if (!res.ok) throw new Error('Failed to fetch knowhow');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useIncrementKnowHowViewCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/education/knowhow/archive/${id}`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to increment view count');
      return res.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['knowhow', id] });
      queryClient.invalidateQueries({ queryKey: ['knowhow'] });
    },
  });
}

// ============================================
// Resources
// ============================================

export function useResources(params?: {
  type?: string;
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.type) queryParams.append('type', params.type);
  if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  return useQuery<ListResponse<Resource>>({
    queryKey: ['resources', params],
    queryFn: async () => {
      const res = await fetch(`/api/education/resources?${queryParams}`);
      if (!res.ok) throw new Error('Failed to fetch resources');
      return res.json();
    },
  });
}

// 자료실 카테고리 목록 조회
export function useResourceCategories() {
  return useQuery<DetailResponse<ResourceCategory[]>>({
    queryKey: ['resourceCategories'],
    queryFn: async () => {
      const res = await fetch('/api/admin/education/resource-categories');
      if (!res.ok) throw new Error('Failed to fetch resource categories');
      return res.json();
    },
  });
}

export function useResource(id: string) {
  return useQuery<DetailResponse<Resource>>({
    queryKey: ['resource', id],
    queryFn: async () => {
      const res = await fetch(`/api/education/resources/${id}`);
      if (!res.ok) throw new Error('Failed to fetch resource');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useDownloadResource() {
  return useMutation({
    mutationFn: async (id: string) => {
      // 다운로드 카운트는 서버에서 자동 증가
      window.location.href = `/api/education/resources/${id}/download`;
    },
  });
}

// ============================================
// File Upload
// ============================================

export interface UploadFileResponse {
  success: boolean;
  data: {
    fileName: string;
    url: string;
    size: number;
    type: string;
  };
}

export function useUploadFile() {
  return useMutation({
    mutationFn: async ({ file, type }: { file: File; type: 'image' | 'document' }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to upload file');
      }

      return res.json() as Promise<UploadFileResponse>;
    },
  });
}

// ============================================
// KnowHow Community (노하우 커뮤니티)
// ============================================

export interface KnowHowCategory {
  id: string;
  name: string;
  description: string | null;
  order: number;
  parentId: string | null;
  _count?: {
    posts: number;
    archives: number;
  };
  children?: KnowHowCategory[];
}

export interface KnowHowPost {
  id: string;
  title: string;
  content: string;
  authorName: string;
  userId: string;
  categoryId: string;
  viewCount: number;
  isPinned: boolean;
  isAnnouncement: boolean;
  isEvent: boolean;
  imageUrls?: string[];
  fileUrls?: string[];
  fileNames?: string[];
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
  category: KnowHowCategory;
  _count: {
    comments: number;
  };
}

export interface PostFormData {
  title: string;
  content: string;
  categoryId: string;
  imageUrls?: string[];
  fileUrls?: string[];
  fileNames?: string[];
  isAnnouncement?: boolean;
  isEvent?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface KnowHowComment {
  id: string;
  content: string;
  authorName: string;
  userId: string;
  postId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  replies?: KnowHowComment[];
}

export function useKnowHowPosts(params?: {
  categoryId?: string;
  isAnnouncement?: boolean;
  isEvent?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
  if (params?.isAnnouncement !== undefined)
    queryParams.append('isAnnouncement', params.isAnnouncement.toString());
  if (params?.isEvent !== undefined) queryParams.append('isEvent', params.isEvent.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  return useQuery<ListResponse<KnowHowPost>>({
    queryKey: ['knowhowPosts', params],
    queryFn: async () => {
      const res = await fetch(`/api/education/knowhow/posts?${queryParams}`);
      if (!res.ok) throw new Error('Failed to fetch knowhow posts');
      return res.json();
    },
  });
}

export function useKnowHowPost(id: string) {
  return useQuery<DetailResponse<KnowHowPost>>({
    queryKey: ['knowhowPost', id],
    queryFn: async () => {
      const res = await fetch(`/api/education/knowhow/posts/${id}`);
      if (!res.ok) throw new Error('Failed to fetch knowhow post');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useIncrementKnowHowPostViewCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/education/knowhow/posts/${id}/view`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to increment view count');
      return res.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['knowhowPost', id] });
      queryClient.invalidateQueries({ queryKey: ['knowhowPosts'] });
    },
  });
}

// 댓글 조회
export function useKnowHowComments(postId: string) {
  return useQuery<DetailResponse<KnowHowComment[]>>({
    queryKey: ['knowhowComments', postId],
    queryFn: async () => {
      const res = await fetch(`/api/education/knowhow/posts/${postId}/comments`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      return res.json();
    },
    enabled: !!postId,
  });
}

// 댓글 작성 (대댓글 지원)
export function useCreateKnowHowComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { content: string; parentId?: string | null }) => {
      const res = await fetch(`/api/education/knowhow/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to create comment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowhowComments', postId] });
      queryClient.invalidateQueries({ queryKey: ['knowhowPost', postId] });
    },
  });
}

// 댓글 수정
export function useUpdateKnowHowComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const res = await fetch(`/api/education/knowhow/posts/${postId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to update comment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowhowComments', postId] });
    },
  });
}

// 댓글 삭제
export function useDeleteKnowHowComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`/api/education/knowhow/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to delete comment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowhowComments', postId] });
    },
  });
}

// 게시글 작성
export function useCreateKnowHowPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      categoryId: string;
      imageUrls?: string[];
      fileUrls?: string[];
      fileNames?: string[];
      isAnnouncement?: boolean;
      isEvent?: boolean;
    }) => {
      const res = await fetch('/api/education/knowhow/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to create post');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowhowPosts'] });
    },
  });
}

// 카테고리 목록 조회
export function useKnowHowCategories() {
  return useQuery<DetailResponse<KnowHowCategory[]>>({
    queryKey: ['knowhowCategories'],
    queryFn: async () => {
      const res = await fetch('/api/education/knowhow/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });
}

// 게시글 삭제
export function useDeleteKnowHowPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/education/knowhow/posts/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to delete post');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowhowPosts'] });
    },
  });
}

// 게시글 수정
export function useUpdateKnowHowPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: PostFormData & { id: string }) => {
      const res = await fetch(`/api/education/knowhow/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to update post');
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['knowhowPost', id] });
      queryClient.invalidateQueries({ queryKey: ['knowhowPosts'] });
    },
  });
}

// ============================================
// Video Comments (비디오 댓글)
// ============================================

export interface VideoComment {
  id: string;
  content: string;
  authorName: string;
  userId: string;
  videoId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  replies?: VideoComment[];
}

/**
 * 특정 비디오의 댓글 목록 조회
 */
export function useVideoComments(videoId: string) {
  return useQuery<DetailResponse<VideoComment[]>>({
    queryKey: ['videoComments', videoId],
    queryFn: async () => {
      const res = await fetch(`/api/education/videos/${videoId}/comments`);
      if (!res.ok) throw new Error('Failed to fetch video comments');
      return res.json();
    },
    enabled: !!videoId,
  });
}

/**
 * 비디오 댓글 작성 (대댓글 지원)
 */
export function useCreateVideoComment(videoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { content: string; parentId?: string | null }) => {
      const res = await fetch(`/api/education/videos/${videoId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to create comment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoComments', videoId] });
    },
  });
}

/**
 * 비디오 댓글 수정
 */
export function useUpdateVideoComment(videoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const res = await fetch(`/api/education/videos/${videoId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to update comment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoComments', videoId] });
    },
  });
}

/**
 * 비디오 댓글 삭제
 */
export function useDeleteVideoComment(videoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`/api/education/videos/${videoId}/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to delete comment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoComments', videoId] });
    },
  });
}

// ============================================
// 노하우 아카이브 댓글 관련 Hooks
// ============================================

export interface KnowHowArchiveComment {
  id: string;
  content: string;
  authorName: string;
  userId: string;
  archiveId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  replies?: KnowHowArchiveComment[];
}

/**
 * 아카이브 댓글 목록 조회
 */
export function useKnowHowArchiveComments(archiveId: string) {
  return useQuery<DetailResponse<KnowHowArchiveComment[]>>({
    queryKey: ['knowhowArchiveComments', archiveId],
    queryFn: async () => {
      const res = await fetch(`/api/education/knowhow/archive/${archiveId}/comments`);
      if (!res.ok) throw new Error('Failed to fetch archive comments');
      return res.json();
    },
    enabled: !!archiveId,
  });
}

/**
 * 아카이브 댓글 작성 (대댓글 지원)
 */
export function useCreateKnowHowArchiveComment(archiveId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { content: string; parentId?: string | null }) => {
      const res = await fetch(`/api/education/knowhow/archive/${archiveId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to create comment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowhowArchiveComments', archiveId] });
    },
  });
}

/**
 * 아카이브 댓글 수정
 */
export function useUpdateKnowHowArchiveComment(archiveId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const res = await fetch(`/api/education/knowhow/archive/${archiveId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to update comment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowhowArchiveComments', archiveId] });
    },
  });
}

/**
 * 아카이브 댓글 삭제
 */
export function useDeleteKnowHowArchiveComment(archiveId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`/api/education/knowhow/archive/${archiveId}/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to delete comment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowhowArchiveComments', archiveId] });
    },
  });
}
