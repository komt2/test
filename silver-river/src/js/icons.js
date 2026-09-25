/* Silver River — small line icons (24x24), two-tone via currentColor. */
(function () {
  'use strict';
  const G = window.SilverRiver;
  const I = {
    sword: '<path d="M5 19l9.5-9.5M14.5 9.5L19 5l.5 3.5L16 12z" /><path d="M4 16l4 4M6.5 17.5l-2 2"/><path class="f" d="M14.5 9.5L19 5l.5 3.5L16 12z"/>',
    scroll: '<path class="f" d="M7 5h11v12a2 2 0 0 1-2 2H6"/><path d="M7 5h11v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7h3"/><path d="M7 5a2 2 0 0 0-2 2M10 9h5M10 12h5M10 15h3"/>',
    guqin: '<path class="f" d="M3 14c2-4 16-7 18-5l-1 3C17 12 6 16 4 17z"/><path d="M3 14c2-4 16-7 18-5l-1 3C17 12 6 16 4 17z"/><path d="M5 14.5l14-4M6 15.5l14-4"/>',
    teacup: '<path class="f" d="M5 10h11v3a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M5 10h11v3a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 11h1.5a2 2 0 0 1 0 4H16M4 20h14"/><path d="M9 7c0-1 1-1 1-2M12 7c0-1 1-1 1-2"/>',
    lotus: '<path class="f" d="M12 18c-3 0-7-2-8-6 3 0 5 1 6 3-1-4 0-7 2-9 2 2 3 5 2 9 1-2 3-3 6-3-1 4-5 6-8 6z"/><path d="M12 18c-3 0-7-2-8-6 3 0 5 1 6 3-1-4 0-7 2-9 2 2 3 5 2 9 1-2 3-3 6-3-1 4-5 6-8 6zM4 20h16"/>',
    dumpling: '<path class="f" d="M4 15c0-5 4-8 8-8s8 3 8 8z"/><path d="M4 15c0-5 4-8 8-8s8 3 8 8zM4 15h16M8 9l1 2M12 7.5v2.5M16 9l-1 2"/>',
    fan: '<path class="f" d="M12 19L4 9a11 11 0 0 1 16 0z"/><path d="M12 19L4 9a11 11 0 0 1 16 0zM12 19V5.5M12 19L8 6.5M12 19l4-12.5"/>',
    star: '<path class="f" d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
    armillary: '<circle class="f" cx="12" cy="10" r="6"/><circle cx="12" cy="10" r="6"/><ellipse cx="12" cy="10" rx="6" ry="2.2" transform="rotate(-25 12 10)"/><path d="M12 16v4M8 20h8"/>',
    herb: '<path class="f" d="M12 20c0-8 3-12 8-14-1 6-4 10-8 11"/><path d="M12 20c0-8 3-12 8-14-1 6-4 10-8 11M12 20c0-5-2-8-7-10 0 5 3 8 7 8"/>',
    swirl: '<path d="M4 14c0-4 3-7 7-7 3 0 5 2 5 4.5S14 15 12 15s-3-1.5-3-3 1-2 2-2"/><path d="M14 18c3 0 6-2 6-5M6 18h8"/>',
    teapot: '<path class="f" d="M6 10h10v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5z"/><path d="M6 10h10v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5zM16 11l4-2-1 4-3 1M6 11c-2 0-3 1-3 3s1 2 3 2M9 8h4M11 8V6"/>',
    steamer: '<path class="f" d="M4 10h16v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/><path d="M4 10h16v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM4 14h16M3 10h18M9 7c0-1 1-1 1-2M14 7c0-1 1-1 1-2"/>',
    sprout: '<path d="M12 20v-8"/><path class="f" d="M12 12c-4 0-6-2-7-6 4 0 6 2 7 6zM12 12c0-4 2-7 7-7-1 4-3 7-7 7z"/><path d="M12 12c-4 0-6-2-7-6 4 0 6 2 7 6zM12 12c0-4 2-7 7-7-1 4-3 7-7 7zM7 20h10"/>',
    spool: '<rect class="f" x="7" y="6" width="10" height="12" rx="1"/><path d="M5 5h14M5 19h14M7 6v12M17 6v12M9 9h6M9 12h6M9 15h6"/>',
    banner: '<path d="M6 21V3"/><path class="f" d="M6 4h12l-3 4 3 4H6"/><path d="M6 4h12l-3 4 3 4H6"/>',
    brush: '<path d="M18 3l-7 9"/><path class="f" d="M11 12c-3 0-5 2-5 5 0 2-1 3-2 4 5 0 9-2 9-6z"/><path d="M11 12c-3 0-5 2-5 5 0 2-1 3-2 4 5 0 9-2 9-6z"/>',
    moon: '<path class="f" d="M19 14A8 8 0 1 1 10 5a6 6 0 0 0 9 9z"/><path d="M19 14A8 8 0 1 1 10 5a6 6 0 0 0 9 9z"/>',
    kite: '<path class="f" d="M12 3l6 7-6 7-6-7z"/><path d="M12 3l6 7-6 7-6-7zM12 3v14M6 10h12M12 17c0 2-2 2-2 4M10 21c1 0 2-1 3 0"/>',
    sparkle: '<path class="f" d="M12 3c1 5 3 7 8 8-5 1-7 3-8 8-1-5-3-7-8-8 5-1 7-3 8-8z"/><path d="M12 3c1 5 3 7 8 8-5 1-7 3-8 8-1-5-3-7-8-8 5-1 7-3 8-8z"/>',
    mountain: '<path class="f" d="M3 19l6-10 4 6 2-3 6 7z"/><path d="M3 19l6-10 4 6 2-3 6 7zM8 11l1.5 1.5L11 11"/>',
    coin: '<circle class="f" cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="8"/><rect x="9.5" y="9.5" width="5" height="5"/>',
    heart: '<path class="f" d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    cloud: '<path class="f" d="M7 18a4 4 0 0 1-.5-8A5 5 0 0 1 16 8.5 4 4 0 1 1 17 18z"/><path d="M7 18a4 4 0 0 1-.5-8A5 5 0 0 1 16 8.5 4 4 0 1 1 17 18z"/>',
    talk: '<path class="f" d="M4 5h16v10H9l-5 4z"/><path d="M4 5h16v10H9l-5 4zM8 9h8M8 12h5"/>',
    basket: '<path class="f" d="M4 10h16l-2 9H6z"/><path d="M4 10h16l-2 9H6zM8 10l3-5M16 10l-3-5M9 13v3M12 13v3M15 13v3"/>',
    robe: '<path class="f" d="M8 4l4 4 4-4 4 3-2 5-2-1v9H8v-9l-2 1-2-5z"/><path d="M8 4l4 4 4-4 4 3-2 5-2-1v9H8v-9l-2 1-2-5zM12 8l-2 12M12 8l2 5"/>',
    album: '<rect class="f" x="4" y="4" width="16" height="16" rx="2"/><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M4 17l5-4 4 3 3-2 4 3"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    sound: '<path class="f" d="M4 10h4l5-4v12l-5-4H4z"/><path d="M4 10h4l5-4v12l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    mute: '<path class="f" d="M4 10h4l5-4v12l-5-4H4z"/><path d="M4 10h4l5-4v12l-5-4H4zM16 9l5 6M21 9l-5 6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    next: '<path d="M9 5l7 7-7 7"/>',
    lantern: '<path d="M12 3v2M10 5h4"/><path class="f" d="M7 11c0-3 2-6 5-6s5 3 5 6-2 6-5 6-5-3-5-6z"/><path d="M7 11c0-3 2-6 5-6s5 3 5 6-2 6-5 6-5-3-5-6zM12 5v12M10 17h4M12 18v3"/>',
    book: '<path class="f" d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h9"/>',
    person: '<circle class="f" cx="12" cy="8" r="4"/><circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7"/>',
    gift: '<rect class="f" x="4" y="9" width="16" height="11" rx="1"/><rect x="4" y="9" width="16" height="11" rx="1"/><path d="M12 9v11M4 13h16M12 9c-2-4-6-4-6-1s4 1 6 1c2 0 6 2 6-1s-4-3-6 1"/>',
    home: '<path class="f" d="M4 11l8-7 8 7v9H4z"/><path d="M2 11.5l10-8.5 10 8.5M4 10v10h16V10M10 20v-6h4v6"/>',
    skip: '<path d="M5 5l7 7-7 7M12 5l7 7-7 7"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    lock: '<rect class="f" x="5" y="11" width="14" height="10" rx="2"/><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    dice: '<rect class="f" x="4" y="4" width="16" height="16" rx="3"/><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="15" r="1.2"/><circle cx="15" cy="9" r="1.2"/><circle cx="9" cy="15" r="1.2"/>',
  };
  G.icon = function (name, cls = '') {
    return `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${I[name] || I.sparkle}</svg>`;
  };
  G.icons = Object.keys(I);
})();
