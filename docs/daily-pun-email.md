# Daily Pun of the Day email

**Status:** Draft

**Audience:** A small, invite-only group of friends

## Purpose

Send the existing Department of Puns **Pun of the Day** to a small group of
friends by email. This should feel like a personal daily note, not a marketing
mailing list.

The email must use the same stable daily selection already shown on the site
and returned by the Pun of the Day API. It must not make a separate random
choice.

## First release

- There will be no public sign-up form.
- The Pun-dent will manually add or remove recipients who have explicitly
  agreed to receive the email.
- The first recipients will be limited to Cloudflare-verified destination
  addresses, such as friends' confirmed email addresses.
- The message will be sent from pundent@departmentofpuns.com.
- Each message will include:
  - a subject such as **Department of Puns — Pun of the Day**;
  - the day's pun and its topic or topics;
  - a link to the Pun of the Day page; and
  - a simple way to stop receiving messages.
- No advertising, open tracking, click tracking, or sharing of recipient
  addresses.

## How it should work

A small dedicated Cloudflare Worker will run on a schedule. It will:

1. Determine the current date in America/Indiana/Indianapolis.
2. Read the already-selected Pun of the Day from D1.
3. Find the active recipients.
4. Send one message to each recipient through Cloudflare Email Sending.
5. Record the result of every attempted delivery.

The scheduled Worker is separate from the Pages site. The Pages site remains
responsible for displaying the daily pun; the Worker is responsible only for
delivering it by email.

The delivery time is intentionally undecided. It should be chosen before
implementation and expressed in Indianapolis local time, so it continues to
arrive at the intended time when daylight saving time changes.

## Reliability and repeat protection

The system must be safe to run again after a temporary failure:

- A recipient must receive at most one daily message for a given date.
- If delivery to one recipient fails, the other recipients should still be
  processed.
- Failures must be recorded so the Pun-dent can investigate or retry them.
- A retry must not create duplicate messages for recipients already marked
  sent.

## Proposed data to add later

This specification does not create database tables yet. When implementation
begins, use versioned D1 migrations to add something close to the following.

### daily_email_recipients

Stores the private recipient list.

| Field | Purpose |
| --- | --- |
| recipient_id | Stable identifier |
| email | Recipient address, unique without regard to letter case |
| status | For example: pending, active, or unsubscribed |
| consented_on | When the recipient agreed to receive the email |
| unsubscribed_on | When the recipient opted out, if applicable |
| created_on | Administrative audit date |

An optional display name can be added later only if it has a real use in the
email. It is not needed for the first release.

### daily_email_deliveries

Records one delivery attempt per recipient per local calendar date.

| Field | Purpose |
| --- | --- |
| delivery_id | Stable identifier |
| recipient_id | Recipient who was considered |
| delivery_date | Indianapolis date of the selected pun |
| pun_id | Pun that was sent |
| status | For example: sent or failed |
| attempted_on | When the Worker attempted delivery |
| provider_message_id | Optional provider reference, if available |
| error_message | Limited technical detail for a failed attempt |

A unique constraint on recipient_id and delivery_date is the core protection
against duplicate messages.

## Privacy and opt-out

Email addresses are private operational data. They should never appear in the
public site, GitHub, application logs, or client-side code.

Before expanding beyond a small personal group, provide a signed, one-click
unsubscribe link. For the first few invited friends, a clearly stated
instruction to reply to the email or contact the Pun-dent is acceptable,
provided removal is handled promptly.

An unsubscribed recipient must remain in the database only as needed to honor
the opt-out and must never receive another daily message unless they explicitly
ask to rejoin.

## Testing and rollout

1. Build and test the Worker against the Preview D1 database.
2. Use a test recipient first, with a clearly marked test subject.
3. Verify the selected pun matches the website for the same Indianapolis date.
4. Verify that triggering the Worker twice does not send a second message.
5. Verify an inactive or unsubscribed recipient is skipped.
6. After the Pun-dent approves the test, apply the migration and Worker
   configuration to production.
7. Add real recipients only after they have opted in.

## Out of scope for the first release

- A public mailing-list sign-up page
- SMS or other messaging services
- Newsletters, promotions, or bulk marketing
- Analytics pixels or engagement tracking
- Changing how the Pun of the Day is selected
- Sending to arbitrary, unverified addresses before the service and its costs
  are intentionally expanded

## Decisions still needed

- What local delivery time should the daily message use?
- Should the first email include only the pun, or also the topic and a short
  note from the Pun-dent?
- When should a signed one-click unsubscribe link replace the manual
  opt-out instruction?
- Should the project remain limited to Cloudflare-verified recipients, or
  later enable Cloudflare's paid outbound email service for a larger list?
