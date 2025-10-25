import { supabase } from './supabase';

// Simple debug version to test basic connectivity
export class AnalyticsServiceDebug {
  static async testConnection(parentId: string) {
    console.log('Testing analytics connection for parent:', parentId);
    
    try {
      // Test 1: Check if we can connect to Supabase
      console.log('Test 1: Checking Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('children')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('Supabase connection error:', testError);
        return { success: false, error: 'Supabase connection failed', details: testError };
      }
      
      console.log('✅ Supabase connection successful');
      
      // Test 2: Check if parent has children
      console.log('Test 2: Checking for children...');
      const { data: children, error: childrenError } = await supabase
        .from('children')
        .select('id, name')
        .eq('parent_id', parentId);
      
      if (childrenError) {
        console.error('Children query error:', childrenError);
        return { success: false, error: 'Children query failed', details: childrenError };
      }
      
      console.log('✅ Children query successful, found:', children?.length || 0, 'children');
      
      // Test 3: Check if we can query chore completions
      console.log('Test 3: Checking chore completions...');
      if (children && children.length > 0) {
        const { data: chores, error: choresError } = await supabase
          .from('chore_completions')
          .select('id')
          .in('child_id', children.map(c => c.id))
          .limit(1);
        
        if (choresError) {
          console.error('Chores query error:', choresError);
          return { success: false, error: 'Chores query failed', details: choresError };
        }
        
        console.log('✅ Chores query successful, found:', chores?.length || 0, 'completions');
      }
      
      // Test 4: Check if we can query story chapters
      console.log('Test 4: Checking story chapters...');
      if (children && children.length > 0) {
        const { data: stories, error: storiesError } = await supabase
          .from('story_chapters')
          .select('id')
          .in('child_id', children.map(c => c.id))
          .limit(1);
        
        if (storiesError) {
          console.error('Stories query error:', storiesError);
          return { success: false, error: 'Stories query failed', details: storiesError };
        }
        
        console.log('✅ Stories query successful, found:', stories?.length || 0, 'chapters');
      }
      
      return { 
        success: true, 
        children: children?.length || 0,
        message: 'All tests passed successfully'
      };
      
    } catch (error) {
      console.error('Debug test failed:', error);
      return { success: false, error: 'Debug test failed', details: error };
    }
  }
}
