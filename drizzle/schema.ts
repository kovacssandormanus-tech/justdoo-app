import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { ENERGIASZINTEK, LISTAK, PROJEKT_ALLAPOTOK } from "../shared/gtd";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  /** A legutóbbi GTD heti áttekintés időpontja. */
  utolsoAttekintes: timestamp("utolsoAttekintes"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 7 }).default("#3b82f6").notNull(),
  /** GTD: a kívánt végeredmény ("mikor van kész?"). */
  cel: text("cel"),
  allapot: mysqlEnum("allapot", PROJEKT_ALLAPOTOK).default("aktiv").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate"),
  status: mysqlEnum("status", ["pending", "completed"]).default("pending").notNull(),
  lista: mysqlEnum("lista", LISTAK).default("kovetkezo").notNull(),
  kontextus: varchar("kontextus", { length: 32 }),
  /** Becsült időigény percben. */
  idoigeny: int("idoigeny"),
  energia: mysqlEnum("energia", ENERGIASZINTEK),
  /** Várakozás listánál: kitől várunk. */
  varakozasKire: varchar("varakozasKire", { length: 255 }),
  befejezve: timestamp("befejezve"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Gyűjtőelemek: a GTD "gyűjtés" lépésében rögzített, még fel nem dolgozott tételek.
 * Az AI ezekből kérdez és sorol be teendőt, projektet vagy elvetést.
 */
export const gyujtoelemek = mysqlTable("gyujtoelemek", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  szoveg: text("szoveg").notNull(),
  kontextus: text("kontextus"),
  kerdes: text("kerdes"),
  allapot: mysqlEnum("allapot", ["uj", "veglegesitve"]).default("uj").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Gyujtoelem = typeof gyujtoelemek.$inferSelect;
export type InsertGyujtoelem = typeof gyujtoelemek.$inferInsert;
