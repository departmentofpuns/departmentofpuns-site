# Pun-dent review desk

The private review page is at `/review` (Cloudflare Pages serves `review.html` at that address). It is intentionally not linked from the public site.

## One-time setup

In Cloudflare Pages, open the Department of Puns project, then **Settings → Variables and secrets**. Add a **secret** named `REVIEW_PASSWORD` for Production (and Preview if you use preview deployments).

Use a long, unique password from a password manager. Do not put it in GitHub, a source file, or an email. The page also uses the existing Turnstile configuration, so a bot cannot repeatedly guess the password without completing its check.

## Reviewing a submission

1. Visit `/review` and sign in.
2. For an approval, choose one topic and optionally leave a private reviewer note.
3. **Approve and publish** changes the submission to `approved`, creates its publication row, and gives it the selected topic. It appears on the public site immediately.
4. **Decline** changes its status to `declined`; it is never published.

The browser receives an eight-hour, HttpOnly, Secure, same-site review session. It contains no password and expires automatically. Use **Sign out** to end it early.

## Finding earlier submissions

Use **Find text in all submissions** to look for a word or phrase across pending, approved, and declined submissions. The search is literal: `%` and `_` are treated as ordinary characters rather than SQL wildcard instructions. Select **Show pending** to return to the normal review queue.
