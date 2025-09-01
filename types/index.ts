// types/index.ts
export type ApiListResponse<T> = {
  data: T[]
  page: number
  limit: number
  hasMore: boolean
}

export type ApiItemResponse<T> = {
  data: T
}
