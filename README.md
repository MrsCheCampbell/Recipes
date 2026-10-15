# La Cuisine d'Abe

A recipe app for Dad (Abraham, "Abe"). It installs on an Android phone straight from Chrome, works offline, and keeps every recipe on the phone.

## Putting it online (one time, ~2 minutes)

1. On GitHub, open this repo → **Settings** → **Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**, pick **master** and **/ (root)**, then **Save**.
3. After about a minute the app is live at **https://mrschecampbell.github.io/Recipes/**

(GitHub Pages needs the repo to be public on a free plan.)

## Installing on Dad's Android phone

1. Open the link above in **Chrome**.
2. Tap **⋮** → **Installer l'application** / **Install app** (or "Ajouter à l'écran d'accueil").
3. The green pot icon appears on his home screen. It opens full screen like any other app.
4. The first time it opens, it asks to **choose a 4-digit code** (and an optional hint). Set it up with him, or pick it for him and tell him.

## Installing on an iPhone

1. Open the same link in **Safari**.
2. Tap the **Share** button (the square with an arrow pointing up) → **Add to Home Screen** / **Sur l'écran d'accueil** → **Add**.
3. Open it from the home screen icon. It runs full screen and asks for its own 4-digit code.

Install it to the home screen rather than using it in a Safari tab: Safari can clear data from websites you haven't visited for a while, but it keeps data for home-screen apps.

Each phone keeps its own recipes. To copy recipes from one phone to another, use *Plus → Envoyer la sauvegarde* on one phone and *Restaurer une sauvegarde* on the other.

## What it does

**Passcode**
- A 4-digit code is asked each time the app opens, and again after 15 minutes in the background.
- "Code oublié ?" shows the hint he saved. The code can be changed, removed, or the app locked straight away from *Plus → Code d'accès*.
- This is a privacy lock for the phone. The recipes never leave his phone, so nobody visiting the website sees them.

**Recipes**
- Add a photo with the camera or from the gallery, or paste an image link. Photos are compressed so the phone doesn't fill up.
- **Import from a link**: paste a recipe URL (Marmiton, 750g, most blogs) and it fills in the title, photo, ingredients, steps, times and servings.
- **Photograph a cookbook page**: take one or more photos of a book page and the app reads the text (French or English) and fills in the title, servings, times, ingredients and steps. The page photos stay attached to the recipe so the original is always one tap away (tap to zoom). Reading happens on the phone itself, so the photos are never sent anywhere.
- **Paste text**: paste a recipe from an email or a WhatsApp message and it splits it into ingredients and steps.
- **Share to the app**: in Chrome or any app, tap *Share → La Cuisine d'Abe* on a recipe page to start a new recipe from it.
- Category, **occasions** (having friends over, family dinner, Mom's birthday, birthdays, Thanksgiving, New Year's Eve, brunch, BBQ & picnic, weeknight, plus his own; seasons, weather & garden: scorching summer day, cold winter day, rainy day, spring, summer, autumn, winter, from the garden; plus the Jewish holidays), kashrut (Bassari / Halavi / Parvé), keywords, notes, "recipe from" (Mom, Aunt Esther…), star rating, favorites.
- Unsaved drafts are kept if he gets interrupted.

**Finding things**
- Alphabetical list grouped by letter, with an A–Z rail to slide through.
- Search across titles, ingredients, steps and notes. It ignores accents (*creme* finds *crème*), tolerates typos, and understands French/English/Hebrew spellings (*Hanoucca / Hanukkah / Chanukah*, *’halla / challah*, *poulet / chicken*).
- Voice search (microphone button).
- Quick filters for Favorites and each category he uses, plus kashrut, occasion and "quick (≤ 30 min)" under Filters.
- At the top, a carousel that fits the moment, worked out from each recipe itself (name, ingredients, type, cooking time), not only from tags. A small stamp on each polaroid says why it was picked ("SOUPE", "POMMES", "MIJOTÉ"). Seasons use what's in season in France (asparagus in spring, tomatoes in summer, squash, apples and mushrooms in autumn, leeks and citrus in winter). The moments: on a hot day (28° or more in his city) "Il fait 33° à Paris : de quoi se rafraîchir", on a cold day (5° or less) something warming, on a rainy day comfort food, otherwise the season's recipes. Then his favorites. Weather comes from Open-Meteo (free, no account); offline it just uses the season.
- Sort A–Z, recently added, most cooked, top rated, or quickest.
- "Surprends-moi" opens a random recipe.

