# Working on this repo

## Never push to master
Every merge to `master` deploys the site to Netlify, and the number of deploys per month is limited.

- Never push, merge or commit directly to `master`.
- Put every change on its own branch and open a pull request. The owner reviews and merges it.
- Group related changes into one pull request. Don't open one per small fix.
- Don't push extra commits to an open pull request unless they're needed (a fix, or a change the owner asked for).

## How the app is laid out
- Plain files, no build step: `index.html` loads `css/app.css` and the scripts in `js/` (one shared scope, loaded in order; the README lists what each holds).
- Every word shown to people lives in `js/strings.js`, in French and English.
- When releasing, bump `VERSION` in `sw.js` and every `?v=` in `index.html` to the same value, or phones keep the old files.
- Changes to `firestore.rules` must be published by hand in the Firebase console; say so in the pull request.
