import {
  CalendarClock,
  Paintbrush,
  Radar,
  Building2,
  Wrench,
  Sparkles,
  Gauge,
  Settings2,
  type LucideIcon,
} from 'lucide-react'
import type { ModCategory } from '../types'

export const CATEGORY_ICON: Record<ModCategory, LucideIcon> = {
  Schedules: CalendarClock,
  Liveries: Paintbrush,
  Traffic: Radar,
  Airports: Building2,
  Tools: Wrench,
  Misc: Sparkles,
  Instruments: Gauge,
  Utility: Settings2,
}

export const CATEGORY_DESCRIPTION: Record<ModCategory, string> = {
  Schedules: 'Timetables and flight plans',
  Liveries: 'Liveries and textures',
  Traffic: 'Air and ground traffic',
  Airports: 'Airports and scenery',
  Tools: 'Companion tools',
  Misc: 'Extras and miscellaneous',
  Instruments: 'Panels and instruments',
  Utility: 'System utilities',
}
