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

## Historical series

- Source: [GCAT](https://planet4589.org/space/gcat/) SATCAT main catalog and LaunchLog.
- Stored dashboard series: `data/metrics/historical-series.json`.
- Coverage currently runs from 2011 through the source cutoff in 2026. The current year is explicitly marked as partial.
- Launch attempts are unique orbital/deep-space `Launch_Tag` values; failed attempts remain in the attempt count, while launch codes marked failed are excluded from the success count.
- Historical orbital inventory is reconstructed at each calendar year end from catalog start and descent dates. It includes active and inactive payload objects, so it is deliberately not presented as the same measure as the current Active Catalog KPI.
- Known payload mass is summed only where GCAT supplies a mass. Missing mass is never imputed as zero.
- Both upstream file hashes and the full classification methodology are stored beside the generated series.

Refresh the complete annual history ad hoc:

```bash
npm run data:update:history -- --from=2011 --to=2026
```

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

`data/editorial/frontier.json` stores manually reviewed cislunar and space-station facts that are better represented as status and events than as sparse time series. Visible editorial fields are stored in Chinese and English. Every asset, milestone, and station record includes an official or program source URL.

The cislunar module uses separate US and Chinese program timelines so completed events, active preparations, planned dates, and policy review are not visually conflated. Official LRO, Queqiao-2, Chang'e-4/Yutu-2, ISS, and Tiangong images are stored locally in `public/`, with credits and source URLs preserved in the JSON.
