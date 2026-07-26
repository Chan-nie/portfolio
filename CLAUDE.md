# Project rules

- Forms: validate on the client with explicit JS, never rely solely on native HTML5 `required` — 

  it doesn't catch whitespace-only input or enforce minimum length.

- Form errors must be wired for accessibility: aria-describedby linking input to error text, plus 

  role="alert" or aria-live="polite" — a red border alone isn't enough.

- When asked to add a feature to an existing section, append to it — never rewrite or delete 

  existing content/copy that wasn't part of the request.