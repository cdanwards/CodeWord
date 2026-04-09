# Spec 10: @shopify/flash-list 1 -> 2 Upgrade

**Phase:** 4b (Independent Library Upgrade)
**Priority:** Low
**Effort:** < 1 hour
**Dependencies:** Spec 08 (Expo SDK 55)
**Blocked by:** Phase 3 completion

---

## Objective

Upgrade `@shopify/flash-list` from 1.8.1 to 2.x.

---

## Files That Use FlashList

Only 1 file: `src/components/ListView.tsx` — imports `FlashList` and `FlashListProps`.

---

## Upgrade Steps

### 1. Update package
```bash
yarn add @shopify/flash-list@^2
```

### 2. Check for API changes

Review the [FlashList v2 changelog](https://github.com/Shopify/flash-list/releases) for:
- Prop renames or removals
- `estimatedItemSize` requirement changes
- New required configuration
- TypeScript type changes to `FlashListProps`

### 3. Update `src/components/ListView.tsx`

Apply any API changes to the component wrapper.

### 4. Check `package.json` for Expo exclusion

The upgrade plan notes: "Keep `expo.install.exclude` for `@shopify/flash-list` in `package.json`" — verify this is still needed with SDK 55.

---

## Verification

- [ ] `yarn compile` — no type errors
- [ ] Manual: Games list screen renders correctly
- [ ] Manual: Scroll performance on a list with 10+ games is smooth

---

## Risks

Minimal — single file, well-contained component wrapper.
