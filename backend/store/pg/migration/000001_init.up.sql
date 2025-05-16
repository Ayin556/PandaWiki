-- Create "apps" table
CREATE TABLE
    "public"."apps" (
        "id" text NOT NULL,
        "kb_id" text NULL,
        "name" text NULL,
        "type" smallint NULL,
        "link" text NULL,
        "settings" jsonb NULL,
        "created_at" timestamptz NULL,
        "updated_at" timestamptz NULL,
        PRIMARY KEY ("id")
    );

-- Create index "idx_apps_link" to table: "apps"
CREATE INDEX "idx_apps_link" ON "public"."apps" ("link");

-- Create "conversation_messages" table
CREATE TABLE
    "public"."conversation_messages" (
        "id" text NOT NULL,
        "conversation_id" text NULL,
        "app_id" text NULL,
        "role" text NULL,
        "content" text NULL,
        "provider" text NULL,
        "model" text NULL,
        "prompt_tokens" bigint NULL DEFAULT 0,
        "completion_tokens" bigint NULL DEFAULT 0,
        "total_tokens" bigint NULL DEFAULT 0,
        "remote_ip" text NULL,
        "created_at" timestamptz NULL,
        PRIMARY KEY ("id")
    );

-- Create index "idx_conversation_messages_app_id" to table: "conversation_messages"
CREATE INDEX "idx_conversation_messages_app_id" ON "public"."conversation_messages" ("app_id");

-- Create index "idx_conversation_messages_conversation_id" to table: "conversation_messages"
CREATE INDEX "idx_conversation_messages_conversation_id" ON "public"."conversation_messages" ("conversation_id");

-- Create "conversation_references" table
CREATE TABLE
    "public"."conversation_references" (
        "conversation_id" text NULL,
        "app_id" text NULL,
        "doc_id" text NULL,
        "title" text NULL,
        "url" text NULL,
        "favicon" text NULL
    );

-- Create index "idx_conversation_references_conversation_id" to table: "conversation_references"
CREATE INDEX "idx_conversation_references_conversation_id" ON "public"."conversation_references" ("conversation_id");

-- Create "conversations" table
CREATE TABLE
    "public"."conversations" (
        "id" text NOT NULL,
        "nonce" text NULL,
        "kb_id" text NULL,
        "app_id" text NULL,
        "subject" text NULL,
        "remote_ip" text NULL,
        "created_at" timestamptz NULL,
        PRIMARY KEY ("id")
    );

-- Create index "idx_conversations_kb_id" to table: "conversations"
CREATE INDEX "idx_conversations_kb_id" ON "public"."conversations" ("kb_id");

-- Create index "idx_conversations_app_id" to table: "conversations"
CREATE INDEX "idx_conversations_app_id" ON "public"."conversations" ("app_id");


-- Create "doc_chunks" table
CREATE TABLE
    "public"."doc_chunks" (
        "id" text NOT NULL,
        "doc_id" text NULL,
        "seq" bigint NULL,
        "url" text NULL,
        "title" text NULL,
        "content" text NULL,
        "kb_id" text NULL,
        PRIMARY KEY ("id")
    );

-- Create index "idx_doc_chunks_doc_id" to table: "doc_chunks"
CREATE INDEX "idx_doc_chunks_doc_id" ON "public"."doc_chunks" ("doc_id");

-- Create index "idx_doc_chunks_kb_id" to table: "doc_chunks"
CREATE INDEX "idx_doc_chunks_kb_id" ON "public"."doc_chunks" ("kb_id");

-- Create "documents" table
CREATE TABLE
    "public"."documents" (
        "id" text NOT NULL,
        "kb_id" text NULL,
        "url" text NULL,
        "source" smallint NULL,
        "status" smallint NULL,
        "error" text NULL,
        "resource_type" text NULL DEFAULT 'Unknown',
        "meta" jsonb NULL,
        "content" text NULL,
        "screenshot" text NULL,
        "created_at" timestamptz NULL,
        "updated_at" timestamptz NULL,
        PRIMARY KEY ("id")
    );

-- Create index "idx_documents_kb_id_url" to table: "documents"
CREATE UNIQUE INDEX "idx_documents_kb_id_url" ON "public"."documents" ("kb_id", "url");

-- Create "knowledge_bases" table
CREATE TABLE
    "public"."knowledge_bases" (
        "id" text NOT NULL,
        "name" text NULL,
        "created_at" timestamptz NULL,
        "updated_at" timestamptz NULL,
        PRIMARY KEY ("id")
    );

-- Create "models" table
CREATE TABLE
    "public"."models" (
        "id" text NOT NULL,
        "provider" text NULL,
        "model" text NULL,
        "api_key" text NULL,
        "api_header" text NULL,
        "base_url" text NULL,
        "api_version" text NULL,
        "prompt_tokens" bigint NULL DEFAULT 0,
        "completion_tokens" bigint NULL DEFAULT 0,
        "total_tokens" bigint NULL DEFAULT 0,
        "created_at" timestamptz NULL,
        "updated_at" timestamptz NULL,
        "is_active" boolean NULL DEFAULT false,
        PRIMARY KEY ("id")
    );

-- Create "users" table
CREATE TABLE
    "public"."users" (
        "id" text NOT NULL,
        "account" text NULL,
        "password" text NULL,
        "created_at" timestamptz NULL,
        "last_access" timestamptz NULL,
        PRIMARY KEY ("id")
    );

-- Create index "idx_users_account" to table: "users"
CREATE UNIQUE INDEX "idx_users_account" ON "public"."users" ("account");
