import type { NarrativeMoment, WarEvent } from './types';

function focusForWar(war: WarEvent): NarrativeMoment['focus'] {
  const route = war.routes?.[0];
  const routePoint = route?.points[Math.floor(route.points.length / 2)];
  const location = war.locations[0];
  const coordinate: [number, number] = routePoint
    ? [routePoint.longitude, routePoint.latitude]
    : location
      ? [location.longitude, location.latitude]
      : [108, 35];
  return { coordinate, scale: route ? 2.25 : 1.85 };
}

/** Resolves the curated sequence from the same audited events shown by the map. */
export function createNarrativeMoments(wars: WarEvent[], narrativeEventIds: readonly string[] = NARRATIVE_EVENT_IDS): NarrativeMoment[] {
  const events = new Map(wars.map((war) => [war.id, war]));
  return narrativeEventIds.map((eventId, configuredOrder) => {
    const war = events.get(eventId);
    if (!war) throw new Error(`Narrative event ${eventId} is missing from the scenario repository.`);
    return {
      id: eventId,
      eventId,
      order: configuredOrder,
      startYear: war.startYear,
      endYear: war.endYear,
      title: war.name,
      text: war.summary,
      confidence: war.confidence,
      sourceTitle: war.sources[0]?.title ?? '来源待补',
      focus: focusForWar(war),
      hasRoute: Boolean(war.routes?.length),
    };
  });
}

export function narrativeMomentById(moments: NarrativeMoment[], id?: string) {
  return id ? moments.find((moment) => moment.id === id) : undefined;
}

export function nextNarrativeMoment(moments: NarrativeMoment[], id?: string) {
  if (!moments.length) return undefined;
  const index = id ? moments.findIndex((moment) => moment.id === id) : -1;
  return index < 0 ? moments[0] : moments[index + 1];
}

export function previousNarrativeMoment(moments: NarrativeMoment[], id?: string) {
  if (!id) return undefined;
  const index = moments.findIndex((moment) => moment.id === id);
  return index > 0 ? moments[index - 1] : undefined;
}

export function narrativeMomentForYear(moments: NarrativeMoment[], year: number) {
  return moments.find((moment) => year >= moment.startYear && year <= moment.endYear)
    ?? moments.find((moment) => moment.startYear >= year);
}
import { NARRATIVE_EVENT_IDS } from '@/data/narratives';