**Cooking**
- Servings scaler that recalculates the quantities (½, ¼, ⅓ fractions).
- Units switch on every recipe: **As written / Metric / Cups & oz**. Cups become grams using the real weight of each ingredient (flour, sugar, butter…), liquids become ml, and oven temperatures in the steps switch between °F and °C. Converted amounts are underlined; tap one to see the original.
- Tick ingredients off as you go.
- **Cooking mode**: one big step at a time, swipe to move between steps, and the screen stays on.
- Times in steps ("20 min", "1 h 30") become tap-to-start timers that ring and vibrate.
- "I cooked this today" keeps a count and the last date cooked.
- Shopping list: add a recipe's ingredients in one tap, check items off, share the list.

**Jewish touches (kept discreet)**
- Hebrew date under the greeting.
- One quiet line under the greeting: the Hebrew date, Shabbat candle-lighting time from Thursday on (his city or GPS), and an upcoming holiday when it's within two weeks. Tapping the holiday shows his recipes for it.
- Jewish holidays are one group of occasions; kashrut sits in a fold-away section of the recipe form and in Filters.

**Occasions with dates**
- Thanksgiving and New Year's Eve are dated automatically. Mom's birthday and any occasion he adds can be given a date in *Plus → Occasions*.
- Two weeks before, a quiet line under the greeting says e.g. "Anniversaire de Maman dans 9 jours". Tapping it shows the recipes tagged for it.
- "Chabbat Chalom, Abe" greeting on Friday afternoon and Shabbat.
- French by default, English available. Metric units, plus a converter for cups, tbsp, oz, lb and °F → °C, with the French oven **thermostat** number.

**Look**
- Grandma's recipe box, re-engineered: gingham with a perforated tear-off edge, paper grain, recipe photos as taped polaroids on a gingham tablecloth, ruled recipe cards with crop marks, a catalogue number on every recipe (N° 001 is the first one he added), thumb-index tabs for A–Z, and his notes on a sticky note.
- Typography: Bodoni Moda for titles, IBM Plex Mono for labels and numbers, Atkinson Hyperlegible for ingredients and steps (chosen for readability), Caveat for handwriting.
- Every icon is drawn for the app (market basket, whisk, sieve, chef's hat, egg timer…), and recipes without a photo get an illustration for their category (soup bowl, braided loaf, cake slice, fish, carrot…). No emoji anywhere.
- Motion: pages slide in, polaroids drop onto the tablecloth, ticked ingredients get crossed out with a drawn line. Turned off automatically if the phone asks for reduced motion.

**Comfort & safety**
- Large text by default (three sizes), light and dark modes, big tap targets.
- **Backup**: send a backup file to email or Google Drive, and restore it on a new phone. The app reminds him once a month.
- Six example recipes (challah, roast chicken, shakshuka, ratatouille, honey cake, tarte Tatin), removable in one tap.

## Sending recipes to each other

Each phone keeps its own recipe book. To share one:

1. On a recipe, tap **Envoyer**. The phone's share menu opens: pick WhatsApp, SMS, e-mail… The recipe travels inside the link (with a small photo).
2. The other person taps the link. On Android it lands in their **Boîte de réception** (the envelope at the top right of the home screen). On iPhone it opens in Safari: tap **Copier pour mon appli**, open the app, go to the inbox and tap **Coller une recette reçue**.
3. In the inbox, **Garder** adds it to their recipes (with "Recette de" set to the sender), the bin deletes it.

Set your own name in *Plus → Réglages → Prénom affiché* so the inbox says who it's from.

## Tech

No build step and no server: `index.html` (the whole app), `manifest.webmanifest`, `sw.js` (offline cache), `icons/`, and `vendor/tesseract/` (Tesseract.js 5.1.1 text recognition with French and English data, Apache-2.0, loaded only when a page is photographed). Data lives in the phone's IndexedDB.
Link import goes through public CORS proxies (allorigins, corsproxy.io, codetabs) because browsers can't read other sites directly. If a site blocks them, the link is still saved and he can paste the text instead.
