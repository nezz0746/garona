# NativeWind Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate all StyleSheet.create usage to NativeWind className across @garona/ui and the mobile app.

**Architecture:** Bottom-up migration — shared UI primitives first, then components, then screens. Each file is converted independently. Both `style` and `className` coexist, so partial migration is safe at any point.

**Tech Stack:** NativeWind 4.x, Tailwind CSS 3.x, React Native, Expo SDK 55

---

## Pre-flight: Config update

### Task 0: Add @garona/ui to Tailwind content paths

**Files:**
- Modify: `apps/mobile/tailwind.config.js`

**Step 1:** Add the UI package path to the `content` array:

```js
content: [
  "./app/**/*.{js,jsx,ts,tsx}",
  "./components/**/*.{js,jsx,ts,tsx}",
  "../../packages/ui/src/**/*.{ts,tsx}",  // <-- add this
],
```

**Step 2: Commit**
```bash
git add apps/mobile/tailwind.config.js
git commit -m "chore: add @garona/ui to tailwind content paths"
```

---

## Layer 1: @garona/ui (4 files)

### Task 1: Migrate Avatar.tsx

**Files:**
- Modify: `packages/ui/src/Avatar.tsx`

**Conversion notes:**
- The `ring` style (borderWidth, padding, justifyContent, alignItems) → `className="border-2 p-0.5 justify-center items-center"`
- Dynamic values (`width`, `height`, `borderRadius`, `borderColor`, `backgroundColor`, `fontSize`, `lineHeight`) from props MUST stay as `style` — they depend on runtime `size` prop
- Remove `StyleSheet` import and `styles` object
- Remove `colors` import (borderColor uses it dynamically, keep only for that)

**Result:** Only the `ring` View wrapper gets `className`. All other styles remain as `style` since they're computed from `size` prop.

**Step 1: Commit**
```bash
git add packages/ui/src/Avatar.tsx
git commit -m "refactor: migrate Avatar to NativeWind"
```

---

### Task 2: Migrate IconButton.tsx

**Files:**
- Modify: `packages/ui/src/IconButton.tsx`

**Conversion:**
- `styles.btn` → `className="p-1"`
- Remove `StyleSheet` import and `styles` object
- Remove `colors` import if no longer needed (keep it — used for default `color` prop)

**Step 1: Commit**
```bash
git add packages/ui/src/IconButton.tsx
git commit -m "refactor: migrate IconButton to NativeWind"
```

---

### Task 3: Migrate PostCard.tsx

**Files:**
- Modify: `packages/ui/src/PostCard.tsx`

**Conversion map:**
| Style | className |
|-------|-----------|
| `container` | `className="mb-2"` |
| `header` | `className="flex-row items-center justify-between px-3 py-2.5"` |
| `headerLeft` | `className="flex-row items-center gap-2.5"` |
| `username` | `className="text-text font-semibold text-[13px]"` |
| `image` | Keep `style` — dynamic `MAX_IMAGE_WIDTH` |
| `actions` | `className="flex-row justify-between items-center px-3 py-2"` |
| `actionsLeft` | `className="flex-row gap-1"` |
| `info` | `className="px-3.5 gap-1 pb-2"` |
| `likesText` | `className="text-text font-semibold text-[13px]"` |
| `caption` | `className="text-text text-[13px] leading-[18px]"` |
| `commentsLink` | `className="text-primary text-[13px]"` |
| `timeAgo` | `className="text-text-muted text-[11px]"` |

- Remove `StyleSheet` import, `colors` import, and `styles` object

**Step 1: Commit**
```bash
git add packages/ui/src/PostCard.tsx
git commit -m "refactor: migrate PostCard to NativeWind"
```

---

### Task 4: Migrate StoryBar.tsx

**Files:**
- Modify: `packages/ui/src/StoryBar.tsx`

**Conversion map:**
| Style | className |
|-------|-----------|
| `scroll` (contentContainerStyle) | `contentContainerClassName="px-2 py-2.5 gap-3"` |
| `item` | `className="items-center w-[68px]"` |
| `label` | `className="text-text text-[11px] mt-1 text-center"` |
| `seen` | Conditional: `className="text-text-muted"` |
| `addBadge` | `className="absolute -bottom-0.5 -right-0.5 bg-bg rounded-[10px] overflow-hidden"` |

- Remove `StyleSheet` import, `colors` import (keep for `colors.primary` in Ionicons), and `styles` object

**Step 2: Commit**
```bash
git add packages/ui/src/StoryBar.tsx
git commit -m "refactor: migrate StoryBar to NativeWind"
```

---

## Layer 2: Mobile Components (13 files)

