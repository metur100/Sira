import { router } from 'expo-router';

import type { NodeType } from '@/services/connections';

/** Opens the detail screen of any content node. */
export function openNode(type: NodeType | 'source', id: string): void {
  switch (type) {
    case 'episode':
      router.push({ pathname: '/episode/[id]', params: { id } });
      return;
    case 'event':
      router.push({ pathname: '/event/[id]', params: { id } });
      return;
    case 'person':
      router.push({ pathname: '/person/[id]', params: { id } });
      return;
    case 'place':
      router.push({ pathname: '/place/[id]', params: { id } });
      return;
    case 'theme':
      router.push({ pathname: '/theme/[id]', params: { id } });
      return;
    case 'source':
      router.push({ pathname: '/source/[id]', params: { id } });
      return;
  }
}

export function openConnections(type: NodeType, id: string): void {
  router.push({ pathname: '/connections/[type]/[id]', params: { type, id } });
}
