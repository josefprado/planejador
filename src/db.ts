import { openDB, DBSchema } from 'idb';

const DB_NAME = 'la-em-orlando-db';
const STORE_NAME = 'offline-documents';

interface OfflineDocument {
  id: string; // Google Drive file ID
  name: string;
  blob: Blob;
  downloadedAt: number;
}

interface AppDB extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: OfflineDocument;
  };
}

const dbPromise = openDB<AppDB>(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
  },
});

export const saveFile = async (id: string, name: string, blob: Blob) => {
  const db = await dbPromise;
  await db.put(STORE_NAME, {
    id,
    name,
    blob,
    downloadedAt: Date.now(),
  });
};

export const getFile = async (id: string): Promise<OfflineDocument | undefined> => {
  const db = await dbPromise;
  return db.get(STORE_NAME, id);
};

export const getSavedFileIds = async (): Promise<string[]> => {
    const db = await dbPromise;
    return db.getAllKeys(STORE_NAME);
};

export const deleteFile = async (id: string) => {
  const db = await dbPromise;
  await db.delete(STORE_NAME, id);
};
