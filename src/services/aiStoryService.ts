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
    console.log('🔑 Initializing AI providers...');
    console.log('🔑 Default provider:', this.defaultProvider);
    console.log('🔑 Expo config extra:', Constants.expoConfig?.extra);
    
    // Initialize OpenAI
    const openaiKey = Constants.expoConfig?.extra?.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    console.log('🔑 OpenAI key found:', !!openaiKey, openaiKey ? `${openaiKey.substring(0, 10)}...` : 'none');
    if (openaiKey && !openaiKey.includes('your-') && !openaiKey.includes('sk-your-')) {
      this.providers.set('openai', new OpenAIProvider(openaiKey));
      console.log('🔑 OpenAI provider initialized');
    }

    // Initialize Gemini - Prioritize environment variables over app.json
    const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || Constants.expoConfig?.extra?.geminiApiKey;
    console.log('🔑 Gemini key found:', !!geminiKey, geminiKey ? `${geminiKey.substring(0, 10)}...` : 'none');
    console.log('🔑 Gemini key from app.json:', Constants.expoConfig?.extra?.geminiApiKey);
    console.log('🔑 Gemini key from env:', process.env.EXPO_PUBLIC_GEMINI_API_KEY);
    
    if (geminiKey && !geminiKey.includes('your-') && geminiKey.length > 10) {
      this.providers.set('gemini', new GeminiProvider(geminiKey));
      console.log('🔑 Gemini provider initialized');
    } else {
      console.log('🔑 Gemini provider NOT initialized - key invalid or missing');
    }

    // Initialize Claude
    const claudeKey = Constants.expoConfig?.extra?.claudeApiKey || process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
    console.log('🔑 Claude key found:', !!claudeKey, claudeKey ? `${claudeKey.substring(0, 10)}...` : 'none');
    if (claudeKey && !claudeKey.includes('your-')) {
      this.providers.set('claude', new ClaudeProvider(claudeKey));
      console.log('🔑 Claude provider initialized');
    }
    
    console.log('🔑 Total providers initialized:', this.providers.size);
    console.log('🔑 Available providers:', Array.from(this.providers.keys()));
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

      // If it's Gemini, we now know the available models from the listing

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
        console.log('📚 All AI providers failed, using fallback story');
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
      console.log('📚 Starting story generation for child:', childId);
      console.log('📚 Completed chore IDs:', completedChoreIds);
      
      // Get child info
      const { data: child, error: childError } = await supabase
        .from('children')
        .select('name, age, age_bracket, world_theme')
        .eq('id', childId)
        .single();

      if (childError || !child) {
        console.error('📚 Error fetching child:', childError);
        return null;
      }

      console.log('📚 Child info:', { name: child.name, world_theme: child.world_theme });

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
        console.error('📚 Error fetching chores:', choresError);
        return null;
      }

      console.log('📚 Found completed chores:', chores.length);

      // Get current story progress
      const { data: progress } = await supabase
        .from('story_progress')
        .select('current_chapter, total_chapters_unlocked')
        .eq('child_id', childId)
        .eq('world_theme', child.world_theme)
        .single();

      // Get the highest existing chapter number for this child
      const { data: existingChapters } = await supabase
        .from('story_chapters')
        .select('chapter_number')
        .eq('child_id', childId)
        .eq('world_theme', child.world_theme)
        .order('chapter_number', { ascending: false })
        .limit(1);

      const highestChapter = existingChapters?.[0]?.chapter_number || 0;
      const currentChapter = highestChapter + 1;
      
      console.log('📚 Chapter calculation:', {
        existingProgress: progress,
        highestExistingChapter: highestChapter,
        newChapterNumber: currentChapter
      });
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

      console.log('📚 Generating story with request:', {
        childName: request.childName,
        worldTheme: request.worldTheme,
        chapterNumber: request.chapterNumber,
        completedChores: request.completedChores
      });

      const result = await this.generateStory(request);
      
      if (result.success && result.chapter) {
        console.log('📚 Story generated successfully:', result.chapter.title);
        
        // Update story progress
        await this.updateStoryProgress(childId, child.world_theme, currentChapter);
        
        // Create notification
        await this.createStoryUnlockNotification(childId, result.chapter.title);
        
        return result.chapter;
      } else {
        console.warn('📚 Story generation failed:', result.error);
        return null;
      }
    } catch (error) {
      console.error('📚 Error in unlockStoryForChores:', error);
      
      // Try to generate a fallback story if AI generation fails
      try {
        console.log('📚 Attempting fallback story generation...');
        const fallbackRequest: StoryGenerationRequest = {
          childId,
          childName: 'Child', // Default name if we can't fetch child info
          ageBracket: '4-6',
          worldTheme: 'magical_forest',
          completedChores: ['completed chore'],
          chapterNumber: 1,
        };
        
        const fallbackResult = await this.generateFallbackStory(fallbackRequest);
        if (fallbackResult.success && fallbackResult.chapter) {
          console.log('📚 Fallback story generated successfully');
          return fallbackResult.chapter;
        }
      } catch (fallbackError) {
        console.error('📚 Fallback story generation also failed:', fallbackError);
      }
      
      return null;
    }
  }

  private async updateStoryProgress(childId: string, worldTheme: string, chapterNumber: number) {
    try {
      // First, try to get existing progress
      const { data: existingProgress } = await supabase
        .from('story_progress')
        .select('*')
        .eq('child_id', childId)
        .eq('world_theme', worldTheme)
        .single();

      if (existingProgress) {
        // Update existing progress
        const { error } = await supabase
          .from('story_progress')
          .update({
            current_chapter: Math.max(existingProgress.current_chapter, chapterNumber),
            total_chapters_unlocked: Math.max(existingProgress.total_chapters_unlocked, chapterNumber),
            updated_at: new Date().toISOString(),
          })
          .eq('child_id', childId)
          .eq('world_theme', worldTheme);

        if (error) {
          console.error('📚 Error updating existing story progress:', error);
        } else {
          console.log('📚 Story progress updated successfully');
        }
      } else {
        // Create new progress record
        const { error } = await supabase
          .from('story_progress')
          .insert({
            child_id: childId,
            world_theme: worldTheme,
            current_chapter: chapterNumber,
            total_chapters_unlocked: chapterNumber,
          });

        if (error) {
          console.error('📚 Error creating new story progress:', error);
        } else {
          console.log('📚 New story progress created successfully');
        }
      }
    } catch (error) {
      console.error('📚 Error in updateStoryProgress:', error);
    }
  }

  private async createStoryUnlockNotification(childId: string, chapterTitle: string) {
    try {
      // Use the NotificationService instead of direct database insert
      // This handles RLS policies properly
      const { NotificationService } = await import('./notificationService');
      
      const notification = await NotificationService.notifyStoryUnlock(childId, chapterTitle);
      
      if (notification) {
        console.log('📚 Story unlock notification created successfully');
      } else {
        console.warn('📚 Failed to create story unlock notification');
      }
    } catch (error) {
      console.error('📚 Error in createStoryUnlockNotification:', error);
    }
  }
}

// Export singleton instance
export const aiStoryService = new AIStoryService();
