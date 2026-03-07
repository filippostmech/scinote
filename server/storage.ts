import {
  type User,
  type InsertUser,
  type Document,
  type InsertDocument,
  type Project,
  type InsertProject,
  type Tag,
  type InsertTag,
  type DocumentVersion,
  users,
  documents,
  projects,
  tags,
  documentTags,
  documentVersions,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, or, ilike, and } from "drizzle-orm";

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
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(data: InsertProject): Promise<Project>;
  updateProject(id: string, data: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<void>;
  getTags(): Promise<Tag[]>;
  createTag(data: InsertTag): Promise<Tag>;
  deleteTag(id: string): Promise<void>;
  getDocumentTags(documentId: string): Promise<Tag[]>;
  setDocumentTags(documentId: string, tagIds: string[]): Promise<Tag[]>;
  getDocumentVersions(documentId: string): Promise<DocumentVersion[]>;
  createDocumentVersion(documentId: string): Promise<DocumentVersion | undefined>;
  getDocumentVersion(documentId: string, version: number): Promise<DocumentVersion | undefined>;
  restoreDocumentVersion(documentId: string, version: number): Promise<Document | undefined>;
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
    await db.delete(documentTags).where(eq(documentTags.documentId, id));
    await db.delete(documentVersions).where(eq(documentVersions.documentId, id));
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
        projectId: original.projectId,
      })
      .returning();
    const originalTags = await this.getDocumentTags(id);
    if (originalTags.length > 0) {
      await this.setDocumentTags(created.id, originalTags.map(t => t.id));
    }
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

  async getProjects(): Promise<Project[]> {
    return db.select().from(projects).orderBy(projects.name);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(data: InsertProject): Promise<Project> {
    const [created] = await db.insert(projects).values(data).returning();
    return created;
  }

  async updateProject(id: string, data: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set(data)
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }

  async deleteProject(id: string): Promise<void> {
    await db.update(documents).set({ projectId: null }).where(eq(documents.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getTags(): Promise<Tag[]> {
    return db.select().from(tags).orderBy(tags.name);
  }

  async createTag(data: InsertTag): Promise<Tag> {
    const [created] = await db.insert(tags).values(data).returning();
    return created;
  }

  async deleteTag(id: string): Promise<void> {
    await db.delete(documentTags).where(eq(documentTags.tagId, id));
    await db.delete(tags).where(eq(tags.id, id));
  }

  async getDocumentTags(documentId: string): Promise<Tag[]> {
    const rows = await db
      .select({ tag: tags })
      .from(documentTags)
      .innerJoin(tags, eq(documentTags.tagId, tags.id))
      .where(eq(documentTags.documentId, documentId));
    return rows.map(r => r.tag);
  }

  async setDocumentTags(documentId: string, tagIds: string[]): Promise<Tag[]> {
    await db.delete(documentTags).where(eq(documentTags.documentId, documentId));
    if (tagIds.length > 0) {
      await db.insert(documentTags).values(
        tagIds.map(tagId => ({ documentId, tagId }))
      );
    }
    return this.getDocumentTags(documentId);
  }

  async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    return db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, documentId))
      .orderBy(desc(documentVersions.version));
  }

  async createDocumentVersion(documentId: string): Promise<DocumentVersion | undefined> {
    const doc = await this.getDocument(documentId);
    if (!doc) return undefined;
    const [created] = await db
      .insert(documentVersions)
      .values({
        documentId,
        version: doc.version,
        title: doc.title,
        blocks: doc.blocks,
      })
      .returning();
    await db
      .update(documents)
      .set({ version: doc.version + 1, updatedAt: new Date() })
      .where(eq(documents.id, documentId));
    return created;
  }

  async getDocumentVersion(documentId: string, version: number): Promise<DocumentVersion | undefined> {
    const [v] = await db
      .select()
      .from(documentVersions)
      .where(and(
        eq(documentVersions.documentId, documentId),
        eq(documentVersions.version, version),
      ));
    return v;
  }

  async restoreDocumentVersion(documentId: string, version: number): Promise<Document | undefined> {
    const v = await this.getDocumentVersion(documentId, version);
    if (!v) return undefined;
    await this.createDocumentVersion(documentId);
    const [updated] = await db
      .update(documents)
      .set({
        title: v.title,
        blocks: v.blocks,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
