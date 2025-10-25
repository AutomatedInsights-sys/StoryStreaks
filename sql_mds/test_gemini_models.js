// Test script to check available Gemini models
// Run this with: node test_gemini_models.js

const GEMINI_API_KEY = 'AIzaSyDm8auXuWAfTvR6zTMMX1Als3sJh60S0CY';

async function listGeminiModels() {
  console.log('🔍 Testing Gemini API models...');
  
  const apiVersions = ['v1', 'v1beta'];
  
  for (const apiVersion of apiVersions) {
    try {
      console.log(`\n🔍 Checking API version: ${apiVersion}`);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/${apiVersion}/models?key=${GEMINI_API_KEY}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.models) {
        console.log(`✅ Found ${data.models.length} models in ${apiVersion}:`);
        data.models.forEach((model) => {
          console.log(`  - ${model.name}`);
          if (model.name.includes('gemini')) {
            console.log(`    🎯 GEMINI MODEL: ${model.name}`);
          }
        });
      } else {
        console.log(`❌ API ${apiVersion} failed:`, data.error?.message || 'Unknown error');
      }
    } catch (error) {
      console.log(`❌ API ${apiVersion} error:`, error.message);
    }
  }
}

// Run the test
listGeminiModels().catch(console.error);
