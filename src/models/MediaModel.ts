export interface MediaModel {
  id: string;
  url: string;
  publicId?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MediaRequest {
  url: string;
  publicId?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
}

export interface PageResponse<T> {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  data: T[];
}
