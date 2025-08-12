'use client';

import { useState } from 'react';

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
                    <button
                        onClick={clearAllCaches}
                        className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Clear All Caches
                    </button>

                    <button
                        onClick={unregisterServiceWorkers}
                        className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Unregister All Service Workers
                    </button>

                    <button
                        onClick={registerDebugServiceWorker}
                        className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Register Debug Service Worker
                    </button>

                    <button
                        onClick={forceReload}
                        className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                        Force Reload
                    </button>

                    <button
                        onClick={hardReload}
                        className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Hard Reload with Cache Bust
                    </button>
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