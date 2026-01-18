export interface OfflineAttendance {
    studentId: string;
    studentName: string;
    classId: string;
    className: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    timestamp: string;
    teacherId: string;
    teacherName: string;
    sessionId: string;
    syncStatus: 'pending' | 'synced';
}

const DB_NAME = 'AttendanceOfflineDB';
const STORE_NAME = 'pendingAttendance';
const DB_VERSION = 1;

export const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
};

export const saveOfflineAttendance = async (record: Omit<OfflineAttendance, 'syncStatus'>): Promise<number> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add({ ...record, syncStatus: 'pending' });

        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
    });
};

export const getPendingAttendance = async (): Promise<(OfflineAttendance & { id: number })[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const all = request.result as (OfflineAttendance & { id: number })[];
            resolve(all.filter(r => r.syncStatus === 'pending'));
        };
        request.onerror = () => reject(request.error);
    });
};

export const markAsSynced = async (id: number): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            const record = request.result;
            if (record) {
                record.syncStatus = 'synced';
                store.put(record);
            }
            resolve();
        };
        request.onerror = () => reject(request.error);
    });
};

export const removeSyncedRecords = async (): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor();

    request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
            if (cursor.value.syncStatus === 'synced') {
                cursor.delete();
            }
            cursor.continue();
        }
    };
};
