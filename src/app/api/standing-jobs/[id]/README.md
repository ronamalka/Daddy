# `[id]/`

`GET /api/standing-jobs/:id` — one standing job and its visit orders. Fills the next visits if the schedule is still active.

`PATCH /api/standing-jobs/:id` — `pause`, `resume`, or `cancel`. Future pending visits are cancelled; past and in-progress orders stay.
