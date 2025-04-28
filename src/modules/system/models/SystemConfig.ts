export interface SystemConfig {
  id: string;
  key: string;
  value: any;
  description?: string | null;
  updatedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConfigDto {
  key: string;
  value: any;
  description?: string;
}

export interface UpdateConfigDto {
  value: any;
  description?: string;
}

export interface ConfigQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ConfigPaginationResult {
  data: SystemConfig[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
