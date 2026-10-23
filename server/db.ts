import { and, asc, desc, eq, gte, lt, lte, ne, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, projects, tasks } from "../drizzle/schema";
import { ENV } from './_core/env';
import type { Nezet } from "../shared/gtd";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

export async function getUserTasks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.userId, userId));
}

export async function getUserProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(eq(projects.userId, userId));
}

function napKezdete(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Függőben lévő feladatok, plusz a ma befejezettek (hogy a pipálás látható maradjon). */
function aktivVagyMaKesz(today: Date) {
  return or(eq(tasks.status, "pending"), gte(tasks.befejezve, today));
}

export async function getTasksByView(userId: number, view: Nezet, now: Date = new Date()) {
  const db = await getDb();
  if (!db) return [];

  const today = napKezdete(now);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const next10Days = new Date(today);
  next10Days.setDate(next10Days.getDate() + 10);

  const sajat = eq(tasks.userId, userId);

  switch (view) {
    case "next":
      return db
        .select()
        .from(tasks)
        .where(and(sajat, eq(tasks.lista, "kovetkezo"), aktivVagyMaKesz(today)))
        .orderBy(asc(tasks.createdAt));
    case "today":
      // GTD "kemény tájkép": a mai és a lejárt, még nyitott határidős tételek.
      return db
        .select()
        .from(tasks)
        .where(
          and(
            sajat,
            ne(tasks.lista, "referencia"),
            lt(tasks.dueDate, tomorrow),
            aktivVagyMaKesz(today)
          )
        )
        .orderBy(asc(tasks.dueDate));
    case "next10days":
      return db
        .select()
        .from(tasks)
        .where(
          and(
            sajat,
            ne(tasks.lista, "referencia"),
            gte(tasks.dueDate, tomorrow),
            lte(tasks.dueDate, next10Days),
            aktivVagyMaKesz(today)
          )
        )
        .orderBy(asc(tasks.dueDate));
    case "waiting":
      return db
        .select()
        .from(tasks)
        .where(and(sajat, eq(tasks.lista, "varakozas"), aktivVagyMaKesz(today)))
        .orderBy(asc(tasks.createdAt));
    case "someday":
      return db
        .select()
        .from(tasks)
        .where(and(sajat, eq(tasks.lista, "majd_egyszer"), aktivVagyMaKesz(today)))
        .orderBy(desc(tasks.createdAt));
    case "reference":
      return db
        .select()
        .from(tasks)
        .where(and(sajat, eq(tasks.lista, "referencia")))
        .orderBy(desc(tasks.createdAt));
  }
}

export async function getUserTaskById(userId: number, taskId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .limit(1);
  return task;
}
