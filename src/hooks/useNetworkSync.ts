import { useEffect } from 'react';
import { getPendingAttendance, markAsSynced, removeSyncedRecords } from '../lib/offlineStorage';
import { db } from '../lib/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { toast } from 'sonner';

export const useNetworkSync = () => {
    const syncAttendance = async () => {
        try {
            const pending = await getPendingAttendance();
            if (pending.length === 0) return;

            console.log(`Syncing ${pending.length} offline attendance records...`);
            const batch = writeBatch(db);

            for (const record of pending) {
                const attendanceRef = doc(collection(db, 'attendance'));
                const { id, syncStatus, timestamp, ...data } = record;
                batch.set(attendanceRef, {
                    ...data,
                    markedAt: timestamp,
                    syncedAt: new Date().toISOString()
                });
            }

            await batch.commit();

            // Mark all as synced in local DB
            for (const record of pending) {
                await markAsSynced(record.id);
            }

            await removeSyncedRecords();

            toast.success(`Successfully synced ${pending.length} offline records!`);
            console.log('Sync complete');
        } catch (error) {
            console.error('Sync failed:', error);
            toast.error('Failed to sync offline records. Will retry later.');
        }
    };

    useEffect(() => {
        const handleOnline = () => {
            console.log('App is online - triggering sync');
            syncAttendance();
        };

        window.addEventListener('online', handleOnline);

        // Also sync on initial mount if online
        if (navigator.onLine) {
            syncAttendance();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, []);
};
