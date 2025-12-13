import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

// Debug ImagePicker import
console.log('📸 ImagePicker imported:', ImagePicker);
console.log('📸 ImagePicker keys:', Object.keys(ImagePicker));
import * as FileSystem from 'expo-file-system/legacy';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { NotificationService } from '../../services/notificationService';
import { Chore, ChoreCompletion } from '../../types';
import { theme } from '../../utils/theme';

// Helper function to get the start of today (midnight local time)
const getStartOfToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

// Helper function to get the start of the current week (Monday)
const getStartOfWeek = (): Date => {
  const now = new Date();
  const day = now.getDay();
  // Adjust so Monday is the first day of the week (day 1)
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.getFullYear(), now.getMonth(), diff);
};

// Helper function to check if a chore is already completed for the current period
const isChoreCompletedForPeriod = (
  chore: Chore, 
  completions: ChoreCompletion[]
): boolean => {
  // Get completions for this chore that are pending or approved (rejected can be retried)
  const choreCompletions = completions.filter(
    c => c.chore_id === chore.id && (c.status === 'pending' || c.status === 'approved')
  );

  if (choreCompletions.length === 0) return false;

  switch (chore.recurrence) {
    case 'one-time':
      // One-time chores are done once they have any pending/approved completion
      return true;

    case 'daily':
      // Daily chores reset at midnight
      const startOfToday = getStartOfToday();
      return choreCompletions.some(c => new Date(c.completed_at) >= startOfToday);

    case 'weekly':
      // Weekly chores reset at the start of the week (Monday)
      const startOfWeek = getStartOfWeek();
      return choreCompletions.some(c => new Date(c.completed_at) >= startOfWeek);

    default:
      return false;
  }
};

