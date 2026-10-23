import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getUserTasks, getUserProjects, getTasksByView, getDb } from "./db";
import { tasks, projects, gyujtoelemek } from "../drizzle/schema";
import { and, desc, eq } from "drizzle-orm";
import { feldolgozGyujtoelem, DONTESEK } from "./feldolgozas";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  tasks: router({
    listByView: protectedProcedure
      .input(z.enum(['inbox', 'today', 'next10days', 'someday']))
      .query(async ({ ctx, input }) => {
        return getTasksByView(ctx.user.id, input);
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        dueDate: z.date().optional(),
        projectId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        return db.insert(tasks).values({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          dueDate: input.dueDate,
          projectId: input.projectId,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        dueDate: z.date().optional().nullable(),
        projectId: z.number().optional().nullable(),
        status: z.enum(['pending', 'completed']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const updates: Record<string, any> = {};
        if (input.title !== undefined) updates.title = input.title;
        if (input.description !== undefined) updates.description = input.description;
        if (input.dueDate !== undefined) updates.dueDate = input.dueDate;
        if (input.projectId !== undefined) updates.projectId = input.projectId;
        if (input.status !== undefined) updates.status = input.status;
        return db.update(tasks).set(updates).where(eq(tasks.id, input.id));
      }),
    
    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        return db.delete(tasks).where(eq(tasks.id, input));
      }),
    
    toggleStatus: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const task = await db.select().from(tasks).where(eq(tasks.id, input)).limit(1);
        if (!task.length) throw new Error('Task not found');
        const newStatus = task[0].status === 'pending' ? 'completed' : 'pending';
        return db.update(tasks).set({ status: newStatus }).where(eq(tasks.id, input));
      }),
  }),

  gyujto: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      return db
        .select()
        .from(gyujtoelemek)
        .where(and(eq(gyujtoelemek.userId, ctx.user.id), eq(gyujtoelemek.allapot, 'uj')))
        .orderBy(desc(gyujtoelemek.createdAt));
    }),

    add: protectedProcedure
      .input(z.object({ szoveg: z.string().trim().min(1).max(2000) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        await db.insert(gyujtoelemek).values({ userId: ctx.user.id, szoveg: input.szoveg });
        return { success: true };
      }),

    javaslat: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const [elem] = await db
          .select()
          .from(gyujtoelemek)
          .where(and(eq(gyujtoelemek.id, input.id), eq(gyujtoelemek.userId, ctx.user.id)))
          .limit(1);
        if (!elem) throw new Error('Gyűjtőelem nem található');

        const meglevo = await db
          .select({ name: projects.name })
          .from(projects)
          .where(eq(projects.userId, ctx.user.id));

        const javaslat = await feldolgozGyujtoelem({
          szoveg: elem.szoveg,
          kontextus: elem.kontextus,
          meglevoProjektek: meglevo.map(p => p.name),
        });

        await db
          .update(gyujtoelemek)
          .set({ kerdes: javaslat.dontes ? null : javaslat.kerdes })
          .where(eq(gyujtoelemek.id, input.id));

        return javaslat;
      }),

    valaszol: protectedProcedure
      .input(z.object({ id: z.number(), valasz: z.string().trim().min(1).max(2000) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const [elem] = await db
          .select()
          .from(gyujtoelemek)
          .where(and(eq(gyujtoelemek.id, input.id), eq(gyujtoelemek.userId, ctx.user.id)))
          .limit(1);
        if (!elem) throw new Error('Gyűjtőelem nem található');

        const kontextus = [elem.kontextus, input.valasz].filter(Boolean).join('\n');
        await db
          .update(gyujtoelemek)
          .set({ kontextus, kerdes: null })
          .where(eq(gyujtoelemek.id, input.id));
        return { success: true };
      }),

    veglegesit: protectedProcedure
      .input(z.object({
        id: z.number(),
        dontes: z.enum(DONTESEK),
        feladatcim: z.string().optional(),
        projektnev: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const [elem] = await db
          .select()
          .from(gyujtoelemek)
          .where(and(eq(gyujtoelemek.id, input.id), eq(gyujtoelemek.userId, ctx.user.id)))
          .limit(1);
        if (!elem) throw new Error('Gyűjtőelem nem található');

        const cim = input.feladatcim?.trim() || elem.szoveg;

        if (input.dontes === 'projekt') {
          const [pr] = await db.insert(projects).values({
            userId: ctx.user.id,
            name: input.projektnev?.trim() || cim,
            color: '#3b82f6',
          });
          await db.insert(tasks).values({
            userId: ctx.user.id,
            title: cim,
            projectId: pr.insertId,
          });
        } else if (input.dontes !== 'elvetes') {
          // ketperces, teendo és majd_egyszer: a feladat a feladatlistába kerül.
          // A majd_egyszer tétel dátum nélkül marad, így a "Valamikor talán" nézetben jelenik meg.
          await db.insert(tasks).values({ userId: ctx.user.id, title: cim });
        }

        await db
          .update(gyujtoelemek)
          .set({ allapot: 'veglegesitve', kerdes: null })
          .where(eq(gyujtoelemek.id, input.id));
        return { success: true };
      }),
  }),

  projects: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return getUserProjects(ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        color: z.string().default('#3b82f6'),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        return db.insert(projects).values({
          userId: ctx.user.id,
          name: input.name,
          color: input.color,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const updates: Record<string, any> = {};
        if (input.name !== undefined) updates.name = input.name;
        if (input.color !== undefined) updates.color = input.color;
        return db.update(projects).set(updates).where(eq(projects.id, input.id));
      }),
    
    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        return db.delete(projects).where(eq(projects.id, input));
      }),
  }),
});

export type AppRouter = typeof appRouter;
