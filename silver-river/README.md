# Silver River 銀河之女

A cozy pixel-art daughter-raising game in the spirit of *Princess Maker*, set in a storybook ancient China.

On **Qixi** night, when magpies build a bridge across the Silver River (the Milky Way), a star falls
into your courtyard. Inside the light is a little girl with hair like spun starlight. You raise her,
as her mother or her father, until her eighteenth Qixi. Then the stars call her home, and she decides
whether to stay.

**Play:** open `dist/silver-river.html` in any modern browser (one self-contained file, works offline
except for the web fonts). For development, open `index.html` directly; no server or build step is needed.

## What makes it different

- **Short runs.** You pick a 3-, 5- or 8-year story: roughly 20, 35 or 60 minutes. A season is one
  turn, and you plan its three months at a time.
- **She is a person, not a stat sheet.**
  - Temperament: five hidden trait axes (shy/bold, practical/dreamy, gentle/fiery, free-spirited/diligent,
    serious/playful). They set her speaking voice (sunny, soft, sassy, dreamy or earnest) and change as she grows.
  - Needs: fun, love, freedom, pride and friends. They drift every season and drive her mood.
  - What you learn about her: likes and dislikes you only find out by trying things, favourite foods and
    flowers, fears, and quirks.
  - Inner life: memories with emotional weight that she brings up later, trust, self-esteem, secrets,
    and promises she remembers you making.
  - Her own will:
    - She reacts to your plans, pushes back on what she hates (you can listen or insist), and asks for things.
    - She wanders the courtyard doing her hobbies.
    - She keeps a diary, which she locks as a teenager and may share again if she trusts you.
    - She takes over more of her own schedule as she grows.
- **You are her parent.**
  - Choose to be her mother or father, what she calls you, and your past: retired general, village
    scholar, silk merchant, herbal physician, court musician or tea farmer.
  - Warmth and strictness are tracked on two axes, and she notices your parenting style.
  - Talks, outings, festivals, birthdays and journeys are things you do *with* her.
- **A town that lives without you.**
  - About fifteen townsfolk with their own story arcs: best friend Mei, shy dumpling-boy Tao, rival-turned-friend
    Lady Wanyin, a runaway prince, and mentors with secrets.
  - Friends and teachers drop by the courtyard to chat with her while you plan.
  - The "Around town" line changes every season based on what has happened in your story.
- **Endings are a whole life.**
  - There are 24 endings: careers, a quiet happy life, the open road, or returning to the stars.
  - Her choice on the Magpie Bridge depends on your bond, her trust, her friendships and her dreams.
  - The game closes with a letter she writes you, built from memories of your actual playthrough.
- **Replayable.**
  - Every daughter is different: random temperament, favourites and fears, over 120 story events,
    and dreams that change.
  - The **family register** keeps every daughter you have raised, with her letter.
  - A **daughter code** (`SR-…`) lets someone else raise the same girl.
  - Four mini-games: poetry riddles, guqin recital, sparring duel and dragon-boat race.
- **Optional heart-to-hearts with Claude.** Inside claude.ai (artifact with the `sample` capability), talks gain a
  "Heart-to-heart (say anything)" option. There she answers in her own voice from her real state and memories, and her
  final letter is written freshly. Everywhere else the game uses its written dialogue and never makes network calls.

## Controls

- **Plan:** pick three activities (Lessons / Work / Leisure tabs), then *Begin the season*. The **?** on a card
  shows what she thinks of it once she has tried it.
- **This season together:** *Talk* and *Outing* spend limited time with her. *Clothes* opens her wardrobe
  (she has opinions).
- **Click her, the cat, or anyone in the world** to hear what they're thinking.
- **Dialogue:** click or press Space/Enter to advance. *Skip ▸▸* fast-forwards text. Settings (title screen or Menu)
  cover text speed, music and sound.
- **Her / Diary / Album** in the top bar show what you know about her, her diary pages and photos of your memories.

## Project layout

```
silver-river/
  index.html              dev entry point (loads src/ directly; works from file://)
  build.js                bundles everything into dist/silver-river.html
  src/css/style.css       pixel UI: border-image frames, responsive layout (desktop, tablet, phone)
  src/js/core.js          helpers: seeded RNG, colours, storage
  src/js/pixel.js         pixel engine: text-grid sprites, palettes, dithering, primitives
  src/js/portrait.js      Stardew-style 64x64 portraits: ages, expressions, hairstyles, blink/talk frames
  src/js/sprites.js       16x32 world sprites and animations (her, townsfolk, cat, props, emotes)
  src/js/world.js         the 320x180 painted scenes, seasons, weather, lighting, and the actor stage
  src/js/icons.js         pixel UI icons
  src/js/audio.js         procedural pentatonic music (Karplus-Strong zither) and sound effects
  src/js/data.js          activities, economy, outfits, parents, dreams
  src/js/npcs.js          the people of Peach Blossom Town
  src/js/mind.js          her mind: traits, needs, mood, memories, trust, voice, wishes, protests
  src/js/sim.js           game state, seasons, months, event selection, the event-script context
  src/js/endings.js       careers, the Magpie Bridge decision, and her letter
  src/js/events.js        story events (childhood, friends, rivals, first love, fights, secrets...)
  src/js/events2.js       townsfolk arcs and events she starts herself
  src/js/town.js          courtyard visitors and the "Around town" news
  src/js/talk.js          talks, outings, festivals, journeys, birthdays and the finale
  src/js/minigames.js     riddles, recital, duel, dragon-boat race
  src/js/llm.js           optional Claude heart-to-hearts and letters (claude.ai `sample` capability)
  src/js/ui.js            HUD, planner, dialogue, sheets, toasts, speech bubbles
  src/js/main.js          app flow: title, setup, seasons, courtyard life, endings, register
  tools/simulate.js       headless balance simulator: node tools/simulate.js [games] [short|standard|long] [random|caring|harsh]
  tools/*-preview.html    art previews for portraits, sprites and scenes
```

## Building

```
node build.js                        # -> dist/silver-river.html (single file, ~450 KB)
node build.js --artifact out.html    # page body only, for hosts that supply their own <html>/<head>
```

All art is generated in code at runtime (no image files), so the whole game is one HTML file.
