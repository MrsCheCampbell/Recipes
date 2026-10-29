'use strict';
// Our Kitchen: Every word the app shows (English).
// The scripts share one scope and load in order (see index.html).

// ---------- Vocabulary ----------
const CATS = ['starters','soups','salads','mains','meat','poultry','fish','vegetarian','sides','breads','desserts','pastries','sauces','drinks','cocktails','other'];
const HOLIDAYS = ['shabbat','roshhashana','yomkippur','sukkot','hanukkah','purim','pesach','shavuot'];
const OCCASIONS = ['friends','family','birthday','newyear','brunch','bbq','weeknight'];
const SEASONS = ['hotday','coldday','rainyday','spring','summer','autumn','winter','garden'];
const KASHRUT = [];

const STR = {
  en: {
    appName: 'Our Kitchen',
    
    nav: { list: 'Recipes', fav: 'Favorites', fridge: 'Fridge', shop: 'Shopping', more: 'More' },
    searchPh: 'Search', voice: 'Search by voice', clear: 'Clear',
    all: 'All', favorites: 'Favorites', filters: 'Filters', quick: 'Quick (≤ 30 min)', 
    sort: { az: 'A to Z', recent: 'Recently added', cooked: 'Most cooked', rating: 'Top rated', time: 'Quickest' },
    nRecipes: n => n === 0 ? 'No recipes' : n === 1 ? '1 recipe' : `${n} recipes`,
    nOf: (n, total) => `${n} of ${total}`,
    add: 'Add', newRecipe: 'New recipe', editRecipe: 'Edit recipe',
    emptyTitle: 'Your recipe book is ready', emptyText: 'Add a recipe with a photo, a link, or by pasting text. Everything stays on your phone.',
    firstRecipe: 'Add my first recipe', loadSamples: 'Show example recipes',
    noResults: 'Nothing found.', noResultsHint: 'Try another word, or remove a filter.', resetFilters: 'Clear all',
    cat: { starters: 'Starters', soups: 'Soups', salads: 'Salads', mains: 'Mains', meat: 'Meat', poultry: 'Poultry', fish: 'Fish', vegetarian: 'Vegetarian', sides: 'Sides', breads: 'Breads', desserts: 'Desserts', pastries: 'Cakes & pastries', sauces: 'Sauces & condiments', drinks: 'Drinks', cocktails: 'Cocktails', other: 'Other' },
    hol: { shabbat: 'Shabbat dinner', roshhashana: 'Rosh Hashanah', yomkippur: 'Yom Kippur break-fast', sukkot: 'Sukkot', hanukkah: 'Hanukkah', purim: 'Purim', pesach: 'Passover', shavuot: 'Shavuot',
      friends: 'Having friends over', family: 'Family dinner', birthday: 'Birthdays', newyear: 'New Year’s Eve', brunch: 'Brunch', bbq: 'BBQ & picnic', weeknight: 'Weeknight dinner',
      hotday: 'Scorching summer day', coldday: 'Cold winter day', rainyday: 'Rainy day', spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter', garden: 'From the garden' },
    prep: 'Prep', cook: 'Cook', total: 'Total', min: 'min', h: 'h',
    servings: n => n === 1 ? '1 serving' : `${fmtNum(n)} servings`, times: x => `Amounts ×${fmtNum(x)}`,
    ingredients: 'Ingredients', steps: 'Method', notes: 'Notes', source: 'Recipe from',
    cookMode: 'Cooking mode', addToShop: 'Add to shopping list', addedToShop: n => `${n} ingredient${n > 1 ? 's' : ''} added to shopping`,
    openLink: 'Open original link', edit: 'Edit', share: 'Share', print: 'Print / PDF', duplicate: 'Duplicate', del: 'Delete',
    copyText: 'Copy text', copied: 'Copied', deleteQ: t => `Delete “${t}”?`, deleteYes: 'Yes, delete', cancel: 'Cancel', deleted: 'Recipe deleted', undo: 'Undo',
    cookedN: (n, d) => n ? `Cooked ${n} time${n > 1 ? 's' : ''}${d ? ' · last on ' + d : ''}` : 'Not cooked yet', bravo: 'Well done! Enjoy',
    addedOn: d => `Added ${d}`,
    photo: 'Photo', addPhoto: 'Take or choose a photo', changePhoto: 'Change', removePhoto: 'Remove', photoUrl: 'or paste an image link',
    importing: 'Importing…', importOk: 'Recipe imported! Check it and save.', importFail: 'This site can’t be read. The link is kept: paste the recipe text, or take screenshots and tap “Photos”.',
    title: 'Recipe name', titlePh: '', link: 'Link (website, video…)', category: 'Category', holidays: 'Holidays', tags: 'Keywords', tagsPh: '', servingsF: 'Servings', prepF: 'Prep (min)', cookF: 'Cook (min)',
    ingF: 'Ingredients', stepsF: 'Steps', notesF: 'Notes from the recipe', noteF: 'Your notes', sourceF: 'Recipe from (who?)', sourcePh: '',
    save: 'Save', saved: 'Saved', needTitle: 'Give the recipe a name',
    draftFound: 'An unsaved draft was found.', restore: 'Restore', discard: 'Discard',
    shopTitle: 'Shopping list', shopAddPh: 'Add an item…', shopEmpty: 'The list is empty. On a recipe, tap “Add to shopping list”.',
    clearDone: 'Remove checked items', clearAll: 'Clear the list', shareList: 'Share the list', other: 'Other', clearAllQ: 'Clear the whole list?',
    moreTitle: 'More', settings: 'Settings', yourName: 'Name shown', language: 'Language', textSize: 'Text size', sizes: { normal: 'Normal', large: 'Large', xl: 'Extra large' },
    theme: 'Appearance', themes: { auto: 'Automatic', light: 'Light', dark: 'Dark' },
    city: 'City (for the weather)', useGps: 'Use my location', myPos: 'My location', gpsFail: 'Location unavailable',
    backup: 'Backup', backupText: 'Your recipes are kept on this phone. Make a backup now and then and email it or save it to Google Drive.',
    exportB: 'Download a backup', shareB: 'Send the backup', importB: 'Restore a backup', importedN: n => `${n} recipe${n > 1 ? 's' : ''} restored`, badFile: 'This file isn’t a valid backup',
    lastBackup: d => d ? `Last backup: ${d}` : 'No backup yet',
    backupNudge: 'Remember to back up your recipes.', backupNow: 'Back up',
    samples: 'Example recipes', samplesAdd: 'Add the examples', samplesDel: 'Remove the examples', samplesAdded: 'Examples added', samplesRemoved: 'Examples removed',
    stats: 'By the numbers', statRecipes: 'recipes', statFav: 'favorites', statCooked: 'times cooked',
    tools: 'Conversions', convFrom: 'Amount', convIngr: 'Ingredient (for cups)', ovenTitle: 'Oven temperatures',
    install: 'Install the app on the phone', installText: 'Put it on the home screen, like a real app.',
    installHow: 'In Chrome: tap the menu (the three dots) then “Install app” (or “Add to Home screen”).',
    installIos: 'In Safari: tap the Share button (the square with an arrow pointing up), then “Add to Home Screen”, then “Add”.',
    iosNudge: 'To use it like a real app: tap Share, then “Add to Home Screen”.', ok: 'OK',
    eraseAll: 'Erase everything', eraseQ: 'Erase every recipe from this phone? This can’t be undone.', erased: 'Everything erased',
    
    step: (i, n) => `Step ${i} of ${n}`, prev: 'Back', next: 'Next', finish: 'Done!', showIng: 'Ingredients', close: 'Close',
    timerDone: 'Timer done', stop: 'Stop', startTimer: 'Start', timerFor: 'Timer',
    offlineSave: 'Storage is unavailable: recipes won’t be kept.',
    units: { orig: 'As written', metric: 'Metric', us: 'Cups & oz' }, unitsLabel: 'Units', unitsNote: 'Approximate conversions. Tap a quantity to see the original.',
    ocrLoading: 'Getting ready to read… (the first time takes a little longer)', ocrReading: (i, n, p) => n > 1 ? `Reading page ${i} of ${n}… ${p}%` : `Reading the page… ${p}%`,
    ocrOk: 'Page read! Check the text, then save.', ocrFail: 'The text couldn’t be read. The page photo is still kept with the recipe.', ocrEmpty: 'No text found. The page photo is still kept with the recipe.',
    pagesN: n => n > 1 ? `Cookbook pages (${n})` : 'Cookbook page', pageAlt: i => `Page ${i}`, removePage: 'Remove page',
    occSeasons: 'Seasons, weather & garden', seasonRail: { spring: 'Spring recipes', summer: 'Summer recipes', autumn: 'Autumn recipes', winter: 'Winter recipes' },
    wxHot: (d, c) => `It’s ${d}° in ${c}: something to cool down`, wxCold: (d, c) => `It’s ${d}° in ${c}: something to warm up`, wxRain: c => `It’s raining in ${c}: some comfort food`,
    occasions: 'Occasions', occMoments: 'Get-togethers & celebrations', addOcc: 'Other occasion', occName: 'Occasion name', occNamePh: '',
    occDate: 'Date (optional, for a small reminder)', occText: 'Add a date to see a quiet reminder a few days before.', occAdd: 'Add an occasion', occDelQ: l => `Delete the occasion “${l}”?`,
    occSoon: (h, n) => n === 0 ? `${h} today` : n === 1 ? `${h} tomorrow` : `${h} in ${n} days`,
    collection: n => `Collection · ${String(n).padStart(3, '0')}`, added: 'Added',
    tabFeed: 'Instagram', addedBy: n => `Added by ${n}`, famStars: (a, n) => `Family: ${a} of 5 (${n} ratings)`,
    recommend: 'Recommend', 
    copyToMine: 'Copy to edit it',
    comments: 'Comments', commentPh: 'Add a comment', triedIt: 'I tried it', noComments: 'No comments yet.', commentSent: 'Comment posted',
    recommendTo: 'Recommend to…', nobodyYet: 'Nobody else in the family yet.', recoNote: 'A little note (optional)', recoNotePh: '',
    recoSent: n => `Recommended to ${n}`, recoFor: n => `${n} recommends`, recoLater: 'Later', you: 'You', like: 'Like',
    feedEmptyT: 'Nothing cooking yet', feedEmpty: 'When someone cooks something (or spots a lovely plate), the photo lands here.',
    agoNow: 'just now', agoMin: n => `${n} min ago`, agoH: n => `${n} h ago`, agoYesterday: 'yesterday', agoD: n => `${n} days ago`,
    family: 'Family', famIntroT: 'Cooking together, each at home', famIntro: 'Everyone keeps their own book and sees what the others are cooking: a recipe feed, hearts, stars, comments and recommendations. One family cookbook, everyone’s recipes in one place.',
    famJoinT: 'Join my family', famJoinText: 'Did someone send you an invite link? Copy it, then tap the button.', famJoinPh: 'Paste the invite link', famJoinBtn: 'Join the family', pasteInvite: 'Paste invite link',
    codeJoinText: 'Type the family code someone sent you.', famCodeLbl: 'Family code', codeGo: 'Continue', haveLink: 'I have an invite link instead',
    codeBad: 'That family code doesn’t exist. Check the letters and try again.', copyCode: 'Copy', codeCopied: 'Code copied',
    famCodeHint: 'Send this code to anyone you want in the family. They type it in More → Family.', invLinkLbl2: 'Or send the invite link',
    backT: 'Already in the family?', backText: 'Tap your name and type your 4-digit code to get everything back.', backGo: 'That’s me', newHereT: 'I’m new here',
    pinLbl: 'Your 4-digit code', pinHint: 'Only asked if you ever reinstall the app, so you come back as you.', pinNeed: 'Choose 4 digits.',
    pinWrong: 'That’s not the right code.', pinTooMany: 'Too many tries. Wait a few minutes and try again.', pinFail: 'Couldn’t save the code. Try again in More → Family.',
    pinNotEnabled: 'Codes need one switch in Firebase: Authentication → Sign-in method → Email/Password → Enable.', pinSaved: 'Code saved. You can always come back as you.',
    secureT: 'Pick your 4-digit code', secureText: 'If you ever delete the app or change phones, this gets you back in as you, with your recipes and notebooks. You only need it then.',
    welcomeBack: n => n ? `Welcome back, ${n}!` : 'Welcome back!',
    fbCardT: 'Ideas & suggestions', fbCardText: 'Anything at all you’d change, add or take away. Big or tiny, it all helps.',
    fbTitle: 'Ideas & suggestions', fbHeroT: 'Literally anything can change', fbHero: 'This app was made for us, so it should work the way you like. Any single thing can be changed, added or removed: a word, a colour, a button, a whole new page.',
    fbIdeas: ['“This button is too small.”', '“I never use the Fridge tab, hide it.”', '“Can it remind me to buy challah on Fridays?”', '“I wish I could see who cooked my recipe.”', '“The text is hard to read.”', '“This bit confuses me.”'],
    fbNoWrong: 'There’s no idea too small, too big or too silly. Something that annoys you even a little is exactly the kind of thing worth saying.',
    fbTo: 'Your idea', fbToName: n => `Your idea (it goes straight to ${n})`, fbSend: 'Send', fbAgain: 'Send as many as you like, whenever they come to you.',
    fbThanks: 'Thank you! Keep them coming.', fbFail: 'Couldn’t send. Check the internet connection.', fbShareIntro: 'An idea for Our Kitchen:',
    fbInboxT: 'What people suggested', fbNone: 'Nothing yet. They’ll show up here.', fbDone: 'Done, remove it', loading: 'Loading…', famRename: 'Rename the family', famRenameHint: 'Everyone sees the new name the next time they open the app.', famRenameFail: 'Couldn’t rename. Check the internet connection.', famNewT: 'Set up a new family instead', invLinkLbl: 'Or copy the invite link', copyLink: 'Copy link', linkCopied: 'Link copied',
    iosJoinT: 'On iPhone, do this first', iosJoinSteps: ['Tap Share (the square with an arrow pointing up), then <b>Add to Home Screen</b>, then <b>Add</b>.', 'Tap <b>Copy link</b> below.', 'Open <b>Our Kitchen</b> from your home screen, go to More → Family, and tap <b>Paste invite link</b>.'],
    famCreateT: 'Create the family (only once, for everyone)', famSteps: ['At <a href="https://console.firebase.google.com" target="_blank" rel="noopener">console.firebase.google.com</a>, create a project (free). Google Analytics isn’t needed.', '<b>Authentication</b> → Get started → enable <b>Anonymous</b>.', '<b>Firestore Database</b> → Create database (production mode, any region).', '<b>Rules</b> tab: replace everything with <a href="firestore.rules" target="_blank" rel="noopener">these rules</a>, then <b>Publish</b>.', '<b>Project settings</b> → Your apps → Web icon <b>&lt;/&gt;</b> → register the app, then copy the <b>firebaseConfig</b> block below.'],
    famCfg: 'Firebase configuration', famName: 'Family name', famNameDefault: 'The family', yourAvatar: 'Your avatar', famCreateBtn: 'Create the family',
    famMembers: 'The family', nRecipesBy: n => n === 1 ? '1 recipe' : `${n} recipes`, inMyFeed: 'In my feed', famInvite: 'Invite someone', famInviteHint: 'Sends the family code and the steps by WhatsApp, SMS or email. They pick a name and an avatar, and everything already there stays.',
    yourProfile: 'My profile', feedT: 'Instagram', feedShow: 'Show the family feed on the home screen', famLeaveT: 'Leave on this phone', famLeaveText: 'Your recipes stay in the family. To come back, type the family code, tap your name and your 4-digit code.', famLeave: 'Leave the family', famLeaveQ: 'Leave the family on this phone?',
    famCfgBad: 'I can’t find apiKey, projectId and appId in this text.', famErr: 'The family couldn’t be created. Check the configuration and that anonymous sign-in is enabled.',
    famJoinBad: 'This invite link isn’t valid.', invitation: 'Invitation', joinTitle: n => `Join “${n}”`, yourNamePh: '', needName: 'Choose a name',
    welcomeFam: n => `Welcome to “${n}”!`, famJoinErr: 'Couldn’t join. Check the internet connection, or ask for a new link.',
    migrateT: n => n === 1 ? 'Share your recipe?' : `Share your ${n} recipes?`, migrateText: 'The recipes already on this phone join the family cookbook.',
    migrateAll: 'Add them to the family cookbook', migrated: n => n === 1 ? '1 recipe added' : `${n} recipes added`,
    
    famCardText: 'Share your recipes with your family.', inviteText: (n, code) => code ? `Join “${n}” in Our Kitchen to see and share our recipes!

Our family code: ${code}

1. Put the app on your phone:
- iPhone: open the link below in Safari, tap Share (the square with an arrow), then “Add to Home Screen”, then “Add”.
- Android: open the link below in Chrome, tap ⋮ at the top right, then “Install app”.
2. Open Our Kitchen, go to More → Family, and type the code ${code}.
3. Tap “I’m new here”, pick your name, and choose a 4-digit code (only needed if you ever reinstall the app).` : `Join “${n}” in Our Kitchen to see and share our recipes. The invite link is below.

On iPhone:
1. Open the link in Safari, tap Share (the square with an arrow pointing up), then “Add to Home Screen”, then “Add”.
2. Come back here, press and hold the link, and tap “Copy Link”.
3. Open Our Kitchen from your home screen, go to More → Family, and tap “Paste invite link”. Pick your name and you’re in.

On Android:
1. Open the link in Chrome, pick your name and tap “Join the family”.
2. Tap the ⋮ menu at the top right, then “Install app”.`,
    fridgeTitle: 'What’s in the fridge?', fridgeAddPh: 'Add an ingredient', fridgeClear: 'Clear all', fridgeQuick: 'Often on hand',
    fridgeEmpty: 'Add what you have, and the app looks through your recipes.', inYourBook: 'In your book', noBookMatch: 'None of your recipes fit yet. Ask Claude for ideas!', noBookMatchPlain: 'None of your recipes fit yet.',
    haveOf: (h, n) => `${h} of ${n} ingredients`, missing: 'Missing', nothingMissing: 'You have everything!',
    askClaude: 'Ask Claude for ideas', askAgain: 'Ask Claude again', claudeThinking: 'Claude is looking in your fridge and searching for recipes…', claudeSec: s => `${s}s`,
    claudeSummary: 'Claude’s take', claudeFromBook: 'In your book', claudeNew: 'New ideas', openSite: 'Open the site', saveIdea: 'Save', claudeUses: 'Uses', claudeOld: d => `Answer from ${d}`,
    claudeNoKey: 'To ask Claude for ideas, add a key in More → Claude.', claudeSetup: 'Set up Claude', claudeErr: 'Claude couldn’t answer. Check the internet connection and the key, then try again.',
    claudeErrKey: 'The key wasn’t accepted. Check it in More → Claude.', claudeRefused: 'Claude couldn’t answer this request.', claudeOffline: 'No internet connection.',
    claudePanel: 'Claude', claudeText: 'Claude can suggest recipes from what you have: it looks through your book and searches the web for new ideas. It needs a key (console.anthropic.com → API keys). The key stays on this phone. Each request costs a few cents.',
    claudeKey: 'Claude key', claudeKeySaved: 'Key saved', claudeKeyRemove: 'Remove the key', claudeKeyOn: 'Claude is ready.', 
    inbox: 'Inbox', parAvion: 'Par avion', inboxEmpty: 'Nothing yet. When someone sends you a recipe from their app, it lands here.',
    fromWho: n => `From ${n}`, receivedOn: d => `received ${d}`, keep: 'Keep it', toss: 'Delete', kept: 'Added to your recipes', tossed: 'Recipe deleted',
    send: 'Send', sendText: (n, title) => `${n} sent you a recipe: “${title}”. Tap the link to add it to your Our Kitchen app:`,
    inboxBanner: (n, from) => n === 1 ? `${from} sent you a recipe` : `${n} recipes are waiting for you`, open: 'Open', preview: 'See the recipe',
    pasteLink: 'Paste a received recipe', pasteHelp: 'On iPhone, or if the link opened somewhere else: copy the message you received, then tap this button.', pastePh: 'Paste the message or link here',
    pasteGo: 'Add to inbox', pasteBad: 'No recipe found in this text.', alreadyIn: 'This recipe is already in your inbox.', gotOne: 'New recipe received!',
    iosCopyTitle: 'A recipe for you', iosCopyText: 'To put it in your app: tap “Copy for my app”, open Our Kitchen, then Inbox → “Paste a received recipe”.',
    copyForApp: 'Copy for my app', someone: 'Someone',
    bdayT: '¡Feliz cumpleaños, Harold!', bdayAge: '¡41 años!', bdaySub: 'Our Kitchen abre sus puertas hoy, en tu honor.', favRail: 'Your favorites', recentRail: 'Recently added', seeAll: 'See all',
    erase: 'Delete', later: 'Later',
  }
};
// Notebooks and "I made it" vocabulary.
Object.assign(STR.en, {
  none: '—', done: 'Done', optional: 'optional', theRecipe: 'The recipe',
  carnets: 'Notebooks', carnet: 'Notebook', carnetsSub: 'Your evenings, your guests, and everything you served.',
  tabEvents: 'Events', tabGuests: 'Guests', upcoming: 'Coming up', memories: 'Memories',
  nEvents: n => n ? `${n} event${n > 1 ? 's' : ''}` : 'New notebook',
  newEvent: 'New event', newGuest: 'New guests',
  eventsEmptyT: 'A brand-new notebook', eventsEmpty: 'Plan dinner with friends, a birthday or New Year’s Eve: menu ideas, what got made, and how the evening went. It all stays here for next year.',
  guestsEmptyT: 'The guest book', guestsEmpty: 'For each couple of friends, what you served them: so you don’t repeat a dish, or so you can make their favourite again.',
  untitled: 'Untitled event', unnamedGuests: 'Unnamed guests', evTitlePh: 'What’s the occasion?',
  evDate: 'Date', evOcc: 'Occasion', evGuests: 'Guests', addGuests: 'Add guests',
  servedBefore: 'Already served to these guests', servedNone: 'Nothing noted yet. Tick the dishes you made in the menu and they’ll show up here next time.',
  servedTimes: (n, d) => `${n} time${n > 1 ? 's' : ''} · last on ${d}`, inMenu: 'on the menu', addToMenu: 'Add to the menu',
  menu: 'The menu', menuEmpty: 'Add the recipes you’re thinking about, then tick what you made.',
  addRecipes: 'Recipes', otherDishPh: 'Another dish', reuseMenu: (title, y) => `Reuse the menu from “${title}” (${y})`,
  made: 'Made', verdicts: { loved: 'Loved', ok: 'Good', meh: 'Meh' }, itemNotePh: 'Note',
  evening: 'The evening', eveningPh: '',
  privateNote: 'This notebook is yours: nobody else sees it.',
  delEvent: 'Delete this event', delEventQ: title => `Delete “${title}”?`,
  guestPickT: 'Who’s coming?', guestNewPh: 'Name', dinnerWith: name => `Dinner with ${name}`,
  guestNamePh: 'Name', guestNotes: 'Good to know', guestNotesPh: '',
  planWith: 'Plan an evening with them', servedToThem: 'What we served them', theirEvenings: 'Their evenings', noEveningsYet: 'No evenings yet.',
  delGuest: 'Delete these guests', delGuestQ: name => `Remove “${name}” from the guest book? Their evenings stay.`,
  nEvenings: n => `${n} evening${n > 1 ? 's' : ''}`, lastOn: d => `last on ${d}`, nDishes: n => `${n} dish${n > 1 ? 'es' : ''}`, nMade: n => `${n} made`,
  addToEvent: 'Add to an event', addedToEvent: title => `Added to “${title}”`, servedAt: 'Served at:',
  madeIt: 'I made it', madeItQ: 'I made something…', madeItSub: 'A photo, a word, the recipe. And it’s in the feed.', madeItToo: 'Me too', madeItStamp: 'Homemade',
  fabQ: 'What are we adding?', newRecipeChoice: 'A new recipe', newRecipeSub: 'Type it, from a link, a photo of a cookbook…',
  cookT: title => `I made “${title}”`, cookPhotoOnlyT: 'A photo for the family', cookPhotoBtn: 'Take or choose a photo',
  cookNote: 'A word?', cookNotePh: '', cookEvent: 'For an event?', cookPost: 'Post',
  cookVisAll: 'The whole family will see it.', 
  cookLocal: 'Kept with the recipe, on this phone.', cookPosted: 'Posted to the feed', cookNoRecipe: 'No recipe, just a photo',
  pickRecipeT: 'Which recipe?', pickSearchPh: 'Search', pickDone: n => n ? `Add (${n})` : 'Add',
  madeByFam: 'Made by the family', madeByMe: 'My attempts', nTimes: n => `${n} time${n > 1 ? 's' : ''}`, cookedVerb: 'made this', photoVerb: 'shared a photo',
  delCookQ: 'Delete this photo and note?', reusedN: n => n ? `${n} dish${n > 1 ? 'es' : ''} added to the menu` : 'Everything is already on the menu',
});
STR.en.nav.carnets = 'Notebooks';
STR.en.nav.feed = 'Instagram';
Object.assign(STR.en, { smartLabel: 'Recipe link or text', smartFill: 'Fill in', photosBtn: 'Photos',
  filledWithoutClaude: 'Filled in without Claude: check the fields.', noRecipeInPhotos: 'Claude didn’t find a recipe in these photos.',
  claudeErrCredit: 'The Claude account is out of credit (console.anthropic.com → Billing).', claudeErrBusy: 'Claude is very busy, try again in a moment.',
  claudeKeyFam: 'Claude is ready (family key).', claudeShared: 'The whole family uses this key.', claudeNotShared: 'Only this phone uses this key.',
  claudeShare: 'Share with the family', claudeUnshare: 'Stop sharing', claudeShareToo: 'Share it with the family (nobody else will have to type it)', claudeShareRules: 'Not shared yet: publish the new rules in the Firebase console, then tap “Share with the family”.', claudeShareFail: 'Not shared yet (no connection?). Try again with “Share with the family”.', claudeSharedToast: 'Key shared with the family' });
Object.assign(STR.en, { mine: 'Mine', whoAdded: 'Added by' });
Object.assign(STR.en, { updateReady: 'A new version of the app is ready', reload: 'Reload' });
Object.assign(STR.en, { autoTagBtn: 'Sort automatically', autoTagBusy: 'Claude is sorting the recipe…',
  autoTagDone: n => `${n} tag${n > 1 ? 's' : ''} added: tap one to remove it`, autoTagNone: 'Nothing more to add', autoTagEmpty: 'Add the title or ingredients first' });
Object.assign(STR.en, { recipeNotes: 'Notes from the recipe', notesOf: n => !n ? 'Your notes' : `${n}’s notes` });
Object.assign(STR.en, { addedLine: (who, n) => `${who ? who + ' added' : 'You added'} ${n === 1 ? 'a recipe' : n + ' recipes'}`, tonightRail: 'Ideas for tonight',
  tagAll: 'Sort all my recipes with Claude', tagAllProgress: (i, n) => `Claude is sorting recipes… ${i} / ${n}`, tagAllDone: n => n ? `${n} recipe${n > 1 ? 's' : ''} sorted` : 'Everything is already sorted' });
Object.assign(STR.en, { claudeReading: 'Claude is reading the recipe…', claudeReadOk: 'Recipe read by Claude. Check it, then save.', claudeTip: 'Tip: with a Claude key (More → Claude), screenshots and difficult sites are read much better.' }); STR.en.sortBy = 'Sort by';
Object.assign(STR.en, { newPosts: n => `${n} new in the family`, composerPh: 'A photo to share?', photoPost: 'Just a photo', photoPostSub: 'At a restaurant, at friends’, a plate too pretty or too funny not to share.', cookPlace: 'Where?', choose: 'Choose', anyF: 'Any', filtersShow: n => n ? `Show ${n} recipe${n > 1 ? 's' : ''}` : 'No recipes' });
Object.assign(STR.en, {
  occOne: { birthday: 'Birthday' },
  tabWines: 'Cellar', allWines: 'All', newWine: 'New wine', unnamedWine: 'Unnamed wine',
  winesEmptyT: 'The cellar', winesEmpty: 'Snap the label of wines you like and add a note. You’ll know which one it was, at which evening, and with which dish.',
  snapLabel: 'Snap the label', wineNamePh: 'Wine name', wineColor: 'Colour', wcol: { red: 'Red', white: 'White', rose: 'Rosé', sparkling: 'Sparkling', sweet: 'Sweet' },
  vintage: 'Vintage', appellation: 'Appellation', producer: 'Château or estate', wineRating: 'Rating', wineNotes: 'Notes',
  pairsWith: 'Goes with', aRecipe: 'A recipe', drunkAt: 'Served at', delWineQ: name => `Remove “${name}” from the cellar?`,
  wines: 'The wines', aWine: 'A wine', pairings: 'Pairings:', pairWine: 'Pair a wine', winesServed: 'Wines served', pickWinesT: 'Which wines?',
  feedIntroT: 'Instagram', feedIntro: 'This is where the whole family’s recipes and photos show up: who made what, hearts, comments, recommendations.',
  feedIntroHow: 'To turn it on, one person creates the family (once, about 10 minutes), then sends the others a link. They just tap “Join”.',
  feedIntroBtn: 'Create or join the family', example: 'Example', exampleWho: 'Mom', exampleNote: 'Sunday’s cake, everyone had seconds.',
});
