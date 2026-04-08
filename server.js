const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MAPA_FILE = path.join(__dirname, 'mapa_obiektow.json');
const TELEFONY_FILE = path.join(__dirname, 'data_index_partial_optimized.json');
const KODY_FILE = path.join(__dirname, 'kody_jednostek.json');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    console.log(`Żądanie: ${req.method} ${req.url}`);

    // Endpoint API do zapisu pliku mapa_obiektow.json
    if (req.method === 'POST' && req.url === '/api/save-mapa') {
        let bodyChunks = [];
        req.on('data', chunk => {
            bodyChunks.push(chunk);
        });
        req.on('end', () => {
            try {
                let body = Buffer.concat(bodyChunks).toString('utf8');
                JSON.parse(body);
                fs.writeFile(MAPA_FILE, body, 'utf8', (err) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Błąd podczas zapisu pliku na serwerze.' }));
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    }
                });
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Przesłane dane nie są poprawnym formatem JSON.' }));
            }
        });
        return;
    }

    // Endpoint API do zapisu pliku data_index_partial_optimized.json
    if (req.method === 'POST' && req.url === '/api/save-telefony') {
        let bodyChunks = [];
        req.on('data', chunk => {
            bodyChunks.push(chunk);
        });
        req.on('end', () => {
            try {
                let body = Buffer.concat(bodyChunks).toString('utf8');
                JSON.parse(body);
                fs.writeFile(TELEFONY_FILE, body, 'utf8', (err) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Błąd podczas zapisu pliku na serwerze.' }));
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    }
                });
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Przesłane dane nie są poprawnym formatem JSON.' }));
            }
        });
        return;
    }

    // Endpoint API do zapisu pliku kody_jednostek.json
    if (req.method === 'POST' && req.url === '/api/save-kody') {
        let bodyChunks = [];
        req.on('data', chunk => {
            bodyChunks.push(chunk);
        });
        req.on('end', () => {
            try {
                let body = Buffer.concat(bodyChunks).toString('utf8');
                JSON.parse(body);
                fs.writeFile(KODY_FILE, body, 'utf8', (err) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Błąd podczas zapisu pliku na serwerze.' }));
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    }
                });
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Przesłane dane nie są poprawnym formatem JSON.' }));
            }
        });
        return;
    }

    // Standardowe serwowanie plików statycznych
    let filePath = req.url === '/' ? '/index.html' : req.url;
    // Usunięcie parametrów zapytania (np. ?t=123) do szukania pliku
    filePath = filePath.split('?')[0];
    filePath = path.join(__dirname, filePath);

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>Błąd 404 - Nie znaleziono pliku</h1><p>Upewnij się, że wpisujesz poprawny adres.</p>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Błąd serwera: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('\n========================================================');
    console.log(`✅ Serwer lokalny działa!`);
    console.log(`🗺️  Strona główna: http://localhost:${PORT}`);
    console.log(`✏️  Edytor Mapy: http://localhost:${PORT}/edytor.html`);
    console.log(`📞  Edytor Kontaktów: http://localhost:${PORT}/edytor_telefony.html`);
    console.log(`🔢  Edytor Kodów Jednostek: http://localhost:${PORT}/edytor_kody.html`);
    console.log(`🛑 Aby zatrzymać serwer, naciśnij w konsoli Ctrl + C`);
    console.log('========================================================\n');
});