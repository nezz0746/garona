// ─── Rang (Trust Rank) System ───
//
// Rang is computed from the sum of active (non-revoked) vouch weights.
// Higher-rang vouchers give more weight.
export enum PERMISSION {
  MAIN_FEED = "main_feed",
  CREATE_PROFILE = "create_profile",
  LIKE = "like",
  FOLLOW = "follow",
  VOUCH = "vouch",
  POST = "post",
  COMMENT = "comment",
}
// Rang 0 = unauthenticated visitor (not stored, inferred)
// Rang 1 = any signed-up user (0 vouches needed, just an account)
// Rang 2+ = earned via vouches
export const RANG_THRESHOLDS = [
  {
    level: 0,
    vouches: -1,
    permissions: [PERMISSION.MAIN_FEED, PERMISSION.CREATE_PROFILE],
  },
  {
    level: 1,
    vouches: 2,
    permissions: [PERMISSION.LIKE, PERMISSION.FOLLOW, PERMISSION.VOUCH],
  },
  {
    level: 2,
    vouches: 5,
    permissions: [PERMISSION.COMMENT, PERMISSION.POST],
  },
] as const;

export type RangLevel = 0 | 1 | 2 | 3;

export function computeRang(totalWeight: number): RangLevel {
  for (let i = RANG_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalWeight >= RANG_THRESHOLDS[i].vouches) {
      return RANG_THRESHOLDS[i].level as RangLevel;
    }
  }
  return 0;
}

// The garona root account username — vouches from this account have boosted weight
export const ROOT_USERNAME = "garona";

// Vouch weight based on voucher's rang
export function vouchWeight(voucherRang: RangLevel, isRoot = false): number {
  if (isRoot) return 5; // root garona account always gives weight 5
  switch (voucherRang) {
    case 0:
      return 0; // rang 0 can't vouch
    case 1:
      return 1;
    case 2:
      return 1;
    case 3:
      return 5;
  }
}

// Can this rang level perform this action?
export function canPerform(rang: RangLevel, action: PERMISSION): boolean {
  for (let i = 0; i <= rang; i++) {
    if (
      (RANG_THRESHOLDS[i].permissions as readonly PERMISSION[]).includes(action)
    )
      return true;
  }
  return false;
}
