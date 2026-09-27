# Filing evidence review · Alpha 1.5.0

Review date: 2026-09-27. ITU SpaceExplorer public database: BR IFIC 3080, 2026-09-15.

## What changed

- Added an explanatory guide separating API/CR, frequency BIU, M0 reporting and RES35 deployment stages; M0 is not BIU.
- Added notice-scoped quantities, frequency ranges, orbit envelopes, report counts/dates and primary-source links for each tracked filing. Unknown technical fields remain explicitly unknown.
- Recovered original STEAM-1/2 API receipt/publication dates (2014-06-27 / 2014-09-30), STEAM-2B (2017-01-01 / 2017-07-25), and L5 parent dates (2012-11-27 / 2013-02-19). Parent-network dates do not replace later frequency-group clocks.
- CTC-1 and CTC-2 each list 96,714 in public technical summaries, received 2025-12-29. No confirmed operator mapping to Guowang/Qianfan. Their orbit envelopes extend to 39,700 km: do not label the entire filing LEO.
- SAILSPACE-1 notice 125500033 and new API 125545457 each list 1,296 but different frequencies. The new API receipt is 2025-12-30. Counts overlap and cannot be added. Its independent frequency deadline remains unknown; the dashboard's earliest network-wide 2030 date is not assigned to the new API.
- GW-A59 coordination notice 120520170 lists 6,080 at 508–600 km. GW-2 coordination notice 120520172 lists 1,728 at 1,145 km. These are selected-version summaries, not Guowang's full 12,992 design target. Both public dashboards show earliest network BIU limit 2027-09-11. Modified receipt dates do not restart every assignment's clock.
- Amazon USASAT-NGSO-8A/B/C public coordination summaries show 1,154–1,156 / 1,294–1,296 / 782–784. The existing RES35 status-table counts 1,154 / 1,294 / 782 remain separately labeled. Public envelopes are 590–630 / 610–630 / 590–630 km, with Tx 17,700–20,200 and Rx 27,500–30,000 MHz. Notification notices 126500007/8/9 are under examination, not recorded grants. Earliest publications are 2019-04-30 / 2019-05-28 / 2019-04-30.
- SpaceX Gen3 100,000 is an FCC application received 2026-07-07 (SAT-LOA-20260630-00264), not a late-2025 ITU grant. Official application notice: https://docs.fcc.gov/public/attachments/DOC-425160A1.pdf

## Evidence scope

Public SpaceExplorer dashboards expose counts/orbit/frequency envelopes and related notices; detailed tables require signed-in access. Regulatory status cards aggregate latest associated notices, whereas technical parameters belong to the selected notice. `Confirmed BIU: No` means no confirmation in this database, not no launch. Associated space-station records are not deployed counts. PART II-S recording dates are publication dates, not an all-frequency unconditional approval.

Full source URLs and manually reviewed fields are in `current/filing-enrichment.json`; published RES35 report extracts remain in `current/filing-deployment-progress.json`. `enrich-constellation-filings.mjs` merges these without modifying physical inventory or compliance report values. `build-constellation-model.mjs` carries the same verified application counts into the visualization-ready model. No cross-filing reserve total is asserted.

## Axis decisions

- Physical orbital object counts and known mass: default log10, with a linear toggle for absolute additions.
- Constellation growth: retain aligned linear/log pair; use genuine log10, omit zero rather than add 1.
- Annual launch attempts/successes, delivered mass and mass per launch: linear default plus log toggle.
- Percentages, mixed lifecycle flows and net change: linear. Negative data automatically disables log.
- Kardashev K: linear because K is already a logarithmic transformation of power.
- Dates, regulatory timelines, categorical distributions and raw-number KPI cards: unchanged.

No projected inventory series, launch deficit coefficient, resource-consumption forecast or implied regulatory grant was added.
