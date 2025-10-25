# 🛠️ StoryStreaks Setup Guide

## Prerequisites

Before starting, make sure you have:
- ✅ Node.js installed (v16 or higher)
- ✅ npm or yarn installed
- ✅ Expo CLI installed (`npm install -g expo-cli`)
- ✅ A Supabase account and project

## Initial Setup (If Not Done Yet)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:
```bash
# Create .env file
touch .env
```

Add the following content:
```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: OpenAI API Key
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

#### Where to Get Supabase Credentials:
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click **Settings** (gear icon) → **API**
4. Copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

⚠️ **Important:** Never commit the `.env` file to git! It's already in `.gitignore`.

### 3. Set Up Supabase Database

#### Option A: Use Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the sidebar
3. Click **New Query**
4. Copy contents of `supabase_rls_fix.sql`
5. Paste and click **Run**

#### Option B: Use Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in your project
supabase init

# Run the migration
supabase db push
```

### 4. Verify Setup

Check if the trigger was created:
```sql
-- Run this in Supabase SQL Editor
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

Should return 1 row.

## Fix RLS Authentication Issue

If you're experiencing the RLS authentication error, follow these steps:

### Quick Fix (5 minutes)
1. ✅ Open `supabase_rls_fix.sql`
2. ✅ Copy all contents
3. ✅ Paste into Supabase SQL Editor
4. ✅ Click Run
5. ✅ Test signup - should work!

### Detailed Fix
See `QUICK_START.md` for step-by-step instructions.

## Running the App

### Start Development Server
```bash
# Start Expo development server
npm start

# Or use specific platform
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser
```

### First Time Setup After Install
1. Sign up with a test account
2. Create a child profile
3. Add a chore
4. Complete and approve the chore
5. Generate a story

## Project Structure

```
StoryStreaks/
├── App.tsx                 # Main app entry point
├── index.ts               # Expo entry point
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx           # Authentication & user state
│   ├── navigation/
│   │   ├── AppNavigator.tsx         # Root navigation
│   │   ├── ParentNavigator.tsx      # Parent screens
│   │   └── ChildNavigator.tsx       # Child screens (future)
│   ├── screens/
│   │   ├── AuthScreen.tsx           # Login/signup
│   │   ├── parent/                  # Parent screens
│   │   └── child/                   # Child screens
│   ├── services/
│   │   ├── supabase.ts              # Supabase client
│   │   └── aiStoryService.ts        # AI story generation
│   ├── types/
│   │   ├── index.ts                 # TypeScript types
│   │   └── supabase.ts              # Database types
│   └── utils/
│       └── theme.ts                 # UI theme
├── supabase_rls_fix.sql             # RLS fix SQL migration
├── RLS_FIX_GUIDE.md                 # Detailed RLS fix guide
├── TESTING_CHECKLIST.md             # Testing checklist
└── package.json
```

## Database Schema

### Tables
- `profiles` - User profiles (parents)
- `children` - Child profiles
- `chores` - Chores assigned to children
- `chore_completions` - Completed chores
- `story_segments` - AI-generated story segments
- `rewards` - Rewards for children

### Row Level Security (RLS)
All tables have RLS enabled with policies that:
- ✅ Allow users to view/edit their own data
- ✅ Allow parents to manage their children's data
- ✅ Prevent cross-user data access

## Troubleshooting

### Issue: "Supabase not configured"
**Cause:** Missing or incorrect environment variables
**Solution:** 
1. Check `.env` file exists
2. Verify URLs and keys are correct
3. Restart Expo dev server

### Issue: "Network request failed"
**Cause:** Cannot connect to Supabase
**Solution:**
1. Check internet connection
2. Verify Supabase project is active
3. Check Supabase project URL is correct

### Issue: RLS policy errors
**Cause:** RLS policies not properly set up
**Solution:**
1. Run `supabase_rls_fix.sql` in SQL Editor
2. Verify trigger exists
3. Check RLS is enabled on all tables

### Issue: "Profile not found"
**Cause:** Profile wasn't created during signup
**Solution:**
1. Check if trigger exists
2. Manually create profile:
```sql
INSERT INTO profiles (id, email, name, role)
SELECT id, email, raw_user_meta_data->>'name', 'parent'
FROM auth.users
WHERE email = 'your-email@example.com';
```

## Development Workflow

### Making Database Changes
1. Make changes in Supabase dashboard
2. Test thoroughly
3. Export schema if needed
4. Update TypeScript types

### Adding New Features
1. Update database schema if needed
2. Update TypeScript types
3. Update RLS policies
4. Implement feature
5. Test thoroughly

### Testing
1. Test signup/signin flow
2. Test all CRUD operations
3. Test RLS security (try accessing other users' data)
4. Test on iOS, Android, and web

## Security Best Practices

✅ **Environment Variables:** Never commit `.env` file
✅ **API Keys:** Use environment variables for all keys
✅ **RLS:** Keep RLS enabled on all tables
✅ **Validation:** Validate all user inputs
✅ **Error Handling:** Don't expose sensitive info in errors

## Production Deployment

### Before Deploying
- [ ] Test all features thoroughly
- [ ] Verify RLS policies work correctly
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Set up analytics (if needed)
- [ ] Test on real devices
- [ ] Review security settings

### Deployment Steps
1. Build production version
2. Test production build
3. Submit to app stores
4. Monitor logs after launch

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## Support

For issues with:
- **RLS Authentication:** See `RLS_FIX_GUIDE.md`
- **Testing:** See `TESTING_CHECKLIST.md`
- **Quick Start:** See `QUICK_START.md`
- **Implementation:** See `IMPLEMENTATION_SUMMARY.md`

## License

[Your License Here]

## Contributing

[Your Contributing Guidelines Here]

---

**Ready to start?** Run `npm start` and open the app! 🚀