### Task 5: Migrate PalierBadge.tsx

**Files:**
- Modify: `apps/mobile/components/PalierBadge.tsx`

**Conversion notes:**
- This component uses dynamic `size` variants (`sm`, `md`, `lg`) with different padding/fontSize
- `borderColor` is dynamic (from `config.color`) → keep as `style`
- `color` on label is dynamic → keep as `style`
- Base badge: `className="flex-row items-center gap-1 border rounded-[20px]"`
- Size variants: use conditional className strings
  - sm: `className="px-2 py-0.5"`, emoji `text-[10px]`, label `text-[10px]`
  - md: `className="px-2.5 py-1"`, emoji `text-[13px]`, label `text-[12px]`
  - lg: `className="px-3.5 py-1.5"`, emoji `text-[16px]`, label `text-[14px]`
- Remove `StyleSheet` import and `styles` object
- Keep `colors` import for `RANG_CONFIG`

**Step 1: Commit**
```bash
git add apps/mobile/components/PalierBadge.tsx
git commit -m "refactor: migrate PalierBadge to NativeWind"
```

---

### Task 6: Migrate VouchButton.tsx

**Files:**
- Modify: `apps/mobile/components/VouchButton.tsx`

**Conversion map:**
| Style | className |
|-------|-----------|
| `btn` | `className="flex-row items-center gap-1.5 px-4 py-2 rounded-lg"` |
| `unvouched` | `className="bg-primary"` |
| `vouched` | `className="bg-primary-light border border-primary"` |
| `text` | `className="font-semibold text-[13px]"` |
| `unvouchedText` | `className="text-white"` |
| `vouchedText` | `className="text-primary"` |

- Remove `StyleSheet` import, `colors` import (keep for ActivityIndicator color prop), and `styles` object

**Step 1: Commit**
```bash
git add apps/mobile/components/VouchButton.tsx
git commit -m "refactor: migrate VouchButton to NativeWind"
```

---

### Task 7: Migrate FeedPostCard.tsx

**Files:**
- Modify: `apps/mobile/components/FeedPostCard.tsx`

**Conversion map:**
| Style | className |
|-------|-----------|
| `container` | `className="mb-2"` |
| `header` | `className="flex-row items-center justify-between px-3 py-2.5"` |
| `headerLeft` | `className="flex-row items-center gap-2.5"` |
| `username` | `className="text-text font-semibold text-[13px]"` |
| `actions` | `className="flex-row justify-between items-center px-3 py-2"` |
| `actionsLeft` | `className="flex-row gap-1"` |
| `info` | `className="px-3.5 gap-1 pb-2"` |
| `likes` | `className="text-text font-semibold text-[13px]"` |
| `caption` | `className="text-text text-[13px] leading-[18px]"` |
| `commentsLink` | `className="text-primary text-[13px]"` |
| `time` | `className="text-text-muted text-[11px]"` |
| `dots` | `className="flex-row justify-center gap-1.5 absolute bottom-3 left-0 right-0"` |
| `dot` | `className="w-1.5 h-1.5 rounded-full bg-white/50"` |
| `dotActive` | `className="bg-white"` |
| `counter` | `className="absolute top-3 right-3 bg-black/60 px-2.5 py-1 rounded-xl"` |
| `counterText` | `className="text-white text-xs font-semibold"` |
| `dotsSmall` | `className="flex-row gap-1 absolute left-0 right-0 justify-center"` |
| `dotSm` | `className="w-[5px] h-[5px] rounded-full bg-border"` |
| `dotSmActive` | `className="bg-primary"` |

- Image `style` stays — dynamic `MAX_WIDTH`
- Remove `StyleSheet` import, `colors` import (keep for Ionicons color prop), and `styles` object

**Step 1: Commit**
```bash
git add apps/mobile/components/FeedPostCard.tsx
git commit -m "refactor: migrate FeedPostCard to NativeWind"
```

---

### Task 8: Migrate CommentsSheet.tsx

**Files:**
- Modify: `apps/mobile/components/CommentsSheet.tsx`

