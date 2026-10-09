# Department of Puns enhancement checklist

This is a working list, not a promise or a schedule. Check an item when it is live on the production site.

## Already complete

- [x] Public pun-submission form with spam protection
- [x] Pending-review workflow
- [x] Private Pun-dent review desk with password and Turnstile protection
- [x] Edit pending submissions before approval or decline
- [x] Find text across pending, approved, and declined submissions
- [x] Approve, decline, and assign a topic
- [x] Show optional contributor credit on published puns
- [x] Edit the public text and contributor credit of an approved pun
- [x] Unpublish and re-publish without deleting the review record
- [x] Separate Preview database for safely testing future changes
- [x] Show newest published puns first
- [x] Add a public **Find a pun** search that searches published puns only
- [x] Move Submit a pun, Find a pun, and topic filters into a responsive left column
- [x] Publish a non-repeating `GET /api/pun-of-the-day` endpoint for daily messages
- [x] Create a shareable `/pun-of-the-day` page using the daily API selection

## Public collection

- [x] Feature Today’s Groan at the top of the home page using the daily selection
- [ ] Add pagination if the newest-first collection still feels too long to browse
- [ ] Make the visible result count reflect the selected topic as well as any Find text
- [x] Replace the separate Clear button with an × inside the Find text field
- [x] Add a **Groan** button and a displayed groan count for each pun
- [x] Prevent repeated groans from the same visitor from inflating a count
- [ ] Add an **Order by** choice: Newest first or Most groaned

## Pun-dent review desk

- [ ] Add a protected way to create a new topic while reviewing a pun
- [ ] Allow the topic of a published pun to be corrected
- [ ] Add a confirmation before unpublishing a pun
- [ ] Consider topic management: rename or retire an unused topic
- [ ] Consider a lightweight editorial history for later corrections

## Data and operations

- [ ] Keep versioned database migration scripts with an "up" and a "down" path where practical
- [ ] Test database changes against the Preview database before applying them to production
- [ ] Establish a repeatable private database-export backup routine, in addition to Cloudflare Time Travel
- [ ] Offer an invite-only daily Pun of the Day email for verified friends
  ([draft specification](daily-pun-email.md))
  - Use a small scheduled Cloudflare Worker to send the existing daily selection from `pundent@departmentofpuns.com`.
  - Keep the initial recipient list private and limited to Cloudflare-verified destination addresses.
  - Honor the chosen `America/Indiana/Indianapolis` delivery time across daylight saving changes.
  - Add an opt-out mechanism before expanding beyond a small personal group.
- [ ] Send a private notification when a new pun is awaiting review
  - Preferred option: Pushover — a focused, ad-free notification app with a small one-time license and no monthly subscription.
  - Free alternative: Telegram bot — send a message to the Pun-dent's private chat.
  - Technical alternative: ntfy — free HTTP-based notifications, using a private, hard-to-guess topic.
  - Store any notification token and recipient identifier as Cloudflare secrets, never in GitHub.
  - A failed notification must never prevent the submission itself from being saved.
