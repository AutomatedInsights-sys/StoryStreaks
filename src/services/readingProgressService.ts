import { supabase } from './supabase';

export interface ReadingSession {
  id: string;
  child_id: string;
  chapter_id: string;
  start_time: string;
  end_time?: string;
  reading_duration?: number; // in seconds
  words_read?: number;
  reading_speed?: number; // words per minute
  created_at: string;
}

export interface ReadingStats {
  total_reading_time: number; // in minutes
  total_chapters_read: number;
  average_reading_speed: number; // words per minute
  reading_streak_days: number;
  longest_reading_session: number; // in minutes
  favorite_world_theme: string;
}

export class ReadingProgressService {
  // Start a reading session
  static async startReadingSession(childId: string, chapterId: string): Promise<ReadingSession | null> {
    try {
      const { data, error } = await supabase
        .from('reading_sessions')
        .insert({
          child_id: childId,
          chapter_id: chapterId,
          start_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error starting reading session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error starting reading session:', error);
      return null;
    }
  }

  // End a reading session
  static async endReadingSession(sessionId: string, wordsRead?: number): Promise<boolean> {
    try {
      const endTime = new Date().toISOString();
      
      // Get the session to calculate duration
      const { data: session } = await supabase
        .from('reading_sessions')
        .select('start_time')
        .eq('id', sessionId)
        .single();

      if (!session) return false;

      const startTime = new Date(session.start_time);
      const duration = Math.floor((new Date(endTime).getTime() - startTime.getTime()) / 1000);
      const readingSpeed = wordsRead && duration > 0 ? Math.round((wordsRead / duration) * 60) : null;

      const { error } = await supabase
        .from('reading_sessions')
        .update({
          end_time: endTime,
          reading_duration: duration,
          words_read: wordsRead,
          reading_speed: readingSpeed,
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error ending reading session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error ending reading session:', error);
      return false;
    }
  }

  // Get reading statistics for a child
  static async getReadingStats(childId: string): Promise<ReadingStats | null> {
    try {
      // Get total reading time and sessions
      const { data: sessions } = await supabase
        .from('reading_sessions')
        .select('reading_duration, reading_speed, created_at')
        .eq('child_id', childId)
        .not('reading_duration', 'is', null);

      if (!sessions || sessions.length === 0) {
        return {
          total_reading_time: 0,
          total_chapters_read: 0,
          average_reading_speed: 0,
          reading_streak_days: 0,
          longest_reading_session: 0,
          favorite_world_theme: '',
        };
      }

      // Calculate total reading time in minutes
      const totalReadingTime = sessions.reduce((sum, session) => 
        sum + (session.reading_duration || 0), 0) / 60;

      // Calculate average reading speed
      const validSpeeds = sessions
        .map(s => s.reading_speed)
        .filter(speed => speed && speed > 0);
      const averageReadingSpeed = validSpeeds.length > 0 
        ? Math.round(validSpeeds.reduce((sum, speed) => sum + speed, 0) / validSpeeds.length)
        : 0;

      // Calculate reading streak
      const readingStreak = this.calculateReadingStreak(sessions);

      // Get longest reading session
      const longestSession = Math.max(...sessions.map(s => s.reading_duration || 0)) / 60;

      // Get favorite world theme
      const { data: favoriteTheme } = await supabase
        .from('reading_sessions')
        .select(`
          chapter_id,
          story_chapters!inner(world_theme)
        `)
        .eq('child_id', childId)
        .not('reading_duration', 'is', null);

      const themeCounts: { [key: string]: number } = {};
      favoriteTheme?.forEach(session => {
        const theme = session.story_chapters?.world_theme;
        if (theme) {
          themeCounts[theme] = (themeCounts[theme] || 0) + 1;
        }
      });

      const favoriteWorldTheme = Object.keys(themeCounts).reduce((a, b) => 
        themeCounts[a] > themeCounts[b] ? a : b, '');

      // Get total chapters read
      const { data: chaptersRead } = await supabase
        .from('story_chapters')
        .select('id')
        .eq('child_id', childId)
        .eq('is_read', true);

      return {
        total_reading_time: Math.round(totalReadingTime),
        total_chapters_read: chaptersRead?.length || 0,
        average_reading_speed: averageReadingSpeed,
        reading_streak_days: readingStreak,
        longest_reading_session: Math.round(longestSession),
        favorite_world_theme: favoriteWorldTheme,
      };
    } catch (error) {
      console.error('Error getting reading stats:', error);
      return null;
    }
  }

  // Calculate reading streak in days
  private static calculateReadingStreak(sessions: any[]): number {
    if (sessions.length === 0) return 0;

    // Sort sessions by date
    const sortedSessions = sessions
      .map(s => new Date(s.created_at))
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const sessionDate of sortedSessions) {
      const sessionDay = new Date(sessionDate);
      sessionDay.setHours(0, 0, 0, 0);

      if (sessionDay.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (sessionDay.getTime() < currentDate.getTime()) {
        break;
      }
    }

    return streak;
  }

  // Get reading progress for a specific chapter
  static async getChapterReadingProgress(chapterId: string): Promise<{
    totalSessions: number;
    totalTime: number;
    averageSpeed: number;
  }> {
    try {
      const { data: sessions } = await supabase
        .from('reading_sessions')
        .select('reading_duration, reading_speed')
        .eq('chapter_id', chapterId)
        .not('reading_duration', 'is', null);

      if (!sessions || sessions.length === 0) {
        return { totalSessions: 0, totalTime: 0, averageSpeed: 0 };
      }

      const totalTime = sessions.reduce((sum, s) => sum + (s.reading_duration || 0), 0) / 60;
      const validSpeeds = sessions
        .map(s => s.reading_speed)
        .filter(speed => speed && speed > 0);
      const averageSpeed = validSpeeds.length > 0 
        ? Math.round(validSpeeds.reduce((sum, speed) => sum + speed, 0) / validSpeeds.length)
        : 0;

      return {
        totalSessions: sessions.length,
        totalTime: Math.round(totalTime),
        averageSpeed,
      };
    } catch (error) {
      console.error('Error getting chapter reading progress:', error);
      return { totalSessions: 0, totalTime: 0, averageSpeed: 0 };
    }
  }
}
