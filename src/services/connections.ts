import type { Episode, Person, Place, SeerahEvent, Theme } from '@/models';

export type NodeType = 'event' | 'person' | 'place' | 'episode' | 'theme';

export interface ConnectionNode {
  type: NodeType;
  id: string;
}

export interface ConnectionGroup {
  type: NodeType;
  nodes: ConnectionNode[];
}

export interface ConnectionContent {
  episodes: readonly Episode[];
  events: readonly SeerahEvent[];
  people: readonly Person[];
  places: readonly Place[];
  themes: readonly Theme[];
}

const ORDER: readonly NodeType[] = ['person', 'place', 'event', 'episode', 'theme'];

function group(map: Map<NodeType, Set<string>>, self: ConnectionNode): ConnectionGroup[] {
  return ORDER.map((type) => ({
    type,
    nodes: [...(map.get(type) ?? [])].filter((id) => !(type === self.type && id === self.id)).map((id) => ({ type, id })),
  })).filter((g) => g.nodes.length > 0);
}

/**
 * "How is everything connected?" – the direct neighbours of an event, person, place, episode or theme:
 * Event → People → Place → Related events, and back again.
 */
export function connectionsOf(node: ConnectionNode, content: ConnectionContent): ConnectionGroup[] {
  const map = new Map<NodeType, Set<string>>();
  const add = (type: NodeType, ids: readonly string[]) => {
    const set = map.get(type) ?? new Set<string>();
    ids.forEach((id) => set.add(id));
    map.set(type, set);
  };

  switch (node.type) {
    case 'event': {
      const ev = content.events.find((e) => e.id === node.id);
      if (!ev) return [];
      add('person', ev.peopleIds);
      add('place', ev.placeIds);
      add('event', ev.relatedEventIds);
      add('episode', ev.episodeId ? [ev.episodeId] : []);
      add('theme', ev.themeIds);
      break;
    }
    case 'person': {
      const events = content.events.filter((e) => e.peopleIds.includes(node.id));
      add('event', events.map((e) => e.id));
      add('place', events.flatMap((e) => e.placeIds));
      add('episode', content.episodes.filter((ep) => ep.people.includes(node.id)).map((ep) => ep.id));
      // People who share at least two events are closely connected.
      const counts = new Map<string, number>();
      events.flatMap((e) => e.peopleIds).forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
      add('person', [...counts].filter(([, n]) => n >= 2).map(([id]) => id));
      break;
    }
    case 'place': {
      const events = content.events.filter((e) => e.placeIds.includes(node.id));
      add('event', events.map((e) => e.id));
      add('person', [...new Set(events.flatMap((e) => e.peopleIds))]);
      add('episode', content.episodes.filter((ep) => ep.places.includes(node.id)).map((ep) => ep.id));
      break;
    }
    case 'episode': {
      const ep = content.episodes.find((e) => e.id === node.id);
      if (!ep) return [];
      add('event', ep.events);
      add('person', ep.people);
      add('place', ep.places);
      add('theme', ep.themeIds);
      break;
    }
    case 'theme': {
      add('event', content.events.filter((e) => e.themeIds.includes(node.id)).map((e) => e.id));
      add('episode', content.episodes.filter((ep) => ep.themeIds.includes(node.id)).map((ep) => ep.id));
      break;
    }
  }
  return group(map, node);
}

/** Path view used in the episode's exploration step: main event → its people → its places → related events. */
export function connectionChain(eventId: string, content: ConnectionContent): ConnectionGroup[] {
  const ev = content.events.find((e) => e.id === eventId);
  if (!ev) return [];
  return [
    { type: 'event' as const, nodes: [{ type: 'event' as const, id: ev.id }] },
    { type: 'person' as const, nodes: ev.peopleIds.map((id) => ({ type: 'person' as const, id })) },
    { type: 'place' as const, nodes: ev.placeIds.map((id) => ({ type: 'place' as const, id })) },
    { type: 'event' as const, nodes: ev.relatedEventIds.map((id) => ({ type: 'event' as const, id })) },
  ].filter((g) => g.nodes.length > 0);
}