**Conversion map:**
| Style | className |
|-------|-----------|
| `container` | `className="flex-1 bg-bg"` |
| `header` | `className="items-center py-3 border-b border-border"` + `style={{ borderBottomWidth: 0.5 }}` |
| `handle` | `className="w-10 h-1 rounded-sm bg-border mb-2"` |
| `title` | `className="text-base font-bold text-text"` |
| `closeBtn` | `className="absolute right-4 top-4"` |
| `center` | `className="flex-1 justify-center items-center gap-2"` |
| `emptyText` | `className="text-base font-semibold text-text"` |
| `emptyHint` | `className="text-sm text-text-muted"` |
| `list` | `contentContainerClassName="p-4 gap-4"` |
| `comment` | `className="flex-row gap-2.5"` |
| `commentBody` | `className="flex-1 gap-0.5"` |
| `commentText` | `className="text-text text-sm leading-5"` |
| `commentAuthor` | `className="font-semibold"` |
| `commentTime` | `className="text-text-muted text-[11px]"` |
| `inputBar` | `className="flex-row items-center px-4 py-2.5 border-t border-border pb-[30px] gap-2.5"` + `style={{ borderTopWidth: 0.5 }}` |
| `input` | `className="flex-1 bg-surface rounded-[20px] px-4 py-2.5 text-sm text-text max-h-[80px]"` |
| `sendBtn` | `className="p-2"` |

- Remove `StyleSheet` import, `colors` import (keep for ActivityIndicator/Ionicons), and `styles` object

**Step 1: Commit**
```bash
git add apps/mobile/components/CommentsSheet.tsx
git commit -m "refactor: migrate CommentsSheet to NativeWind"
```

---

### Task 9: Migrate LaunchScreen.tsx

**Files:**
- Modify: `apps/mobile/components/LaunchScreen.tsx`

**Conversion map:**
| Style | className |
|-------|-----------|
| `container` | `className="flex-1 bg-bg justify-between pb-[60px] pt-[120px]"` |
| `hero` | `className="items-center gap-3"` |
| `logoWrap` | `className="w-[100px] h-[100px] rounded-full bg-primary-light justify-center items-center mb-2"` |
| `brand` | `className="text-[42px] font-black text-primary tracking-tight"` |
| `tagline` | `className="text-base text-text-muted font-medium"` |
| `bottom` | `className="px-8 gap-3"` |
| `signUpBtn` | `className="bg-primary rounded-[14px] py-4 items-center"` |
| `signUpText` | `className="text-white text-[17px] font-bold"` |
| `signInBtn` | `className="rounded-[14px] py-4 items-center border-[1.5px] border-primary"` |
| `signInText` | `className="text-primary text-[17px] font-bold"` |

- Remove `StyleSheet` import, `colors` import (keep for Ionicons), and `styles` object

**Step 1: Commit**
```bash
git add apps/mobile/components/LaunchScreen.tsx
git commit -m "refactor: migrate LaunchScreen to NativeWind"
```

---

### Task 10: Migrate SigninSheet.tsx

**Files:**
- Modify: `apps/mobile/components/SigninSheet.tsx`

**Conversion map:**
| Style | className |
|-------|-----------|
| `container` | `className="flex-1 bg-bg"` |
| `header` | `className="items-center py-3"` |
| `handle` | `className="w-10 h-1 rounded-sm bg-border"` |
| `closeBtn` | `className="absolute right-4 top-3"` |
| `content` | `className="flex-1 px-8 items-center gap-4 pt-6"` |
| `iconWrap` | `className="w-[88px] h-[88px] rounded-[44px] bg-surface justify-center items-center"` |
| `title` | `className="text-2xl font-extrabold text-text"` |
| `notice` | `className="flex-row items-center gap-1.5 bg-surface rounded-lg p-3 w-full"` |
| `noticeText` | `className="text-text-muted text-[13px] flex-1"` |
| `errorRow` | `className="flex-row items-center gap-1.5 px-1"` |
| `errorText` | `className="text-[#ef4444] text-[13px] flex-1"` |
| `signInBtn` | `className="flex-row items-center justify-center gap-2.5 bg-primary rounded-xl py-4 w-full"` |
| `signInText` | `className="text-white text-[17px] font-bold"` |

- Remove `StyleSheet` import, `colors` import (keep for Ionicons), and `styles` object

**Step 1: Commit**
```bash
git add apps/mobile/components/SigninSheet.tsx
git commit -m "refactor: migrate SigninSheet to NativeWind"
```

---

### Task 11: Migrate SignupForm.tsx

**Files:**
- Modify: `apps/mobile/components/SignupForm.tsx`

