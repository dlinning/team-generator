self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("dlteams").then((cache) => {
      return cache.addAll([
        "./",
        "./teams",
        "./index.html",
        "./style.css",
        "./script.js",
      ]);
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("Activated sw.js", event);
});

self.addEventListener("fetch", (event) => {
  console.log("fetching", event.request);

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
