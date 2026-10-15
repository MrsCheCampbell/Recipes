# La Cuisine d'Abe 🍲✡

A recipe app for Dad (Abraham, "Abe"). It installs on an Android phone straight from Chrome, works offline, and keeps every recipe on the phone.

## Putting it online (one time, ~2 minutes)

1. On GitHub, open this repo → **Settings** → **Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**, pick **master** and **/ (root)**, then **Save**.
3. After about a minute the app is live at **https://mrschecampbell.github.io/Recipes/**

(GitHub Pages needs the repo to be public on a free plan.)

## Installing on Dad's Android phone

1. Open the link above in **Chrome**.
2. Tap **⋮** → **Installer l'application** / **Install app** (or "Ajouter à l'écran d'accueil").
3. The blue pot icon appears on his home screen. It opens full screen like any other app.

## What it does

**Recipes**
- Add a photo with the camera or from the gallery, or paste an image link. Photos are compressed so the phone doesn't fill up.
- **Import from a link**: paste a recipe URL (Marmiton, 750g, most blogs) and it fills in the title, photo, ingredients, steps, times and servings.
- **Paste text**: paste a recipe from an email or a WhatsApp message and it splits it into ingredients and steps.
- **Share to the app**: in Chrome or any app, tap *Share → La Cuisine d'Abe* on a recipe page to start a new recipe from it.
- Category, kashrut (Bassari / Halavi / Parvé), kosher for Pesach, holidays, keywords, notes, "recipe from" (Mom, Aunt Esther…), star rating, favorites.
- Unsaved drafts are kept if he gets interrupted.

**Finding things**
- Alphabetical list grouped by letter, with an A–Z rail to slide through.
- Search across titles, ingredients, steps and notes. It ignores accents (*creme* finds *crème*), tolerates typos, and understands French/English/Hebrew spellings (*Hanoucca / Hanukkah / Chanukah*, *’halla / challah*, *poulet / chicken*).
- Voice search (microphone button).
- Quick filters for Favorites, Bassari, Halavi, Parvé, plus category, holiday, "quick (≤ 30 min)" and kosher for Pesach.
- Sort A–Z, recently added, most cooked, top rated, or quickest.
- "Surprends-moi" opens a random recipe.

**Cooking**
- Servings scaler that recalculates the quantities (½, ¼, ⅓ fractions).
- Tick ingredients off as you go.
- **Cooking mode**: one big step at a time, swipe to move between steps, and the screen stays on.
- Times in steps ("20 min", "1 h 30") become tap-to-start timers that ring and vibrate.
- "I cooked this today" keeps a count and the last date cooked.
- Shopping list: add a recipe's ingredients in one tap, check items off, share the list.

**Jewish calendar & France**
- Hebrew date under the greeting.
- Banner for the next holiday (Roch Hachana, Yom Kippour, Souccot, Hanoucca, Tou Bichvat, Pourim, Pessah, Chavouot) with a button for his recipes for it.
- From Wednesday on, Shabbat **candle-lighting and end times** for his city (Paris, Lyon, Marseille, Nice, Strasbourg… or GPS).
- "Chabbat Chalom, Abe" greeting on Friday afternoon and Shabbat.
- French by default, English available. Metric units, plus a converter for cups, tbsp, oz, lb and °F → °C, with the French oven **thermostat** number.

**Comfort & safety**
- Large text by default (three sizes), light and dark modes, big tap targets.
- **Backup**: send a backup file to email or Google Drive, and restore it on a new phone. The app reminds him once a month.
- Six example recipes (challah, matzo ball soup, shakshuka, latkes, honey cake, hamantaschen), removable in one tap.

## Tech

No build step and no server: `index.html` (the whole app), `manifest.webmanifest`, `sw.js` (offline cache) and `icons/`. Data lives in the phone's IndexedDB.
Link import goes through public CORS proxies (allorigins, corsproxy.io, codetabs) because browsers can't read other sites directly. If a site blocks them, the link is still saved and he can paste the text instead.
