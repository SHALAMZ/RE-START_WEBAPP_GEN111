export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      cycles: Table<
        { id: string; started_at: string; expires_at: string; created_at: string },
        { id?: string; started_at?: string; created_at?: string }
      >;
      cycle_control: Table<
        { singleton: boolean; active_cycle_id: string; updated_at: string },
        { singleton?: boolean; active_cycle_id: string; updated_at?: string }
      >;
      profiles: Table<
        {
          id: string;
          cycle_id: string;
          nickname: string;
          avatar_key: string;
          is_current: boolean;
          created_at: string;
          updated_at: string;
        },
        { id?: string; cycle_id: string; nickname: string; avatar_key: string }
      >;
      posts: Table<
        { id: string; cycle_id: string; author_profile_id: string; content: string; created_at: string },
        { id?: string; cycle_id: string; author_profile_id: string; content: string }
      >;
      comments: Table<
        {
          id: string;
          cycle_id: string;
          post_id: string;
          parent_comment_id: string | null;
          author_profile_id: string;
          content: string;
          created_at: string;
        },
        {
          id?: string;
          cycle_id: string;
          post_id: string;
          parent_comment_id?: string | null;
          author_profile_id: string;
          content: string;
        }
      >;
      reactions: Table<
        {
          id: string;
          cycle_id: string;
          post_id: string;
          profile_id: string;
          type: string;
          created_at: string;
        },
        { id?: string; cycle_id: string; post_id: string; profile_id: string; type: string }
      >;
      chats: Table<
        {
          id: string;
          cycle_id: string;
          participant_a_profile_id: string;
          participant_b_profile_id: string;
          updated_at: string;
        },
        {
          id?: string;
          cycle_id: string;
          participant_a_profile_id: string;
          participant_b_profile_id: string;
          updated_at?: string;
        }
      >;
      chat_messages: Table<
        {
          id: string;
          cycle_id: string;
          chat_id: string;
          sender_profile_id: string;
          content: string;
          created_at: string;
        },
        {
          id?: string;
          cycle_id: string;
          chat_id: string;
          sender_profile_id: string;
          content: string;
        }
      >;
      reports: Table<
        {
          id: string;
          cycle_id: string;
          reporter_profile_id: string;
          target_type: string;
          target_id: string;
          category: string;
          reason: string;
          created_at: string;
        },
        never,
        never
      >;
    };
    Views: Record<string, never>;
    Functions: {
      ensure_active_cycle: {
        Args: Record<PropertyKey, never>;
        Returns: Array<{ id: string; started_at: string; expires_at: string; created_at: string }>;
      };
      get_active_cycle: {
        Args: Record<PropertyKey, never>;
        Returns: Array<{
          id: string;
          started_at: string;
          expires_at: string;
          created_at: string;
          server_now: string;
        }>;
      };
      current_profile: {
        Args: Record<PropertyKey, never>;
        Returns: Array<{
          id: string;
          cycle_id: string;
          nickname: string;
          avatar_key: string;
          is_current: boolean;
          created_at: string;
          updated_at: string;
        }>;
      };
      create_or_reset_profile: {
        Args: { p_nickname: string; p_avatar_key: string };
        Returns: Array<{
          id: string;
          cycle_id: string;
          nickname: string;
          avatar_key: string;
          is_current: boolean;
          created_at: string;
          updated_at: string;
        }>;
      };
      reset_current_profile: { Args: Record<PropertyKey, never>; Returns: undefined };
      create_post: {
        Args: { p_content: string };
        Returns: Array<{ id: string; cycle_id: string; author_profile_id: string; content: string; created_at: string }>;
      };
      delete_post: { Args: { p_post_id: string }; Returns: undefined };
      create_comment: {
        Args: { p_post_id: string; p_content: string; p_parent_comment_id?: string | null };
        Returns: Array<{
          id: string;
          cycle_id: string;
          post_id: string;
          parent_comment_id: string | null;
          author_profile_id: string;
          content: string;
          created_at: string;
        }>;
      };
      delete_comment: { Args: { p_comment_id: string }; Returns: undefined };
      toggle_reaction: { Args: { p_post_id: string; p_type: string }; Returns: boolean };
      create_or_get_chat: {
        Args: { p_target_profile_id: string };
        Returns: Array<{
          id: string;
          cycle_id: string;
          participant_a_profile_id: string;
          participant_b_profile_id: string;
          updated_at: string;
        }>;
      };
      is_chat_participant: { Args: { p_chat_id: string }; Returns: boolean };
      send_chat_message: {
        Args: { p_chat_id: string; p_content: string };
        Returns: Array<{
          id: string;
          cycle_id: string;
          chat_id: string;
          sender_profile_id: string;
          content: string;
          created_at: string;
        }>;
      };
      end_chat: { Args: { p_chat_id: string }; Returns: undefined };
      submit_report: {
        Args: { p_target_type: string; p_target_id: string; p_category: string; p_reason: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
