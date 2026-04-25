# PetPawSphere — Diagnostic OCR/MLM Feature Design

**Date:** 2026-03-09
**Author:** TAURUS AI Corp
**Status:** Approved

---

## Overview

Add AI-powered veterinary diagnostics to PetPawSphere: visual symptom analysis from pet photos and structured data extraction from vet documents (lab reports, prescriptions, vaccination certificates). Uses Gemini 2.5 Flash multimodal vision with the existing Genkit flow architecture.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Vision AI | Gemini 2.5 Flash (multimodal) | Already in stack, strong vision, no infra overhead |
| RAG | Deferred to v1.1 | Ship fast with Gemini-only, add Pinecone RAG once user needs are clear |
| Audio | Deferred to v2.0 | Requires specialized models + training data |
| Document Types | Lab reports, prescriptions, vaccination certs | Covers 90% of pet owner document needs |
| Storage | Same SQLite + Drizzle pattern | Consistent with existing architecture |
| Image Handling | Base64 upload via Express (Capacitor Camera API on mobile) | Simple, works on web + native |

---

## Architecture

```
Phone Camera / File Upload
  → Express API (multipart or base64 JSON)
  → Genkit Flow (petDiagnostic or vetDocumentOCR)
  → Gemini 2.5 Flash Vision
  → Structured JSON response
  → Save to SQLite (pet_diagnostics or pet_documents)
  → Return to client
```

---

## Database Schema

### pet_diagnostics

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| petId | UUID | FK → pets |
| requestedBy | UUID | FK → users |
| imageUrl | TEXT | uploaded symptom photo (base64 or URL) |
| symptoms | TEXT | user-described symptoms |
| assessment | TEXT | AI analysis summary |
| possibleConditions | TEXT | JSON array: [{condition, likelihood, severity}] |
| recommendedActions | TEXT | JSON array of strings |
| urgencyLevel | TEXT | routine, soon, urgent, emergency |
| disclaimer | TEXT | always present — consult licensed UAE vet |
| createdAt | TIMESTAMP | |

### pet_documents

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| petId | UUID | FK → pets |
| uploadedBy | UUID | FK → users |
| imageUrl | TEXT | document photo |
| documentType | TEXT | lab_report, prescription, vaccination |
| extractedData | TEXT | JSON — structured extracted content |
| rawText | TEXT | full OCR text |
| processedAt | TIMESTAMP | |
| createdAt | TIMESTAMP | |

---

## AI Flows

### petDiagnostic Flow

**Input:** `{ imageUrl: string, symptoms?: string, petId: string, species: 'dog'|'cat', breed: string, age: number }`

**Output:**
```typescript
{
  assessment: string;                    // Summary paragraph
  possibleConditions: Array<{
    condition: string;
    likelihood: 'high' | 'moderate' | 'low';
    severity: 'mild' | 'moderate' | 'severe';
    description: string;
  }>;
  recommendedActions: string[];          // Next steps
  urgencyLevel: 'routine' | 'soon' | 'urgent' | 'emergency';
  shouldSeeVet: boolean;
  disclaimer: string;                    // Always included
}
```

**Prompt strategy:** Provide pet context (breed, age, species) alongside the image. Instruct Gemini to be cautious, always recommend professional vet consultation, and consider UAE climate factors (heat-related conditions, desert parasites).

### vetDocumentOCR Flow

**Input:** `{ imageUrl: string, documentType: 'lab_report' | 'prescription' | 'vaccination' }`

**Output varies by document type:**

**Lab Report:**
```typescript
{
  documentType: 'lab_report';
  clinicName?: string;
  date?: string;
  results: Array<{
    test: string;
    value: string;
    unit: string;
    referenceRange: string;
    flag: 'normal' | 'high' | 'low' | 'critical';
  }>;
  veterinarian?: string;
  notes?: string;
  rawText: string;
}
```

