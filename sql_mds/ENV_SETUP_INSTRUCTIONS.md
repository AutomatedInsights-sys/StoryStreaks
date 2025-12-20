# Environment Setup Instructions

## 🚨 **Current Issue**
Your Gemini API key is in `app.json` but the app is not reading it properly. The logs show "No AI provider configured for: gemini".

## 🛠️ **Solution: Create .env File**

### **Step 1: Create .env File**
Create a file named `.env` in your project root (same level as `package.json`):

```bash
# AI Provider API Keys
EXPO_PUBLIC_GEMINI_API_KEY=your-new-gemini-key-here
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key_here
EXPO_PUBLIC_CLAUDE_API_KEY=your_claude_key_here

# Default AI Provider
EXPO_PUBLIC_DEFAULT_AI_PROVIDER=gemini

# Supabase Configuration (replace with your actual values)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### **Step 2: Restart Development Server**
```bash
# Stop your current server (Ctrl+C)
# Then restart
npm start
# or
expo start
```

### **Step 3: Clear App Cache**
- If using Expo Go: Shake device → "Reload"
- If using development build: Clear app data and restart

### **Step 4: Test Again**
1. Approve a chore
2. Check console logs for:
   - `🔑 Gemini key found: true`
   - `🔑 Gemini provider initialized`
   - `📚 Story generated successfully`

## 🔍 **Expected Console Logs After Fix**

You should see:
```
🔑 Initializing AI providers...
🔑 Default provider: gemini
🔑 Expo config extra: { defaultAIProvider: 'gemini', ... }
🔑 Gemini key found: true AIzaSy...
🔑 Gemini provider initialized
🔑 Total providers initialized: 1
🔑 Available providers: ['gemini']
📚 Story generated successfully: Chapter 4: [Story Title]
```

## 🚨 **If Still Not Working**

### **Check .env File Location**
Make sure `.env` is in the project root (same folder as `package.json`).

### **Check File Format**
Make sure there are no spaces around the `=` sign:
```bash
# Correct
EXPO_PUBLIC_GEMINI_API_KEY=your-new-gemini-key-here

# Incorrect
EXPO_PUBLIC_GEMINI_API_KEY = your-new-gemini-key-here
```

### **Check API Key Format**
Your Gemini key should:
- Start with `AIza`
- Be about 39 characters long
- Not have any spaces or extra characters

## 🎯 **Alternative: Update app.json**

If the `.env` file doesn't work, you can also try updating your `app.json` to use environment variables:

```json
{
  "expo": {
    "extra": {
      "defaultAIProvider": "gemini",
      "openaiApiKey": "sk-your-openai-key-here",
      "geminiApiKey": "${EXPO_PUBLIC_GEMINI_API_KEY}",
      "claudeApiKey": "your-claude-key-here"
    }
  }
}
```

Then create the `.env` file as described above.

## 🎉 **Success Indicators**

When working correctly, you'll see:
1. **Console logs** showing Gemini provider initialization
2. **Story generation** without "No AI provider configured" errors
3. **New stories** appearing in the Stories tab
4. **Proper chapter progression** (Chapter 4, 5, 6, etc.)
