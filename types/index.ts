export interface CurrentUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: 'USER' | 'ADMIN';
}
