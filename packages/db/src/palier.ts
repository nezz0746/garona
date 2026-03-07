// ─── Rang (Trust Rank) System ───
//
// Rang is computed from the sum of active (non-revoked) vouch weights.
// Higher-rang vouchers give more weight.

// Rang 0 = unauthenticated visitor (not stored, inferred)
// Rang 1 = any signed-up user (0 vouches needed, just an account)
// Rang 2+ = earned via vouches
export const RANG_THRESHOLDS = [
  { level: 0, vouches: -1, label: "Visiteur", abilities: ["browse feed"] },
  {
    level: 1,
    vouches: 0,
    label: "Membre",
    abilities: ["create profile", "follow", "like"],
  },
  {
    level: 2,
    vouches: 3,
    label: "Contributeur",
    abilities: ["post", "comment"],
  },
  { level: 3, vouches: 5, label: "Résident", abilities: ["DMs"] },
  {
    level: 4,
    vouches: 10,
    label: "Notable",
    abilities: ["create events"],
  },
  {
    level: 5,
    vouches: 20,
    label: "Gardien",
    abilities: ["moderate", "verify others"],
  },
] as const;

// Backward compat alias
export const PALIER_THRESHOLDS = RANG_THRESHOLDS;

export type PalierLevel = 0 | 1 | 2 | 3 | 4 | 5;

export function computePalier(totalWeight: number): PalierLevel {
  for (let i = RANG_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalWeight >= RANG_THRESHOLDS[i].vouches) {
      return RANG_THRESHOLDS[i].level as PalierLevel;
    }
  }
  return 0;
}

// Vouch weight based on voucher's rang
export function vouchWeight(voucherPalier: PalierLevel): number {
  switch (voucherPalier) {
    case 0:
      return 0; // rang 0 can't vouch
    case 1:
      return 1;
    case 2:
      return 1;
    case 3:
      return 2;
    case 4:
      return 3;
    case 5:
      return 5;
  }
}

// Can this rang level perform this action?
export function canPerform(palier: PalierLevel, action: string): boolean {
  for (let i = 0; i <= palier; i++) {
    if ((RANG_THRESHOLDS[i].abilities as readonly string[]).includes(action)) return true;
  }
  return false;
}
