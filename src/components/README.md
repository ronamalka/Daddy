# `src/components/` — React UI

Reusable pieces of the interface. Subfolders group related screens.

| File or folder | Role |
| --- | --- |
| `navbar.tsx` / `footer.tsx` | Site chrome |
| `session-provider.tsx` / `csrf-provider.tsx` | Auth session and CSRF `fetch` patch |
| `review-form.tsx` | Buyer 1–10 Midrag scores after a completed job |
| `slot-picker.tsx` / `visit-window-fields.tsx` | Choose a two-hour visit |
| `request-photos-field.tsx` | Upload up to four request photos via `/api/upload` |
| `service-picker.tsx` / `location-picker.tsx` | Services and cities |
| `notification-bell.tsx` | Header alerts (orders, chat, nearby requests) |
| `cookie-consent-banner.tsx` | Cookie choice (Israeli privacy practice) |
| `accessibility-toolbar.tsx` | Font size, contrast, and related a11y controls |
| `legal-consent-fields.tsx` / `marketplace-disclaimer.tsx` / `cancellation-policy-note.tsx` | Legal copy on forms and checkout |
| `profile-progress.tsx` | Daddy onboarding meter and checklist |
| `home/` | Homepage sections |
| `inbox/` | Messenger UI |
| `chat/` | Attachment bubble and paperclip composer |
| `orders/` | Order cards, seller calendar, and dispute dialog |
| `admin/` | Moderation queue |
| `ui/` | Small primitives (button, dialog, sheet) |
