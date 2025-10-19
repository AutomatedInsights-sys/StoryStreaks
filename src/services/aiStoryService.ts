import Constants from 'expo-constants';
import { supabase } from './supabase';
import { StoryGenerationRequest, StoryGenerationResponse, StoryChapter } from '../types';
import { OpenAIProvider, GeminiProvider, ClaudeProvider } from '../ai/storyProviders';

export class AIStoryService {
  private providers: Map<string, any> = new Map();
  private defaultProvider: string;

  constructor() {
    this.defaultProvider = Constants.expoConfig?.extra?.defaultAIProvider || process.env.EXPO_PUBLIC_DEFAULT_AI_PROVIDER || 'openai';
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize OpenAI
    const openaiKey = Constants.expoConfig?.extra?.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (openaiKey) {
      this.providers.set('openai', new OpenAIProvider(openaiKey));
    }

    // Initialize Gemini
    const geminiKey = Constants.expoConfig?.extra?.geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (geminiKey) {
      this.providers.set('gemini', new GeminiProvider(geminiKey));
    }

    // Initialize Claude
    const claudeKey = Constants.expoConfig?.extra?.claudeApiKey || process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
    if (claudeKey) {
      this.providers.set('claude', new ClaudeProvider(claudeKey));
    }
  }

