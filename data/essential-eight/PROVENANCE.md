# Control Catalogue Provenance

This directory contains OpenE8's **starter** Essential Eight control catalogue (`controls.json`).
This file records where it comes from and — importantly — what has and has not been verified.

## Source

- **Framework:** ASD *Essential Eight Maturity Model*, last substantively revised **November 2023**
  ([PDF](https://www.cyber.gov.au/sites/default/files/2023-11/PROTECT%20-%20Essential%20Eight%20Maturity%20Model%20%28November%202023%29.pdf)).
- **Authoritative ISM mapping (verification target):** *Essential Eight Maturity Model and ISM Mapping*,
  **December 2023**
  ([PDF](https://www.cyber.gov.au/sites/default/files/2023-12/PROTECT%20-%20Essential%20Eight%20Maturity%20Model%20and%20ISM%20Mapping%20%28December%202023%29.pdf)) —
  the ISM also publishes OSCAL baselines for the Essential Eight for machine ingestion.
- **Landing page:** <https://www.cyber.gov.au/business-government/asds-cyber-security-frameworks/essential-eight/essential-eight-maturity-model-and-ism-mapping>
- **Nature:** A community-authored, **paraphrased** interpretation of ASD guidance — not a verbatim
  reproduction and not an authoritative reproduction of the maturity model.

## Verification status

| Aspect | Status |
| --- | --- |
| Strategy coverage (8 strategies) | Complete |
| Maturity levels (ML1–ML3) | Present, but **collapsed** — several distinct ASD requirements per level are merged into one row (breadth expansion tracked separately). |
| Requirement wording | Paraphrased starter text; not assessor-grade. |
| `ismMapping` (ISM control IDs) | **PROVISIONAL / UNVERIFIED.** These IDs have **not** been reconciled against a specific dated ISM release. Do not rely on them for a real assessment. |
| Catalogue currency | Aligned to the Nov 2023 maturity model; **not** to any specific ISM quarterly release (the earlier "October 2024 ISM" label was incorrect and has been removed). |

## Why the ISM mappings are flagged provisional

The `ISM-xxxx` references in `controls.json` were introduced without being checked against an authoritative
ISM release, and previously the documentation table and the catalogue data disagreed with each other (the docs
even referenced a non-existent `E8-BU-*` requirement and mapped the same ISM number to two different
strategies). The documentation table is now **generated from this data**
(`scripts/generate-ism-mapping.mjs`) so the two can no longer drift, but that does not make the numbers
themselves correct.

### Verification status: NOT YET RECONCILED

Reconciling each `ismMapping` entry against the authoritative *Essential Eight Maturity Model and ISM Mapping
(December 2023)* is an open task. It has **not** been completed — the source is a large PDF (and OSCAL
baseline) that could not be parsed inline. Until it is done, treat every `ISM-xxxx` value here as an
**unverified candidate**, not a citation. The correct way to close this out is to ingest the December 2023
OSCAL baseline / mapping document and either correct each identifier or remove the ones that cannot be
substantiated. Do not present these numbers as authoritative in any report until then.

## Integrity

`controls.json` is SHA-256 hashed at seed time and recorded on the `ControlCatalogVersion` row as a
tamper-check. Changing the catalogue changes that hash by design.
