'use client';

import { GenericCategoryManager } from './GenericCategoryManager';

/**
 * 자료 유형 관리 컴포넌트 (Wrapper)
 * GenericCategoryManager를 자료 유형용으로 설정
 */
export function ResourceTypeManager() {
  return (
    <GenericCategoryManager
      apiEndpoint="/api/admin/education/resource-types"
      queryKey={['admin', 'resource-types']}
      entityName="자료"
      countFieldName="resources"
    />
  );
}
