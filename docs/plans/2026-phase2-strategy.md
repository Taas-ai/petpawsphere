# PawMatch Phase 2 — Revenue Moat Strategy

## 1. Hedera Breeding Contracts
- Smart contract escrow for breeding fees
- Litter profit sharing (stud owner % of puppy sales)
- Health guarantee enforcement via OCR verification
- 2.5% transaction fee
- Stack: @hashgraph/sdk (already in monorepo), Hedera testnet → mainnet

## 2. MoCCAE Regulatory Integration
- Digital pet registration linked to microchip IDs
- Vaccination record API sync
- Compliance layer = mandatory B2B network effects
- Proposal target: UAE Ministry of Climate Change & Environment

## 3. Insurance Data Licensing
- Anonymized breed/health/location dataset API
- Targets: Daman, AXA Gulf, Watania
- Pricing: AED 500K–2M/yr per insurer
- Requires: PDPL-compliant data anonymisation pipeline

## 4. GTM Phases
| Phase | Action | Revenue |
|-------|--------|---------|
| Q1 | Free premium for top 50 UAE licensed breeders | Data seeding |
| Q2 | MoCCAE digital compliance proposal | Gov contract |
| Q3 | Hedera breeding contracts (2.5% fee) | Transaction fees |
| Q4 | AXA Gulf insurance data pilot | B2B licensing |

## Next Dev Sprints
- [ ] `packages/blockchain/` — Hedera contract module
- [ ] `packages/server/src/routes/contracts.ts` — extend with Hedera escrow
- [ ] MoCCAE API integration stub
- [ ] Anonymisation pipeline for insurance export
