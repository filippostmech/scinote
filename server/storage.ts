import {
  type User,
  type InsertUser,
  type Document,
  type InsertDocument,
  users,
  documents,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getDocuments(): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<void>;
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
}

export const storage = new DatabaseStorage();
