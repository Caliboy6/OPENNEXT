'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {getMarket, getNews} = require('./OpenNEXT-market-feed.cjs');
const {createPricingService} = require('./OpenNEXT-pricing-service.cjs');
const {createPricingRouter} = require('./OpenNEXT-pricing-api.cjs');

// Only browser assets are served. Source-only configuration and local files
// outside this allowlist are never exposed by the preview HTTP server.
const files = new Set([
  'index.html', 'admin/index.html',
  'OpenNEXT-preview-entry.html', 'OpenNEXT-terminal-preview.html',
  'OpenNEXT-original-homepage.js', 'OpenNEXT-original-homepage.css',
  'OpenNEXT-home-listings.js', 'OpenNEXT-home-listings.css',
  'OpenNEXT-model-quotes.js', 'OpenNEXT-history-chart.js', 'OpenNEXT-history-chart.css',
  'OpenNEXT-gci-index-factory.html', 'OpenNEXT-market-data.js',
  'OpenNEXT-terminal.js', 'OpenNEXT-terminal.css',
  'OpenNEXT-auth.js', 'OpenNEXT-auth.css',
  'OpenNEXT-admin-console.html', 'OpenNEXT-admin.js', 'OpenNEXT-admin.css',
  'OpenNEXT-provider-console.js', 'OpenNEXT-provider-console.css', 'OpenNEXT-provider-logos.js',
]);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

// Optional host-based split. When both are set, the Capacity Terminal is served
// only on TERMINAL_HOST and everything else (site, /admin/) on SITE_HOST.
const SITE_HOST = (process.env.SITE_HOST || '').toLowerCase();
const TERMINAL_HOST = (process.env.TERMINAL_HOST || '').toLowerCase();
const adminFile = name => name.startsWith('admin/') || name.startsWith('OpenNEXT-admin');

function createAppServer(options = {}) {
  const pricing = options.pricingService || createPricingService({dataDir:options.dataDir});
  const pricingRoute = createPricingRouter(pricing, {env:options.env || process.env});
  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (!['GET', 'HEAD'].includes(req.method) && !String(req.url).startsWith('/api/admin/pricing/')) {
      res.writeHead(405, {Allow: 'GET, HEAD'});
      res.end('Method not allowed');
      return;
    }
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      res.writeHead(400);
      res.end('Invalid URL');
      return;
    }
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].split(':')[0].trim().toLowerCase();
    const onTerminal = Boolean(TERMINAL_HOST) && host === TERMINAL_HOST;
    if (await pricingRoute(req, res, new URL(req.url, 'http://localhost'), {onTerminal})) return;
    if (TERMINAL_HOST && SITE_HOST) {
      if (!onTerminal && pathname === '/terminal') {
        res.writeHead(308, {Location: 'https://' + TERMINAL_HOST + '/'});
        res.end();
        return;
      }
      if (onTerminal && (pathname === '/terminal' || pathname === '/terminal/')) {
        res.writeHead(308, {Location: '/'});
        res.end();
        return;
      }
    }
    if (pathname === '/admin' || pathname === '/terminal/') {
      res.writeHead(308, {Location: pathname === '/admin' ? '/admin/' : '/terminal'});
      res.end();
      return;
    }
    if (pathname === '/api/market' || pathname === '/api/news') {
      try {
        const data = await (pathname === '/api/market' ? getMarket() : getNews());
        res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
        res.end(req.method === 'HEAD' ? undefined : JSON.stringify(data));
      } catch {
        res.writeHead(503, {'Content-Type': 'application/json; charset=utf-8'});
        res.end(req.method === 'HEAD' ? undefined : JSON.stringify({error: 'Feed unavailable'}));
      }
      return;
    }
    const aliases = {
      '/': onTerminal ? 'OpenNEXT-preview-entry.html' : 'index.html',
      '/terminal': 'OpenNEXT-preview-entry.html',
      '/admin/': 'admin/index.html',
    };
    const name = aliases[pathname] || pathname.slice(1);
    if (!files.has(name) || (onTerminal && adminFile(name))) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const file = path.join(__dirname, name);
    if (!fs.existsSync(file)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, {'Content-Type': types[path.extname(name)] || 'application/octet-stream'});
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
  });
  server.pricing = pricing;
  server.on('close', () => {pricing.close().catch(() => {});});
  return server;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 4188);
  const host = process.env.HOST || '127.0.0.1';
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('PORT must be an integer between 0 and 65535');
  }
  const server = createAppServer();
  server.on('error', error => {console.error(error.message); process.exitCode = 1;});
  server.listen(port, host, () => {
    const actualPort = server.address().port;
    console.log('OpenNEXT website: http://' + host + ':' + actualPort + '/');
    console.log('Operations Console: http://' + host + ':' + actualPort + '/admin/');
    server.pricing.startScheduler();
  });
}

module.exports = {createAppServer};