  async generateStory(request: StoryGenerationRequest): Promise<StoryGenerationResponse> {
    try {
      // Get the provider
      const provider = this.providers.get(this.defaultProvider);
      if (!provider) {
        return {
          success: false,
          error: `No AI provider configured for: ${this.defaultProvider}`,
        };
      }

      // Generate story with primary provider
      let result = await provider.generateStory(request);
      
      // If primary provider fails, try fallback providers
      if (!result.success) {
        console.warn(`Primary provider ${this.defaultProvider} failed, trying fallbacks`);
        
        for (const [providerName, fallbackProvider] of this.providers) {
          if (providerName !== this.defaultProvider) {
            result = await fallbackProvider.generateStory(request);
            if (result.success) {
              console.log(`Fallback provider ${providerName} succeeded`);
              break;
            }
          }
        }
      }

      // If all providers fail, use curated fallback
      if (!result.success) {
        return await this.generateFallbackStory(request);
      }

      // Save to database
      if (result.chapter) {
        const savedChapter = await this.saveChapterToDatabase(result.chapter);
        if (savedChapter) {
          result.chapter = savedChapter;
        }
      }

      return result;
    } catch (error) {
      console.error('AI Story Service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async generateFallbackStory(request: StoryGenerationRequest): Promise<StoryGenerationResponse> {
    // Curated fallback stories based on world theme
    const fallbackStories = {
      magical_forest: {
        title: `Chapter ${request.chapterNumber}: The Helpful Fairy`,
        content: `In the magical forest, ${request.childName} discovered a tiny fairy who needed help organizing her flower garden. The fairy was so grateful for ${request.childName}'s help that she granted them a special wish. ${request.childName} wished for all children to be happy and helpful, just like they had been today. The fairy smiled and sprinkled magic dust, making the wish come true. From that day forward, ${request.childName} knew that helping others was the greatest magic of all.`
      },
      space_adventure: {
        title: `Chapter ${request.chapterNumber}: The Friendly Alien`,
        content: `During their space adventure, ${request.childName} met a friendly alien named Zyx who was having trouble keeping their spaceship clean. ${request.childName} helped Zyx organize the control room and learned about different planets in the galaxy. Zyx was so impressed by ${request.childName}'s helpfulness that they gave them a special space badge. ${request.childName} felt proud to be a helpful space explorer and promised to always lend a hand when others needed it.`
      },
      underwater_kingdom: {
        title: `Chapter ${request.chapterNumber}: The Mermaid's Treasure`,
        content: `In the underwater kingdom, ${request.childName} helped a young mermaid named Coral organize her seashell collection. Coral had so many beautiful shells but couldn't find the ones she needed. ${request.childName} carefully sorted the shells by color and size, making Coral's collection neat and organized. As a thank you, Coral shared a magical pearl with ${request.childName}, which glowed softly and reminded them that helping others makes the whole ocean a brighter place.`
      }
    };

    const fallbackStory = fallbackStories[request.worldTheme] || fallbackStories.magical_forest;

    const chapter: StoryChapter = {
      id: '', // Will be set by database
      child_id: request.childId,
      chapter_number: request.chapterNumber,
      title: fallbackStory.title,
      content: fallbackStory.content,
      world_theme: request.worldTheme,
      unlocked_at: new Date().toISOString(),
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const savedChapter = await this.saveChapterToDatabase(chapter);

    return {
      success: true,
      chapter: savedChapter || chapter,
      fallbackUsed: true,
    };
  }

  private async saveChapterToDatabase(chapter: StoryChapter): Promise<StoryChapter | null> {
    try {
      const { data, error } = await supabase
        .from('story_chapters')
        .insert({
          child_id: chapter.child_id,
          chapter_number: chapter.chapter_number,
          title: chapter.title,
          content: chapter.content,
          world_theme: chapter.world_theme,
          unlocked_at: chapter.unlocked_at,
          is_read: chapter.is_read,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving chapter to database:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in saveChapterToDatabase:', error);
      return null;
    }
  }

  async unlockStoryForChores(childId: string, completedChoreIds: string[]): Promise<StoryChapter | null> {
    try {
      // Get child info
      const { data: child, error: childError } = await supabase
        .from('children')
        .select('name, age, age_bracket, world_theme')
        .eq('id', childId)
        .single();

      if (childError || !child) {
        console.error('Error fetching child:', childError);
        return null;
      }

      // Get completed chores
      const { data: chores, error: choresError } = await supabase
        .from('chore_completions')
        .select(`
          chore_id,
          chores (
            title,
            description
          )
        `)
        .in('id', completedChoreIds)
        .eq('status', 'approved');

      if (choresError || !chores) {
        console.error('Error fetching chores:', choresError);
        return null;
      }

      // Get current story progress
      const { data: progress } = await supabase
        .from('story_progress')
        .select('current_chapter, total_chapters_unlocked')
        .eq('child_id', childId)
        .eq('world_theme', child.world_theme)
        .single();

      const currentChapter = (progress?.current_chapter || 0) + 1;
      const completedChoreTitles = chores.map(c => c.chores?.title || 'completed chore');

      // Get previous chapter summary if exists
      const { data: previousChapter } = await supabase
        .from('story_chapters')
        .select('content')
        .eq('child_id', childId)
        .eq('chapter_number', currentChapter - 1)
        .single();

      const request: StoryGenerationRequest = {
        childId,
        childName: child.name,
        ageBracket: child.age_bracket,
        worldTheme: child.world_theme,
        completedChores: completedChoreTitles,
        previousChapterSummary: previousChapter?.content ? 
          previousChapter.content.substring(0, 200) + '...' : undefined,
        chapterNumber: currentChapter,
      };

      const result = await this.generateStory(request);
      
      if (result.success && result.chapter) {
        // Update story progress
        await this.updateStoryProgress(childId, child.world_theme, currentChapter);
        
        // Create notification
        await this.createStoryUnlockNotification(childId, result.chapter.title);
        
        return result.chapter;
      }

      return null;
    } catch (error) {
      console.error('Error in unlockStoryForChores:', error);
      return null;
    }
  }

  private async updateStoryProgress(childId: string, worldTheme: string, chapterNumber: number) {
    try {
      const { error } = await supabase
        .from('story_progress')
        .upsert({
          child_id: childId,
          world_theme: worldTheme,
          current_chapter: chapterNumber,
          total_chapters_unlocked: chapterNumber,
        });

      if (error) {
        console.error('Error updating story progress:', error);
      }
    } catch (error) {
      console.error('Error in updateStoryProgress:', error);
    }
  }

  private async createStoryUnlockNotification(childId: string, chapterTitle: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: childId,
          type: 'story_unlock',
          title: 'New Story Unlocked!',
          message: `A new chapter "${chapterTitle}" is ready to read!`,
          data: { chapterTitle },
        });

      if (error) {
        console.error('Error creating story unlock notification:', error);
      }
    } catch (error) {
      console.error('Error in createStoryUnlockNotification:', error);
    }
  }
}

// Export singleton instance
export const aiStoryService = new AIStoryService();
