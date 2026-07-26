# [WORKFLOW.md](http://WORKFLOW.md)

## Setup

Feature: contact form with validation, added to the existing portfolio (index.html / style.css). 

Two branches, each built in a fresh Cursor session to avoid context bleed.

## Round 1 — vague prompt

Prompt: "Add a contact form to my site."

What it produced: Replaced the entire existing contact section (deleting the original email/social 

links markup and rewriting the surrounding copy) with a new form posting to [formsubmit.co](http://formsubmit.co), using a 

hidden captcha-disable field and a honeypot spam trap. Validation relied entirely on native HTML5 

`required` attributes — no custom JavaScript at all.

Bugs/gaps found:

- Whitespace-only input (e.g. three spaces in the name field) passes native `required` validation 

  and would submit — no `.trim()` check anywhere.

- No minimum length enforced on the message field.

- No accessible error announcements (no aria-live, no custom error text) — only default browser 

  validation bubbles, which aren't reliably announced by screen readers.

- Rewrote existing page copy it wasn't asked to touch (e.g. "Email me at:" became "Or email me 

  directly at"), introducing unwanted scope creep from a one-line prompt.

## Round 2 — precise prompt + verification loop

Prompt: In `index.html`, inside the existing `<section id="contact">` (which currently just has an email link and social links), add a contact form below the existing content. Style it using existing classes in `styles.css` where possible — vanilla JS only, no frameworks.

Requirements:

- Fields: name (required), email (required, valid format), message (required, min 10 chars)
- Each input has an associated `<label for>` — no placeholder-only labels
- On invalid submit: don't submit, show inline error text under the offending field, and move focus to the first invalid field
- Errors are announced to screen readers (aria-live region or aria-describedby linking input to error text)
- Empty/whitespace-only strings count as invalid, not just empty strings
- No inline `onclick` handlers — use `addEventListener` in a separate JS file, don't remove the existing email/social links

First, write a short plan of the DOM structure and validation logic before writing code. Then implement it. Then write a set of manual/automated test cases covering: empty submit, invalid email formats, whitespace-only name, valid submit — and actually run them (use Node + jsdom or a simple test HTML harness) and show me the pass/fail output before you're done.

What it produced: Appended the new form after the existing contact content (left untouched), using 

`novalidate` + custom JS validation in a separate contact-form.js file. Each field has an aria- 

describedby-linked error span with role="alert" and aria-live="polite"; invalid fields get 

aria-invalid="true" (styled via CSS). A separate success message (role="status") replaces the need 

for a page redirect.

Tests written and run: 40 unit + jsdom DOM integration tests covering empty submit, invalid email 

formats, whitespace-only name/message, short messages, and valid submit — all 40 passed on first run.

Mistake AI made that I caught: The clearest AI mistake caught was in Round 1: it assumed native HTML5 `required` validation was sufficient and never added a `.trim()` check, so three spaces in the name field would pass validation and submit. Round 2 was explicitly instructed to treat whitespace-only strings as invalid, and has three passing tests confirming this (see `tests/contact-form.test.js`, "Whitespace-only name").

## Diff comparison

- Correctness: Round 1 fully depends on native browser validation and has a real whitespace-bypass 

  bug; Round 2 has explicit, tested validation logic covering that exact case.

- Accessibility: Round 1 has proper <label for> elements but no ARIA wiring for errors; Round 2 adds 

  aria-describedby, role="alert", aria-live, and aria-invalid throughout.

- Edge cases: Round 1 misses whitespace-only and message-length edge cases entirely; Round 2 has 

  dedicated passing tests for both.

- Review effort: Round 1 took 27 minutes to review and I found 3 issues I'd need to fix before shipping it (whitespace-bypass validation gap, missing ARIA wiring, unwanted rewrite of existing page copy). Round 2 took 20 minutes to review but needed no fixes — the extra time spent writing the precise prompt (~7 min) was recovered by not having to debug or patch anything afterward.

## Takeaway

Round 2's setup (writing the detailed prompt, waiting for the plan, approving it) felt slower in the 

moment, but the total time including review and fixing was shorter than Round 1, because Round 1's 

speed was an illusion — all its missing validation and scope creep would have needed to be caught 

and fixed before it could actually ship.