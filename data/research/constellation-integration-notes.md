# Constellation inventory integration — Alpha 1.2

Implemented 2026-09-26 in the orbital-assets section.

- Five side-by-side inventory cards, with shared 2018–2026 calendar coverage and independent vertical scales.
- Monthly estimated inventory reconstructed from GCAT launch/reentry dates. Latest constellation snapshot is a separate source; the final connecting segment is dashed.
- Deployment plans retain their differing scope; no misleading fleet completion percentage is calculated.
- Eleven filing groups show official dates on a proportionally spaced 2026–2038 timeline. Undated official status remains separate from dated milestones.
- Unknown dates, candidate associations and unavailable official records are explicitly visible. Inventory is not allocated to filings.
- Chinese and English copy is included; narrow screens stack cards and scroll only the ITU timeline locally.

Verification: production build and ten render/data tests passed. Repository-wide TypeScript checking still encounters existing missing Cloudflare worker ambient types in db/index.ts and worker/index.ts; the new component has no reported type errors.

Follow-up 2026-09-26: Mac is unlocked and local preview is running at http://localhost:3000/#constellation-assets. Browser automation rejected the preview action under its URL policy; no alternate browser automation was attempted. Screenshot review remains unverified. Added a two-column tablet breakpoint, sticky-header anchor clearance, and 14px essential ITU dates/status. The normal test command now includes constellation data tests.

Publishing is still blocked because the Sites workflow installation disappeared between initial discovery and invocation. Source credential was held in memory only; no source push, new saved version or production deployment is claimed.
