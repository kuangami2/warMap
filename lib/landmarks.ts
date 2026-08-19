import type { LandmarkImage } from './types';

export function landmarkForYear(images: LandmarkImage[], year: number, selectedEventId?: string) {
  const selected = selectedEventId ? images.find((image) => image.eventId === selectedEventId) : undefined;
  if (selected) return selected;
  return images
    .filter((image) => image.displayYear === year)
    .sort((left, right) => right.editorialPriority - left.editorialPriority || left.id.localeCompare(right.id))[0];
}
