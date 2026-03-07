import {
  RANG_THRESHOLDS,
  vouchWeight,
  type PalierLevel,
} from "@garona/db";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-6 py-5">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Garona Admin
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Documentation — How the social network works
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Core Concept */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            The Rang System
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Garona is a trust-based social network for Toulouse. Every user has
            a <strong>Rang</strong> (trust level) from 0 to 5, computed
            dynamically from the vouches they receive. Higher rang unlocks more
            abilities.
          </p>

          <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-100 text-left text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                  <th className="px-4 py-3 font-medium">Rang</th>
                  <th className="px-4 py-3 font-medium">Label</th>
                  <th className="px-4 py-3 font-medium">Weight Needed</th>
                  <th className="px-4 py-3 font-medium">Abilities Unlocked</th>
                </tr>
              </thead>
              <tbody className="text-zinc-700 dark:text-zinc-300">
                {RANG_THRESHOLDS.map((t) => (
                  <tr
                    key={t.level}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/50"
                  >
                    <td className="px-4 py-3 font-mono font-semibold">
                      {t.level}
                    </td>
                    <td className="px-4 py-3">{t.label}</td>
                    <td className="px-4 py-3 font-mono">
                      {t.vouches < 0 ? "—" : `${t.vouches}+`}
                    </td>
                    <td className="px-4 py-3">{t.abilities.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
            Rang is never stored — it is always computed on-the-fly from active
            vouch weights. Authenticated users are always at least Rang 1.
          </p>
        </section>

        {/* Vouching */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Vouching Mechanics
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Any user at Rang 1+ can vouch for another user. Each vouch carries a{" "}
            <strong>weight</strong> that depends on the voucher&apos;s own rang.
            A user&apos;s total weight determines their rang.
          </p>

          <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-100 text-left text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                  <th className="px-4 py-3 font-medium">
                    Voucher&apos;s Rang
                  </th>
                  <th className="px-4 py-3 font-medium">Vouch Weight</th>
                </tr>
              </thead>
              <tbody className="text-zinc-700 dark:text-zinc-300">
                {RANG_THRESHOLDS.map((t) => {
                  const w = vouchWeight(t.level as PalierLevel);
                  return (
                    <tr
                      key={t.level}
                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/50"
                    >
                      <td className="px-4 py-3">
                        {t.level} — {t.label}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {w === 0 ? "Cannot vouch" : w}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
              Rules
            </h3>
            <ul className="list-inside list-disc space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>One vouch per user pair (unique constraint).</li>
              <li>You cannot vouch for yourself.</li>
              <li>
                Vouches can be <strong>revoked</strong> (soft-delete, preserves
                history). Revoked vouches don&apos;t count.
              </li>
              <li>
                Revoked vouches can be re-activated — the existing row is updated
                instead of creating a new one.
              </li>
              <li>
                The vouchee&apos;s rang is recalculated after every vouch or
                revocation.
              </li>
            </ul>
          </div>

          <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-100/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Example
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              A user receives 2 vouches from Rang 1 users (2 x 1 = 2) and 1
              vouch from a Rang 3 user (1 x 2 = 2). Total weight ={" "}
              <strong>4</strong> → Rang 2 (Contributeur, needs 3+).
            </p>
          </div>
        </section>

        {/* Signup */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Signup Flow
          </h2>
          <ol className="mt-4 list-inside list-decimal space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>User provides a name and username.</li>
            <li>
              Username is sanitized: lowercase, only{" "}
              <code className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
                a-z 0-9 . _ -
              </code>
              , 3–30 characters.
            </li>
            <li>
              An internal email (
              <code className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
                username@garona.local
              </code>
              ) and random password are generated — users authenticate via
              passkeys.
            </li>
            <li>Better-Auth creates the user and session.</li>
            <li>User starts at Rang 1 (Membre).</li>
          </ol>
        </section>

        {/* Authentication */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Authentication
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Garona uses <strong>Better-Auth</strong> with{" "}
            <strong>Passkey/WebAuthn</strong> as the primary method. Sessions are
            stored in the database and validated via cookies.
          </p>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>Dev mode:</strong> In non-production environments, send the{" "}
              <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs dark:bg-amber-900/50">
                X-Dev-User
              </code>{" "}
              header with a seeded username to bypass auth.
            </p>
          </div>
        </section>

        {/* Social Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Social Features
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Posts",
                desc: "Rang 2+ can create posts with multi-image carousels and captions.",
              },
              {
                title: "Likes",
                desc: "Rang 2+ can like/unlike posts. One like per user per post.",
              },
              {
                title: "Comments",
                desc: "Rang 2+ can comment on posts. Plain text, tied to a post and author.",
              },
              {
                title: "Follows",
                desc: "Rang 1+ can follow other users. One follow per pair.",
              },
              {
                title: "Stories",
                desc: "Ephemeral content with a 24-hour expiry. Tied to an author.",
              },
              {
                title: "Feed",
                desc: "Personalized feed (followed + own posts) or discovery feed for visitors.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {feature.title}
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Data Model */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Data Model
          </h2>
          <pre className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-100 p-4 font-mono text-xs leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            {`users
 ├── sessions        (1:N)
 ├── accounts        (1:N, OAuth)
 ├── passkeys        (1:N, WebAuthn)
 ├── posts
 │    ├── postImages (1:N, carousel)
 │    ├── likes      (N:M)
 │    └── comments   (1:N)
 ├── stories         (1:N)
 ├── follows          (N:M)
 └── vouches          (N:M, voucher → vouchee)`}
          </pre>
        </section>

        {/* API Reference */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            API Reference
          </h2>
          <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-100 text-left text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                  <th className="px-4 py-3 font-medium">Route</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Auth</th>
                </tr>
              </thead>
              <tbody className="text-zinc-700 dark:text-zinc-300">
                {[
                  {
                    route: "POST /api/signup",
                    desc: "Create account with username",
                    auth: "No",
                  },
                  {
                    route: "GET /api/me",
                    desc: "Current user profile",
                    auth: "Yes",
                  },
                  {
                    route: "GET /api/vouches/me",
                    desc: "My rang + vouch counts",
                    auth: "Yes",
                  },
                  {
                    route: "POST /api/vouches/vouch/:id",
                    desc: "Vouch for a user",
                    auth: "Rang 1+",
                  },
                  {
                    route: "DELETE /api/vouches/vouch/:id",
                    desc: "Revoke vouch",
                    auth: "Rang 1+",
                  },
                  {
                    route: "GET /api/feed",
                    desc: "Personalized or discovery feed",
                    auth: "Optional",
                  },
                  {
                    route: "POST /api/posts",
                    desc: "Create post",
                    auth: "Rang 2+",
                  },
                  {
                    route: "POST /api/posts/:id/like",
                    desc: "Like/unlike post",
                    auth: "Rang 2+",
                  },
                  {
                    route: "POST /api/posts/:id/comment",
                    desc: "Add comment",
                    auth: "Rang 2+",
                  },
                  {
                    route: "GET /api/profiles/:username",
                    desc: "Get user profile",
                    auth: "No",
                  },
                  {
                    route: "POST /api/profiles/:username/follow",
                    desc: "Follow user",
                    auth: "Rang 1+",
                  },
                  {
                    route: "GET /api/profiles",
                    desc: "Search users",
                    auth: "No",
                  },
                  {
                    route: "GET /api/activity",
                    desc: "Activity on my content",
                    auth: "Yes",
                  },
                ].map((row) => (
                  <tr
                    key={row.route}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                      {row.route}
                    </td>
                    <td className="px-4 py-3">{row.desc}</td>
                    <td className="px-4 py-3 text-xs">{row.auth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Design Decisions */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Key Design Decisions
          </h2>
          <dl className="mt-4 space-y-4">
            {[
              {
                term: "Rang is computed, not stored",
                desc: "Prevents stale data and ensures consistency when vouches are revoked.",
              },
              {
                term: "Weighted vouching",
                desc: "Higher-trust users have more influence, creating a natural hierarchy.",
              },
              {
                term: "Progressive access",
                desc: "New users can browse immediately but must earn trust to post. Prevents spam and abuse.",
              },
              {
                term: "Soft-delete for vouches",
                desc: "Revoking sets revoked = true rather than deleting, preserving history.",
              },
              {
                term: "No email-based identity",
                desc: "Users sign up with usernames and authenticate via passkeys. Internal @garona.local emails are generated for Better-Auth compatibility.",
              },
            ].map((item) => (
              <div key={item.term}>
                <dt className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {item.term}
                </dt>
                <dd className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {item.desc}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </div>
  );
}
