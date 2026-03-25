// shared/src/types/entity.types.ts
export enum EntityType {
  PLAYER = 'player',
  CLUB = 'club',
  NATIONAL = 'national',
  MANAGER = 'manager'
}

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  nameTr?: string;
  countryCode?: string;
  alias: string[];
  imagePath?: string;
}
