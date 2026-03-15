# AURA Assistant

## Current State
Full AURA dashboard with dark futuristic cyan/blue theme. Features: voice input, command processing, music playback, command history. No authentication gate.

## Requested Changes (Diff)

### Add
- Login page (shown before the main AURA dashboard)
- Credentials stored in localStorage (username + password, hardcoded default: `aura` / `1234` or user can set their own)
- Logout button on main dashboard
- Coffee + neon green theme replacing the current cyan/blue palette

### Modify
- index.css: Replace OKLCH color tokens — background becomes deep espresso brown, accent/neon color becomes neon green (cyberpunk cafe vibe)
- App.tsx: Wrap main UI with auth gate — if not logged in, show LoginPage; if logged in, show AURA dashboard
- All cyan neon references updated to green neon throughout

### Remove
- Previous cyan neon theme tokens and grid/glow colors

## Implementation Plan
1. Update index.css OKLCH tokens: background = deep espresso brown (~oklch(0.1 0.03 40)), neon accent = bright neon green (~oklch(0.82 0.25 140))
2. Create LoginPage component with username/password fields, localStorage-based auth check
3. Update App.tsx to conditionally render LoginPage vs main dashboard based on auth state
4. Add logout button to dashboard header
5. Replace all `neon-cyan` color references in App.tsx and index.css with green equivalents
6. Update glow/border/animation colors to green
