# Alpha 1.3 — merged 02A constellation tracking

- Moved constellation inventory and filings into existing 02A, preserving operator rankings, communication/navigation counts and all existing network disclosures.
- Five monthly inventory curves share a single logarithmic count axis. Target reference lines retain distinct authorization/notification/design/commercial scopes. Qianfan's 15,000 is a lower bound, not an exact terminal count.
- Filing rows explicitly map commercial name, operator, network and available notification identity. Candidate and unassigned mappings remain visibly uncertain.
- Timeline spans 2016–2038, adding collected official receipt/publication and BIU dates. Report receipt/publication is not represented as the date a deployment milestone was actually achieved. Undated Met/As Received statuses sit within the timeline area, not in the identity column.
- Added CTC-1/CTC-2 December 2025 receipt and March 2026 publication records. Technical-notice counts and brand/operator attribution remain unverified; no six-figure approval or Guowang/Qianfan linkage is asserted.
- Build and ten tests passed. Screenshot review is not claimed. Publication status is determined by the native deployment result, not this note.

Rebuild filing events with `node scripts/update-constellation-filings.mjs` after regenerating the base constellation metric snapshot. This updater is idempotent and reads dated official-report evidence from the local research datasets.
