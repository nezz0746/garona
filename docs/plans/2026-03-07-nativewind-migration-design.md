# NativeWind Migration Design

## Goal

Migrate the entire Garona mobile app and `@garona/ui` shared package from `StyleSheet.create` to NativeWind `className` styling.

## Approach: Bottom-Up

Migrate dependencies first, then dependents. Three layers in order.

## Scope

- **25 files** total (1 already done: profile.tsx)
- **~670 lines** of `StyleSheet.create` code to remove
- **Zero functional changes** — purely a styling syntax migration

## Config Changes

- Add `@garona/ui` paths to `tailwind.config.js` content array: `"../../packages/ui/src/**/*.{ts,tsx}"`

## Migration Layers

### Layer 1: `@garona/ui` (4 files)

| File | StyleSheet lines | Notes |
|------|-----------------|-------|
| Avatar.tsx | 6 | Keep dynamic `size` prop as `style` |
| IconButton.tsx | 2 | Trivial |
| PostCard.tsx | 13 | Keep dynamic image dimensions as `style` |
| StoryBar.tsx | 6 | Straightforward |

### Layer 2: Shared Components (13 files)

| File | StyleSheet lines | Uses @garona/ui |
|------|-----------------|-----------------|
| PalierBadge.tsx | 18 | No |
| VouchButton.tsx | 28 | No |
| FeedPostCard.tsx | 36 | Avatar, IconButton |
| CommentsSheet.tsx | 44 | Avatar |
| LaunchScreen.tsx | 57 | No |
| SigninSheet.tsx | 54 | No |
| SignupForm.tsx | 91 | No |
| ProfileShareSheet.tsx | 58 | Avatar |
| InviteGenerator.tsx | 100 | No |
| InviteValidator.tsx | 96 | No |
| OnboardingCarousel.tsx | 42 | No |
| TutorialSlides.tsx | 35 | No |
| QRScanner.tsx | 131 | No |

### Layer 3: Screens (8 files)

| File | StyleSheet lines | Notes |
|------|-----------------|-------|
| (tabs)/index.tsx | 16 | Home feed |
| (tabs)/search.tsx | 28 | Search + explore |
| (tabs)/create.tsx | 78 | Image picker + caption |
| (tabs)/activity.tsx | 24 | Notifications |
| (tabs)/guide.tsx | 20 | Trust system guide |
| user/[username].tsx | 34 | User profile page |
| posts/[username].tsx | 14 | User posts feed |
| _layout.tsx + (tabs)/_layout.tsx | 0 (inline only) | Layouts with inline styles |

## Conversion Rules

1. `StyleSheet.create` blocks: delete entirely, replace with `className` on elements
2. Static inline `style={{...}}`: convert to `className`
3. Dynamic/computed values (runtime sizes, `insets.top`, computed tile sizes): keep as `style`
4. Remove `colors` imports from `@garona/shared` where no longer needed
5. Remove `StyleSheet` from RN imports when no longer used

## What Stays as `style`

- Dynamic values from props (e.g., `size` in Avatar)
- Computed layout values (e.g., `Dimensions.get("window").width` calculations)
- `useSafeAreaInsets()` padding
- Tab bar style in `(tabs)/_layout.tsx`

## Risk & Rollback

- Both `style` and `className` coexist — partial migration is safe at any point
- If anything breaks visually, revert the individual file
