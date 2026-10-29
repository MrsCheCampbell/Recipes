# Our Kitchen

A recipe app for our family. It installs on a phone straight from Chrome or Safari, works offline, and keeps every recipe on the phone.

## Putting it online

The app is hosted on Netlify: every merge to `master` deploys it (see CLAUDE.md — deploys are limited, so changes go through pull requests).

## Installing on Dad's Android phone

1. Open the link above in **Chrome**.
2. Tap **⋮** → **Installer l'application** / **Install app** (or "Ajouter à l'écran d'accueil").
3. The green pot icon appears on his home screen. It opens full screen like any other app.
4. Open it. There's no code to set up.

## Installing on an iPhone

1. Open the same link in **Safari**.
2. Tap the **Share** button (the square with an arrow pointing up) → **Add to Home Screen** / **Sur l'écran d'accueil** → **Add**.
3. Open it from the home screen icon. It runs full screen.

Install it to the home screen rather than using it in a Safari tab: Safari can clear data from websites you haven't visited for a while, but it keeps data for home-screen apps.

Each phone keeps its own recipes. To copy recipes from one phone to another, use *Plus → Envoyer la sauvegarde* on one phone and *Restaurer une sauvegarde* on the other.

## What it does

**Recipes**
- **One box at the top of the form** (*Lien ou texte de la recette*): paste a link, or a whole recipe from an email or a WhatsApp message, and tap **Remplir**. Or tap **Photos** to photograph a cookbook page or pick screenshots. A line under the box always says what happened (read by Claude, filled without Claude, site blocked…), so nothing fails silently.
- Ingredients typed or pasted on one line with commas ("200 g de farine, 3 œufs, 100 g de sucre") are split into one per line. The page photos stay attached to the recipe so the original is always one tap away (tap to zoom).
- Add a photo of the dish with the camera or from the gallery, or paste an image link. Photos are compressed so the phone doesn't fill up.
- **Share to the app**: in Chrome or any app, tap *Share → Our Kitchen* on a recipe page to start a new recipe from it.
- Category, **occasions** (having friends over, family dinner, birthdays, New Year's Eve, brunch, BBQ & picnic, weeknight, Shabbat dinner and the Jewish holidays, plus your own; seasons, weather & garden: scorching summer day, cold winter day, rainy day, spring, summer, autumn, winter, from the garden), keywords, notes, "recipe from" (Mom, Aunt Esther…), star rating, favorites.
- Unsaved drafts are kept if he gets interrupted.

**Finding things**
- Alphabetical list grouped by letter, with an A–Z rail to slide through.
- Search across titles, ingredients, steps and notes. It ignores accents (*creme* finds *crème*), tolerates typos, and understands French/English spellings (*poulet / chicken*, *aubergine / eggplant*).
- Voice search (microphone button).
- One quiet **Filtres** button next to the sort: favorites, quick (≤ 30 min), who added it, seasons and weather, occasions and category. Active filters show as small pills under the search bar; tap one to remove it.
- At the top, a row of ideas that fits the moment, shown every time the app opens, worked out from each recipe itself (name, ingredients, type, cooking time), not only from tags. A small label on each one says why it was picked ("SOUPE", "POMMES", "MIJOTÉ"). Seasons use what's in season in France (asparagus in spring, tomatoes in summer, squash, apples and mushrooms in autumn, leeks and citrus in winter). The moments: on a hot day (28° or more in his city) "Il fait 33° à Paris : de quoi se rafraîchir", on a cold day (5° or less) something warming, on a rainy day comfort food, otherwise the season's recipes. Then his favorites. Weather comes from Open-Meteo (free, no account); offline it just uses the season.
- Sort A–Z, recently added, most cooked, top rated, or quickest.

**Cooking**
- Servings scaler that recalculates the quantities (½, ¼, ⅓ fractions).
- Units switch on every recipe: **As written / Metric / Cups & oz**. Cups become grams using the real weight of each ingredient (flour, sugar, butter…), liquids become ml, and oven temperatures in the steps switch between °F and °C. Converted amounts are underlined; tap one to see the original.
- Tick ingredients off as you go.
- **Cooking mode**: one big step at a time, swipe to move between steps, and the screen stays on.
- Times in steps ("20 min", "1 h 30") become tap-to-start timers that ring and vibrate.
- "I cooked this today" keeps a count and the last date cooked.
- Shopping list: add a recipe's ingredients in one tap, check items off, share the list.

**Occasions with dates**
- New Year's Eve is dated automatically. Any occasion he adds (a birthday, say) can be given a date in *Plus → Occasions*.
- Two weeks before, a quiet line at the top says e.g. "Réveillon du Nouvel An dans 9 jours". Tapping it shows the recipes tagged for it.
- The app is in English. It still reads French recipes (links, pasted text, photos). Metric units, plus a converter for cups, tbsp, oz, lb and °F → °C, with the French oven **thermostat** number.

**More**
- Open: the family, **Ideas & suggestions**, and *Install the app* until it's installed. Everything else is a folded card you tap open: By the numbers, Settings, Occasions, Conversions, Example recipes, and at the bottom Claude and Backup.
- **Ideas & suggestions**: anyone in the family can send any idea, from a word to a whole new page. They go to whoever set up the family, who sees them listed on that page and ticks them off when done. Without a family, the idea goes out with the phone's share menu.
- The envelope (inbox) is for recipes sent by link from outside the family; in a family it only shows when one is waiting. Inside the family there's no need to send recipes: everyone sees them all, and **Recommend** on a recipe points one person to it.

**Harold's birthday (temporary)**
- A teal *¡Feliz cumpleaños, Harold!* card (with a *¡41 años!* tag) at the top of Recipes, and a shower of confetti every time the app opens. While the card is up, the date line reads Wednesday, October 28. It waits for Harold: once his phone has shown it, it stays two more days on everyone's phone, then goes away (and in any case after December 31, 2026).
- A phone in Spain uses Madrid for the weather (Barcelona, Valencia, Sevilla, Málaga and Bilbao are in *More → Settings*, or use your location).

**Look**
- Dark mode by default (Automatic or Light in *More → Settings*).
- Calm and classic: the home page is the date, a search bar and the day's ideas. Each recipe in the list is a plain index card (title over a thin red rule, then the details), with a small photo when there is one. A recipe page opens on its photo, then the title, details, ingredients and steps; notes sit in a quiet box. No tape, no tilted cards.
- Typography: Bodoni Moda for titles, IBM Plex Mono for labels and numbers, Atkinson Hyperlegible for ingredients and steps (chosen for readability), Caveat for handwriting.
- Illustrations (category drawings, family avatars, bottom bar, empty pages) are flat kitchen doodles in `art/`, one file per name, so a purchased set can be dropped in with the same file names. See [`art/README.md`](art/README.md). Small button icons are drawn in code. No emoji anywhere.
- Motion: pages slide in, polaroids drop onto the tablecloth, ticked ingredients get crossed out with a drawn line. Turned off automatically if the phone asks for reduced motion.

**Comfort & safety**
- Large text by default (three sizes), light and dark modes, big tap targets.
- **Backup**: send a backup file to email or Google Drive, and restore it on a new phone. The app reminds him once a month.
- Four example recipes (roast chicken, shakshuka, ratatouille, tarte Tatin), removable in one tap.

## La famille: a recipe feed just for us

Everyone keeps their own book, and sees what the others are cooking.

The feed has its own tab in the bottom bar, **Famille**. A small red number on it says how many new posts there are since you last looked (and on Android, and on iPhone when installed, the app icon shows it too). Until the family is set up (below), the tab shows what the feed will look like and a button to create or join it.

- **Just a photo**: the bar at the top of the feed (or the + button) shares a photo with no recipe attached: a plate at a restaurant, a dish at friends', anything too pretty or too funny. Add where it was if you like.

- **One family cookbook**: every recipe anyone adds goes into the shared list in **Recettes**, with a small avatar showing who added it. Nothing is hidden. Your hearts and favourites stay your own.
- **Finding someone's recipes**: *Filtres → Ajoutées par* lists **Les miennes** and each person who has added recipes (Maman, Papa…). Typing a name in the search works too: "maman gâteau" finds Mom's cakes.
- **Instagram** (the tab, formerly Famille): food photos, of something someone cooked (tagged to the recipe) or any plate worth sharing, with hearts and comments. New recipes show up as one quiet line ("Papa a ajouté 3 recettes").
- **"J'ai cuisiné" (I made it)**: the **+** button now asks *J'ai cuisiné…* or *Une nouvelle recette*. Pick the recipe you made, add a photo if you like (or just a word), and it goes in the feed with the recipe attached. Anyone can make anyone's recipe and post their own photo ("Moi aussi" on a post). Every photo and note shows up on the recipe itself, in a **Fait par la famille** panel of little polaroids. A post is seen by exactly the people who can see the recipe: if Mom's cake is secret, so are the photos of it, and if she later shares the cake, the photos follow. The recipe button **J'ai cuisiné** does the same and counts the times you've made it. Without the family, the photos stay on the phone as your own "Mes essais".
- **Recommend**: on any recipe, **Recommander** → pick who → a note. It appears at the top of their feed (not in their messages) until they keep it or tap "Plus tard".
- **Ratings**: everyone rates with their own stars; the recipe shows the family average.
- **Mute**: in *Plus → La famille*, untick anyone you don't want in your feed, or turn the feed off entirely.
- **Avatars**: each person picks a drawn avatar and a colour.
- **Cocktails** have their own section (and illustration).
- **Renaming the family**: whoever created it can change the name in *More → Family*; everyone sees it the next time they open the app.
- **Adding someone later** (your brother): *More → Family → Invite someone* shares a message with the steps and the invite link (the same link is shown under the button, with **Copy link**). They pick a name and avatar; everything already there stays.
- Works offline: everything is cached on the phone, and changes sync when the connection comes back.

### Setting up the family (once, about 10 minutes)

The family's recipes live in your own free Firebase project (Google). Nobody else can read them.

1. Go to https://console.firebase.google.com → **Create a project** (free Spark plan; Google Analytics not needed).
2. **Build → Authentication → Get started → Sign-in method → Anonymous → Enable.**
3. **Build → Firestore Database → Create database** (production mode, a region near you, e.g. `europe-west`).
4. In Firestore, open the **Rules** tab, replace everything with the contents of [`firestore.rules`](firestore.rules), and click **Publish**.
5. **Project settings (gear) → Your apps → Web (`</>`)** → register an app (no hosting needed) → copy the `firebaseConfig = { ... }` block.
6. In the app: **Plus → La famille → Créer la famille**, paste that block, name the family, pick your name and avatar.
7. **Invite someone** → send the message to everyone. On Android they tap the link, pick a name, done. On iPhone the home-screen app keeps its own data, separate from Safari, so they add the app to the home screen first, copy the link, then tap **Paste invite link** in *More → Family* inside the app (the join page in Safari says so).

When joining, the app offers to add the recipes already on that phone to the family cookbook.

Notes: the Firebase web config isn't a secret (security comes from the rules). Accounts are tied to each phone; if someone leaves or resets their phone, they rejoin with a new invite link (their earlier recipes stay in the family). The free plan's limits (50,000 reads and 20,000 writes a day, 1 GB) are far beyond what a family uses.

## Carnets: evenings and guests

The **Carnets** tab (bottom bar) is private to each person, even in the family.

- **Soirées (events)**: one page per evening: friends over, a birthday, New Year's Eve. Give it a date and an occasion, add the guests, then build **the menu**: recipes you're considering (from your book or the family's), or any other dish typed in ("Sarah's cheese board"). On the night, tick what you actually made, mark it *Adoré / Bien / Bof*, and add a note per dish. **La soirée** is for notes about the evening and up to six photos. "J'ai cuisiné" photos tagged to that evening show up there too.
- **Next year**: an evening with the same occasion offers **Reprendre le menu de « Réveillon 2025 »**, which copies last year's menu in one tap.
- **Invités (guest book)**: one page per couple or group of friends: what to know about them (allergies, what they love), every evening with them, and **everything you've served them**, with how many times, when last, and whether it was loved. When you plan a new evening with them, **Déjà servi à ces invités** lists it right on the page, so you don't repeat a dish, or so you can make their favourite again. **Organiser une soirée avec eux** starts a new evening with them already invited.
- On a recipe: *menu → Ajouter à une soirée*, and the recipe shows which evenings it was served at.
- **Cave (wine notes)**: snap the label, note the name, colour, vintage, appellation, château, stars and a few words. Link a wine to the dishes it went with (the recipe then shows *Accords*), add wines to an evening, and each guest book lists the wines poured for those friends.
- **Favoris** is now the last tab inside Carnets.

Everything is in the backup file (*Plus → Sauvegarder*). In a family it is also stored in your own private space on the server, which only you can read.

> **If the family was set up before this update:** open Firestore → **Rules** once more, paste the new [`firestore.rules`](firestore.rules) and **Publish**. The new rules add the "J'ai cuisiné" posts, the private notebooks and the shared Claude key.

## Smart tags and suggestions

- **Ranger automatiquement**: a button in the recipe form fills in the category, seasons, weather and occasions right away (and keywords, with a Claude key). New ones are ringed, so you can see them and tap any to remove it before saving. It also runs by itself after importing from a link, screenshots or pasted text.
- When a recipe is saved without that, the app files it under its seasons, weather (scorching day, cold day, rainy day) and occasions (barbecue, brunch, quick weeknight…), and picks a category if none was chosen. It never removes a tag you set, and you can always change them.
- With a Claude key, Claude also reads each new recipe and adds the tags that fit. *Plus → Claude → Ranger toutes mes recettes avec Claude* does the same for older recipes.
- The top of **Recettes** always shows a row of ideas for today: from the weather (hot, cold, rainy) or the season, or a daily pick when nothing matches.
- In **Filtres**, seasons and weather come first, then occasions and category.

## Adding recipes from links and screenshots

- **Links**: the app first asks the site's own little helper on Netlify (`netlify/functions/fetch-page.mjs`, at `/api/fetch`) to fetch the page, which gets past the browser restriction that blocks most recipe sites. It falls back to public proxies if that fails. If the page has recipe data built in (most big sites do), the form fills in instantly, with no AI involved.
- **With a Claude key** (*Plus → Claude*, the same key as the Frigo), anything that doesn't fill in cleanly is read by Claude instead:
  - pages without recipe data (blogs): Claude reads the page text;
  - sites that refuse the helper: Claude fetches the page itself;
  - **screenshots and cookbook photos**: Claude reads the pictures directly, several at once, joined into one recipe, in the recipe's own language. This is much better than the reader built into the phone;
  - pasted text: Claude sorts it into ingredients and steps.
  Each recipe read this way costs a few cents on the Claude account. Without a key, the phone's own reader is used as before (good for pasted text, weak for photos).
- **One key for the whole family**: when you save the key in *Plus → Claude*, the box *Partager avec la famille* is ticked, so Maman and Papa get it the next time they open the app, with nothing to type. It is stored in the family's private space on Firebase, which only members can read. *Ne plus partager* takes it back.
- The Netlify helper is free on Netlify's free plan (it counts as a function call, not a deploy). It only fetches public web pages and images, only for the app itself.

## Frigo: what can I make?

The **Frigo** tab (the little fridge in the bottom bar):

1. Add what you have (type it, or tap the common ones). It's remembered for next time.
2. **Dans votre livre** instantly lists your own recipes that fit, ranked by how much you have (the ring shows the %), then by your stars, favorites and how often you've cooked them, with what's missing. Salt, pepper, oil and water don't count as missing.
3. **Demander des idées à Claude**: Claude reads your fridge, your best recipes, the season and the weather, writes a short suggestion, picks from your book, and searches the web for 3–5 real recipe pages (French sites first when the app is in French). Each idea has **Voir le site** and **Enregistrer**, which opens the normal new-recipe form with the link and imports it.

Claude needs an API key: create one at console.anthropic.com → API keys, then paste it in *Plus → Claude*. The key is stored on that phone (and, if you share it, in the family's private space) and requests go straight from the phone to Anthropic (Claude Opus 5.5 with web search). Each request costs a few cents; you can set a monthly spending limit in the Console. Only links Claude actually found in its search are shown.

## Sending recipes to each other

Each phone keeps its own recipe book. To share one:

1. On a recipe, tap **Envoyer**. The phone's share menu opens: pick WhatsApp, SMS, e-mail… The recipe travels inside the link (with a small photo).
2. The other person taps the link. On Android it lands in their **Boîte de réception** (the envelope at the top right of the home screen). On iPhone it opens in Safari: tap **Copier pour mon appli**, open the app, go to the inbox and tap **Coller une recette reçue**.
3. In the inbox, **Garder** adds it to their recipes (with "Recette de" set to the sender), the bin deletes it.

Set your own name in *Plus → Réglages → Prénom affiché* so the inbox says who it's from.

## Tech

No build step. The app is plain files that Netlify serves as they are:

- `index.html`: the page skeleton; it loads the styles and scripts below.
- `css/app.css`: all the styles ("Le Carnet" design).
- `js/`: the app, split by feature. The scripts share one scope and load in order:
  `icons.js` (icons, artwork) · `strings.js` (every word, English) · `core.js` (helpers, storage, search, calendar, units, images, navigation) · `book.js` (recipe list, suggestions, recipe page, cook mode, timers, form, smart tags, importing) · `fridge.js` (Frigo and Claude) · `family.js` (Firebase sync, hearts, comments, recommendations, feed, joining) · `notebooks.js` ("J'ai cuisiné" photos, evenings, guests, wine) · `more.js` (sending recipes, share target, shopping list, settings, examples) · `app.js` (taps, passcode, start).
- `sw.js`: the service worker. The app opens from its saved copy (fast, and works offline); new versions download in the background and the app offers to reload. **When releasing, bump `VERSION` in `sw.js` and the `?v=` numbers in `index.html` together.**
- `netlify/functions/fetch-page.mjs`: fetches recipe pages for link imports.
- `firestore.rules`: the family's security rules.
- `vendor/`: libraries loaded only when needed: `tesseract/` (Tesseract.js 5.1.1, French and English, Apache-2.0, for reading photos without Claude), `anthropic/` (Anthropic TypeScript SDK 0.130.0, MIT), `firebase/` (Firebase JS SDK 12.19.0, app + auth + firestore, Apache-2.0).
- `art/`: drawings for avatars and the bottom bar (see `art/README.md`).

Data lives on the phone (IndexedDB). In a family, Firebase is the shared copy and the phone keeps its own copy, so the app opens instantly and works offline.
