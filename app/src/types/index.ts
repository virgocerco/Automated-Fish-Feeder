export type ModalType = 'login' | 'signup';

export interface User {
  username: string;
  email?: string;
}

export interface AuthFormData {
  username: string;
  password: string;
  email?: string;
}