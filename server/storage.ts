import {
  type User,
  type InsertUser,
  type Document,
  type InsertDocument,
  users,
  documents,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, or, ilike } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getDocuments(): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<void>;
  searchDocuments(query: string): Promise<Document[]>;
  duplicateDocument(id: string): Promise<Document | undefined>;
  toggleFavorite(id: string): Promise<Document | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getDocuments(): Promise<Document[]> {
    return db.select().from(documents).orderBy(desc(documents.updatedAt));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const [created] = await db.insert(documents).values(doc).returning();
    return created;
  }

  async updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document | undefined> {
    const [updated] = await db
      .update(documents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  async searchDocuments(query: string): Promise<Document[]> {
    const pattern = `%${query}%`;
    return db
      .select()
      .from(documents)
      .where(
        or(
          ilike(documents.title, pattern),
          sql`${documents.blocks}::text ILIKE ${pattern}`
        )
      )
      .orderBy(desc(documents.updatedAt));
  }

  async duplicateDocument(id: string): Promise<Document | undefined> {
    const original = await this.getDocument(id);
    if (!original) return undefined;
    const [created] = await db
      .insert(documents)
      .values({
        title: `Copy of ${original.title}`,
        blocks: original.blocks,
        icon: original.icon,
        coverColor: original.coverColor,
      })
      .returning();
    return created;
  }

  async toggleFavorite(id: string): Promise<Document | undefined> {
    const doc = await this.getDocument(id);
    if (!doc) return undefined;
    const [updated] = await db
      .update(documents)
      .set({ isFavorite: !doc.isFavorite, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
