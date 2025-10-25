# API Key Setup Guide

## 🔑 **Required API Keys**

You need to set up API keys for the AI story generation. The system supports multiple providers with fallback.

### **Option 1: Gemini (Recommended)**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to your `.env` file:
```bash
EXPO_PUBLIC_GEMINI_API_KEY=your_actual_gemini_key_here
```

### **Option 2: OpenAI (Fallback)**
1. Go to [OpenAI Platform](https://platform.openai.com/account/api-keys)
2. Create a new API key
3. Add to your `.env` file:
```bash
EXPO_PUBLIC_OPENAI_API_KEY=your_actual_openai_key_here
```

### **Option 3: Claude (Fallback)**
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create a new API key
3. Add to your `.env` file:
```bash
EXPO_PUBLIC_CLAUDE_API_KEY=your_actual_claude_key_here
```

## 📝 **Environment File Setup**

Create a `.env` file in your project root:

```bash
# AI Provider API Keys
EXPO_PUBLIC_GEMINI_API_KEY=your_actual_gemini_key_here
EXPO_PUBLIC_OPENAI_API_KEY=your_actual_openai_key_here
EXPO_PUBLIC_CLAUDE_API_KEY=your_actual_claude_key_here

# Default AI Provider (gemini, openai, or claude)
EXPO_PUBLIC_DEFAULT_AI_PROVIDER=gemini

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔧 **App.json Configuration**

Update your `app.json` with the actual API keys:

```json
{
  "expo": {
    "extra": {
      "defaultAIProvider": "gemini",
      "openaiApiKey": "your_actual_openai_key_here",
      "geminiApiKey": "your_actual_gemini_key_here",
      "claudeApiKey": "your_actual_claude_key_here"
    }
  }
}
```

## 🧪 **Testing API Keys**

After setting up the keys, test them:

1. **Restart your development server**
2. **Clear app cache** (if using Expo Go)
3. **Try generating a story** by approving a chore
4. **Check console logs** for API key validation

## 🚨 **Troubleshooting**

### **"API key not valid" Error**
- ✅ Check that the API key is correct
- ✅ Ensure the key has proper permissions
- ✅ Verify the key is not expired
- ✅ Check that the environment variable is loaded

### **"Incorrect API key provided" Error**
- ✅ Verify the key format (starts with `sk-` for OpenAI)
- ✅ Check for extra spaces or characters
- ✅ Ensure the key is from the correct provider

### **Fallback Stories**
If all AI providers fail, the system will use curated fallback stories. This is normal behavior and ensures the app continues to work.

## 💡 **Recommendations**

1. **Start with Gemini** - It's free and has good quality
2. **Add OpenAI as fallback** - For better reliability
3. **Test with small requests first** - To avoid API costs
4. **Monitor usage** - To stay within API limits

## 🔒 **Security Notes**

- ✅ Never commit API keys to version control
- ✅ Use environment variables for all keys
- ✅ Rotate keys regularly
- ✅ Monitor API usage for unusual activity
