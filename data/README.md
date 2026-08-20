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

The cislunar module uses a proportional 2007–2030 calendar axis, with US events above and Chinese events below. Apollo-era rows are intentionally omitted from this modern program comparison. The orbit atlas adds official references for LRO's polar orbit, Queqiao-2's ELFO, DRO-A/B's distant retrograde orbit, and CAPSTONE's NRHO. Official LRO, Queqiao-2, Chang'e-4/Yutu-2, ISS, and Tiangong images are stored locally in `public/`, with credits and source URLs preserved in the JSON.

## Launch development programs

`data/editorial/launch-development.json` tracks launch vehicles that are still proving engineering capabilities. It is intentionally separate from orbital payload-launch totals.

- Programs are compared against six independent capabilities: ground systems, vertical takeoff and landing, integrated flight, orbit insertion, first-stage recovery, and routine payload service.
- A capability can be achieved out of sequence; for example, a booster recovery demonstration does not imply that routine payload delivery has begun.
- Each milestone keeps an official program or regulator source. A development flight that also reaches orbit may appear once in orbital launch activity and once as an engineering milestone, but the two views are never added together.
- The initial reviewed set covers Starship / Super Heavy, Zhuque-3, and the Long March 10 family.
- Zhuque-3 stage recovery is marked achieved from the official Y2 orbital launch and landing-leg touchdown on 2026-08-19. Routine service remains unachieved until recovered-stage inspection, reflight, and sustained payload operations are demonstrated.

Rocket-family lift classes are a presentation overlay, not a new launch metric. They use published maximum payload envelopes: small under 2 t, medium 2–20 t, heavy 20–50 t, and super-heavy at least 50 t. LEO capacity is preferred; high-energy configurations use the published reference orbit. Suborbital test vehicles are labeled separately.
