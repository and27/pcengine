import type { ProjectStatus } from "../domain/project";

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          narrative_link: string | null;
          why_now: string | null;
          finish_definition: string | null;
          status: ProjectStatus;
          next_action: string;
          start_date: string;
          finish_date: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          narrative_link?: string | null;
          why_now?: string | null;
          finish_definition?: string | null;
          status: ProjectStatus;
          next_action: string;
          start_date: string;
          finish_date?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          narrative_link?: string | null;
          why_now?: string | null;
          finish_definition?: string | null;
          status?: ProjectStatus;
          next_action?: string;
          start_date?: string;
          finish_date?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_project_with_active_cap: {
        Args: {
          name: string;
          narrative_link: string | null;
          why_now: string | null;
          finish_definition: string | null;
          status: ProjectStatus;
          next_action: string;
          start_date: string;
          finish_date: string | null;
          max_active: number;
        };
        Returns: Database["public"]["Tables"]["projects"]["Row"];
      };
      launch_project_with_active_cap: {
        Args: {
          project_id: string;
          max_active: number;
        };
        Returns: Database["public"]["Tables"]["projects"]["Row"];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
