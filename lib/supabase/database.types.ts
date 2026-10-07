// Generated from the Supabase schema (project qhvlhiboaknvqhkpqtfk) via the MCP type generator.
// Regenerate after every migration.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.18" };
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string | null; avatar: string | null; theme: string; onboarded_at: string | null; created_at: string; updated_at: string };
        Insert: { id: string; display_name?: string | null; avatar?: string | null; theme?: string; onboarded_at?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; display_name?: string | null; avatar?: string | null; theme?: string; onboarded_at?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      funds: {
        Row: { id: string; user_id: string; created_at: string; updated_at: string; name: string; category: string; amfi_code: string | null; sip_amount: number; sip_day: number; sip_status: string; latest_nav: number; nav_date: string; manual_value: number | null };
        Insert: { id?: string; user_id?: string; created_at?: string; updated_at?: string; name: string; category: string; amfi_code?: string | null; sip_amount?: number; sip_day?: number; sip_status?: string; latest_nav: number; nav_date?: string; manual_value?: number | null };
        Update: { id?: string; user_id?: string; created_at?: string; updated_at?: string; name?: string; category?: string; amfi_code?: string | null; sip_amount?: number; sip_day?: number; sip_status?: string; latest_nav?: number; nav_date?: string; manual_value?: number | null };
        Relationships: [];
      };
      fund_txns: {
        Row: { id: string; user_id: string; created_at: string; updated_at: string; fund_id: string; date: string; type: string; amount: number; nav: number };
        Insert: { id?: string; user_id?: string; created_at?: string; updated_at?: string; fund_id: string; date: string; type: string; amount: number; nav: number };
        Update: { id?: string; user_id?: string; created_at?: string; updated_at?: string; fund_id?: string; date?: string; type?: string; amount?: number; nav?: number };
        Relationships: [{ foreignKeyName: "fund_txns_fund_id_user_id_fkey"; columns: ["fund_id", "user_id"]; isOneToOne: false; referencedRelation: "funds"; referencedColumns: ["id", "user_id"] }];
      };
      stock_txns: {
        Row: { id: string; user_id: string; created_at: string; updated_at: string; ticker: string; date: string; type: string; quantity: number; price: number };
        Insert: { id?: string; user_id?: string; created_at?: string; updated_at?: string; ticker: string; date: string; type: string; quantity: number; price: number };
        Update: { id?: string; user_id?: string; created_at?: string; updated_at?: string; ticker?: string; date?: string; type?: string; quantity?: number; price?: number };
        Relationships: [];
      };
      stock_quotes: {
        Row: { id: string; user_id: string; created_at: string; updated_at: string; ticker: string; name: string; sector: string; cmp: number; as_of: string };
        Insert: { id?: string; user_id?: string; created_at?: string; updated_at?: string; ticker: string; name: string; sector: string; cmp: number; as_of?: string };
        Update: { id?: string; user_id?: string; created_at?: string; updated_at?: string; ticker?: string; name?: string; sector?: string; cmp?: number; as_of?: string };
        Relationships: [];
      };
      fixed_assets: {
        Row: { id: string; user_id: string; created_at: string; updated_at: string; kind: string; name: string; provider: string; invested: number; current_value: number; annual_contribution: number; maturity: string; liquidity: string };
        Insert: { id?: string; user_id?: string; created_at?: string; updated_at?: string; kind: string; name: string; provider?: string; invested?: number; current_value?: number; annual_contribution?: number; maturity?: string; liquidity: string };
        Update: { id?: string; user_id?: string; created_at?: string; updated_at?: string; kind?: string; name?: string; provider?: string; invested?: number; current_value?: number; annual_contribution?: number; maturity?: string; liquidity?: string };
        Relationships: [];
      };
      balance_assets: {
        Row: { id: string; user_id: string; created_at: string; updated_at: string; name: string; kind: string; value: number };
        Insert: { id?: string; user_id?: string; created_at?: string; updated_at?: string; name: string; kind: string; value?: number };
        Update: { id?: string; user_id?: string; created_at?: string; updated_at?: string; name?: string; kind?: string; value?: number };
        Relationships: [];
      };
      liabilities: {
        Row: { id: string; user_id: string; created_at: string; updated_at: string; name: string; lender: string; outstanding: number };
        Insert: { id?: string; user_id?: string; created_at?: string; updated_at?: string; name: string; lender?: string; outstanding?: number };
        Update: { id?: string; user_id?: string; created_at?: string; updated_at?: string; name?: string; lender?: string; outstanding?: number };
        Relationships: [];
      };
      goals: {
        Row: { id: string; user_id: string; created_at: string; updated_at: string; name: string; target: number; target_date: string; expected_return: number; monthly_sip: number };
        Insert: { id?: string; user_id?: string; created_at?: string; updated_at?: string; name: string; target: number; target_date: string; expected_return?: number; monthly_sip?: number };
        Update: { id?: string; user_id?: string; created_at?: string; updated_at?: string; name?: string; target?: number; target_date?: string; expected_return?: number; monthly_sip?: number };
        Relationships: [];
      };
      snapshots: {
        Row: { id: string; user_id: string; created_at: string; updated_at: string; month: string; total_assets: number; total_liabilities: number; net_worth: number; investment_value: number };
        Insert: { id?: string; user_id?: string; created_at?: string; updated_at?: string; month: string; total_assets: number; total_liabilities: number; net_worth: number; investment_value: number };
        Update: { id?: string; user_id?: string; created_at?: string; updated_at?: string; month?: string; total_assets?: number; total_liabilities?: number; net_worth?: number; investment_value?: number };
        Relationships: [];
      };
      review_items: {
        Row: { id: string; user_id: string; created_at: string; updated_at: string; position: number; action: string; timeline: string; focus: string; done: boolean };
        Insert: { id?: string; user_id?: string; created_at?: string; updated_at?: string; position?: number; action: string; timeline?: string; focus?: string; done?: boolean };
        Update: { id?: string; user_id?: string; created_at?: string; updated_at?: string; position?: number; action?: string; timeline?: string; focus?: string; done?: boolean };
        Relationships: [];
      };
      review_notes: {
        Row: { id: string; user_id: string; created_at: string; updated_at: string; category: string; text: string };
        Insert: { id?: string; user_id?: string; created_at?: string; updated_at?: string; category: string; text: string };
        Update: { id?: string; user_id?: string; created_at?: string; updated_at?: string; category?: string; text?: string };
        Relationships: [];
      };
      documents: {
        Row: { id: string; user_id: string; created_at: string; updated_at: string; storage_path: string; file_name: string; mime: string; size: number; kind: string; linked_type: string | null; linked_id: string | null };
        Insert: { id?: string; user_id?: string; created_at?: string; updated_at?: string; storage_path: string; file_name: string; mime?: string; size: number; kind?: string; linked_type?: string | null; linked_id?: string | null };
        Update: { id?: string; user_id?: string; created_at?: string; updated_at?: string; storage_path?: string; file_name?: string; mime?: string; size?: number; kind?: string; linked_type?: string | null; linked_id?: string | null };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicTables = Database["public"]["Tables"];
export type Row<T extends keyof PublicTables> = PublicTables[T]["Row"];
export type InsertRow<T extends keyof PublicTables> = PublicTables[T]["Insert"];
