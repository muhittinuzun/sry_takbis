const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const N8N_HOST = 'n8n.ittyazilim.com';

const server = http.createServer((req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Custom-Header');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Handle Proxy Requests for n8n
    if (req.url.startsWith('/n8n-proxy/')) {
        const targetPath = req.url.replace('/n8n-proxy', '');

        console.log(`[PROXY] ${req.method} https://${N8N_HOST}${targetPath}`);

        const proxyReq = https.request({
            hostname: N8N_HOST,
            port: 443,
            path: targetPath,
            method: req.method,
            headers: {
                ...req.headers,
                host: N8N_HOST,
                origin: `https://${N8N_HOST}`
            }
        }, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (e) => {
            console.error(`[PROXY ERROR] ${e.message}`);
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Proxy Error', details: e.message }));
        });

        req.pipe(proxyReq);
        return;
    }

    // Handle Static Files
    let filePath = '.' + req.url.split('?')[0];
    if (filePath === './') filePath = './index.html';

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.jpeg': 'image/jpg',
        '.svg': 'image/svg+xml'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404);
                res.end('File Not Found');
            } else {
                res.writeHead(500);
                res.end(`Internal Server Error: ${error.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`----------------------------------------`);
    console.log(`Local Server: http://localhost:${PORT}/`);
    console.log(`n8n Proxy: http://localhost:${PORT}/n8n-proxy/`);
    console.log(`----------------------------------------`);
});
