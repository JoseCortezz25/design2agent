# Business Logic

**Plugin purpose, user roles, screen flows, and domain rules.**

---

## What the Plugin Does

This Figma plugin template provides a reference flow for exporting components and frameworks from Figma to a configurable backend. It bridges Figma Desktop with the product backend through a typed UI-mediated request layer.

---

## User Flow

### 1. Authentication
- User opens the plugin in Figma Desktop
- Authenticates with their platform account credentials
- Session is cached (`session.store`) — subsequent launches skip login

### 2. Context Selection
- Selects the **client** they are working with
  - Step skipped if user has only one assigned client
- Selects the **brand** within that client

### 3. Export Hub
- Main hub screen after authentication
- User selects a **campaign** (destination) or creates a new one
- Triggers the identification scan

### 4. Identification
- Plugin scans the Figma canvas for exportable elements:
  - **Hub Frameworks**: frames with specific nomenclature
  - **Independent components**: standalone Figma components
- Results are displayed for user review

### 5. Export Review
- User reviews detected elements
- Can deselect items they don't want to include
- Confirms the export

### 6. Export
- Plugin uploads assets to the configured backend
- On success → returns to ExportHub (ready for next operation)
- On error → goes to ExportError → user can retry from ExportReview

---

## Screen Inventory

| Screen | Path | Role |
|--------|------|------|
| Login | `screens/login/` | Authenticate with platform credentials |
| SelectClient | `screens/select-client/` | Pick active client (skipped if one client) |
| SelectBrand | `screens/select-brand/` | Pick active brand within client |
| ExportHub | `screens/export-hub/` | Select campaign, trigger identification |
| Identifying | `screens/identifying/` | Loading state while sandbox scans canvas |
| ExportReview | `screens/export-review/` | Review and deselect detected elements |
| Exporting | `screens/exporting/` | Loading state while assets upload |
| ExportError | `screens/export-error/` | Error state with retry option |

---

## State Rules

### Session Persistence
- `session.store` persists for the full plugin session
- Contains: authenticated user, active client, active brand
- NOT cleared when navigating back — user stays authenticated

### Stepper Cascade Invalidation
- `stepper.store` manages export flow state
- Changing a selection invalidates all downstream state:

```
Change client  → clears: brand, campaign, identified elements
Change brand   → clears: campaign, identified elements
Change campaign → clears: identified elements
```

---

## Repositories

| Repository | External API endpoints |
|-----------|------------------------|
| `auth.repository.ts` | Login, refresh token, logout |
| `client.repository.ts` | List clients for current user |
| `brand.repository.ts` | List brands for selected client |
| `campaign.repository.ts` | List campaigns, create campaign |
| `export.repository.ts` | Upload assets, confirm export |

---

## Canvas Identification Rules

The sandbox scans the Figma canvas for two element types:

**Hub Frameworks**: Figma frames that match a specific naming pattern (nomenclature defined in `src/plugin/export/nomenclature.ts`)

**Independent Components**: Standalone Figma component instances not inside a Hub Framework frame

The user can deselect any detected element before confirming the export.

---

## Authentication & Sessions

- Auth credentials go through `auth.repository.ts` (UI side)
- Auth tokens are stored in `figma.clientStorage` (sandbox side) via `storage.service.ts`
- On plugin open, sandbox reads stored tokens and notifies UI of auth state
- UI manages the session display via `session.store`