**Conversion map:**
| Style | className |
|-------|-----------|
| `container` | `className="flex-1 bg-bg"` |
| `backBtn` | `className="p-4"` |
| `content` | `className="flex-1 px-8 items-center gap-3"` |
| `iconWrap` | `className="w-[88px] h-[88px] rounded-[44px] bg-surface justify-center items-center mb-1"` |
| `title` | `className="text-2xl font-extrabold text-text mb-2"` |
| `form` | `className="w-full gap-4"` |
| `inputGroup` | `className="gap-1.5"` |
| `inputLabel` | `className="text-[13px] font-semibold text-text pl-1"` |
| `input` | `className="bg-surface border border-border rounded-xl px-4 py-3.5 text-base text-text"` |
| `usernameRow` | `className="flex-row items-center"` |
| `atSign` | `className="bg-surface border border-border border-r-0 rounded-tl-xl rounded-bl-xl px-3.5 py-3.5 text-base text-text-muted font-semibold"` |
| `errorRow` | `className="flex-row items-center gap-1.5 px-1"` |
| `errorText` | `className="text-[#ef4444] text-[13px] flex-1"` |
| `signupBtn` | `className="flex-row items-center justify-center gap-2.5 bg-primary rounded-xl py-4 w-full mt-2"` |
| `signupText` | `className="text-white text-[17px] font-bold"` |
| `blockedWrap` | `className="items-center gap-2 mt-4 px-2"` |
| `blockedIcon` | `className="w-16 h-16 rounded-full bg-surface justify-center items-center"` |
| `blockedTitle` | `className="text-base font-bold text-text"` |
| `blockedText` | `className="text-[13px] text-text-muted text-center leading-5"` |

- The username input with custom border radii: keep inline `style` for `borderTopLeftRadius: 0, borderBottomLeftRadius: 0`
- Remove `StyleSheet` import, `colors` import (keep for Ionicons/ActivityIndicator), and `styles` object

**Step 1: Commit**
```bash
git add apps/mobile/components/SignupForm.tsx
git commit -m "refactor: migrate SignupForm to NativeWind"
```

---

### Task 12: Migrate ProfileShareSheet.tsx

**Files:**
- Modify: `apps/mobile/components/ProfileShareSheet.tsx`

**Conversion map:**
| Style | className |
|-------|-----------|
| `container` | `className="flex-1 bg-bg items-center pt-3"` |
| `header` | `className="w-full items-center pb-2"` |
| `handle` | `className="w-10 h-1 rounded-sm bg-border"` |
| `closeBtn` | `className="absolute right-4 top-0"` |
| `card` | `className="items-center py-8 px-6 gap-2"` |
| `name` | `className="text-xl font-bold text-text mt-2"` |
| `username` | `className="text-[15px] text-text-muted"` |
| `qrWrap` | `className="mt-6 p-4 bg-white rounded-2xl"` + `style` for shadow/elevation |
| `hint` | `className="text-[13px] text-text-muted mt-4"` |
| `actions` | `className="flex-row gap-3 px-6 w-full"` |
| `actionBtn` | `className="flex-1 flex-row items-center justify-center gap-2 bg-surface border border-border rounded-xl py-3.5"` |
| `actionText` | `className="text-primary font-semibold text-[15px]"` |

- `qrWrap` shadow properties don't have Tailwind equivalents in RN → keep as `style`
- Remove `StyleSheet` import, `colors` import (keep for Ionicons/QRCode), and `styles` object

**Step 1: Commit**
```bash
git add apps/mobile/components/ProfileShareSheet.tsx
git commit -m "refactor: migrate ProfileShareSheet to NativeWind"
```

---

### Task 13: Migrate InviteGenerator.tsx

**Files:**
- Modify: `apps/mobile/components/InviteGenerator.tsx`

**Conversion map:**
| Style | className |
|-------|-----------|
| `container` | `className="p-4"` |
| `generateBtn` | `className="flex-row items-center justify-center gap-2 bg-primary py-3.5 rounded-xl"` |
| `generateText` | `className="text-white text-base font-semibold"` |
| `inviteCard` | `className="bg-card border border-border rounded-xl p-4 gap-3"` |
| `codeRow` | `className="items-center gap-1"` |
| `codeLabel` | `className="text-text-muted text-xs"` |
| `code` | `className="text-xl font-bold text-text tracking-wider"` |
| `actions` | `className="flex-row gap-2"` |
| `shareBtn` | `className="flex-1 flex-row items-center justify-center gap-1.5 bg-primary py-2.5 rounded-lg"` |
| `shareText` | `className="text-white font-semibold text-sm"` |
| `newBtn` | `className="flex-row items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg border border-primary"` |
| `newText` | `className="text-primary font-semibold text-sm"` |
| `hint` | `className="text-text-muted text-xs text-center"` |
| `locked` | `className="flex-row items-center justify-center gap-2 p-4 bg-surface rounded-xl m-4"` |
| `lockedText` | `className="text-text-muted text-[13px]"` |
| `error` | `className="text-[#ef4444] text-center mt-2 text-[13px]"` |

- Remove `StyleSheet` import, `colors` import (keep for Ionicons/ActivityIndicator), and `styles` object

**Step 1: Commit**
```bash
git add apps/mobile/components/InviteGenerator.tsx
git commit -m "refactor: migrate InviteGenerator to NativeWind"
```

