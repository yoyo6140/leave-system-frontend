export interface LoginInput {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data?: { token: string };
  error?: {
    code: string;
    message: string;
  };
}

export type AuthBody = {
  success: boolean;
  data?: { message: string };
  error?: { message: string };
};

export interface ApiUserData {
  id: number;
  username: string;
  name: string;
  role: string;
  email: string;
  gender: string;
  id_number: string;
  hire_date: string;
  birth_date: string;
  is_active?: boolean;
}
