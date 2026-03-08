"use client";

import { useState, useTransition } from "react";
import { vouchAsRoot, revokeRootVouch } from "../actions";

type User = {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  createdAt: Date;
  rang: number;
  totalWeight: number;
  rootVouched: boolean;
};

export function UserList({ users }: { users: User[] }) {
  const [search, setSearch] = useState("");
  const filtered = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        Users ({users.length})
      </h2>
      <div className="mt-4">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
            <tr>
              <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">User</th>
              <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Rang</th>
              <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Weight</th>
              <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Joined</th>
              <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Vouch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function UserRow({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();
  const [vouched, setVouched] = useState(user.rootVouched);
  const [error, setError] = useState("");
  const isRoot = user.username === "garona";

  function handleVouch() {
    setError("");
    startTransition(async () => {
      const result = await vouchAsRoot(user.id);
      if (result.error) {
        setError(result.error);
      } else {
        setVouched(true);
      }
    });
  }

  function handleRevoke() {
    setError("");
    startTransition(async () => {
      const result = await revokeRootVouch(user.id);
      if (result.error) {
        setError(result.error);
      } else {
        setVouched(false);
      }
    });
  }

  return (
    <tr className="bg-white dark:bg-zinc-900">
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {user.name}
            {isRoot && (
              <span className="ml-1.5 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                root
              </span>
            )}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            @{user.username}
          </p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {user.rang}
        </span>
      </td>
      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
        {user.totalWeight}
      </td>
      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        {isRoot ? (
          <span className="text-xs text-zinc-400">—</span>
        ) : vouched ? (
          <button
            type="button"
            onClick={handleRevoke}
            disabled={isPending}
            className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
          >
            {isPending ? "..." : "Revoke"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleVouch}
            disabled={isPending}
            className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
          >
            {isPending ? "..." : "Vouch (+3)"}
          </button>
        )}
        {error && (
          <p className="mt-1 text-[10px] text-red-500">{error}</p>
        )}
      </td>
    </tr>
  );
}