---

### Task 14: Migrate InviteValidator.tsx

**Files:**
- Modify: `apps/mobile/components/InviteValidator.tsx`

**Conversion map:**
| Style | className |
|-------|-----------|
| `container` | `className="flex-1 bg-bg justify-center items-center px-8 gap-4"` |
| `iconWrap` | `className="w-[100px] h-[100px] rounded-full bg-[#fef2f2] justify-center items-center mb-2"` |
| `iconWrap` (valid) | Dynamic `style={{ backgroundColor: colors.primaryLight }}` kept |
| `title` | `className="text-[26px] font-extrabold text-text"` |
| `desc` | `className="text-sm text-text-secondary text-center leading-[22px] px-2"` |
| `creatorCard` | `className="flex-row items-center gap-3 bg-card border border-border rounded-xl p-4 w-full"` |
| `avatar` | `className="w-12 h-12 rounded-full"` |
| `creatorName` | `className="text-base font-semibold text-text"` |
| `creatorUsername` | `className="text-[13px] text-text-muted mt-0.5"` |
| `acceptBtn` | `className="flex-row items-center gap-2 bg-primary px-8 py-4 rounded-xl mt-2 w-full justify-center"` |
| `acceptText` | `className="text-white text-[17px] font-semibold"` |
| `backBtn` | `className="px-8 py-3.5 rounded-xl border border-border mt-2"` |
| `backText` | `className="text-text text-base font-semibold"` |
| `cancelText` | `className="text-text-muted text-[15px] mt-1"` |
| `loadingText` | `className="text-text-secondary text-[15px] mt-4"` |

- Remove `StyleSheet` import, `colors` import (keep for Ionicons/ActivityIndicator + primaryLight), and `styles` object

**Step 1: Commit**
```bash
git add apps/mobile/components/InviteValidator.tsx
git commit -m "refactor: migrate InviteValidator to NativeWind"
```

---

### Task 15: Migrate OnboardingCarousel.tsx

**Files:**
- Modify: `apps/mobile/components/OnboardingCarousel.tsx`

**Conversion notes:**
- Uses `Dimensions.get("window").width` for slide width → keep as `style`
- Slide item width is dynamic → keep as `style`

**Conversion map:**
| Style | className |
|-------|-----------|
| `container` | `className="flex-1 bg-bg"` |
| `slide` | `className="flex-1 justify-center items-center px-8"` + `style={{ width }}` |
| `iconWrap` | `className="w-[100px] h-[100px] rounded-full bg-primary-light justify-center items-center mb-6"` |
| `slideTitle` | `className="text-[28px] font-extrabold text-text text-center"` |
| `slideSubtitle` | `className="text-base font-semibold text-primary text-center mt-2"` |
| `slideDesc` | `className="text-sm text-text-secondary text-center leading-[22px] mt-3 px-2"` |
| `footer` | `className="px-6 pb-3 gap-3"` |
| `dots` | `className="flex-row justify-center gap-2"` |
| `dot` | `className="w-2 h-2 rounded-full bg-border"` |
| `dotActive` | `className="bg-primary w-5"` |
| `nextBtn` | `className="bg-primary rounded-[14px] py-4 items-center"` |
| `nextText` | `className="text-white text-[17px] font-bold"` |
| `signInRow` | `className="items-center py-1"` |
| `signInText` | `className="text-primary text-sm font-semibold"` |

- Remove `StyleSheet` import, `colors` import (keep for Ionicons/ActivityIndicator), and `styles` object

**Step 1: Commit**
```bash
git add apps/mobile/components/OnboardingCarousel.tsx
git commit -m "refactor: migrate OnboardingCarousel to NativeWind"
```

---

### Task 16: Migrate TutorialSlides.tsx

**Files:**
- Modify: `apps/mobile/components/TutorialSlides.tsx`

**Conversion notes:**
- Uses `Dimensions.get("window").width` for slide width → keep as `style`

**Conversion map:**
| Style | className |
|-------|-----------|
| `container` | `className="flex-1 bg-bg"` |
| `slide` | `className="flex-1 justify-center items-center px-10"` + `style={{ width }}` |
| `emoji` | `className="text-[64px] mb-4"` |
| `title` | `className="text-2xl font-extrabold text-text text-center"` |
| `desc` | `className="text-sm text-text-secondary text-center leading-[22px] mt-3"` |
| `footer` | `className="px-6 pb-3 gap-3"` |
| `dots` | `className="flex-row justify-center gap-2"` |
| `dot` | `className="w-2 h-2 rounded-full bg-border"` |
| `dotActive` | `className="bg-primary w-5"` |
| `nextBtn` | `className="bg-primary rounded-[14px] py-4 items-center"` |
| `nextText` | `className="text-white text-[17px] font-bold"` |

