import type { ProjectStatus } from "../domain/project";

export type Database = {
  public: {
    Tables: {
      github_connections: {
        Row: {
          id: string;
          user_id: string;
          github_user_id: number;
          github_login: string;
          access_token: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          github_user_id: number;
          github_login: string;
          access_token: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          github_user_id?: number;
          github_login?: string;
          access_token?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      repo_drafts: {
        Row: {
          id: string;
          user_id: string;
          github_repo_id: number;
          full_name: string;
          html_url: string;
          description: string | null;
          visibility: string;
          default_branch: string;
          pushed_at: string | null;
          topics: string[] | null;
          imported_at: string;
          converted_project_id: string | null;
          converted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          github_repo_id: number;
          full_name: string;
          html_url: string;
          description?: string | null;
          visibility: string;
          default_branch: string;
          pushed_at?: string | null;
          topics?: string[] | null;
          imported_at?: string;
          converted_project_id?: string | null;
          converted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          github_repo_id?: number;
          full_name?: string;
          html_url?: string;
          description?: string | null;
          visibility?: string;
          default_branch?: string;
          pushed_at?: string | null;
          topics?: string[] | null;
          imported_at?: string;
          converted_project_id?: string | null;
          converted_at?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          name: string;
          narrative_link: string | null;
          why_now: string | null;
          finish_definition: string | null;
          status: ProjectStatus;
          next_action: string;
          start_date: string | null;
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
          start_date?: string | null;
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
          start_date?: string | null;
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
          start_date: string | null;
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
      get_github_connection_state: {
        Args: Record<string, never>;
        Returns: {
          connected: boolean;
          github_login: string | null;
        }[];
      };
      convert_repo_draft_to_project: {
        Args: {
          draft_id: string;
          project_name: string;
          next_action: string;
          finish_definition: string | null;
        };
        Returns: {
          project_id: string;
        }[];
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
