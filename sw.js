importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js');

if (workbox) {
	console.log('Workbox is loaded');

	workbox.core.skipWaiting();
	workbox.core.clientsClaim();

	// Precache assets
	workbox.precaching.precacheAndRoute([
		{ url: '/index.html', revision: '4' },
		{ url: '/manifest.json', revision: '4' },
		{ url: '/assets/css/styles.css', revision: '4' },
		{ url: '/assets/js/core/app.js', revision: '4' },
		{ url: '/assets/js/core/config.js', revision: '4' },
		{ url: '/assets/js/core/utils.js', revision: '4' },
		{ url: '/assets/js/services/camera.service.js', revision: '4' },
		{ url: '/assets/js/services/detection.service.js', revision: '4' },
		{ url: '/assets/js/services/facts.service.js', revision: '4' },
		{ url: '/assets/js/ui/ui.handler.js', revision: '4' },
		{ url: '/assets/icons/icon-192x192.png', revision: '4' },
		{ url: '/assets/icons/icon-512x512.png', revision: '4' },
		{ url: '/assets/icons/apple-touch-icon.png', revision: '4' },
		{ url: '/model/model.json', revision: '4' },
		{ url: '/model/metadata.json', revision: '4' },
		{ url: '/model/weights.bin', revision: '4' },
	]);

	// Cache third-party scripts (TensorFlow.js, Transformers.js, Lucide)
	workbox.routing.registerRoute(
		({url}) => url.origin === 'https://unpkg.com' || url.origin === 'https://cdn.jsdelivr.net',
		new workbox.strategies.CacheFirst({
			cacheName: 'third-party-scripts',
			plugins: [
				new workbox.expiration.ExpirationPlugin({
					maxEntries: 20,
					maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
				}),
			],
		})
	);
} else {
	console.log('Workbox failed to load');
}
