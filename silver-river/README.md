# Silver River 银河之女

A daughter-raising game in the spirit of *Princess Maker*, set in a storybook ancient China.

On the night of **Qixi**, when magpies build a bridge across the Silver River (the Milky Way), a star falls
into your courtyard. Inside the light is a little girl with hair like spun starlight. You raise her,
as her mother or father, until her eighteenth Qixi, when the stars call her home and she decides whether to stay.

## Design goals

- **Short playthroughs.** Choose a 3-, 5- or 8-year story (roughly 15, 25 or 45 minutes). Seasons are the turn unit.
- **She is a person, not a stat sheet.** Hidden temperament (shy/bold, practical/dreamy, gentle/fiery,
  free-spirited/diligent, serious/playful), likes and dislikes you discover by trying things, favourite
  things, fears, and dreams that change as she grows. She reacts to every plan, can protest, asks for
  things, keeps a diary (that she locks as a teenager), and plans more of her own life as she gets older.
- **You are her parent.** Mother or father, with a past of your own (retired general, scholar, silk
  merchant, herbal physician, court musician or tea farmer). How warm and how strict you are shapes who she becomes.
- **Endings are a whole life.** A career, her friendships, and her relationship with you, closed by a
  letter she writes you that remembers what actually happened in your playthrough.

## Project layout

```
silver-river/
  index.html            dev entry point (loads src/ directly; works from file://)
  src/css/style.css     UI styles
  src/js/core.js        helpers: seeded RNG, colour maths, storage
  src/js/art.js         her portrait: SVG, ages 10-18, expressions, hairstyles, hanfu outfits
  src/js/scenes.js      painted SVG backgrounds by season and time of day
  src/js/icons.js       line icons
  src/js/fx.js          canvas particles (petals, leaves, snow, fireflies, lanterns, stars)
  src/js/audio.js       procedural pentatonic music (Karplus-Strong zither) and sound effects
  tools/                art-preview.html / scene-preview.html for checking the art
```

## Status

Work in progress. Done: portrait renderer, scenes, icons, particles, music. In progress: game data and
simulation, story events, UI, build.

## Art packs (planned)

The drawn SVG art is a placeholder ceiling. Illustrated PNGs dropped into `art/` will replace it, with
anything missing falling back to the SVG art:

- `art/her/<stage>_<expression>.png` — stage `child` (10-12), `teen` (13-15), `adult` (16-18); expressions
  `neutral, happy, joy, sad, angry, surprised, shy, worried`. Waist-up, transparent background, 800x1000.
- `art/bg/<scene>.png` — one per scene in `scenes.js` (optionally `<scene>_<season>.png`). 1600x1200.
- `art/endings/<ending-id>.png` — one illustration per ending.
