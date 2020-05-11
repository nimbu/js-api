export type CustomFields = Record<string, unknown>;

export type ObjectProperties = {
  id: string;
  updated_at: string;
  created_at: string;
  slug: string;
  url?: string;
};

export type Object<T extends CustomFields> = T & ObjectProperties;

export type CustomerProperties = ObjectProperties & {
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
};

export type Customer<T extends CustomFields> = T & CustomerProperties;

export type CurrentCustomer<T extends CustomFields> = Customer<T> & {
  session_token: string;
};