**Prescription:**
```typescript
{
  documentType: 'prescription';
  clinicName?: string;
  date?: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  veterinarian?: string;
  rawText: string;
}
```

**Vaccination:**
```typescript
{
  documentType: 'vaccination';
  clinicName?: string;
  date?: string;
  vaccinations: Array<{
    vaccine: string;
    dateAdministered: string;
    nextDue?: string;
    batchNumber?: string;
  }>;
  microchipNumber?: string;
  veterinarian?: string;
  rawText: string;
}
```

---

## API Endpoints

```
POST /api/diagnostic/:petId          # Upload symptom photo → AI analysis
GET  /api/diagnostic/:petId          # Diagnostic history for a pet
POST /api/documents/:petId/scan      # Upload vet document → OCR extraction
GET  /api/documents/:petId           # List extracted documents for a pet
```

---

## Frontend Pages

| Route | Page | Auth |
|-------|------|------|
| /tools/diagnostic | Select pet → upload photo → describe symptoms → view assessment | Yes |
| /tools/document-scan | Select pet → upload document → select type → view extracted data | Yes |
| /pets/:id (enhanced) | New "Health Timeline" tab: diagnostics + documents chronologically | Yes |

### Key Components

- **DiagnosticResult** — urgency badge (green/yellow/orange/red), conditions with likelihood bars, action checklist, vet disclaimer
- **DocumentViewer** — side-by-side: original photo + extracted structured data, edit for corrections
- **HealthTimeline** — chronological list of diagnostics, documents, and vet consultations for a pet

---

## Testing Strategy

- **Flow tests (mocked Gemini):** petDiagnostic returns valid schema, urgency levels correct, disclaimer always present
- **Flow tests (mocked Gemini):** vetDocumentOCR returns correct structure per document type
- **API tests (Supertest):** CRUD endpoints, pet ownership validation, auth required
- **Component tests:** DiagnosticResult renders urgency badge, DocumentViewer displays extracted data

---

## Version Roadmap

### MVP (v1.0) — Current Scope
- Pet symptom photo analysis via Gemini vision
- Document OCR: lab reports, prescriptions, vaccination certificates
- Results persisted to pet health record
- Urgency-level triage (routine → emergency)
- UAE vet disclaimer on all assessments
- Web + Capacitor mobile camera integration

### v1.1 — RAG-Enhanced Diagnostics
- Pinecone vector DB with veterinary knowledge base
- Curated from open vet resources + HuggingFace veterinary datasets
- Breed-specific condition lookup (Saluki hip dysplasia, Bulldog BOAS, Persian PKD, etc.)
- UAE import/export pet certificates OCR
- Multi-image support (before/after comparison, multiple angles)
- Confidence scoring with knowledge source citations
- GridDB for time-series health data (weight tracking, condition progression)

### v2.0 — Audio + Advanced ML
- Audio anomaly detection (coughing, wheezing, abnormal breathing patterns)
- Video analysis for gait/mobility assessment
- Fine-tuned model on veterinary clinical data (HuggingFace)
- Real-time vet consultation booking from diagnostic results
- Integration with UAE vet clinic systems (appointment scheduling + records sync)
- Arabic OCR for Arabic-language vet documents
- Wearable device integration (pet activity/heart rate monitors)

---

## Pitch Deck Talking Points

- **Problem:** UAE pet owners wait days for vet appointments; minor issues go unchecked, serious ones get delayed
- **Solution:** AI-powered instant triage — snap a photo, get a preliminary assessment in seconds
- **Differentiator:** UAE-specific (climate, breed popularity, local vet directory), bilingual (AR/EN), integrated with breeding platform
- **Market:** UAE pet care market $500M+, 2M+ pet owners, growing 15% YoY
- **Monetization:** Premium tier for unlimited diagnostics, vet clinic partnerships for referral fees
- **Tech moat:** Proprietary veterinary knowledge base (v1.1), audio diagnostics (v2.0) — no competitor offers multimodal pet health AI in MENA region
