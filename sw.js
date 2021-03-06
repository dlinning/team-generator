self.addEventListener("install", (e) => {
	e.waitUntil(
		caches.open("dlteams").then((cache) => {
			return cache.addAll([
				"./",
				"./index.html",
				"./style.css",
				"./script.js",
				"./images/icons/icon-192x192.png"
			]);
		})
	);
});

self.addEventListener("activate", (event) => {
	console.log("Activated sw.js", event);
});

self.addEventListener("fetch", (event) => {
	event.respondWith(
		caches.match(event.request).then((response) => {
			return response || fetch(event.request);
		})
	);
});
