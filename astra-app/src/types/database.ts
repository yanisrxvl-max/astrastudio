export type QuoteItem = {
  label: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  total: number;
};

/** Valeurs JSON Postgres (schéma Supabase) */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "admin" | "client";
          full_name: string;
          company_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: "admin" | "client";
          full_name: string;
          company_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: "admin" | "client";
          full_name?: string;
          company_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          first_name: string;
          email: string;
          message: string;
          budget_range: string | null;
          source: string | null;
          phone: string | null;
          offer_interest: string | null;
          status:
            | "new"
            | "contacted"
            | "call_scheduled"
            | "quoted"
            | "converted"
            | "lost";
          notes: string | null;
          /** Présent si `migration_cockpit.sql` a été exécuté */
          heat?: "cold" | "warm" | "hot" | null;
          potential_value?: number | null;
          tags?: string[] | null;
          converted_client_id?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          email: string;
          message: string;
          budget_range?: string | null;
          source?: string | null;
          phone?: string | null;
          offer_interest?: string | null;
          status?:
            | "new"
            | "contacted"
            | "call_scheduled"
            | "quoted"
            | "converted"
            | "lost";
          notes?: string | null;
          heat?: "cold" | "warm" | "hot" | null;
          potential_value?: number | null;
          tags?: string[] | null;
          converted_client_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          email?: string;
          message?: string;
          budget_range?: string | null;
          source?: string | null;
          phone?: string | null;
          offer_interest?: string | null;
          status?:
            | "new"
            | "contacted"
            | "call_scheduled"
            | "quoted"
            | "converted"
            | "lost";
          notes?: string | null;
          heat?: "cold" | "warm" | "hot" | null;
          potential_value?: number | null;
          tags?: string[] | null;
          converted_client_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lead_status_history: {
        Row: {
          id: string;
          lead_id: string;
          previous_status: string | null;
          new_status: string;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          lead_id: string;
          previous_status?: string | null;
          new_status: string;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          lead_id?: string;
          previous_status?: string | null;
          new_status?: string;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          user_id: string | null;
          company_name: string;
          contact_name: string;
          email: string;
          phone: string | null;
          brand_url: string | null;
          offer_type: "audit" | "monthly" | "custom";
          monthly_price: number | null;
          start_date: string | null;
          status: "active" | "paused" | "ended";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          company_name: string;
          contact_name: string;
          email: string;
          phone?: string | null;
          brand_url?: string | null;
          offer_type: "audit" | "monthly" | "custom";
          monthly_price?: number | null;
          start_date?: string | null;
          status?: "active" | "paused" | "ended";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          company_name?: string;
          contact_name?: string;
          email?: string;
          phone?: string | null;
          brand_url?: string | null;
          offer_type?: "audit" | "monthly" | "custom";
          monthly_price?: number | null;
          start_date?: string | null;
          status?: "active" | "paused" | "ended";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      quotes: {
        Row: {
          id: string;
          quote_number: string;
          client_id: string | null;
          lead_id: string | null;
          recipient_name: string;
          recipient_email: string;
          recipient_company: string | null;
          items: QuoteItem[];
          subtotal: number;
          tax_rate: number;
          total: number;
          valid_until: string;
          status:
            | "draft"
            | "sent"
            | "viewed"
            | "accepted"
            | "rejected"
            | "expired";
          notes: string | null;
          pdf_url: string | null;
          sent_at: string | null;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quote_number: string;
          client_id?: string | null;
          lead_id?: string | null;
          recipient_name: string;
          recipient_email: string;
          recipient_company?: string | null;
          items: QuoteItem[];
          subtotal: number;
          tax_rate?: number;
          total: number;
          valid_until: string;
          status?:
            | "draft"
            | "sent"
            | "viewed"
            | "accepted"
            | "rejected"
            | "expired";
          notes?: string | null;
          pdf_url?: string | null;
          sent_at?: string | null;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          quote_number?: string;
          client_id?: string | null;
          lead_id?: string | null;
          recipient_name?: string;
          recipient_email?: string;
          recipient_company?: string | null;
          items?: QuoteItem[];
          subtotal?: number;
          tax_rate?: number;
          total?: number;
          valid_until?: string;
          status?:
            | "draft"
            | "sent"
            | "viewed"
            | "accepted"
            | "rejected"
            | "expired";
          notes?: string | null;
          pdf_url?: string | null;
          sent_at?: string | null;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      content_packs: {
        Row: {
          id: string;
          client_id: string;
          title: string;
          description: string | null;
          month: string;
          status: "preparing" | "delivered" | "downloaded";
          delivered_at: string | null;
          /** Première ouverture côté client (badge « Nouveau ») */
          opened_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          title: string;
          description?: string | null;
          month: string;
          status?: "preparing" | "delivered" | "downloaded";
          delivered_at?: string | null;
          opened_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          title?: string;
          description?: string | null;
          month?: string;
          status?: "preparing" | "delivered" | "downloaded";
          delivered_at?: string | null;
          opened_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      content_files: {
        Row: {
          id: string;
          pack_id: string;
          file_name: string;
          file_type: "video" | "photo" | "document" | "other";
          file_size: number;
          file_url: string;
          thumbnail_url: string | null;
          mime_type: string;
          sort_order: number;
          /** Renseigné quand le client a téléchargé le fichier (app). */
          client_downloaded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          pack_id: string;
          file_name: string;
          file_type: "video" | "photo" | "document" | "other";
          file_size: number;
          file_url: string;
          thumbnail_url?: string | null;
          mime_type: string;
          sort_order?: number;
          client_downloaded_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          pack_id?: string;
          file_name?: string;
          file_type?: "video" | "photo" | "document" | "other";
          file_size?: number;
          file_url?: string;
          thumbnail_url?: string | null;
          mime_type?: string;
          sort_order?: number;
          client_downloaded_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      client_uploads: {
        Row: {
          id: string;
          client_id: string;
          uploaded_by: string;
          file_name: string;
          file_type: "brief" | "asset" | "photo" | "document" | "other";
          file_size: number;
          file_url: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          uploaded_by: string;
          file_name: string;
          file_type: "brief" | "asset" | "photo" | "document" | "other";
          file_size: number;
          file_url: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          uploaded_by?: string;
          file_name?: string;
          file_type?: "brief" | "asset" | "photo" | "document" | "other";
          file_size?: number;
          file_url?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type:
            | "new_lead"
            | "quote_accepted"
            | "content_delivered"
            | "file_uploaded"
            | "message";
          title: string;
          body: string | null;
          read: boolean;
          link: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type:
            | "new_lead"
            | "quote_accepted"
            | "content_delivered"
            | "file_uploaded"
            | "message";
          title: string;
          body?: string | null;
          read?: boolean;
          link?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?:
            | "new_lead"
            | "quote_accepted"
            | "content_delivered"
            | "file_uploaded"
            | "message";
          title?: string;
          body?: string | null;
          read?: boolean;
          link?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Lead = Tables<"leads">;
export type LeadStatusHistory = Tables<"lead_status_history">;
export type Client = Tables<"clients">;
export type Quote = Tables<"quotes">;
export type ContentPack = Tables<"content_packs">;
export type ContentFile = Tables<"content_files">;
export type ClientUpload = Tables<"client_uploads">;
export type Notification = Tables<"notifications">;
export type Profile = Tables<"profiles">;
