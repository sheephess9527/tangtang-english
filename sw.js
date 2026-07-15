// 糖糖提分通 Service Worker：离线可用 + CDN 资源本地缓存（兜住 unpkg/tailwind 不稳的风险）
const CACHE = 'tt-cache-v1';

// 预缓存清单：页面 + 图标 + 全部 CDN 依赖（版本号锁定，内容不会变）
const PRECACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/apple-touch-icon.png',
    '/icon-192.png',
    '/icon-512.png',
];
// unpkg 支持 CORS（页面 script 标签带 crossorigin+SRI，必须以 cors 模式缓存才能通过完整性校验）
const PRECACHE_CORS = [
    'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
    'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js',
    'https://unpkg.com/@babel/standalone@7.29.7/babel.min.js',
];
// tailwind CDN 的 script 标签无 crossorigin，属 no-cors 请求，用 opaque 响应缓存
const PRECACHE_NOCORS = [
    'https://cdn.tailwindcss.com/3.4.16',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE).then((cache) => Promise.allSettled([
            ...PRECACHE.map((u) => cache.add(u)),
            ...PRECACHE_CORS.map((u) => cache.add(new Request(u, { mode: 'cors', credentials: 'omit' }))),
            ...PRECACHE_NOCORS.map((u) => cache.add(new Request(u, { mode: 'no-cors' }))),
        ])).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);

    // 在线发音（有道）不走 SW：音频常带 Range 请求，缓存整包响应会让 Safari 播不出来
    if (url.hostname === 'dict.youdao.com') return;

    if (url.origin !== self.location.origin) {
        // CDN 资源：缓存优先（URL 带版本号，内容不变），未命中再走网络并回填
        event.respondWith(
            caches.match(req).then((hit) => hit || fetch(req).then((res) => {
                const copy = res.clone();
                caches.open(CACHE).then((c) => c.put(req, copy));
                return res;
            }))
        );
    } else {
        // 本站资源：网络优先（保证更新及时），失败回退缓存；导航请求最终兜底到首页
        event.respondWith(
            fetch(req).then((res) => {
                const copy = res.clone();
                caches.open(CACHE).then((c) => c.put(req, copy));
                return res;
            }).catch(() =>
                caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('/index.html') : Response.error()))
            )
        );
    }
});