export default function ChoreDetailScreen({ route, navigation }: any) {
  const { choreId } = route.params;
  const { currentChild } = useAuth();
  const [chore, setChore] = useState<Chore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);

  useEffect(() => {
    fetchChoreDetails();
  }, [choreId]);

  const fetchChoreDetails = async () => {
    if (!currentChild?.id) return;
    
    try {
      // Fetch chore details
      const { data, error } = await supabase
        .from('chores')
        .select('*')
        .eq('id', choreId)
        .single();

      if (error) {
        console.error('Error fetching chore details:', error);
        Alert.alert('Error', 'Failed to load chore details');
        return;
      }

      setChore(data);
      
      // Fetch completions to check if already completed for current period
      const { data: completionsData, error: completionsError } = await supabase
        .from('chore_completions')
        .select('*')
        .eq('chore_id', choreId)
        .eq('child_id', currentChild.id);

      if (completionsError) {
        console.error('Error fetching completions:', completionsError);
      } else {
        const completions = (completionsData || []) as ChoreCompletion[];
        const alreadyCompleted = isChoreCompletedForPeriod(data, completions);
        setIsAlreadyCompleted(alreadyCompleted);
      }
    } catch (error) {
      console.error('Error fetching chore details:', error);
      Alert.alert('Error', 'Failed to load chore details');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      console.log('📸 Requesting media library permissions...');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📸 Permission result:', permissionResult);
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      console.log('📸 Launching image library...');
      console.log('📸 Available ImagePicker properties:', Object.keys(ImagePicker));
      console.log('📸 MediaTypeOptions:', ImagePicker.MediaTypeOptions);
      console.log('📸 MediaType:', ImagePicker.MediaType);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Use string array format
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      console.log('📸 Image picker result:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('📸 Image selected:', result.assets[0].uri);
        setSelectedImage(result.assets[0].uri);
      } else {
        console.log('📸 Image picker canceled or no assets');
      }
    } catch (error) {
      console.error('📸 Error in pickImage:', error);
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      console.log('📸 Requesting camera permissions...');
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📸 Camera permission result:', permissionResult);
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera is required!');
        return;
      }

      console.log('📸 Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      console.log('📸 Camera result:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('📸 Photo taken:', result.assets[0].uri);
        setSelectedImage(result.assets[0].uri);
      } else {
        console.log('📸 Camera canceled or no assets');
      }
    } catch (error) {
      console.error('📸 Error in takePhoto:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Add Photo',
      'How would you like to add a photo?',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const completeChore = async () => {
    if (!chore || !currentChild) return;
    
    // Double-check that the chore isn't already completed
    if (isAlreadyCompleted) {
      Alert.alert('Already Completed', 'This chore has already been completed for the current period.');
      return;
    }

    setIsCompleting(true);

    try {
      let photoUrl = null;

      // Upload photo if selected
      if (selectedImage) {
        try {
          const fileName = `chore_${chore.id}_${Date.now()}.jpg`;
          
          console.log('📸 Uploading photo:', fileName);
          console.log('📸 Photo URI:', selectedImage);
          
          // Try a different approach - use fetch to get the file data
          console.log('📸 Attempting to read file as base64...');
          
          try {
            // Use FormData approach for reliable file upload
            console.log('📸 Using FormData approach for file upload...');
            const formData = new FormData();
            formData.append('file', {
              uri: selectedImage,
              type: 'image/jpeg',
              name: fileName,
            } as any);
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('chore-photos')
              .upload(fileName, formData, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              console.error('📸 Error uploading photo:', uploadError);
              Alert.alert('Error', 'Failed to upload photo, but chore will still be marked as completed');
            } else {
              console.log('📸 Photo uploaded successfully:', uploadData);
              const { data: publicUrl } = supabase.storage
                .from('chore-photos')
                .getPublicUrl(uploadData.path);
              photoUrl = publicUrl.publicUrl;
              console.log('📸 Photo URL:', photoUrl);
            }
          } catch (uploadError) {
            console.error('📸 Error uploading photo:', uploadError);
            Alert.alert('Error', 'Failed to upload photo, but chore will still be marked as completed');
          }
        } catch (photoError) {
          console.error('Error processing photo:', photoError);
          Alert.alert('Error', 'Failed to process photo, but chore will still be marked as completed');
        }
      }

      // Create chore completion record
      const { error } = await supabase
        .from('chore_completions')
        .insert({
          chore_id: chore.id,
          child_id: currentChild.id,
          photo_url: photoUrl,
          status: 'pending',
        });

      if (error) {
        console.error('Error completing chore:', error);
        Alert.alert('Error', 'Failed to complete chore');
        return;
      }

      // Send notification to parent
      if (currentChild?.parent_id) {
        await NotificationService.notifyChoreCompletion(
          chore.id,
          currentChild.id,
          currentChild.parent_id
        );
      }

      Alert.alert(
        'Chore Completed! 🎉',
        'Your chore has been submitted for approval. Great job!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error completing chore:', error);
      Alert.alert('Error', 'Failed to complete chore');
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading chore details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chore) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Chore not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>{chore.title}</Text>
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsText}>{chore.points} points</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>{chore.description}</Text>

          <View style={styles.detailsSection}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>
                {chore.recurrence === 'daily' ? 'Daily' : 
                 chore.recurrence === 'weekly' ? 'Weekly' : 'One-time'}
              </Text>
            </View>
            
            {chore.deadline && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Deadline:</Text>
                <Text style={styles.detailValue}>
                  {new Date(chore.deadline).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.photoSection}>
            <Text style={styles.sectionTitle}>Completion Photo (Optional)</Text>
            <Text style={styles.sectionSubtitle}>
              Add a photo to show you completed the chore!
            </Text>

            {selectedImage ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: selectedImage }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.changePhotoButton}
                  onPress={showImagePicker}
                >
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addPhotoButton} onPress={showImagePicker}>
                <Text style={styles.addPhotoText}>📷 Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        {isAlreadyCompleted ? (
          <View style={styles.completedMessage}>
            <Text style={styles.completedEmoji}>✅</Text>
            <Text style={styles.completedText}>
              {chore?.recurrence === 'one-time' 
                ? 'This chore has been completed!'
                : chore?.recurrence === 'daily'
                ? 'You already completed this chore today! Come back tomorrow.'
                : 'You already completed this chore this week! Come back next week.'}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={completeChore}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.completeButtonText}>Mark as Complete</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  pointsContainer: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 16,
  },
  pointsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: theme.spacing.lg,
  },
  description: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  detailsSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text,
  },
  photoSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  addPhotoButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  photoContainer: {
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.border,
  },
  changePhotoButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
  },
  changePhotoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomSection: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  completeButton: {
    backgroundColor: theme.colors.success,
    padding: theme.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  completedMessage: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.success,
  },
  completedEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  completedText: {
    color: theme.colors.text,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});
