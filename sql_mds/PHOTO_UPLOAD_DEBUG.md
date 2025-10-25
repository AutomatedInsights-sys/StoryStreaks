# 📸 Photo Upload Debug Guide

## 🐛 Current Issue
Error: `[ReferenceError: Property 'blob' doesn't exist]`

## 🔍 Debugging Steps

### 1. Check if Storage Bucket Exists
Run the SQL script in Supabase:
```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'chore-photos';

-- If not exists, create it
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chore-photos',
  'chore-photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);
```

### 2. Test Photo Upload
The current implementation should now work with FormData. Check the console logs for:
- `📸 Uploading photo: [filename]`
- `📸 Photo URI: [uri]`
- `📸 Photo uploaded successfully: [data]`
- `📸 Photo URL: [url]`

### 3. Alternative Approaches

If the current approach doesn't work, try these alternatives:

#### Option A: Use expo-file-system
```typescript
import * as FileSystem from 'expo-file-system';

// Read file as base64
const base64 = await FileSystem.readAsStringAsync(selectedImage, {
  encoding: FileSystem.EncodingType.Base64,
});

// Upload base64 data
const { data, error } = await supabase.storage
  .from('chore-photos')
  .upload(fileName, base64, {
    contentType: 'image/jpeg',
  });
```

#### Option B: Use fetch with proper headers
```typescript
// Read file as blob
const response = await fetch(selectedImage);
const blob = await response.blob();

// Upload blob
const { data, error } = await supabase.storage
  .from('chore-photos')
  .upload(fileName, blob, {
    contentType: 'image/jpeg',
  });
```

#### Option C: Use react-native-fs
```typescript
import RNFS from 'react-native-fs';

// Read file as base64
const base64 = await RNFS.readFile(selectedImage, 'base64');

// Upload base64 data
const { data, error } = await supabase.storage
  .from('chore-photos')
  .upload(fileName, base64, {
    contentType: 'image/jpeg',
  });
```

## 🧪 Testing Steps

1. **Run the SQL script** to create the storage bucket
2. **Test photo upload** with the current FormData approach
3. **Check console logs** for debugging information
4. **If still failing**, try one of the alternative approaches above

## 🎯 Expected Results

After fixing the upload method:
- ✅ Photo uploads successfully to Supabase storage
- ✅ Photo URL is generated and stored in database
- ✅ Photo appears in parent approval screen
- ✅ No more blob errors

## 🚀 Next Steps

1. Test the current FormData approach
2. If it fails, try the expo-file-system approach
3. Check Supabase storage bucket for uploaded files
4. Verify photo appears in parent approval screen
