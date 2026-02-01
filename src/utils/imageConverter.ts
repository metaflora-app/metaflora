/**
 * Конвертер PNG → JPEG для изображений из Supabase
 * Автоматически заменяет .png на .jpeg в URL
 */

/**
 * Конвертирует PNG URL в JPEG URL
 * @param pngUrl - URL изображения PNG
 * @returns URL изображения JPEG
 */
export function convertPngToJpeg(pngUrl: string): string {
  if (!pngUrl) return pngUrl;
  
  // Проверяем что это Supabase URL
  if (!pngUrl.includes('supabase.co')) {
    return pngUrl;
  }
  
  // Заменяем .png на .jpeg
  if (pngUrl.endsWith('.png') || pngUrl.endsWith('.PNG')) {
    return pngUrl.replace(/\.png$/i, '.jpeg');
  }
  
  return pngUrl;
}

/**
 * Пытается загрузить изображение с fallback на PNG если JPEG не найден
 * @param imageUrl - URL изображения
 * @returns Promise с финальным URL который работает
 */
export async function getWorkingImageUrl(imageUrl: string): Promise<string> {
  if (!imageUrl) return imageUrl;
  
  // Сначала пробуем JPEG
  const jpegUrl = convertPngToJpeg(imageUrl);
  
  try {
    const response = await fetch(jpegUrl, { method: 'HEAD' });
    if (response.ok) {
      return jpegUrl;
    }
  } catch (error) {
    // Если JPEG не найден, возвращаем оригинальный PNG
  }
  
  return imageUrl;
}

/**
 * Хук для загрузки изображения с автоматической конвертацией PNG→JPEG
 */
export function useImageWithFallback(originalUrl: string): string {
  const [finalUrl, setFinalUrl] = React.useState(originalUrl);
  
  React.useEffect(() => {
    if (!originalUrl) return;
    
    getWorkingImageUrl(originalUrl).then(setFinalUrl);
  }, [originalUrl]);
  
  return finalUrl;
}

// Для использования без React hooks
import React from 'react';