- Remove `StyleSheet` import, `colors` import (keep if used elsewhere), and `styles` object

**Step 1: Commit**
```bash
git add apps/mobile/components/TutorialSlides.tsx
git commit -m "refactor: migrate TutorialSlides to NativeWind"
```

---

### Task 17: Migrate QRScanner.tsx

**Files:**
- Modify: `apps/mobile/components/QRScanner.tsx`

**Conversion notes:**
- This is the largest file (131 lines of StyleSheet). Uses `Dimensions.get("window")` for scanner overlay sizing → keep as `style`
- Camera view is full-screen with overlay — some absolute positioning stays as `style` for computed values

**Conversion map (static styles only):**
| Style | className |
|-------|-----------|
| `container` | `className="flex-1 bg-black"` |
| `camera` | `className="flex-1"` |
| `overlay` | `className="flex-1 justify-center items-center"` |
| `header` | `className="absolute top-0 left-0 right-0 flex-row justify-between items-center px-4 pt-3"` + `style={{ paddingTop: insets.top + 12 }}` |
| `closeBtn` | `className="p-2"` |
| `flashBtn` | `className="p-2"` |
| `hintTop` | `className="text-white text-base font-semibold text-center mb-6"` |
| `hintBottom` | `className="text-white/70 text-[13px] text-center mt-6"` |
| `bottomBar` | `className="absolute bottom-0 left-0 right-0 items-center pb-3"` + `style={{ paddingBottom: insets.bottom + 12 }}` |
| `manualBtn` | `className="flex-row items-center gap-2 bg-white/20 px-5 py-3 rounded-full"` |
| `manualText` | `className="text-white font-semibold text-sm"` |
| `permissionContainer` | `className="flex-1 bg-bg justify-center items-center px-8 gap-4"` |
| `permissionTitle` | `className="text-xl font-bold text-text"` |
| `permissionText` | `className="text-sm text-text-muted text-center leading-5"` |
| `permissionBtn` | `className="bg-primary px-8 py-3.5 rounded-xl"` |
| `permissionBtnText` | `className="text-white text-base font-semibold"` |

- Scanner frame (computed `SCAN_SIZE`) stays as `style`
- Corner markers use absolute positioning with computed values → stay as `style`
- Remove `StyleSheet` import, `colors` import (keep for Ionicons), and `styles` object

**Step 1: Commit**
```bash
git add apps/mobile/components/QRScanner.tsx
git commit -m "refactor: migrate QRScanner to NativeWind"
```

---

## Layer 3: Screens (8 files)

### Task 18: Migrate (tabs)/index.tsx (Home Feed)

**Files:**
- Modify: `apps/mobile/app/(tabs)/index.tsx`

**Conversion map:**
| Style | className |
|-------|-----------|
| `container` | `className="flex-1 bg-bg"` + `style={{ paddingTop: insets.top }}` |
| `header` | `className="flex-row justify-between items-center px-4 py-2 border-b border-border"` + `style={{ borderBottomWidth: 0.5 }}` |
| `logo` | `className="text-2xl font-bold text-primary tracking-tight"` |
| `empty` | `className="p-10 items-center gap-2"` |
| `emptyText` | `className="text-base font-semibold text-text"` |
| `emptyHint` | `className="text-sm text-text-muted text-center"` |

- Remove `StyleSheet` import, `colors` import (keep for RefreshControl/Ionicons), and `styles` object

**Step 1: Commit**
```bash
git add apps/mobile/app/(tabs)/index.tsx
git commit -m "refactor: migrate Home screen to NativeWind"
```

---

### Task 19: Migrate (tabs)/search.tsx

**Files:**
- Modify: `apps/mobile/app/(tabs)/search.tsx`

**Conversion map:**
| Style | className |
|-------|-----------|
| `container` | `className="flex-1 bg-bg"` + `style={{ paddingTop: insets.top }}` |
| `searchBar` | `className="flex-row items-center bg-surface rounded-xl mx-4 my-2 px-3 gap-2"` |
| `searchInput` | `className="flex-1 py-2.5 text-sm text-text"` |
| `resultItem` | `className="flex-row items-center gap-3 px-4 py-2.5"` |
| `resultName` | `className="text-text font-semibold text-[15px]"` |
| `resultUsername` | `className="text-text-muted text-[13px]"` |
| `exploreHeader` | `className="px-4 py-2"` |
| `exploreTitle` | `className="text-base font-bold text-text"` |

