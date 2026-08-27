import {
  TABLET_PROJECT_SCHEMA_VERSION,
  type ProjectStore,
  type TabletProjectRecord,
} from './project-store';

const DATABASE_NAME = 'cubelink-studio-tablet';
const DATABASE_VERSION = 1;
const PROJECT_STORE = 'projects';

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB 요청에 실패했습니다.'));
  });
}

export class IndexedDbProjectStore implements ProjectStore {
  private databasePromise?: Promise<IDBDatabase>;

  private database(): Promise<IDBDatabase> {
    if (!this.databasePromise) {
      this.databasePromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains(PROJECT_STORE)) {
            const store = database.createObjectStore(PROJECT_STORE, { keyPath: 'id' });
            store.createIndex('updatedAt', 'updatedAt');
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('프로젝트 저장소를 열 수 없습니다.'));
      });
    }
    return this.databasePromise;
  }

  async list(): Promise<TabletProjectRecord[]> {
    const database = await this.database();
    const transaction = database.transaction(PROJECT_STORE, 'readonly');
    const records = await requestResult(transaction.objectStore(PROJECT_STORE).getAll());
    return (records as TabletProjectRecord[]).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: string): Promise<TabletProjectRecord | undefined> {
    const database = await this.database();
    const transaction = database.transaction(PROJECT_STORE, 'readonly');
    return requestResult(transaction.objectStore(PROJECT_STORE).get(id));
  }

  async save(project: TabletProjectRecord): Promise<void> {
    if (project.schemaVersion !== TABLET_PROJECT_SCHEMA_VERSION) {
      throw new Error(`지원하지 않는 프로젝트 버전입니다: ${project.schemaVersion}`);
    }
    const database = await this.database();
    const transaction = database.transaction(PROJECT_STORE, 'readwrite');
    await requestResult(transaction.objectStore(PROJECT_STORE).put(project));
  }

  async remove(id: string): Promise<void> {
    const database = await this.database();
    const transaction = database.transaction(PROJECT_STORE, 'readwrite');
    await requestResult(transaction.objectStore(PROJECT_STORE).delete(id));
  }
}

export function createProject(name: string, workspaceXml = '', missionId?: string): TabletProjectRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    schemaVersion: TABLET_PROJECT_SCHEMA_VERSION,
    name,
    workspaceXml,
    missionId,
    createdAt: now,
    updatedAt: now,
    deviceProfile: 'ARM',
  };
}
