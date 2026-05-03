import type { LucideIcon } from 'lucide-react'
import {
  Clapperboard,
  ImageIcon,
  Newspaper,
  Play,
  Swords,
  StickyNote,
  Tv,
} from 'lucide-react'

export type QuickService = {
  id: string
  title: string
  description: string
  path: string
  icon: LucideIcon
  /** Vite env key for external URL, e.g. VITE_PLEX_URL */
  envKey?: keyof ImportMetaEnv
  emoji?: string
}

export const QUICK_SERVICES: QuickService[] = [
  {
    id: 'match',
    title: 'Match Tracker',
    description: 'Log Dota matches, track win rates',
    path: '/match',
    icon: Swords,
    emoji: '⚔',
  },
  {
    id: 'plex',
    title: 'Plex',
    description: 'Stream your media library',
    path: '/plex',
    icon: Play,
    envKey: 'VITE_PLEX_URL',
    emoji: '▶',
  },
  {
    id: 'seer',
    title: 'Overseerr',
    description: 'Request movies & shows',
    path: '/seer',
    icon: Clapperboard,
    envKey: 'VITE_OVERSEERR_URL',
    emoji: '🎬',
  },
  {
    id: 'immich',
    title: 'Immich',
    description: 'Your photo library',
    path: '/immich',
    icon: ImageIcon,
    envKey: 'VITE_IMMICH_URL',
    emoji: '🖼',
  },
  {
    id: 'stash',
    title: 'StashApp',
    description: 'Media management',
    path: '/stash',
    icon: Tv,
    envKey: 'VITE_STASH_URL',
    emoji: '📁',
  },
  {
    id: 'news',
    title: 'Server News',
    description: 'Updates & announcements',
    path: '/news',
    icon: Newspaper,
    emoji: '📢',
  },
  {
    id: 'notes',
    title: 'Notes',
    description: 'Personal sticky notes',
    path: '/notes',
    icon: StickyNote,
    emoji: '📝',
  },
]

export function getServiceUrl(service: QuickService): string | undefined {
  if (!service.envKey) return undefined
  const v = import.meta.env[service.envKey]
  return typeof v === 'string' && v.length > 0 ? v : undefined
}
