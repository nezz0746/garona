"use client";

import { useState } from "react";
import { runCommentsMigration } from "../actions";

export function MigrationButton() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleMigration = async () => {
    if (status === "running") return;

    const confirmed = window.confirm(
      "⚠️ Migration: Comments → Reply Posts\n\n" +
      "Cette migration va:\n" +
      "1. Ajouter parent_id + reply_count aux posts\n" +
      "2. Convertir tous les commentaires en reply posts\n" +
      "3. Supprimer la table comments (backup créé)\n\n" +
      "Continuer ?"
    );

    if (!confirmed) return;

    setStatus("running");
    setMessage("");

    try {
      const result = await runCommentsMigration();
      if (result.success) {
        setStatus("done");
        setMessage(result.message);
      } else {
        setStatus("error");
        setMessage("Erreur inconnue");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Erreur lors de la migration");
    }
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            🔄 Migration: Comments → Reply Posts
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Convertit les commentaires en posts avec parentId. Idempotent et safe.
          </p>
        </div>
        <button
          onClick={handleMigration}
          disabled={status === "running"}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            status === "running"
              ? "cursor-not-allowed bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
              : status === "done"
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30"
          }`}
        >
          {status === "running" ? "Migration en cours..." : status === "done" ? "✓ Terminé" : "Exécuter"}
        </button>
      </div>
      {message && (
        <div
          className={`mt-3 rounded-md px-3 py-2 text-xs ${
            status === "error"
              ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
