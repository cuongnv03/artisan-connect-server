export enum ProductStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
  DELETED = 'DELETED',
}

export enum ProductSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  PRICE = 'price',
  NAME = 'name',
  VIEW_COUNT = 'viewCount',
  SALES_COUNT = 'salesCount',
  RATING = 'avgRating',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}
