import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
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
  ]),
  content: z.string(),
  meta: z.record(z.string(), z.any()).optional(),
});

export type Block = z.infer<typeof blockSchema>;

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull().default("Untitled"),
  blocks: jsonb("blocks").notNull().default(sql`'[]'::jsonb`),
  icon: text("icon"),
  coverColor: text("cover_color"),
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
