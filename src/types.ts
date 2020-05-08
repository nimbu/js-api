export interface Object extends Record<string, unknown> {
  id: string;
  updated_at: string;
  created_at: string;
  slug: string;
  url?: string;
}

export interface Customer extends Object {
  email: string;
  firstname: string;
  lastname: string;
  name: string;
  language: string;
  number: string;
  status: string;
  session_token?: string;
  verified_email?: boolean;
  verified_at?: string;
  suspended?: boolean;
  suspended_at?: string;
  password_updated_at?: string;
}

export interface CurrentCustomer extends Customer {
  session_token: string;
}
