export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      apartments: { Row: any; Insert: any; Update: any };
      rent_prices: { Row: any; Insert: any; Update: any };
      utility_types: { Row: any; Insert: any; Update: any };
      utility_bills: { Row: any; Insert: any; Update: any };
      billing_runs: { Row: any; Insert: any; Update: any };
      app_settings: { Row: any; Insert: any; Update: any };
    };
    Functions: {
      initialize_user_defaults: { Args: Record<string, never>; Returns: void };
      lock_billing_run: { Args: { p_run_id: string }; Returns: any };
    };
  };
}
