export const CATEGORIES = [
  'Music',
  'Cooking',
  'Languages',
  'Technology',
  'Design',
  'Fitness',
  'Crafts',
  'Business',
  'Academics',
  'Outdoors',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]

/** A small emoji hint per category, used on listing cards. */
export const CATEGORY_EMOJI: Record<string, string> = {
  Music: '🎵',
  Cooking: '🍳',
  Languages: '🗣️',
  Technology: '💻',
  Design: '🎨',
  Fitness: '🏋️',
  Crafts: '🧵',
  Business: '📈',
  Academics: '📚',
  Outdoors: '🏕️',
  Other: '✨',
}