- Grid tile size is computed → keep as `style`
- Remove `StyleSheet` import, `colors` import (keep for Ionicons), and `styles` object

**Step 1: Commit**
```bash
git add apps/mobile/app/(tabs)/search.tsx
git commit -m "refactor: migrate Search screen to NativeWind"
```

---

### Task 20: Migrate (tabs)/create.tsx

**Files:**
- Modify: `apps/mobile/app/(tabs)/create.tsx`

**Conversion notes:**
- Largest screen file (78 lines StyleSheet). Heavy use of dynamic computed values for gallery tile sizing.
- Selected image border, gallery grid, caption input all have static styles.

**Key conversions:**
| Style | className |
|-------|-----------|
| `container` | `className="flex-1 bg-bg"` + `style={{ paddingTop: insets.top }}` |
| `header` | `className="flex-row justify-between items-center px-4 py-2 border-b border-border"` + `style={{ borderBottomWidth: 0.5 }}` |
| `headerTitle` | `className="text-lg font-bold text-text"` |
| `nextBtn` / `nextBtnDisabled` | `className="bg-primary px-4 py-1.5 rounded-lg"` + conditional opacity |
| `nextText` | `className="text-white font-semibold text-sm"` |
| `captionInput` | `className="px-4 py-3 text-base text-text min-h-[80px]"` |
| `charCount` | `className="text-right px-4 text-xs text-text-muted"` |
| `galleryHeader` | `className="flex-row justify-between items-center px-4 py-2 border-t border-b border-border"` + `style={{ borderTopWidth: 0.5, borderBottomWidth: 0.5 }}` |
| `galleryTitle` | `className="text-sm font-semibold text-text"` |

- Preview image, gallery tiles use computed dimensions → keep as `style`
- Selected tile overlay uses absolute positioning → className where possible
- Remove `StyleSheet` import, `colors` import (keep for Ionicons), and `styles` object

**Step 1: Commit**
```bash
git add apps/mobile/app/(tabs)/create.tsx
git commit -m "refactor: migrate Create screen to NativeWind"
```

---

### Task 21: Migrate (tabs)/activity.tsx

**Files:**
- Modify: `apps/mobile/app/(tabs)/activity.tsx`

**Conversion map:**
| Style | className |
|-------|-----------|
| `container` | `className="flex-1 bg-bg"` + `style={{ paddingTop: insets.top }}` |
| `header` | `className="px-4 py-2 border-b border-border"` + `style={{ borderBottomWidth: 0.5 }}` |
| `headerTitle` | `className="text-xl font-bold text-text"` |
| `item` | `className="flex-row items-center gap-3 px-4 py-3"` |
| `itemBody` | `className="flex-1"` |
| `itemText` | `className="text-text text-sm leading-5"` |
| `bold` | `className="font-semibold"` |
| `itemTime` | `className="text-text-muted text-xs mt-0.5"` |
| `empty` | `className="flex-1 justify-center items-center gap-2"` |
| `emptyText` | `className="text-base font-semibold text-text"` |
| `emptyHint` | `className="text-sm text-text-muted"` |

- Remove `StyleSheet` import, `colors` import (keep for RefreshControl/Ionicons), and `styles` object

**Step 1: Commit**
```bash
git add apps/mobile/app/(tabs)/activity.tsx
git commit -m "refactor: migrate Activity screen to NativeWind"
```

---

### Task 22: Migrate (tabs)/guide.tsx

**Files:**
- Modify: `apps/mobile/app/(tabs)/guide.tsx`

**Conversion map:**
| Style | className |
|-------|-----------|
| `container` | `className="flex-1 bg-bg"` + `style={{ paddingTop: insets.top }}` |
| `header` | `className="px-4 py-2 border-b border-border"` + `style={{ borderBottomWidth: 0.5 }}` |
| `headerTitle` | `className="text-xl font-bold text-text"` |
| `content` | `contentContainerClassName="p-4 gap-4"` |
| `section` | `className="bg-card border border-border rounded-xl p-4 gap-3"` |
| `sectionTitle` | `className="text-base font-bold text-text"` |
| `sectionDesc` | `className="text-sm text-text-secondary leading-5"` |
| `rankRow` | `className="flex-row items-center gap-3 py-1.5"` |
| `rankInfo` | `className="flex-1"` |
| `rankLabel` | `className="text-sm font-semibold text-text"` |
| `rankDesc` | `className="text-xs text-text-muted mt-0.5"` |

- Remove `StyleSheet` import, `colors` import, and `styles` object

**Step 1: Commit**
```bash
git add apps/mobile/app/(tabs)/guide.tsx
git commit -m "refactor: migrate Guide screen to NativeWind"
```

