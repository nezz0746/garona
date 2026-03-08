import {
  db,
  users,
  vouches,
  computeRang,
} from "@garona/db";
import { eq, and, sql } from "drizzle-orm";
import { CreatePostForm } from "./components/CreatePostForm";
import { LogoutButton } from "./components/LogoutButton";
import { RootAccountSection } from "./components/RootAccountSection";
import { UserList } from "./components/UserList";
import { getUsers } from "./actions";

export const dynamic = "force-dynamic";

async function getRootAccount() {
  const [rootUser] = await db
    .select()
    .from(users)
    .where(eq(users.username, "garona"));

  if (!rootUser) return { user: null, vouchCount: 0, rang: 0 };

  const [result] = await db
    .select({ total: sql<number>`coalesce(sum(${vouches.weight}), 0)` })
    .from(vouches)
    .where(and(eq(vouches.voucheeId, rootUser.id), eq(vouches.revoked, false)));

  const totalWeight = Number(result?.total ?? 0);
  const rang = Math.max(computeRang(totalWeight), 1);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(vouches)
    .where(and(eq(vouches.voucheeId, rootUser.id), eq(vouches.revoked, false)));

  return {
    user: rootUser,
    vouchCount: Number(countResult?.count ?? 0),
    rang,
  };
}

export default async function Home() {
  const { user: rootUser, vouchCount, rang } = await getRootAccount();
  const allUsers = await getUsers();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Garona Admin
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Dashboard
            </p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Root Account */}
        <RootAccountSection
          initialUser={rootUser}
          vouchCount={vouchCount}
          rang={rang}
        />

        {/* User List with vouch controls */}
        <UserList users={allUsers} />

        {/* Create Post (only if root account exists) */}
        {rootUser && <CreatePostForm rootUserId={rootUser.id} />}

        {/* Docs Link */}
        <section className="mb-12">
          <a
            href="/docs"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            View Documentation
            <span aria-hidden="true">&rarr;</span>
          </a>
        </section>
      </main>
    </div>
  );
}
