// Debug script to test photo URL format
// This will help us understand what the photo URL should look like

const testPhotoUrl = "https://your-project.supabase.co/storage/v1/object/public/chore-photos/chore_123_1234567890.jpg";

console.log("Expected photo URL format:");
console.log("Base URL: https://your-project.supabase.co");
console.log("Storage path: /storage/v1/object/public/");
console.log("Bucket: chore-photos");
console.log("File: chore_123_1234567890.jpg");

console.log("\nCommon issues:");
console.log("1. Bucket not public");
console.log("2. Incorrect URL format");
console.log("3. File not found");
console.log("4. CORS issues");
console.log("5. RLS policies blocking access");

console.log("\nTo debug:");
console.log("1. Check if the URL is accessible in browser");
console.log("2. Verify bucket is public");
console.log("3. Check RLS policies");
console.log("4. Verify file exists in storage");
