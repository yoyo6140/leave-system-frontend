export interface ApiUser {
  id: number;
  username: string;
  name: string;
  role: string;
  email: string;
  gender: string;
  id_number: string;
  hire_date: string;
  birth_date: string;
  is_active: boolean;
}

export interface UserListResponse {
  total: number;
  page: number;
  limit: number;
  data: ApiUser[];
}

export interface UserCreateInput {
  name: string;
  role: string;
  email: string;
  gender: string;
  id_number: string;
  hire_date: string;
  birth_date: string;
}

export interface UserUpdateInput {
  name: string;
  role: string;
  email: string;
  gender: string;
  id_number: string;
  hire_date: string;
  birth_date: string;
}

export type UsersQueryParams = {
  search?: string;
  page?: number;
  limit?: number;
  /** 是否包含已停用帳號（預設 false） */
  include_inactive?: boolean;
};
