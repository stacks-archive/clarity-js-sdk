export interface Var {
  name: string;
}

export interface Method {
  name: string;
  args?: string[];
}

export interface Receipt {
  success: boolean;
  error?: string;
  data?: any;
}
