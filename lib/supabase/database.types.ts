export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Relationship<
  ForeignKeyName extends string,
  Columns extends string[],
  ReferencedRelation extends string,
  ReferencedColumns extends string[],
> = {
  foreignKeyName: ForeignKeyName;
  columns: Columns;
  isOneToOne: false;
  referencedRelation: ReferencedRelation;
  referencedColumns: ReferencedColumns;
};

type Table<Row, Insert, Update, Relationships extends unknown[] = []> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationships;
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.18" };
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      conversations: Table<
        {
          id: string;
          type: string;
          name: string | null;
          avatar_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          type: string;
          name?: string | null;
          avatar_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          type?: string;
          name?: string | null;
          avatar_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        [
          Relationship<
            "conversations_created_by_fkey",
            ["created_by"],
            "profiles",
            ["id"]
          >,
        ]
      >;
      conversation_participants: Table<
        {
          id: string;
          conversation_id: string;
          user_id: string;
          role: string;
          joined_at: string;
          last_read_at: string | null;
        },
        {
          id?: string;
          conversation_id: string;
          user_id: string;
          role?: string;
          joined_at?: string;
          last_read_at?: string | null;
        },
        {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string;
          last_read_at?: string | null;
        },
        [
          Relationship<
            "conversation_participants_conversation_id_fkey",
            ["conversation_id"],
            "conversations",
            ["id"]
          >,
          Relationship<
            "conversation_participants_user_id_fkey",
            ["user_id"],
            "profiles",
            ["id"]
          >,
        ]
      >;
      messages: Table<
        {
          id: string;
          conversation_id: string;
          sender_id: string | null;
          content: string;
          message_type: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        },
        {
          id?: string;
          conversation_id: string;
          sender_id?: string | null;
          content: string;
          message_type?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        },
        {
          id?: string;
          conversation_id?: string;
          sender_id?: string | null;
          content?: string;
          message_type?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        },
        [
          Relationship<
            "messages_conversation_id_fkey",
            ["conversation_id"],
            "conversations",
            ["id"]
          >,
          Relationship<
            "messages_sender_id_fkey",
            ["sender_id"],
            "profiles",
            ["id"]
          >,
        ]
      >;
      message_reads: Table<
        {
          id: string;
          message_id: string;
          user_id: string;
          read_at: string;
        },
        {
          id?: string;
          message_id: string;
          user_id: string;
          read_at?: string;
        },
        {
          id?: string;
          message_id?: string;
          user_id?: string;
          read_at?: string;
        },
        [
          Relationship<
            "message_reads_message_id_fkey",
            ["message_id"],
            "messages",
            ["id"]
          >,
          Relationship<
            "message_reads_user_id_fkey",
            ["user_id"],
            "profiles",
            ["id"]
          >,
        ]
      >;
      friendships: Table<
        {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          requester_id?: string;
          addressee_id?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        },
        [
          Relationship<
            "friendships_requester_id_fkey",
            ["requester_id"],
            "profiles",
            ["id"]
          >,
          Relationship<
            "friendships_addressee_id_fkey",
            ["addressee_id"],
            "profiles",
            ["id"]
          >,
        ]
      >;
    };
    Views: Record<string, never>;
    Functions: {
      add_conversation_participant: {
        Args: { target_conversation_id: string; target_user_id: string };
        Returns: undefined;
      };
      create_conversation: {
        Args: { conversation_name?: string; conversation_type: string };
        Returns: string;
      };
      is_conversation_participant: {
        Args: { target_conversation_id: string };
        Returns: boolean;
      };
      respond_friend_request: {
        Args: { response: string; target_friendship_id: string };
        Returns: undefined;
      };
      send_friend_request: {
        Args: { target_user_id: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
