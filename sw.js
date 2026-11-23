// 糖糖提分通 Service Worker：离线可用 + 本地资源缓存
const CACHE = 'tt-cache-v2-precompiled';

// 预缓存清单：页面 + 图标 + 预编译脚本和样式
const PRECACHE = [
    '/',
    '/index.html',
    '/app.js',
    '/tailwind.css',
    '/manifest.json',
    '/apple-touch-icon.png',
    '/icon-192.png',
    '/icon-512.png',
];
// 预缓存绕过并刷新 HTTP 缓存，页面按导航的 Accept 取：Cloudflare 只给 Accept 含 text/html 的请求注入统计信标，
// 两种响应 ETag 相同，默认 Accept 的预缓存请求会把 HTTP 缓存里的首页换成无信标版本，之后刷新 304 也拿不到信标
const precacheRequest = (u) => new Request(u, {
    cache: 'reload',
    headers: (u === '/' || u.endsWith('.html')) ? { Accept: 'text/html' } : {},
});
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE).then((cache) => Promise.allSettled([
            ...PRECACHE.map((u) => cache.add(precacheRequest(u))),
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

    // Cloudflare Web Analytics 信标脚本不走 SW：SW 的 fetch 受 connect-src 约束，直通由页面 script-src 放行
    if (url.hostname === 'static.cloudflareinsights.com') return;

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
