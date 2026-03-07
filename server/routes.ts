import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDocumentSchema, blockSchema } from "@shared/schema";
import { z } from "zod";

const updateDocumentSchema = z.object({
  title: z.string().optional(),
  blocks: z.array(blockSchema).optional(),
  icon: z.string().nullable().optional(),
  coverColor: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  isFavorite: z.boolean().optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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

  app.patch("/api/documents/:id", async (req, res) => {
    const parsed = updateDocumentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid update data", errors: parsed.error.flatten() });
    }
    const doc = await storage.updateDocument(req.params.id, parsed.data);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.json(doc);
  });

  app.delete("/api/documents/:id", async (req, res) => {
    await storage.deleteDocument(req.params.id);
    res.status(204).send();
  });

  return httpServer;
}
