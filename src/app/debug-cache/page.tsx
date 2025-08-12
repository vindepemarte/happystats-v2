'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function DebugCachePage() {
    const [status, setStatus] = useState<string>('');
    const [cacheList, setCacheList] = useState<string[]>([]);

    const clearAllCaches = async () => {
        try {
            setStatus('Clearing all caches...');

            if ('caches' in window) {
                const cacheNames = await window.caches.keys();
                const cacheNamesArray = Array.from(cacheNames);
                setCacheList(cacheNamesArray);

                await Promise.all(
                    cacheNamesArray.map(cacheName => window.caches.delete(cacheName))
                );

                setStatus(`Cleared ${cacheNamesArray.length} caches successfully!`);
            } else {
                setStatus('Cache API not supported');
            }
        } catch (error) {
            setStatus(`Error clearing caches: ${error}`);
        }
    };

    const unregisterServiceWorkers = async () => {
        try {
            setStatus('Unregistering service workers...');

            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();

                await Promise.all(
                    registrations.map(registration => registration.unregister())
                );

                setStatus(`Unregistered ${registrations.length} service workers!`);
            } else {
                setStatus('Service Worker API not supported');
            }
        } catch (error) {
            setStatus(`Error unregistering service workers: ${error}`);
        }
    };

    const registerDebugServiceWorker = async () => {
        try {
            setStatus('Registering debug service worker...');

            if ('serviceWorker' in navigator) {
                await navigator.serviceWorker.register('/debug-sw.js');
                setStatus('Debug service worker registered! Refresh the page.');
            } else {
                setStatus('Service Worker API not supported');
            }
        } catch (error) {
            setStatus(`Error registering debug service worker: ${error}`);
        }
    };

    const forceReload = () => {
        window.location.reload();
    };

    const hardReload = () => {
        window.location.href = window.location.href + '?cache-bust=' + Date.now();
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">Cache Debug Utility</h1>

            <div className="space-y-4">
                <div className="bg-gray-100 p-4 rounded">
                    <h2 className="font-semibold mb-2">Current Status:</h2>
                    <p className="text-sm">{status || 'Ready'}</p>
                </div>

                {cacheList.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded">
                        <h3 className="font-semibold mb-2">Found Caches:</h3>
                        <ul className="text-sm space-y-1">
                            {cacheList.map(cache => (
                                <li key={cache} className="font-mono">{cache}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="space-y-2">
                    <Button onClick={clearAllCaches} className="w-full">
                        Clear All Caches
                    </Button>

                    <Button onClick={unregisterServiceWorkers} variant="secondary" className="w-full">
                        Unregister All Service Workers
                    </Button>

                    <Button onClick={registerDebugServiceWorker} variant="outline" className="w-full">
                        Register Debug Service Worker
                    </Button>

                    <Button onClick={forceReload} variant="outline" className="w-full">
                        Force Reload
                    </Button>

                    <Button onClick={hardReload} variant="outline" className="w-full">
                        Hard Reload with Cache Bust
                    </Button>
                </div>

                <div className="bg-yellow-50 p-4 rounded text-sm">
                    <h3 className="font-semibold mb-2">Instructions:</h3>
                    <ol className="list-decimal list-inside space-y-1">
                        <li>Click "Clear All Caches" to remove cached data</li>
                        <li>Click "Unregister All Service Workers" to remove PWA workers</li>
                        <li>Click "Register Debug Service Worker" for debugging</li>
                        <li>Click "Hard Reload with Cache Bust" to force fresh load</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}