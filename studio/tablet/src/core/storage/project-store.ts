export const TABLET_PROJECT_SCHEMA_VERSION = 1;

export interface TabletProjectRecord {
  id: string;
  schemaVersion: typeof TABLET_PROJECT_SCHEMA_VERSION;
  name: string;
  workspaceXml: string;
  missionId?: string;
  createdAt: string;
  updatedAt: string;
  deviceProfile?: string;
}

export interface ProjectStore {
  list(): Promise<TabletProjectRecord[]>;
  get(id: string): Promise<TabletProjectRecord | undefined>;
  save(project: TabletProjectRecord): Promise<void>;
  remove(id: string): Promise<void>;
}
