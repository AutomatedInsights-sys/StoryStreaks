/**
 * Backfill Script: Add Premium Cover Images to Existing Books
 * 
 * This script updates all story_books that don't have a cover_image
 * and all story_chapters that don't have an image_url.
 * 
 * Run this script once after adding the cover_image column to story_books.
 */

import { supabase } from '../services/supabase';
import { getRandomThemeImage } from '../constants/themeImages';
import { StoryWorld } from '../types';

interface BackfillResult {
  booksUpdated: number;
  chaptersUpdated: number;
  errors: string[];
}

export async function backfillCoverImages(): Promise<BackfillResult> {
  const result: BackfillResult = {
    booksUpdated: 0,
    chaptersUpdated: 0,
    errors: [],
  };

  console.log('🖼️ Starting cover image backfill...');

  try {
    // 1. Fetch all books without a cover_image
    const { data: booksWithoutCover, error: booksError } = await supabase
      .from('story_books')
      .select('id, theme')
      .is('cover_image', null);

    if (booksError) {
      result.errors.push(`Error fetching books: ${booksError.message}`);
      console.error('❌ Error fetching books:', booksError);
      return result;
    }

    console.log(`📚 Found ${booksWithoutCover?.length || 0} books without cover images`);

    // 2. Update each book with a random cover image based on its theme
    if (booksWithoutCover && booksWithoutCover.length > 0) {
      for (const book of booksWithoutCover) {
        const coverImage = getRandomThemeImage(book.theme as StoryWorld);
        
        if (coverImage) {
          const { error: updateError } = await supabase
            .from('story_books')
            .update({ cover_image: coverImage })
            .eq('id', book.id);

          if (updateError) {
            result.errors.push(`Error updating book ${book.id}: ${updateError.message}`);
            console.error(`❌ Error updating book ${book.id}:`, updateError);
          } else {
            result.booksUpdated++;
            console.log(`✅ Updated book ${book.id} with cover: ${coverImage.substring(0, 50)}...`);

            // 3. Update all chapters of this book to use the same cover image
            const { data: updatedChapters, error: chaptersUpdateError } = await supabase
              .from('story_chapters')
              .update({ image_url: coverImage })
              .eq('story_book_id', book.id)
              .is('image_url', null)
              .select('id');

            if (chaptersUpdateError) {
              result.errors.push(`Error updating chapters for book ${book.id}: ${chaptersUpdateError.message}`);
              console.error(`❌ Error updating chapters for book ${book.id}:`, chaptersUpdateError);
            } else {
              const chaptersCount = updatedChapters?.length || 0;
              result.chaptersUpdated += chaptersCount;
              console.log(`  📖 Updated ${chaptersCount} chapters for book ${book.id}`);
            }
          }
        } else {
          result.errors.push(`No cover image available for theme: ${book.theme}`);
        }
      }
    }

    // 4. Handle orphan chapters (chapters without a book or with a book that has a cover)
    // These chapters should also get cover images based on their world_theme
    const { data: orphanChapters, error: orphanError } = await supabase
      .from('story_chapters')
      .select('id, world_theme, story_book_id')
      .is('image_url', null);

    if (orphanError) {
      result.errors.push(`Error fetching orphan chapters: ${orphanError.message}`);
    } else if (orphanChapters && orphanChapters.length > 0) {
      console.log(`📖 Found ${orphanChapters.length} chapters still without cover images`);

      for (const chapter of orphanChapters) {
        // Try to get the book's cover image first
        let coverImage: string | null = null;

        if (chapter.story_book_id) {
          const { data: book } = await supabase
            .from('story_books')
            .select('cover_image')
            .eq('id', chapter.story_book_id)
            .single();

          coverImage = book?.cover_image || null;
        }

        // If no book cover, generate one based on the chapter's theme
        if (!coverImage) {
          coverImage = getRandomThemeImage(chapter.world_theme as StoryWorld);
        }

        if (coverImage) {
          const { error: updateError } = await supabase
            .from('story_chapters')
            .update({ image_url: coverImage })
            .eq('id', chapter.id);

          if (updateError) {
            result.errors.push(`Error updating chapter ${chapter.id}: ${updateError.message}`);
          } else {
            result.chaptersUpdated++;
          }
        }
      }
    }

    console.log('\n🎉 Backfill complete!');
    console.log(`   📚 Books updated: ${result.booksUpdated}`);
    console.log(`   📖 Chapters updated: ${result.chaptersUpdated}`);
    if (result.errors.length > 0) {
      console.log(`   ⚠️ Errors: ${result.errors.length}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);
    console.error('❌ Backfill failed:', error);
  }

  return result;
}

// Export for use in the app
export default backfillCoverImages;

