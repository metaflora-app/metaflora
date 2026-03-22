import { supabase } from './supabase';

export interface LessonProgress {
  videoWatched: boolean;
  materialsRead: boolean;
  videoViewed?: boolean;
  completed?: boolean;
}

export interface UserProgressRow {
  id: string;
  user_id: number;
  lesson_id: string;
  video_watched: boolean;
  materials_read: boolean;
  video_viewed: boolean;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Получить прогресс пользователя по всем урокам
 */
export async function getUserProgress(userId: number): Promise<Record<string, LessonProgress>> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user progress:', error);
    return {};
  }

  const progress: Record<string, LessonProgress> = {};
  data?.forEach((row: UserProgressRow) => {
    progress[row.lesson_id] = {
      videoWatched: row.video_watched,
      materialsRead: row.materials_read,
      videoViewed: row.video_viewed,
      completed: row.completed,
    };
  });

  return progress;
}

/**
 * Получить прогресс по конкретному уроку
 */
export async function getLessonProgress(userId: number, lessonId: string): Promise<LessonProgress | null> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    videoWatched: data.video_watched,
    materialsRead: data.materials_read,
    videoViewed: data.video_viewed,
    completed: data.completed,
  };
}

/**
 * Обновить прогресс по уроку
 */
export async function updateLessonProgress(
  userId: number,
  lessonId: string,
  updates: Partial<LessonProgress>
): Promise<boolean> {
  const currentProgress = await getLessonProgress(userId, lessonId);
  
  const newProgress = {
    video_watched: updates.videoWatched ?? currentProgress?.videoWatched ?? false,
    materials_read: updates.materialsRead ?? currentProgress?.materialsRead ?? false,
    video_viewed: updates.videoViewed ?? currentProgress?.videoViewed ?? false,
  };

  // Автоматически устанавливаем completed если оба условия выполнены
  const completed = newProgress.video_watched && newProgress.materials_read;

  const { error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      ...newProgress,
      completed,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,lesson_id'
    });

  if (error) {
    console.error('Error updating lesson progress:', error);
    return false;
  }

  return true;
}

/**
 * Получить список завершенных уроков
 */
export async function getCompletedLessons(userId: number): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('completed', true);

  if (error) {
    console.error('Error fetching completed lessons:', error);
    return [];
  }

  return data?.map((row: { lesson_id: string }) => row.lesson_id) || [];
}

/**
 * Проверить был ли просмотрен видео (для блюра)
 */
export async function wasVideoViewed(userId: number, lessonId: string): Promise<boolean> {
  const progress = await getLessonProgress(userId, lessonId);
  return progress?.videoViewed ?? false;
}

/**
 * Отметить что видео было просмотрено (для блюра)
 */
export async function markVideoViewed(userId: number, lessonId: string): Promise<boolean> {
  return updateLessonProgress(userId, lessonId, { videoViewed: true });
}

export async function markLessonVideoWatched(userId: number, lessonId: string): Promise<boolean> {
  return updateLessonProgress(userId, lessonId, { videoWatched: true });
}

export async function markLessonMaterialsRead(userId: number, lessonId: string): Promise<boolean> {
  return updateLessonProgress(userId, lessonId, { materialsRead: true });
}
