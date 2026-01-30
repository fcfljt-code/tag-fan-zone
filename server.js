// Einfacher Server für TSG 1899 Hoffenheim Fan-Website
// Frontend: Port 8086
// Backend API: Port 3005

const http = require('http');
const fs = require('fs');
const path = require('path');

// MIME Types
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp'
};

// ============================================
// FRONTEND SERVER (Port 8086)
// ============================================
const frontendServer = http.createServer((req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Datei nicht gefunden: ' + req.url);
            } else {
                res.writeHead(500);
                res.end('Server-Fehler: ' + err.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

// ============================================
// BACKEND API SERVER (Port 3005)
// ============================================
const BLOG_FILE = path.join(__dirname, 'data', 'blog-posts.json');

// Blog-Posts laden
function loadBlogPosts() {
    try {
        if (fs.existsSync(BLOG_FILE)) {
            return JSON.parse(fs.readFileSync(BLOG_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('Fehler beim Laden der Blog-Posts:', e);
    }
    return [];
}

// Blog-Posts speichern
function saveBlogPosts(posts) {
    fs.writeFileSync(BLOG_FILE, JSON.stringify(posts, null, 2), 'utf8');
}

const backendServer = http.createServer((req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://localhost:3005`);

    // API Routes
    if (url.pathname === '/api/posts') {
        handlePosts(req, res);
    } else if (url.pathname.startsWith('/api/posts/')) {
        const id = parseInt(url.pathname.split('/').pop());
        handleSinglePost(req, res, id);
    } else if (url.pathname === '/api/galerie') {
        handleGalerie(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Route nicht gefunden' }));
    }
});

// Blog-Posts Handler
function handlePosts(req, res) {
    if (req.method === 'GET') {
        const posts = loadBlogPosts();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(posts));
    } else if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const posts = loadBlogPosts();

                const newPost = {
                    id: Date.now(),
                    title: data.title,
                    content: data.content,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                posts.unshift(newPost);
                saveBlogPosts(posts);

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(newPost));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Ungültige Daten' }));
            }
        });
    }
}

// Einzelner Post Handler
function handleSinglePost(req, res, id) {
    const posts = loadBlogPosts();

    if (req.method === 'GET') {
        const post = posts.find(p => p.id === id);
        if (post) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(post));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Post nicht gefunden' }));
        }
    } else if (req.method === 'PUT') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const index = posts.findIndex(p => p.id === id);

                if (index !== -1) {
                    posts[index].title = data.title;
                    posts[index].content = data.content;
                    posts[index].updatedAt = new Date().toISOString();
                    saveBlogPosts(posts);

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(posts[index]));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Post nicht gefunden' }));
                }
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Ungültige Daten' }));
            }
        });
    } else if (req.method === 'DELETE') {
        const index = posts.findIndex(p => p.id === id);
        if (index !== -1) {
            posts.splice(index, 1);
            saveBlogPosts(posts);
            res.writeHead(204);
            res.end();
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Post nicht gefunden' }));
        }
    }
}

// Galerie Handler - Bilder aus dem Ordner auflisten
function handleGalerie(req, res) {
    const galerieDir = path.join(__dirname, 'images', 'erinnerungen');

    try {
        if (!fs.existsSync(galerieDir)) {
            fs.mkdirSync(galerieDir, { recursive: true });
        }

        const files = fs.readdirSync(galerieDir)
            .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
            .map(file => ({
                filename: file,
                url: `/images/erinnerungen/${file}`
            }));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(files));
    } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Fehler beim Lesen der Galerie' }));
    }
}

// Server starten
const FRONTEND_PORT = 8086;
const BACKEND_PORT = 3005;

frontendServer.listen(FRONTEND_PORT, () => {
    console.log(`\n🔵 TSG 1899 Hoffenheim Fan-Website`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`\n📱 Frontend: http://localhost:${FRONTEND_PORT}`);
    console.log(`🔧 Backend API: http://localhost:${BACKEND_PORT}`);
    console.log(`\n⚽ Viel Spaß mit deiner Fan-Website!\n`);
});

backendServer.listen(BACKEND_PORT, () => {
    console.log(`Backend API gestartet auf Port ${BACKEND_PORT}`);
});
