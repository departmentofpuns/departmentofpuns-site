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

## Public collection

- [ ] Move public controls into a left column on wider screens: Submit a pun, Find a pun, topic filters, and ordering
- [ ] Add pagination if the newest-first collection still feels too long to browse
- [ ] Add a **Groan** button and a displayed groan count for each pun
- [ ] Prevent repeated groans from the same visitor from inflating a count
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
- [ ] Consider email notifications for new submissions if a suitable no-cost option becomes available
