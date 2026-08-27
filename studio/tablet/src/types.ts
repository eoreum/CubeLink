export type RouteId =
  | 'home'
  | 'missions'
  | 'coding'
  | 'connection'
  | 'simulation'
  | 'manual'
  | 'projects'
  | 'settings';

export interface RouteDefinition {
  id: RouteId;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
}
