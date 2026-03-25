import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer, boolean, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const blockSchema = z.object({
  id: z.string(),
  type: z.enum([
    "text",
    "heading1",
    "heading2",
    "heading3",
    "bulleted-list",
    "numbered-list",
    "code",
    "quote",
    "divider",
    "callout",
    "table",
    "image",
  ]),
  content: z.string(),
  meta: z.object({
    align: z.enum(["left", "center", "right"]).optional(),
  }).catchall(z.any()).optional(),
});

export type Block = z.infer<typeof blockSchema>;

export const workspaces = pgTable("workspaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#2EAADC"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({
  id: true,
  createdAt: true,
});
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Workspace = typeof workspaces.$inferSelect;

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#2EAADC"),
  description: text("description"),
  workspaceId: varchar("workspace_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export const tags = pgTable("tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#787774"),
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
});
export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull().default("Untitled"),
  blocks: jsonb("blocks").notNull().default(sql`'[]'::jsonb`),
  icon: text("icon"),
  coverColor: text("cover_color"),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  projectId: varchar("project_id"),
  workspaceId: varchar("workspace_id"),
  version: integer("version").default(1).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  sortOrder: integer("sort_order").default(0),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export const documentTags = pgTable("document_tags", {
  documentId: varchar("document_id").notNull(),
  tagId: varchar("tag_id").notNull(),
}, (t) => [
  primaryKey({ columns: [t.documentId, t.tagId] }),
]);

export const documentVersions = pgTable("document_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull(),
  version: integer("version").notNull(),
  title: text("title").notNull(),
  blocks: jsonb("blocks").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDocumentVersionSchema = createInsertSchema(documentVersions).omit({
  id: true,
  createdAt: true,
});
export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;
export type DocumentVersion = typeof documentVersions.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
