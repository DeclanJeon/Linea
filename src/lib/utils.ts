import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * YouTube 비디오 ID로부터 썸네일 URL을 생성합니다.
 * @param videoId - YouTube 비디오 ID
 * @param quality - 썸네일 품질 (default, mqdefault, hqdefault, sddefault, maxresdefault)
 * @returns 썸네일 URL
 */
export function getYouTubeThumbnail(
  videoId: string,
  quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'hqdefault'
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * 썸네일 이미지가 실제로 존재하는지 확인합니다.
 * @param url - 썸네일 URL
 * @returns 이미지 존재 여부
 */
export async function validateThumbnail(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
