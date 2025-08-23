# Network Issues - Development Notes

## Current Status

- **Date**: Current session
- **Issue**: Persistent network connectivity problems with Supabase in iOS Simulator
- **Status**: Temporarily bypassed for UI development

## Problem Description

### Symptoms

1. **Database timeouts**: `db.getUserGames()` calls hanging indefinitely
2. **Connection failures**: Supabase client unable to establish connection
3. **Environment variables**: `process.env.SUPABASE_URL` and `process.env.SUPABASE_ANON_KEY` showing as `false`
4. **iOS Simulator specific**: Issues appear to be isolated to iOS Simulator environment

### Debugging Attempts Made

#### 1. Environment Variable Loading

- ✅ Created `.env` file in project root
- ✅ Added `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- ✅ Restarted server with `npx expo start --clear`
- ❌ Environment variables still not loading (`process.env` shows `false`)

#### 2. App Config Fallbacks

- ✅ Added hardcoded fallback values in `app.config.ts`
- ✅ Updated `supabase/database.ts` to use `Constants.expoConfig?.extra`
- ❌ Connection tests still timing out

#### 3. Connection Testing

- ✅ Added direct `fetch` calls to Supabase health endpoint
- ✅ Added auth session checks
- ✅ Implemented 5-second timeouts with fallbacks
- ❌ All connection attempts timing out

#### 4. iOS Simulator Network Issues

- **Suspected cause**: iOS Simulator has known network connectivity issues with external APIs
- **Evidence**: Timeouts occur consistently regardless of configuration
- **Workaround**: Temporarily bypassed database calls in `GamesScreen.tsx`

## Current Workaround

### GamesScreen.tsx

```typescript
// TEMPORARY: Bypass Supabase due to iOS Simulator network issues
// TODO: Re-enable when network connectivity is resolved
const loadGames = useCallback(async () => {
  console.log("=== loadGames function called ===")
  console.log("iOS Simulator network issue - bypassing database calls")
  setGames([]) // Set empty array instead of calling db.getUserGames()
  setLoading(false)
}, [isAuthenticated, user?.id])
```

### Supabase Client

- Environment variables loaded via `Constants.expoConfig?.extra`
- Fallback values in `app.config.ts` for development
- Connection tests implemented but timing out

## Next Steps for Future Session

### 1. Test on Physical Device

- Deploy to physical iOS device to confirm if issue is simulator-specific
- Test Supabase connectivity on real device

### 2. Alternative Development Approaches

- Consider using Expo Go instead of development build
- Test with different network configurations
- Try using web version for database testing

### 3. Re-enable Database Calls

Once network issues are resolved:

- Remove temporary bypass in `GamesScreen.tsx`
- Re-enable `db.getUserGames()` calls
- Test optimistic UI updates
- Verify game creation and joining functionality

### 4. Environment Variable Debugging

- Investigate why `process.env` variables aren't loading
- Check Expo configuration for environment variable injection
- Consider using `expo-constants` for all environment access

## Files Modified for Network Issue Workaround

1. **`src/screens/GamesScreen.tsx`**
   - Added temporary bypass for `loadGames` function
   - Added extensive debugging logs
   - Wrapped `loadGames` in `useCallback` to prevent infinite loops

2. **`app.config.ts`**
   - Added hardcoded fallback values for Supabase credentials

3. **`supabase/database.ts`**
   - Added debugging logs for environment variable loading
   - Updated to use `Constants.expoConfig?.extra`

## Current UI State

- ✅ Modal layout and styling working correctly
- ✅ Bottom sheet provider properly configured
- ✅ GamesScreen layout with debug colors
- ✅ CreateGameModal and JoinGameModal functional (UI only)
- ❌ Database integration temporarily disabled

## Notes for Resumption

- UI components are ready for database integration
- All styling and layout issues have been resolved
- Focus should be on resolving network connectivity before re-enabling database calls
- Consider testing on physical device to isolate simulator-specific issues
