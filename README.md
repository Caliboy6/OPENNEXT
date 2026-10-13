# OpenNEXT

Complete source for the current **OpenNEXT website / Capacity Terminal** and the separate **Operations Console** for the OpenNEXT team.

## Run locally

Requires Node.js 20 or later. There are no third-party runtime dependencies and no API keys are required.

```sh
git clone https://github.com/Caliboy6/OPENNEXT.git
cd OPENNEXT
npm start
```

- Website and buyer/seller terminal: http://127.0.0.1:4188/
- Team Operations Console: http://127.0.0.1:4188/admin/

If port 4188 is already in use, choose another port:

```sh
# macOS / Linux
PORT=4190 npm start

# Windows PowerShell
$env:PORT = '4190'
npm start
```

The server binds to localhost by default. Set `HOST` only when intentionally enabling network access. This preview is not a production deployment.

## Included sites

### Website and Capacity Terminal

The original landing page is retained, including market listings, procurement flow, supplier sections and the bundled GCI Index Factory animation. The GPU ticker rotates, pauses on hover and exposes a price chart.

The three homepage listing tabs use a horizontal, one-card-at-a-time carousel: five cards on desktop, responsive layouts on smaller screens, hover pause, manual navigation and reduced-motion support. The catalog contains 12 model API reference rates, 14 GPU rental demand records and 10 physical GPU / server reference offers observed on 13 October 2026. Price provenance stays in source metadata rather than appearing on the cards. These are dated observations, not a live inventory feed or firm OpenNEXT quotes.

The terminal includes searchable GPU model / region / GPU count filters, market terms, model-specific charts and comparison data, rotating best/recent matches, quote requests, RFQs, supply onboarding, instances, saved products, quote cart, supplier conversations, account settings and the agent drawer.

### Operations Console

The independent team interface includes overview, market datasets, advisory, orders, instances, schedules and execution history, platform-agent configuration, agent billing, user/supplier reviews and audit logs. Review, delivery, authorization and schedule actions persist within the browser.

## Source map

| Files | Responsibility |
| --- | --- |
| `index.html`, `OpenNEXT-preview-entry.html`, `OpenNEXT-terminal-preview.html` | Main website / terminal entry points |
| `OpenNEXT-original-homepage.js` / `.css` | Preserved landing-page content and visual system |
| `OpenNEXT-home-listings.js` / `.css` | Three market-card carousels, dated price metadata and motion controls |
| `OpenNEXT-gci-index-factory.html` | Homepage animation with bundled resources |
| `OpenNEXT-auth.js` / `.css` | Authentication UI and local preview account flows |
| `OpenNEXT-terminal.js` / `.css` | Buyer, seller and broker workflows |
| `OpenNEXT-market-data.js` | GPU catalog, indicative curves and comparisons |
| `OpenNEXT-market-feed.cjs` | Public catalog normalization, cache and source-linked news |
| `admin/index.html`, `OpenNEXT-admin-console.html` | Operations Console entry points |
| `OpenNEXT-admin.js` / `.css` | Team dashboard, reviews and operating workflows |
| `OpenNEXT-preview-server.cjs` | Local server and `/api/market`, `/api/news` |
| `scripts/`, `tests/` | Portable syntax and HTTP smoke checks |

## Data and preview boundaries

- Public reference prices use Vultr's public bare-metal catalog. Whole-instance hourly prices are divided by GPU count. A cached observation is retained if the feed is unavailable; public pricing does not guarantee regional inventory.
- Supplier listings, matching, chart histories, account balances and workflow records are demonstration data, not executed transactions or a published benchmark. Packet Demand is a buyer-demand reference, not a settled Spot-price feed.
- News currently uses a source-linked, dated editorial snapshot, not a live crawler.
- Google / GitHub buttons demonstrate account selection; actual OAuth is not connected. Email verification and password-reset steps are preview flows only. Do not use real passwords or private credentials.
- User activity is stored in browser `localStorage`. It is not shared between browsers or automatically synchronized between the terminal and admin console.
- The Console has no production authentication or server-side authorization. Supplier approval, funding confirmation, SSH verification and agent execution are demonstrations; they do not move money, connect to GPUs or execute remote commands.
- SMM settlement, real supplier agents, production identity/permissions and durable backend storage are not connected in this version.

Before production, implement server-side identity/RBAC, tenant isolation, secure secret storage, authenticated supplier integrations, payment verification, durable audit logs, data licensing and operational monitoring. Do not expose this Console as a protected live admin service.

## Verification

```sh
npm run check
npm test
```

Checks validate JavaScript syntax, both site entry points, local resource completeness, the news response, method handling and the static-file allowlist.

## Hosting

The Node server runs both sites and the market API. Static hosting can serve `index.html` and `admin/index.html`; without the Node API the terminal retains bundled reference data. This repository stores the source; it does not automatically deploy a production service or enable GitHub Pages.

## 中文说明

本仓库包含当前两个站点的完整运行代码：OpenNEXT 官网与交易 Terminal，以及独立的团队管理后台。安装 Node.js 20+ 后执行 `npm start` 即可同时启动，默认主站为 `http://127.0.0.1:4188/`，后台为 `http://127.0.0.1:4188/admin/`。

当前为可交互演示版本：OAuth、真实交付、SMM 资金结算和供应商 Agent 尚未接入；操作记录保存在本机浏览器。后台尚无生产级登录鉴权，不能直接用作真实业务管理后台。仓库不包含本地账户存储、登录凭据、视频、截图或与 OpenNEXT 无关的文件。
