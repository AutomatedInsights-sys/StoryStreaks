import { StoryGenerationRequest, StoryGenerationResponse, AIProvider } from '../types';

// OpenAI Provider
export class OpenAIProvider implements AIProvider {
  name = 'openai' as const;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateStory(request: StoryGenerationRequest): Promise<StoryGenerationResponse> {
    try {
      const prompt = this.buildPrompt(request);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a children\'s story writer. Create engaging, age-appropriate stories that are positive, educational, and safe for children.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'OpenAI API error');
      }

      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated');
      }

      // Basic content moderation
      if (!(await this.moderateContent(content))) {
        throw new Error('Content failed moderation');
      }

      return {
        success: true,
        chapter: {
          id: '', // Will be set by caller
          child_id: request.childId,
          chapter_number: request.chapterNumber,
          title: this.extractTitle(content),
          content: content,
          world_theme: request.worldTheme,
          unlocked_at: new Date().toISOString(),
          is_read: false,
          created_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('OpenAI generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async moderateContent(content: string): Promise<boolean> {
    // Basic content filtering - in production, use OpenAI's moderation API
    const inappropriateWords = ['violence', 'scary', 'fear', 'danger', 'angry'];
    const lowerContent = content.toLowerCase();
    
    return !inappropriateWords.some(word => lowerContent.includes(word));
  }

  private buildPrompt(request: StoryGenerationRequest): string {
    const worldDescriptions = {
      magical_forest: 'a magical forest filled with talking animals, friendly fairies, and enchanted trees',
      space_adventure: 'an exciting space adventure with friendly aliens, spaceships, and distant planets',
      underwater_kingdom: 'a beautiful underwater kingdom with mermaids, sea creatures, and coral castles',
    };

    const worldDescription = worldDescriptions[request.worldTheme] || worldDescriptions.magical_forest;
    
    const ageGuidance = request.ageBracket === '4-6' 
      ? 'Use simple words and short sentences suitable for ages 4-6.'
      : request.ageBracket === '7-8'
      ? 'Use slightly more complex language suitable for ages 7-8.'
      : 'Use engaging language suitable for ages 9-10.';

    return `
Create a children's story chapter for ${request.childName}, a ${request.ageBracket}-year-old child.

Setting: ${worldDescription}

Chapter ${request.chapterNumber}: ${request.completedChores.length > 0 
  ? `This chapter should incorporate the chores ${request.childName} completed: ${request.completedChores.join(', ')}.`
  : 'This is the beginning of their adventure.'}

${request.previousChapterSummary ? `Previous chapter summary: ${request.previousChapterSummary}` : ''}

Requirements:
- Make ${request.childName} the main character
- Keep it positive, educational, and safe
- Length: 150-700 words
- ${ageGuidance}
- Include a clear beginning, middle, and end
- End with a sense of accomplishment or lesson learned
- No violence, scary elements, or inappropriate content

Write the story chapter now:
    `.trim();
  }

  private extractTitle(content: string): string {
    // Try to extract title from first line or generate one
    const firstLine = content.split('\n')[0];
    if (firstLine && firstLine.length < 50 && firstLine.includes('Chapter')) {
      return firstLine;
    }
    return `Chapter ${Math.floor(Math.random() * 10) + 1}: A New Adventure`;
  }
}

// Gemini Provider
export class GeminiProvider implements AIProvider {
  name = 'gemini' as const;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async listAvailableModels(): Promise<string[]> {
    try {
      console.log('🔍 Listing available Gemini models...');
      
      // Try both API versions
      const apiVersions = ['v1', 'v1beta'];
      const availableModels: string[] = [];
      
      for (const apiVersion of apiVersions) {
        try {
          console.log(`🔍 Checking models for API version: ${apiVersion}`);
          
          const response = await fetch(`https://generativelanguage.googleapis.com/${apiVersion}/models?key=${this.apiKey}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const data = await response.json();

          if (response.ok && data.models) {
            console.log(`🔍 Found ${data.models.length} models in ${apiVersion}:`);
            data.models.forEach((model: any) => {
              console.log(`🔍 - ${model.name}`);
              if (model.name.includes('gemini')) {
                availableModels.push(model.name);
              }
            });
          } else {
            console.log(`🔍 API ${apiVersion} failed:`, data.error?.message || 'Unknown error');
          }
        } catch (error) {
          console.log(`🔍 API ${apiVersion} error:`, error);
        }
      }
      
      console.log('🔍 Available Gemini models:', availableModels);
      return availableModels;
    } catch (error) {
      console.error('🔍 Error listing models:', error);
      return [];
    }
  }

  async generateStory(request: StoryGenerationRequest): Promise<StoryGenerationResponse> {
    try {
      const prompt = this.buildPrompt(request);
      
      // Try different Gemini models and API versions based on available models
      const modelConfigs = [
        { model: 'gemini-2.5-pro', apiVersion: 'v1' },
        { model: 'gemini-2.5-flash', apiVersion: 'v1' },
        { model: 'gemini-2.0-flash', apiVersion: 'v1' },
        { model: 'gemini-2.5-pro', apiVersion: 'v1beta' },
        { model: 'gemini-2.5-flash', apiVersion: 'v1beta' }
      ];
      let lastError = null;
      
      for (const config of modelConfigs) {
        try {
          console.log(`🔑 Trying Gemini model: ${config.model} with API ${config.apiVersion}`);
          
          const response = await fetch(`https://generativelanguage.googleapis.com/${config.apiVersion}/models/${config.model}:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }]
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error?.message || 'Gemini API error');
          }

          const content = data.candidates[0]?.content?.parts[0]?.text;
          if (!content) {
            throw new Error('No content generated');
          }

          // Basic content moderation
          if (!(await this.moderateContent(content))) {
            throw new Error('Content failed moderation');
          }

          console.log(`🔑 Gemini model ${config.model} with API ${config.apiVersion} succeeded!`);
          return {
            success: true,
            chapter: {
              id: '', // Will be set by caller
              child_id: request.childId,
              chapter_number: request.chapterNumber,
              title: this.extractTitle(content),
              content: content,
              world_theme: request.worldTheme,
              unlocked_at: new Date().toISOString(),
              is_read: false,
              created_at: new Date().toISOString(),
            },
          };
        } catch (modelError) {
          console.log(`🔑 Gemini model ${config.model} with API ${config.apiVersion} failed:`, modelError);
          lastError = modelError;
          continue; // Try next model
        }
      }
      
      // If all models failed, throw the last error
      throw lastError || new Error('All Gemini models failed');
    } catch (error) {
      console.error('Gemini generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async moderateContent(content: string): Promise<boolean> {
    // Basic content filtering
    const inappropriateWords = ['violence', 'scary', 'fear', 'danger', 'angry'];
    const lowerContent = content.toLowerCase();
    
    return !inappropriateWords.some(word => lowerContent.includes(word));
  }

  private buildPrompt(request: StoryGenerationRequest): string {
    // Similar to OpenAI but optimized for Gemini
    const worldDescriptions = {
      magical_forest: 'a magical forest filled with talking animals, friendly fairies, and enchanted trees',
      space_adventure: 'an exciting space adventure with friendly aliens, spaceships, and distant planets',
      underwater_kingdom: 'a beautiful underwater kingdom with mermaids, sea creatures, and coral castles',
    };

    const worldDescription = worldDescriptions[request.worldTheme] || worldDescriptions.magical_forest;
    
    return `Write a children's story chapter for ${request.childName} (age ${request.ageBracket}) set in ${worldDescription}. 
    
    Chapter ${request.chapterNumber}: ${request.completedChores.length > 0 
      ? `Include how ${request.childName} completed these chores: ${request.completedChores.join(', ')}.`
      : 'Begin their adventure.'}

    ${request.previousChapterSummary ? `Previous: ${request.previousChapterSummary}` : ''}

    Make it positive, safe, 150-700 words, age-appropriate, and educational.`;
  }

  private extractTitle(content: string): string {
    const firstLine = content.split('\n')[0];
    if (firstLine && firstLine.length < 50) {
      return firstLine;
    }
    return `Chapter ${Math.floor(Math.random() * 10) + 1}: A New Adventure`;
  }
}

// Claude Provider (placeholder - would need actual implementation)
export class ClaudeProvider implements AIProvider {
  name = 'claude' as const;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateStory(request: StoryGenerationRequest): Promise<StoryGenerationResponse> {
    // Placeholder implementation
    return {
      success: false,
      error: 'Claude provider not implemented yet',
    };
  }

  async moderateContent(content: string): Promise<boolean> {
    return true; // Placeholder
  }
}
