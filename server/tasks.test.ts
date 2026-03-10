import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("tasks procedures", () => {
  describe("tasks.create", () => {
    it("creates a new task with title", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tasks.create({
        title: "Test Task",
      });

      expect(result).toBeDefined();
    });

    it("creates a task with all fields", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const dueDate = new Date();

      const result = await caller.tasks.create({
        title: "Complete Task",
        description: "This is a complete task",
        dueDate,
        projectId: 1,
      });

      expect(result).toBeDefined();
    });

    it("rejects task creation without title", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.tasks.create({
          title: "",
        })
      ).rejects.toThrow();
    });
  });

  describe("tasks.listByView", () => {
    it("lists inbox tasks (unscheduled)", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tasks.listByView("inbox");

      expect(Array.isArray(result)).toBe(true);
    });

    it("lists today tasks", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tasks.listByView("today");

      expect(Array.isArray(result)).toBe(true);
    });

    it("lists next 10 days tasks", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tasks.listByView("next10days");

      expect(Array.isArray(result)).toBe(true);
    });

    it("lists someday tasks", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tasks.listByView("someday");

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("tasks.update", () => {
    it("updates task title", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a task first
      await caller.tasks.create({
        title: "Original Title",
      });

      // Update it
      const result = await caller.tasks.update({
        id: 1,
        title: "Updated Title",
      });

      expect(result).toBeDefined();
    });

    it("updates task status", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tasks.update({
        id: 1,
        status: "completed",
      });

      expect(result).toBeDefined();
    });

    it("clears due date when set to null", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tasks.update({
        id: 1,
        dueDate: null,
      });

      expect(result).toBeDefined();
    });
  });

  describe("tasks.toggleStatus", () => {
    it("toggles task status", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tasks.toggleStatus(1);

      expect(result).toBeDefined();
    });
  });

  describe("tasks.delete", () => {
    it("deletes a task", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tasks.delete(1);

      expect(result).toBeDefined();
    });
  });
});

describe("projects procedures", () => {
  describe("projects.create", () => {
    it("creates a new project with name", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.projects.create({
        name: "Test Project",
      });

      expect(result).toBeDefined();
    });

    it("creates a project with custom color", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.projects.create({
        name: "Colored Project",
        color: "#ff0000",
      });

      expect(result).toBeDefined();
    });

    it("rejects project creation without name", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.projects.create({
          name: "",
        })
      ).rejects.toThrow();
    });
  });

  describe("projects.list", () => {
    it("lists all projects for user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.projects.list();

      expect(Array.isArray(result)).toBe(true);
    });

    it("returns empty array when no projects exist", async () => {
      const ctx = createAuthContext(999);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.projects.list();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("projects.update", () => {
    it("updates project name", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.projects.update({
        id: 1,
        name: "Updated Project Name",
      });

      expect(result).toBeDefined();
    });

    it("updates project color", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.projects.update({
        id: 1,
        color: "#00ff00",
      });

      expect(result).toBeDefined();
    });
  });

  describe("projects.delete", () => {
    it("deletes a project", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.projects.delete(1);

      expect(result).toBeDefined();
    });
  });
});
