# Teen Hive - Project Context

## App
Hyperlocal job marketplace connecting teens and young adults (13+) with parents for neighborhood jobs.

## Tech Stack
- React Native + Expo
- expo-router for navigation
- Supabase for auth + database
- TypeScript
- Manrope + Newsreader fonts

## IMPORTANT
- NO Clerk - completely removed
- Auth is handled by context/AuthContext.tsx
- Supabase client is in lib/supabase.ts

## Colors
- background: #f3fbf4
- primary: #051b0e
- accent: #22c55e
- secondary text: #737972

## User Roles
- teen: can browse jobs, apply, post services
- parent: can post jobs, browse teens, invite teens

## Key Flows
- Teen applies to job → parent accepts → chat unlocks
- Parent invites teen → teen accepts → chat unlocks
- Only parent can mark job complete
- Only parent can accept applications
- Only teen can accept invites

## Database Tables
profiles, jobs, applications, messages, reviews, 
notifications, reports, blocks, feedback, teen_services
