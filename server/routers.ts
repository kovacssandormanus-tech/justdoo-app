import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getUserTasks, getUserProjects, getTasksByView, getUserTaskById, getDb } from "./db";
import {
  tasks,
  projects,
  gyujtoelemek,
  users,
  type InsertProject,
  type InsertTask,
} from "../drizzle/schema";
import { and, asc, count, desc, eq, ne } from "drizzle-orm";
import { feldolgozGyujtoelem } from "./feldolgozas";
import { attekintesAdatok, hetiAttekintes, mitCsinaljakMost, projektKovetkezoLepes } from "./asszisztens";
import {
  DONTESEK,
  ENERGIASZINTEK,
  LISTAK,
  NEZETEK,
  PROJEKT_ALLAPOTOK,
  type Dontes,
  type Energia,
  type Lista,
} from "../shared/gtd";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return db;
}

const gtdMezok = {
  lista: z.enum(LISTAK).optional(),
  kontextus: z.string().max(32).optional().nullable(),
  idoigeny: z.number().int().positive().max(10000).optional().nullable(),
  energia: z.enum(ENERGIASZINTEK).optional().nullable(),
  varakozasKire: z.string().max(255).optional().nullable(),
};

async function sajatGyujtoelem(userId: number, id: number) {
  const db = await requireDb();
  const [elem] = await db
    .select()
    .from(gyujtoelemek)
    .where(and(eq(gyujtoelemek.id, id), eq(gyujtoelemek.userId, userId)))
    .limit(1);
  if (!elem) throw new Error('Gyűjtőelem nem található');
  return elem;
}

function datumbol(hatarido: string) {
  // Helyi dél: így időzóna-eltolás mellett sem csúszik át a szomszédos napra.
  return new Date(`${hatarido}T12:00:00`);
}

/** A feldolgozási döntésből a létrehozandó feladat (projekt nélkül); elvetésnél null. */
export function gyujtoelemFeladat(
  szoveg: string,
  input: {
    dontes: Dontes;
    feladatcim?: string;
    hatarido?: string | null;
    lista?: Lista;
    kontextus?: string | null;
    idoigeny?: number | null;
    energia?: Energia | null;
    varakozasKire?: string | null;
  },
  ma: Date = new Date()
): Omit<InsertTask, 'userId'> | null {
  if (input.dontes === 'elvetes') return null;
  const title = (input.feladatcim?.trim() || szoveg).slice(0, 255);
  const alap = {
    title,
    kontextus: input.kontextus ?? null,
    idoigeny: input.idoigeny ?? null,
    energia: input.energia ?? null,
    dueDate: input.hatarido ? datumbol(input.hatarido) : null,
  };

  switch (input.dontes) {
    case 'ketperces':
      // Két perces szabály: azonnal elvégzendő, ezért a Ma nézetbe kerül.
      return { ...alap, lista: 'kovetkezo', idoigeny: alap.idoigeny ?? 2, dueDate: alap.dueDate ?? ma };
    case 'naptar':
      return { ...alap, lista: 'kovetkezo', dueDate: alap.dueDate ?? ma };
    case 'teendo':
    case 'projekt':
      return { ...alap, lista: 'kovetkezo' };
    case 'delegalas':
      return { ...alap, lista: 'varakozas', varakozasKire: input.varakozasKire?.trim() || null };
    case 'majd_egyszer':
      return { title, lista: 'majd_egyszer', description: title === szoveg ? null : szoveg };
    case 'referencia':
      return { title, lista: 'referencia', description: title === szoveg ? null : szoveg };
  }
}

