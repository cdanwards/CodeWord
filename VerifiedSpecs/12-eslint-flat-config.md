# Spec 12: ESLint Flat Config Migration (8 -> 9+)

**Phase:** 5a (Toolchain Upgrade)
**Priority:** Medium
**Effort:** 1-2 days
**Dependencies:** Spec 08 (Expo SDK 55)
**Blocked by:** Phase 3 completion

---

## Objective

Migrate from ESLint 8.x with `.eslintrc.js` to ESLint 9+ with flat config (`eslint.config.mjs`). Also upgrade related plugins and re-enable `@typescript-eslint/no-explicit-any`.

---

## Current Config

**File:** `.eslintrc.js` (to be deleted)

Key settings to preserve:
- Expo config extension
- Prettier integration
- React Native plugin
- Custom rules (especially any that are intentionally off)
- `@typescript-eslint/no-explicit-any: 0` (currently disabled — this spec re-enables it)

---

## Packages to Update

| Package | From | To |
|---------|------|----|
| `eslint` | ^8.57.0 | ^9.x or 10.x |
| `eslint-config-prettier` | ^9.1.0 | ^10.x |
| `eslint-plugin-react-native` | ^4.1.0 | ^5.0.0 |
| `eslint-config-expo` | ~9.2.0 | SDK 55 compatible |

---

## Migration Steps

### 1. Update packages
```bash
yarn add -D eslint@latest eslint-config-prettier@latest eslint-plugin-react-native@latest
```

### 2. Create flat config

**New file:** `eslint.config.mjs`

```javascript
import { FlatCompat } from "@eslint/eslintrc"
import expoConfig from "eslint-config-expo"
import prettierConfig from "eslint-config-prettier"

const compat = new FlatCompat()

export default [
  // Expo base config (may need FlatCompat wrapper if not flat-config-native)
  ...compat.extends("expo"),

  // Prettier must be last to override formatting rules
  prettierConfig,

  // Global ignores (replaces .eslintignore)
  {
    ignores: [
      "node_modules/",
      ".expo/",
      "ios/",
      "android/",
      "plugins/",
      "scripts/",
    ],
  },

  // Custom rules
  {
    rules: {
      // Re-enable no-explicit-any (was disabled as `0` in old config)
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]
```

### 3. Delete old config files
- Delete `.eslintrc.js`
- Delete `.eslintignore` (patterns moved into flat config `ignores`)

### 4. Fix `any` violations

With `no-explicit-any` re-enabled as `"warn"`, fix the ~27 violations:

**Common patterns to fix:**

| Pattern | Fix |
|---------|-----|
| `catch (e: any)` | `catch (e: unknown)` then narrow with `instanceof` |
| `as any` on storage adapter | Type properly with `import type { SupportedStorage }` |
| `(item: any)` in keyExtractor | Use proper item type |
| `withTimeout<any>` | Use proper generic type |

### 5. Update `package.json` lint script

Verify `yarn lint:check` still works. ESLint 9+ may need different CLI flags.

---

## Verification

- [ ] `yarn lint:check` produces same or fewer warnings than before
- [ ] No `any` types remain unaddressed (all either fixed or explicitly `// eslint-disable-next-line` with justification)
- [ ] `.eslintrc.js` deleted
- [ ] `.eslintignore` deleted
- [ ] `eslint.config.mjs` exists and is the sole ESLint config
- [ ] `yarn compile` passes

---

## Risks

- **Plugin compatibility:** Some ESLint plugins may not support flat config yet. Use `@eslint/eslintrc` FlatCompat as a bridge.
- **Expo config:** `eslint-config-expo` may not be flat-config-native yet. Check the SDK 55 version.
- **Rule behavior changes:** Some rules may have different defaults in ESLint 9+. Run `yarn lint:check` and compare output before/after.
