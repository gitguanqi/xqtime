#!/usr/bin/env node
/**
 * 零依赖静态服务器，用来在真实浏览器里打开 test/*.html。
 *
 * 用法：
 *   node scripts/serve.mjs
 *   PORT=5000 HOST=127.0.0.1 node scripts/serve.mjs
 *
 * 特性：/ 重定向到 /test/、正确的 MIME（含 .mjs）、no-store、拒绝路径穿越与 node_modules。
 */
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = process.env.HOST || 'localhost';
const PORT = Number(process.env.PORT || 4001);

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.md': 'text/markdown; charset=utf-8',
};

const PAGES = ['test/index.html', 'test/browser.html', 'test/esm.html', 'test/amd.html'];

function isInsideRoot(target) {
    const relative = path.relative(ROOT, target);
    return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function send(response, statusCode, body) {
    response.writeHead(statusCode, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
    });
    response.end(body);
}

const server = createServer(async (request, response) => {
    let pathname;
    try {
        pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host || HOST}`).pathname);
    } catch {
        send(response, 400, '400 Bad Request');
        return;
    }

    if (pathname === '/') {
        response.writeHead(302, { Location: '/test/', 'Cache-Control': 'no-store' });
        response.end();
        return;
    }

    if (pathname.endsWith('/')) pathname += 'index.html';

    const target = path.resolve(ROOT, '.' + pathname);

    if (!isInsideRoot(target)) {
        send(response, 403, '403 Forbidden');
        return;
    }

    if (target.split(path.sep).includes('node_modules')) {
        send(response, 403, '403 Forbidden');
        return;
    }

    const info = await stat(target).catch(() => null);
    if (!info || !info.isFile()) {
        send(response, 404, '404 Not Found');
        return;
    }

    response.writeHead(200, {
        'Content-Type': MIME[path.extname(target).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
        'Content-Length': info.size,
    });

    if (request.method === 'HEAD') {
        response.end();
        return;
    }

    createReadStream(target).pipe(response);
});

server.listen(PORT, HOST, () => {
    console.log(`xqtime 测试服务器：http://${HOST}:${PORT}/test/\n`);
    for (const page of PAGES) {
        console.log(`  http://${HOST}:${PORT}/${page}`);
    }
    console.log('\n按 Ctrl+C 停止。');
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`端口 ${PORT} 已被占用，请用 PORT=其他端口 node scripts/serve.mjs 启动。`);
    } else {
        console.error(error);
    }
    process.exitCode = 1;
});
