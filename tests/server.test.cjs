'use strict';
const {test, before, after} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createAppServer} = require('../OpenNEXT-preview-server.cjs');
let server;
let base;
before(async () => {
  server = createAppServer({dataDir:fs.mkdtempSync(path.join(os.tmpdir(),'opennext-http-test-'))});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
});
test('website and terminal entry points are available', async () => {
  for (const route of ['/', '/index.html', '/terminal', '/OpenNEXT-terminal-preview.html']) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(await response.text(), /OpenNEXT-terminal\.js/);
  }
});
test('both console entry points load all local assets', async () => {
  for (const route of ['/admin/', '/OpenNEXT-admin-console.html']) {
    const response = await fetch(base + route);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /Operations Console/);
    for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const asset = await fetch(new URL(match[1], response.url));
      assert.equal(asset.status, 200, match[1]);
    }
  }
});
test('website asset references and homepage animation are complete', async () => {
  const response = await fetch(base);
  const html = await response.text();
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert.equal((await fetch(new URL(match[1], response.url))).status, 200, match[1]);
  }
  const animation = await fetch(base + '/OpenNEXT-gci-index-factory.html');
  assert.equal(animation.status, 200);
  assert((await animation.text()).length > 1000000);
});
test('news endpoint preserves source attribution', async () => {
  const response = await fetch(base + '/api/news');
  assert.equal(response.status, 200);
  const data = await response.json();
  assert(data.articles.length > 0);
  assert(data.articles.every(article => article.source && article.title && /^https:\/\//.test(article.url)));
});
test('private files and unsupported operations are not served', async () => {
  for (const route of ['/.git/config', '/.env', '/OpenNEXT-market-feed.cjs', '/package.json', '/missing']) {
    assert.equal((await fetch(base + route)).status, 404, route);
  }
  assert.equal((await fetch(base, {method: 'POST'})).status, 405);
  assert.equal((await fetch(base + '/%ZZ')).status, 400);
});
test('HEAD and canonical console routing work', async () => {
  const head = await fetch(base, {method: 'HEAD'});
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  const redirect = await fetch(base + '/admin', {redirect: 'manual'});
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.get('location'), '/admin/');
});
test('host-based split serves terminal only on the terminal host', async () => {
  const saved = [process.env.SITE_HOST, process.env.TERMINAL_HOST];
  delete require.cache[require.resolve('../OpenNEXT-preview-server.cjs')];
  process.env.SITE_HOST = 'site.test';
  process.env.TERMINAL_HOST = 'term.test';
  const split = require('../OpenNEXT-preview-server.cjs').createAppServer({dataDir:fs.mkdtempSync(path.join(os.tmpdir(),'opennext-split-test-'))});
  await new Promise(resolve => split.listen(0, '127.0.0.1', resolve));
  const http = require('node:http');
  const get = (route, host) => new Promise((resolve, reject) => {
    http.get({host: '127.0.0.1', port: split.address().port, path: route, headers: {host}}, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({status: res.statusCode, headers: {get: n => res.headers[n]}, text: async () => body}));
    }).on('error', reject);
  });
  try {
    assert.match(await (await get('/', 'term.test')).text(), /Capacity Terminal/);
    assert.equal((await get('/admin/', 'term.test')).status, 404);
    assert.equal((await get('/OpenNEXT-admin.js', 'term.test')).status, 404);
    assert.equal((await get('/admin/', 'site.test')).status, 200);
    const redirect = await get('/terminal', 'site.test');
    assert.equal(redirect.status, 308);
    assert.equal(redirect.headers.get('location'), 'https://term.test/');
  } finally {
    split.closeAllConnections();
    await new Promise(resolve => split.close(resolve));
    for (const [i, k] of ['SITE_HOST', 'TERMINAL_HOST'].entries()) saved[i] === undefined ? delete process.env[k] : process.env[k] = saved[i];
    delete require.cache[require.resolve('../OpenNEXT-preview-server.cjs')];
  }
});