async function attekintesAdatokBetolt(userId: number) {
  const db = await requireDb();
  const [feladatok, projektek, [gyujto]] = await Promise.all([
    getUserTasks(userId),
    getUserProjects(userId),
    db
      .select({ db: count() })
      .from(gyujtoelemek)
      .where(and(eq(gyujtoelemek.userId, userId), eq(gyujtoelemek.allapot, 'uj'))),
  ]);
  return attekintesAdatok({ feladatok, projektek, gyujtoDb: gyujto?.db ?? 0 });
}

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
      .input(z.enum(NEZETEK))
      .query(async ({ ctx, input }) => {
        return getTasksByView(ctx.user.id, input);
      }),

    listByProject: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const db = await requireDb();
        return db
          .select()
          .from(tasks)
          .where(and(eq(tasks.userId, ctx.user.id), eq(tasks.projectId, input)))
          .orderBy(asc(tasks.createdAt));
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        dueDate: z.date().optional(),
        projectId: z.number().optional(),
        ...gtdMezok,
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        return db.insert(tasks).values({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          dueDate: input.dueDate,
          projectId: input.projectId,
          lista: input.lista ?? 'kovetkezo',
          kontextus: input.kontextus ?? null,
          idoigeny: input.idoigeny ?? null,
          energia: input.energia ?? null,
          varakozasKire: input.varakozasKire ?? null,
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
        ...gtdMezok,
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const { id, ...mezok } = input;
        const updates: Partial<InsertTask> = {};
        for (const [kulcs, ertek] of Object.entries(mezok)) {
          if (ertek !== undefined) (updates as Record<string, unknown>)[kulcs] = ertek;
        }
        if (input.status) updates.befejezve = input.status === 'completed' ? new Date() : null;
        return db.update(tasks).set(updates).where(and(eq(tasks.id, id), eq(tasks.userId, ctx.user.id)));
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        return db.delete(tasks).where(and(eq(tasks.id, input), eq(tasks.userId, ctx.user.id)));
      }),

    toggleStatus: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const task = await getUserTaskById(ctx.user.id, input);
        if (!task) throw new Error('Task not found');
        const kesz = task.status === 'pending';
        return db
          .update(tasks)
          .set({ status: kesz ? 'completed' : 'pending', befejezve: kesz ? new Date() : null })
          .where(eq(tasks.id, input));
      }),
  }),

  gyujto: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await requireDb();
      return db
        .select()
        .from(gyujtoelemek)
        .where(and(eq(gyujtoelemek.userId, ctx.user.id), eq(gyujtoelemek.allapot, 'uj')))
        .orderBy(desc(gyujtoelemek.createdAt));
    }),

    add: protectedProcedure
      .input(z.object({ szoveg: z.string().trim().min(1).max(2000) }))
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        await db.insert(gyujtoelemek).values({ userId: ctx.user.id, szoveg: input.szoveg });
        return { success: true };
      }),

    javaslat: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const elem = await sajatGyujtoelem(ctx.user.id, input.id);

        const meglevo = await db
          .select({ name: projects.name })
          .from(projects)
          .where(and(eq(projects.userId, ctx.user.id), ne(projects.allapot, 'kesz')));

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
        const db = await requireDb();
        const elem = await sajatGyujtoelem(ctx.user.id, input.id);
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
        hatarido: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
        ...gtdMezok,
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const elem = await sajatGyujtoelem(ctx.user.id, input.id);
        const ujFeladat = gyujtoelemFeladat(elem.szoveg, input);

        if (ujFeladat) {
          let projectId: number | null = null;
          const projektnev = input.projektnev?.trim();
          if (projektnev && ujFeladat.lista !== 'referencia' && ujFeladat.lista !== 'majd_egyszer') {
            const [meglevo] = await db
              .select({ id: projects.id })
              .from(projects)
              .where(and(eq(projects.userId, ctx.user.id), eq(projects.name, projektnev)))
              .limit(1);
            if (meglevo) {
              projectId = meglevo.id;
            } else if (input.dontes === 'projekt') {
              const [pr] = await db.insert(projects).values({
                userId: ctx.user.id,
                name: projektnev,
                cel: elem.szoveg,
                color: '#3b82f6',
              });
              projectId = pr.insertId;
            }
          }
          await db.insert(tasks).values({ ...ujFeladat, userId: ctx.user.id, projectId });
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

    /** Projektek a nyitott következő lépések számával; 0 lépésű aktív projekt = elakadt. */
    overview: protectedProcedure.query(async ({ ctx }) => {
      const [projektek, feladatok] = await Promise.all([
        getUserProjects(ctx.user.id),
        getUserTasks(ctx.user.id),
      ]);
      return projektek.map(p => {
        const sajat = feladatok.filter(f => f.projectId === p.id);
        const nyitott = sajat.filter(f => f.status === 'pending' && f.lista === 'kovetkezo').length;
        return {
          ...p,
          nyitottLepesek: nyitott,
          keszLepesek: sajat.filter(f => f.status === 'completed').length,
          elakadt: p.allapot === 'aktiv' && nyitott === 0,
        };
      });
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        color: z.string().default('#3b82f6'),
        cel: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        return db.insert(projects).values({
          userId: ctx.user.id,
          name: input.name,
          color: input.color,
          cel: input.cel || null,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        color: z.string().optional(),
        cel: z.string().optional().nullable(),
        allapot: z.enum(PROJEKT_ALLAPOTOK).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const { id, ...mezok } = input;
        const updates: Partial<InsertProject> = {};
        for (const [kulcs, ertek] of Object.entries(mezok)) {
          if (ertek !== undefined) (updates as Record<string, unknown>)[kulcs] = ertek;
        }
        return db.update(projects).set(updates).where(and(eq(projects.id, id), eq(projects.userId, ctx.user.id)));
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        await db
          .update(tasks)
          .set({ projectId: null })
          .where(and(eq(tasks.projectId, input), eq(tasks.userId, ctx.user.id)));
        return db.delete(projects).where(and(eq(projects.id, input), eq(projects.userId, ctx.user.id)));
      }),
  }),

  asszisztens: router({
    mitCsinaljak: protectedProcedure
      .input(z.object({
        kontextus: z.string().max(32).optional().nullable(),
        idoPerc: z.number().int().positive().max(1440).optional().nullable(),
        energia: z.enum(ENERGIASZINTEK).optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const [feladatok, projektek] = await Promise.all([
          getTasksByView(ctx.user.id, 'next'),
          getUserProjects(ctx.user.id),
        ]);
        const javaslat = await mitCsinaljakMost({ feladatok, projektek, helyzet: input });
        const feladatMap = new Map(feladatok.map(f => [f.id, f]));
        return {
          osszegzes: javaslat.osszegzes,
          javaslatok: javaslat.javaslatok.map(j => ({ ...j, feladat: feladatMap.get(j.taskId)! })),
        };
      }),

    attekintesAllapot: protectedProcedure.query(async ({ ctx }) => {
      const adatok = await attekintesAdatokBetolt(ctx.user.id);
      return { ...adatok, utolsoAttekintes: ctx.user.utolsoAttekintes ?? null };
    }),

    hetiAttekintes: protectedProcedure.mutation(async ({ ctx }) => {
      const adatok = await attekintesAdatokBetolt(ctx.user.id);
      return hetiAttekintes(adatok);
    }),

    attekintesKesz: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await requireDb();
      const most = new Date();
      await db.update(users).set({ utolsoAttekintes: most }).where(eq(users.id, ctx.user.id));
      return { utolsoAttekintes: most };
    }),

    projektLepes: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const [projekt] = await db
          .select()
          .from(projects)
          .where(and(eq(projects.id, input), eq(projects.userId, ctx.user.id)))
          .limit(1);
        if (!projekt) throw new Error('Projekt nem található');
        const feladatok = await db
          .select()
          .from(tasks)
          .where(and(eq(tasks.userId, ctx.user.id), eq(tasks.projectId, input)))
          .orderBy(asc(tasks.createdAt));
        return projektKovetkezoLepes({ projekt, feladatok });
      }),
  }),
});

export type AppRouter = typeof appRouter;
