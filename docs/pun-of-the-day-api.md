# Pun of the Day API

`GET /api/pun-of-the-day` returns one active, published pun for the current day in the `America/Indiana/Indianapolis` time zone.

```json
{
  "date": "2026-10-06",
  "cycle": 1,
  "pun": {
    "id": 42,
    "text": "What do you call a fake noodle? An impasta.",
    "submittedBy": null,
    "topics": ["Food"]
  }
}
```

The first request on a local calendar day makes the selection. All later requests that day receive the same pun. The API records each choice in `daily_pun_selections` and does not repeat an eligible active pun until every eligible active pun has appeared in the current cycle.

If a selected pun is unpublished later that same day, the API replaces that day's selection with another eligible pun. Pending, declined, unpublished, and untagged puns are never returned.

Apply `docs/migrations/003-add-daily-pun-selections.up.sql` to the Preview database before testing the endpoint, and to Production only after the feature is approved. The `.down.sql` file is available if the migration must be rolled back; it removes only the daily-selection history.
