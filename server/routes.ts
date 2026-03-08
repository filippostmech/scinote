import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDocumentSchema, insertProjectSchema, insertTagSchema, insertWorkspaceSchema, blockSchema } from "@shared/schema";
import { z } from "zod";

const updateWorkspaceSchema = z.object({
  name: z.string().optional(),
  color: z.string().optional(),
  description: z.string().nullable().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().optional(),
  color: z.string().optional(),
  description: z.string().nullable().optional(),
  workspaceId: z.string().nullable().optional(),
});

const updateDocumentSchema = z.object({
  title: z.string().optional(),
  blocks: z.array(blockSchema).optional(),
  icon: z.string().nullable().optional(),
  coverColor: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  isFavorite: z.boolean().optional(),
  projectId: z.string().nullable().optional(),
  workspaceId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/workspaces", async (_req, res) => {
    const list = await storage.getWorkspaces();
    res.json(list);
  });

  app.post("/api/workspaces", async (req, res) => {
    const parsed = insertWorkspaceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid workspace data", errors: parsed.error.flatten() });
    }
    const ws = await storage.createWorkspace(parsed.data);
    res.status(201).json(ws);
  });

  app.patch("/api/workspaces/:id", async (req, res) => {
    const parsed = updateWorkspaceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid workspace data", errors: parsed.error.flatten() });
    }
    const ws = await storage.updateWorkspace(req.params.id, parsed.data);
    if (!ws) return res.status(404).json({ message: "Workspace not found" });
    res.json(ws);
  });

  app.delete("/api/workspaces/:id", async (req, res) => {
    await storage.deleteWorkspace(req.params.id);
    res.status(204).send();
  });

  app.get("/api/projects", async (_req, res) => {
    const list = await storage.getProjects();
    res.json(list);
  });

  app.post("/api/projects", async (req, res) => {
    const parsed = insertProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid project data", errors: parsed.error.flatten() });
    }
    const project = await storage.createProject(parsed.data);
    res.status(201).json(project);
  });

  app.patch("/api/projects/:id", async (req, res) => {
    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid project data", errors: parsed.error.flatten() });
    }
    const project = await storage.updateProject(req.params.id, parsed.data);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  });

  app.delete("/api/projects/:id", async (req, res) => {
    await storage.deleteProject(req.params.id);
    res.status(204).send();
  });

  app.get("/api/tags", async (_req, res) => {
    const list = await storage.getTags();
    res.json(list);
  });

  app.post("/api/tags", async (req, res) => {
    const parsed = insertTagSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid tag data", errors: parsed.error.flatten() });
    }
    const tag = await storage.createTag(parsed.data);
    res.status(201).json(tag);
  });

  app.delete("/api/tags/:id", async (req, res) => {
    await storage.deleteTag(req.params.id);
    res.status(204).send();
  });

  app.get("/api/documents", async (_req, res) => {
    const docs = await storage.getDocuments();
    res.json(docs);
  });

  app.get("/api/documents/search", async (req, res) => {
    const q = (req.query.q as string) || "";
    if (!q.trim()) {
      return res.json([]);
    }
    const docs = await storage.searchDocuments(q.trim());
    res.json(docs);
  });

  app.get("/api/documents/:id", async (req, res) => {
    const doc = await storage.getDocument(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.json(doc);
  });

  app.get("/api/documents/tags/batch", async (req, res) => {
    const ids = ((req.query.ids as string) || "").split(",").filter(Boolean);
    const result: Record<string, any[]> = {};
    for (const id of ids) {
      result[id] = await storage.getDocumentTags(id);
    }
    res.json(result);
  });

  app.get("/api/documents/:id/tags", async (req, res) => {
    const docTags = await storage.getDocumentTags(req.params.id);
    res.json(docTags);
  });

  app.get("/api/documents/:id/versions", async (req, res) => {
    const versions = await storage.getDocumentVersions(req.params.id);
    res.json(versions);
  });

  app.post("/api/documents", async (req, res) => {
    const parsed = insertDocumentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid document data", errors: parsed.error.flatten() });
    }
    const doc = await storage.createDocument(parsed.data);
    res.status(201).json(doc);
  });

  app.post("/api/documents/:id/duplicate", async (req, res) => {
    const doc = await storage.duplicateDocument(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.status(201).json(doc);
  });

  app.post("/api/documents/:id/favorite", async (req, res) => {
    const doc = await storage.toggleFavorite(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.json(doc);
  });

  app.post("/api/documents/:id/versions", async (req, res) => {
    const version = await storage.createDocumentVersion(req.params.id);
    if (!version) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.status(201).json(version);
  });

  app.post("/api/documents/:id/versions/:version/restore", async (req, res) => {
    const versionNum = parseInt(req.params.version);
    if (isNaN(versionNum)) {
      return res.status(400).json({ message: "Invalid version number" });
    }
    const doc = await storage.restoreDocumentVersion(req.params.id, versionNum);
    if (!doc) {
      return res.status(404).json({ message: "Version not found" });
    }
    res.json(doc);
  });

  app.patch("/api/documents/:id", async (req, res) => {
    const parsed = updateDocumentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid update data", errors: parsed.error.flatten() });
    }
    const { tagIds, ...docData } = parsed.data;
    const doc = await storage.updateDocument(req.params.id, docData);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }
    if (tagIds !== undefined) {
      await storage.setDocumentTags(req.params.id, tagIds);
    }
    res.json(doc);
  });

  app.delete("/api/documents/:id", async (req, res) => {
    await storage.deleteDocument(req.params.id);
    res.status(204).send();
  });

  return httpServer;
}
