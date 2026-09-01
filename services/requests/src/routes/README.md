# `routes/` — requests HTTP handlers

`service-requests.ts` owns list, create, get, quote, accept, and the public teaser. Create stores optional photos, street, floor, and preferred window; GET list/detail blank street unless the viewer is the buyer, an admin, or the accepted seller.
