# Data snapshots

This directory stores reviewable, Git-tracked source snapshots and derived dashboard metrics.

## Launch activity

- Source: [Launch Library 2](https://thespacedevs.com/llapi), API v2.3.0.
- Stored source fields: `data/snapshots/launch-library-2.json`.
- Derived annual series: `data/metrics/launch-activity.json`.
- Metrics currently derived: orbital launch attempts, successful orbital missions, and rocket-family task mix.
- When LL2 configuration fields are unavailable in an older stored snapshot, the updater derives the initial configuration label from the standard launch-name prefix and records `rocketClassificationBasis: launch_name_prefix`. A later API refresh replaces that fallback with configuration IDs and families.
- Country grouping prefers the launch service provider's country when that provider is present in the pad agency data. The pad country is an explicit fallback and is retained in `classificationBasis` for later audit.
- Terminal status IDs 3, 4, and 7 count as attempts; only status ID 3 counts as success.

Run an ad hoc update for a date window:

```bash
npm run data:update:launches -- --from=2026-07-01 --to=2026-08-31
```

With no arguments, the updater refreshes the previous calendar month through today. It replaces records inside that date window, keeps older snapshots, and regenerates all annual aggregates. A one-month overlap is intentional so late status corrections are picked up.

To regenerate classifications and metrics without contacting the API:

```bash
npm run data:update:launches -- --rebuild-only
```

When one task exposes the launch service provider's country and another task for the same provider does not, the updater reuses that provider country and records `lsp_country_inferred_from_peer`. It falls back to the pad country only when no provider-country evidence exists anywhere in the stored snapshot.

The production API's free tier is rate-limited. Prefer one monthly run with a bounded date window rather than repeated exploratory requests.

## Orbital assets

- Source: [GCAT](https://planet4589.org/space/gcat/), release 1.8.5, CC-BY-4.0.
- Active payload mass, mission category, owner state, and operational orbit come from GCAT's derived Active Catalog.
- All catalog-object counts come from GCAT's derived Current Catalog, limited to free-flying Earth-orbit objects with current orbital data.
- Each run creates a dated aggregate under `data/snapshots/orbit-assets/`; the dashboard series in `data/metrics/orbit-assets.json` is rebuilt from all dated snapshots.
- The mass figure is the sum of known active-payload masses. The dashboard always shows object coverage and separately cites ESA's all-object environment mass for validation.

Run the monthly snapshot:

```bash
npm run data:update:orbit -- --date=2026-08-19
```

## Editorial frontier data

`data/editorial/frontier.json` stores manually reviewed cislunar and space-station facts that are better represented as status and events than as sparse time series. Every asset, event, and station record includes an official or program source URL. Official station images are stored locally in `public/` with credits preserved in the JSON.
