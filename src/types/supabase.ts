export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          fitness_goal: string | null;
          training_level: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          fitness_goal?: string | null;
          training_level?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          fitness_goal?: string | null;
          training_level?: string | null;
          is_public?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          source: "ai" | "manual";
          status: "draft" | "active" | "archived";
          onboarding_answers: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          source: "ai" | "manual";
          status?: "draft" | "active" | "archived";
          onboarding_answers?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          source?: "ai" | "manual";
          status?: "draft" | "active" | "archived";
          onboarding_answers?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      plan_days: {
        Row: {
          id: string;
          plan_id: string;
          day_of_week: number;
          title: string;
          is_rest_day: boolean;
          duration_minutes: number | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          plan_id: string;
          day_of_week: number;
          title: string;
          is_rest_day?: boolean;
          duration_minutes?: number | null;
          notes?: string | null;
        };
        Update: {
          day_of_week?: number;
          title?: string;
          is_rest_day?: boolean;
          duration_minutes?: number | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      calendar_events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          starts_at: string;
          ends_at: string | null;
          event_type: "workout" | "rest" | "other";
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          starts_at: string;
          ends_at?: string | null;
          event_type: "workout" | "rest" | "other";
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          starts_at?: string;
          ends_at?: string | null;
          event_type?: "workout" | "rest" | "other";
          notes?: string | null;
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
