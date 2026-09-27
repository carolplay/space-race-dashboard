# Constellation data contract v1 — Alpha 1.3.1

Dataset: `metrics/constellation-model.json`. Regenerate with `node scripts/build-constellation-model.mjs` after refreshing the inventory and filing datasets. JSON arrays may be loaded directly into ECharts/D3 or separately imported into Power BI/Tableau. No new visualization dependency is required.

## Table grain and joins

| Array | One row represents | Key / relation |
|---|---|---|
| entities | Commercial fleet | entityId |
| generations | Verified generation scope | generationId → fleetId |
| targets | A scoped authorization, notification or design quantity | targetId → entityId; scope is mandatory |
| candidates | Unverified candidate fleet, generation or filing | entityId; parent may be unknown |
| observations | A metric for an entity on a dated snapshot | entityId + date + metric |
| milestones | A dated event for a particular ITU filing | eventId → filingId and nullable entityId |
| regulatoryEvents | A domestic licensing event | entityId + authority + scope + date |

Dates use ISO 8601; quantities retain numeric value, unit, scope, source and evidence/method. Missing values are null, not zero. Empty orbit-shell/band arrays mean uncollected, not an absence of shells/bands. Observation methods distinguish reconstructed estimates from current snapshots. A report receipt/publication date is not a deployment-achievement date.

## KPI acceptance

- Physical orbital inventory: calculated for the five tracked fleets, including inactive satellites. Do not label it Active in Orbit or global network capacity. Global Active Catalog payloads remain a distinct, broader KPI.
- National authorization sample: Starlink Gen2 15,000 + Amazon Gen1 3,232. Clearly partial; authorization does not imply firm manufacturing orders. Other commercial plans and ITU notification counts are excluded from this sum.
- ITU reserve total: null until counts, overlapping scopes, operator mapping and filing versions are verified. FCC Gen3 applications cannot be silently added to an ITU total.
- Launch deficit: null without deployment schedule, replacement cohorts and comparable demonstrated delivered capacity. Model inputs and units must be explicit.

Do not sum parent fleets with generations or frequency-group filings. `targets.isAdditive=false` prevents unrestricted target aggregation. A chart can compare these scopes but must label the differences.

## Four visualization modules

1. Orbit-layer distribution: accepted as an asset-composition extension. Use altitude/plane/constellation observations separately from proposed shells. Planned satellite counts do not measure congestion, collision risk or exclusive orbital ownership. Shell geometry and counts are not yet collected.
2. Country / scale treemap: accepted after separating observed, nationally authorized, commercial target and filed scope. Candidate counts are excluded from verified totals. Mass, bandwidth and bands remain unfilled until sourced by generation and assignment.
3. Inventory stacked area: existing historical inventory is ready. Actual reentry is a flow, not a negative inventory category. Notification-limit reduction is a regulatory event, not physical satellite disappearance. Future 2027–2040 values require a named scenario, not a continuation of historical facts.
4. Resource gauges: accepted as an optional scenario layer. Required inputs include annual builds/replacements, generation mass, species-specific propellant load, material mass and demonstrated launch-delivered mass. No invented demand for xenon/krypton/argon or NdFeB is emitted. Full-reuse hundred-ton launches remain a scenario, not current demonstrated capacity.

## Regulatory corrections

- Amazon: current Gen1 count 3,232 and original 50% threshold 1,616, not 3,236 / 1,618. FCC DA 26-553 grants a limited conditional interim waiver; final July 30, 2029 requirement remains. The June 5 order is separate from the original July 30, 2026 milestone.
- Starlink: 42,000 is not treated as a fully authorized Gen1/2 fleet. Current verified Gen2 authorization is 15,000, with separate scope from legacy Gen1 and candidate Gen3.
- BIU: frequency-assignment activation, not commercial opening or every orbital plane activation. Applicable non-GSO rules cannot be summarized as universally continuous signal transmission for 90 days by all planes.
- RES35 M1/M2/M3: deployment milestones are +2/+5/+7 years from the end of the seven-year regulatory period, not from actual BIU. Report submission deadlines add 30 days in the applicable case; transitional provisions and notified bands/services must be checked. No universal CTC/SpaceX 2032/2034/2037/2039 calendar is asserted.
- A filing establishes a regulatory process, not an exclusive property title over an orbit shell. Reduction, cancellation or compliance must be sourced per assignment and authority.

Sources:
- https://docs.fcc.gov/public/attachments/DA-26-553A1.pdf (retrieved and text-checked 2026-09-26)
- https://docs.fcc.gov/public/attachments/DA-26-36A1.pdf
- https://www.itu.int/en/ITU-R/space/Documents/RES35(REV.%20WRC-23)-timeframe.pdf
- https://www.itu.int/en/ITU-R/space/Pages/res35main.aspx
- https://www.itu.int/en/ITU-R/space/Pages/FAQspace.aspx

Unverified submitted reference values (203,000 combined China, 96,714 per CTC network, 100,000 Gen3, 10,000 Honghu-3) are candidates/claims only, not approved totals. CTC-1/2 filing dates remain separately evidenced in the existing inventory dataset.