---

### Task 23: Migrate user/[username].tsx

**Files:**
- Modify: `apps/mobile/app/user/[username].tsx`

**Conversion map:**
| Style | className |
|-------|-----------|
| `container` | `className="flex-1 bg-bg"` + `style={{ paddingTop: insets.top }}` |
| `header` | `className="flex-row items-center gap-3 px-4 py-2 border-b border-border"` + `style={{ borderBottomWidth: 0.5 }}` |
| `headerTitle` | `className="text-lg font-bold text-text"` |
| `profileRow` | `className="flex-row items-center px-4 pt-4 gap-6"` |
| `statsRow` | `className="flex-1 flex-row justify-around"` |
| `stat` | `className="items-center"` |
| `statValue` | `className="text-text font-bold text-base"` |
| `statLabel` | `className="text-text-secondary text-xs mt-0.5"` |
| `bio` | `className="px-4 pt-3"` |
| `name` | `className="text-text font-semibold text-[15px]"` |
| `bioText` | `className="text-text text-[13px] mt-1"` |
| `actions` | `className="flex-row px-4 pt-4 gap-1.5"` |
| `gridHeader` | `className="flex-row border-t border-b border-border mt-4"` + `style={{ borderTopWidth: 0.5, borderBottomWidth: 0.5 }}` |
| `gridTab` | `className="flex-1 items-center py-2.5 border-b-2 border-primary"` |
| `empty` | `className="py-[60px] items-center gap-3"` |
| `emptyText` | `className="text-text-muted text-[15px]"` |

- Grid tile size computed from `Dimensions` → keep as `style`
- Remove `StyleSheet` import, `colors` import (keep for Ionicons), and `styles` object

**Step 1: Commit**
```bash
git add apps/mobile/app/user/[username].tsx
git commit -m "refactor: migrate UserProfile screen to NativeWind"
```

---

### Task 24: Migrate posts/[username].tsx

**Files:**
- Modify: `apps/mobile/app/posts/[username].tsx`

**Conversion map:**
| Style | className |
|-------|-----------|
| `container` | `className="flex-1 bg-bg"` + `style={{ paddingTop: insets.top }}` |
| `header` | `className="flex-row items-center gap-3 px-4 py-2 border-b border-border"` + `style={{ borderBottomWidth: 0.5 }}` |
| `headerTitle` | `className="text-lg font-bold text-text"` |
| `image` | Keep as `style` — full-width computed |
| `caption` | `className="px-4 py-3"` |
| `captionText` | `className="text-text text-sm leading-5"` |
| `username` | `className="font-semibold"` |

- Remove `StyleSheet` import, `colors` import (keep for Ionicons), and `styles` object

**Step 1: Commit**
```bash
git add apps/mobile/app/posts/[username].tsx
git commit -m "refactor: migrate Posts screen to NativeWind"
```

---

### Task 25: Migrate _layout.tsx (Root) and (tabs)/_layout.tsx

**Files:**
- Modify: `apps/mobile/app/_layout.tsx`
- Modify: `apps/mobile/app/(tabs)/_layout.tsx`

**Root layout conversion:**
- `style={{ flex: 1, backgroundColor: colors.bg }}` → `className="flex-1 bg-bg"` (4 occurrences)
- `style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}` → `className="flex-1 bg-bg justify-center items-center"`
- Remove `colors` import if no longer needed (check if used in Stack screenOptions)
- `contentStyle: { backgroundColor: colors.bg }` in Stack screenOptions → keep as `style` (Stack API)

**Tabs layout:**
- `tabBarStyle` inline styles → keep as `style` (Tab navigator API expects style objects)
- Convert any other inline `style` on View/Text to `className`
- Dev skip button styles → `className`

**Step 1: Commit**
```bash
git add apps/mobile/app/_layout.tsx apps/mobile/app/(tabs)/_layout.tsx
git commit -m "refactor: migrate layouts to NativeWind"
```

---

## Final: Cleanup

### Task 26: Verify and clean up

**Step 1:** Search for any remaining `StyleSheet.create` usage:
```bash
grep -r "StyleSheet.create" apps/mobile/ packages/ui/src/
```
Expected: No results.

**Step 2:** Search for unused `colors` imports:
```bash
grep -rn "import.*colors.*from.*@garona/shared" apps/mobile/ packages/ui/src/
```
Review each file — remove the import if `colors` is no longer referenced in the file body.

**Step 3:** Verify the app starts without errors:
```bash
cd apps/mobile && pnpm dev --clear
```

**Step 4: Final commit**
```bash
git add -A
git commit -m "chore: clean up unused StyleSheet and colors imports"
```
