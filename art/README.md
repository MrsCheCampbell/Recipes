# Artwork

Every illustration in the app is one file in this folder. The current set is a mockup in a flat "kitchen doodle" style (coral, mustard, sage, sky blue, navy). To use artwork you've bought, replace a file with one that has **the same name**, and the app uses it everywhere.

- **Format:** SVG is best, since it stays sharp at any size. PNG or WebP also work: either keep the `.svg` name, or add a line to `ART_FILES` near the top of the script in `index.html`, for example `whisk: 'whisk.png'`.
- **Shape:** square, with a transparent background and the drawing centred, leaving a little margin. At least 256 × 256 px for PNG.
- **Licence:** check that the set allows use in an app, and keep its licence file in this folder.

| File | Shows | Used for |
|---|---|---|
| `soups.svg` | soup bowl | recipes in Soupes, placeholder when there's no photo |
| `salads.svg` | salad bowl | Salades |
| `mains.svg` | serving dish with a cover (cloche) | Plats, and recipes with no category |
| `meat.svg` | steak | Viandes |
| `poultry.svg` | drumstick | Volailles |
| `fish.svg` | fish | Poissons |
| `vegetarian.svg` | carrot | Végétarien |
| `sides.svg` | potatoes | Accompagnements |
| `breads.svg` | loaf | Pains & brioches |
| `desserts.svg` | cupcake | Desserts |
| `pastries.svg` | croissant | Pâtisseries & gâteaux |
| `sauces.svg` | jar | Sauces & condiments |
| `drinks.svg` | teapot | Boissons |
| `cocktails.svg` | cocktail glass | Cocktails |
| `wine.svg` | bottle and glass | the Cave (wine notes): wines without a label photo |
| `starters.svg` | small bites on a plate | Entrées |
| `other.svg` | whisk | Autre |
| `whisk.svg`, `teapot.svg`, `kettle.svg`, `mitt.svg`, `apron.svg`, `pan.svg`, `pot.svg`, `rollingpin.svg`, `grater.svg`, `spoon.svg` | kitchen tools | family avatars (plus a few category drawings); `pot.svg` is also the empty-page drawing, `whisk.svg` the "Claude is thinking" animation |
| `nav-book.svg` | open recipe book | bottom bar: Recettes |
| `nav-notebook.svg` | spiral notebook with a bookmark | bottom bar: Carnets |
| `nav-saved.svg` | ribbon bookmark | (spare, was the Favoris tab) |
| `nav-fridge.svg` | fridge | bottom bar: Frigo |
| `nav-basket.svg` | market basket | bottom bar: Courses |
| `nav-whisk.svg` | whisk | bottom bar: Plus |

The small line icons inside buttons (search, back, share, timer, and so on) are drawn in code (`const I = {…}` in `index.html`) so they can change colour with the theme. They can be replaced too. Ask, and they can be moved into this folder the same way.
