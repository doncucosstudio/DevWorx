/**
 * The catalog of occasions (categories) and their preselected prompts.
 *
 * Every prompt is a short script. Tokens are filled in by `compose.ts`:
 *   {to}     – who the video is for ("Mom", "the Garcia family")
 *   {from}   – who it's from
 *   {names}  – everyone added, joined naturally ("Ava, Leo & Biscuit")
 *   {name}   – the person/pet currently in the spotlight
 *   {year}   – the current year (New Year uses the upcoming year)
 * A line whose token has no value is dropped (or its ", {to}" trimmed),
 * so every prompt still reads well with blanks left empty.
 */

export type ParticleKind =
  | "snow"
  | "confetti"
  | "hearts"
  | "leaves"
  | "fireworks"
  | "stars"
  | "petals"
  | "lanterns"
  | "fireflies"
  | "bats"
  | "sparkles";

export type MusicMood =
  | "festive"
  | "joyful"
  | "romantic"
  | "gentle"
  | "spooky"
  | "warm"
  | "anthem";

export type Theme = {
  /** Top → bottom background gradient. */
  bg: [string, string];
  /** Soft drifting glow behind the content. */
  glow: string;
  accent: string;
  text: string;
  subtext: string;
  /** Colors used by confetti, fireworks, lanterns, etc. */
  palette: string[];
  particles: ParticleKind[];
  font: "serif" | "sans";
  music: MusicMood;
};

export type PromptScript = {
  intro: { title: string; subtitle?: string };
  /** One line per person, cycled. */
  spotlight: string[];
  /** Used for pets instead of `spotlight` when present. */
  petSpotlight?: string[];
  /** Shown over everyone together when 2+ are added. */
  group?: string;
  /** The heart of the video. Can be replaced by the user's own words. */
  message: string;
  closing: { title: string; subtitle?: string };
};

export type Prompt = {
  id: string;
  title: string;
  blurb: string;
  script: PromptScript;
};

export type CategoryGroup = "holidays" | "celebrations" | "comfort";

export type Category = {
  id: string;
  name: string;
  group: CategoryGroup;
  emoji: string;
  description: string;
  theme: Theme;
  prompts: Prompt[];
};

export const GROUPS: { id: CategoryGroup; name: string; description: string }[] = [
  {
    id: "holidays",
    name: "Major holidays",
    description: "Greetings for the days we gather.",
  },
  {
    id: "celebrations",
    name: "Celebrations",
    description: "Birthdays, anniversaries and big milestones.",
  },
  {
    id: "comfort",
    name: "Comfort & remembrance",
    description: "Gentle words for loss, grief and missing someone.",
  },
];

const DEFAULT_PET_LINES = [
  "The best little friend anyone could ask for.",
  "Four paws, one enormous heart.",
  "Our favorite furry family member.",
];

const MEMORIAL_PET_LINES = [
  "Your paw prints are still all over our hearts.",
  "Every walk, every nap, every wag — remembered.",
  "You loved us completely. We'll love you forever.",
];

export const CATEGORIES: Category[] = [
  // ───────────────────────────── Holidays ─────────────────────────────
  {
    id: "christmas",
    name: "Christmas",
    group: "holidays",
    emoji: "🎄",
    description: "Cozy, snowy holiday cheer.",
    theme: {
      bg: ["#0f3d2e", "#06201a"],
      glow: "rgba(255, 214, 140, 0.35)",
      accent: "#e8b54a",
      text: "#fff8ec",
      subtext: "#f2d9a6",
      palette: ["#d62f3a", "#e8b54a", "#ffffff", "#3fa36b"],
      particles: ["snow", "sparkles"],
      font: "serif",
      music: "festive",
    },
    prompts: [
      {
        id: "christmas-cozy",
        title: "Merry & bright",
        blurb: "A warm, classic Christmas greeting from the whole crew.",
        script: {
          intro: { title: "Merry Christmas, {to}", subtitle: "From our home to yours" },
          spotlight: [
            "Wishing you a season full of warmth.",
            "Here's to cocoa, carols and cozy nights.",
            "Sending you all the holiday magic.",
            "Hoping Santa finds you this year.",
            "Peace, joy and a little extra sparkle.",
          ],
          petSpotlight: [
            "Officially on the nice list. Mostly.",
            "Dreaming of a treat-filled Christmas.",
            "Helping unwrap every single present.",
          ],
          group: "{names} — together for the holidays",
          message:
            "May your days be merry, your nights be calm, and your heart be full of the people you love.",
          closing: { title: "Happy Holidays", subtitle: "With love, {from}" },
        },
      },
      {
        id: "christmas-far",
        title: "Miles apart",
        blurb: "For family you can't be with this year.",
        script: {
          intro: { title: "Wish you were here, {to}", subtitle: "Christmas just isn't the same without you" },
          spotlight: [
            "Saving you a seat by the tree.",
            "Missing you more than ever this season.",
            "Your stocking is still hanging.",
          ],
          petSpotlight: ["Waiting by the door for you.", "Keeping your spot on the couch warm."],
          group: "All of us, thinking of you",
          message:
            "Distance can't touch the love we share. Until we're together again, you're in every candle and every carol.",
          closing: { title: "Merry Christmas", subtitle: "Love always, {from}" },
        },
      },
    ],
  },
  {
    id: "hanukkah",
    name: "Hanukkah",
    group: "holidays",
    emoji: "🕎",
    description: "Eight nights of light.",
    theme: {
      bg: ["#16306b", "#0a1736"],
      glow: "rgba(150, 190, 255, 0.35)",
      accent: "#f4c95d",
      text: "#f5f8ff",
      subtext: "#bcd0ff",
      palette: ["#f4c95d", "#8fb3ff", "#ffffff"],
      particles: ["stars", "sparkles"],
      font: "serif",
      music: "warm",
    },
    prompts: [
      {
        id: "hanukkah-light",
        title: "Festival of lights",
        blurb: "Bright wishes for all eight nights.",
        script: {
          intro: { title: "Happy Hanukkah, {to}", subtitle: "Chag Sameach" },
          spotlight: [
            "Wishing you eight nights of joy.",
            "May your latkes be crispy and your heart be full.",
            "Shining a little light your way.",
          ],
          group: "{names} — lighting the candles together",
          message:
            "May the glow of every candle bring warmth to your home, and may this season be filled with light, love and miracles big and small.",
          closing: { title: "Chag Urim Sameach", subtitle: "With love, {from}" },
        },
      },
    ],
  },
  {
    id: "kwanzaa",
    name: "Kwanzaa",
    group: "holidays",
    emoji: "🕯️",
    description: "Unity, family and heritage.",
    theme: {
      bg: ["#3a1410", "#120806"],
      glow: "rgba(255, 170, 90, 0.35)",
      accent: "#f0b23a",
      text: "#fff4e6",
      subtext: "#f2c58a",
      palette: ["#c8262d", "#1f8a4c", "#111111", "#f0b23a"],
      particles: ["fireflies", "sparkles"],
      font: "serif",
      music: "warm",
    },
    prompts: [
      {
        id: "kwanzaa-unity",
        title: "Habari Gani",
        blurb: "Celebrating family, community and purpose.",
        script: {
          intro: { title: "Joyous Kwanzaa, {to}", subtitle: "Habari Gani?" },
          spotlight: [
            "Celebrating the strength of our family.",
            "Honoring where we come from.",
            "Grateful for your light in our community.",
          ],
          group: "{names} — Umoja. Unity.",
          message:
            "May the seven principles guide your year, and may your home be filled with family, creativity and faith.",
          closing: { title: "Heri za Kwanzaa", subtitle: "With love, {from}" },
        },
      },
    ],
  },
  {
    id: "new-year",
    name: "New Year",
    group: "holidays",
    emoji: "🎆",
    description: "Ring in the new year with a bang.",
    theme: {
      bg: ["#130f2e", "#05040f"],
      glow: "rgba(200, 160, 255, 0.35)",
      accent: "#f6d36b",
      text: "#ffffff",
      subtext: "#d9ccff",
      palette: ["#f6d36b", "#ff6fa8", "#6fd3ff", "#b18cff", "#ffffff"],
      particles: ["fireworks", "sparkles"],
      font: "sans",
      music: "joyful",
    },
    prompts: [
      {
        id: "new-year-cheers",
        title: "Cheers to {year}",
        blurb: "A sparkling toast to the year ahead.",
        script: {
          intro: { title: "Happy New Year, {to}", subtitle: "Cheers to {year}!" },
          spotlight: [
            "Here's to new adventures.",
            "May this be your best year yet.",
            "Raising a glass to you!",
            "Big dreams. Bigger laughs.",
          ],
          petSpotlight: ["Resolution: more naps.", "Not a fan of fireworks. Huge fan of you."],
          group: "{names} — ready for {year}",
          message:
            "Thank you for every memory we made this year. Here's to twelve new months of health, happiness and good company.",
          closing: { title: "Happy {year}!", subtitle: "From {from}" },
        },
      },
    ],
  },
  {
    id: "lunar-new-year",
    name: "Lunar New Year",
    group: "holidays",
    emoji: "🏮",
    description: "Luck, prosperity and family reunion.",
    theme: {
      bg: ["#7a0d12", "#2b0306"],
      glow: "rgba(255, 190, 80, 0.4)",
      accent: "#ffcf4d",
      text: "#fff6e0",
      subtext: "#ffd89a",
      palette: ["#ff3b30", "#ffcf4d", "#ff8a3d"],
      particles: ["lanterns", "sparkles"],
      font: "serif",
      music: "festive",
    },
    prompts: [
      {
        id: "lunar-prosperity",
        title: "Good fortune",
        blurb: "Wishing luck and prosperity for the year ahead.",
        script: {
          intro: { title: "Happy Lunar New Year, {to}", subtitle: "Wishing you luck and prosperity" },
          spotlight: [
            "May good fortune find you.",
            "Wishing you health and happiness.",
            "May your year overflow with blessings.",
          ],
          group: "{names} — together for the reunion",
          message:
            "May the new year bring you peace in your home, success in your work and joy in every day.",
          closing: { title: "Gong Xi Fa Cai", subtitle: "With love, {from}" },
        },
      },
    ],
  },
  {
    id: "valentines",
    name: "Valentine's Day",
    group: "holidays",
    emoji: "💝",
    description: "Love notes, sweet and simple.",
    theme: {
      bg: ["#5c0f2e", "#22040f"],
      glow: "rgba(255, 120, 170, 0.4)",
      accent: "#ff8fb4",
      text: "#fff0f5",
      subtext: "#ffc2d6",
      palette: ["#ff4d7d", "#ff8fb4", "#ffffff"],
      particles: ["hearts", "sparkles"],
      font: "serif",
      music: "romantic",
    },
    prompts: [
      {
        id: "valentine-mine",
        title: "Be mine",
        blurb: "A romantic note for your favorite person.",
        script: {
          intro: { title: "Happy Valentine's Day, {to}", subtitle: "You have my whole heart" },
          spotlight: ["Every day with you is my favorite.", "You make ordinary moments magic."],
          petSpotlight: ["Sending you puppy-love kisses.", "Purr-fectly in love with you."],
          group: "{names} — so much love in one place",
          message:
            "Thank you for the laughter, the patience and the thousand little ways you show you care. I'd choose you every time.",
          closing: { title: "I love you", subtitle: "Forever yours, {from}" },
        },
      },
      {
        id: "valentine-family",
        title: "Love from all of us",
        blurb: "Galentine's, family, friends — love for everyone.",
        script: {
          intro: { title: "Happy Valentine's Day", subtitle: "Sending love your way, {to}" },
          spotlight: ["Full of love for you.", "You're one of our favorite people.", "Sending the biggest hug."],
          group: "{names} — love you lots!",
          message: "Love isn't just for couples. Today we're celebrating you and everything you mean to us.",
          closing: { title: "With all our hearts", subtitle: "{from}" },
        },
      },
    ],
  },
  {
    id: "easter",
    name: "Easter",
    group: "holidays",
    emoji: "🐣",
    description: "Spring blooms and new beginnings.",
    theme: {
      bg: ["#f6e7ff", "#d9f1e8"],
      glow: "rgba(255, 255, 255, 0.6)",
      accent: "#a05bd6",
      text: "#3b2350",
      subtext: "#6b5a7a",
      palette: ["#ffb3c7", "#c9b3ff", "#b3e6c9", "#fff0a8"],
      particles: ["petals"],
      font: "serif",
      music: "joyful",
    },
    prompts: [
      {
        id: "easter-spring",
        title: "Hoppy Easter",
        blurb: "Playful spring wishes for the whole family.",
        script: {
          intro: { title: "Happy Easter, {to}", subtitle: "Hope your basket is full!" },
          spotlight: ["Wishing you a sweet spring.", "Hope you find every egg!", "Blooming with joy for you."],
          petSpotlight: ["Chief egg-hunt assistant.", "Bunny ears: tolerated."],
          group: "{names} — springing into the season",
          message: "May this season of new beginnings bring you hope, renewal and plenty of chocolate.",
          closing: { title: "Happy Easter", subtitle: "Love, {from}" },
        },
      },
      {
        id: "easter-blessed",
        title: "He is risen",
        blurb: "A faith-centered Easter blessing.",
        script: {
          intro: { title: "Happy Easter, {to}", subtitle: "He is risen" },
          spotlight: ["Wishing you peace this Easter.", "Grateful for every blessing.", "Celebrating hope with you."],
          group: "{names} — rejoicing together",
          message: "May the hope and joy of Easter fill your heart today and all year long.",
          closing: { title: "Easter blessings", subtitle: "With love, {from}" },
        },
      },
    ],
  },
  {
    id: "eid",
    name: "Eid",
    group: "holidays",
    emoji: "🌙",
    description: "Blessings for Eid al-Fitr and Eid al-Adha.",
    theme: {
      bg: ["#0d3b4a", "#041820"],
      glow: "rgba(130, 230, 210, 0.3)",
      accent: "#e9c46a",
      text: "#f4fbff",
      subtext: "#bfe6e0",
      palette: ["#e9c46a", "#7fdccb", "#ffffff"],
      particles: ["stars", "lanterns"],
      font: "serif",
      music: "warm",
    },
    prompts: [
      {
        id: "eid-mubarak",
        title: "Eid Mubarak",
        blurb: "Warm wishes for a blessed Eid.",
        script: {
          intro: { title: "Eid Mubarak, {to}", subtitle: "Wishing you a blessed celebration" },
          spotlight: ["May your prayers be answered.", "Wishing you peace and plenty.", "Sending love and blessings."],
          group: "{names} — celebrating together",
          message: "May this Eid bring happiness to your home, peace to your heart and blessings to your family.",
          closing: { title: "Eid Mubarak", subtitle: "With love, {from}" },
        },
      },
    ],
  },
  {
    id: "mothers-day",
    name: "Mother's Day",
    group: "holidays",
    emoji: "💐",
    description: "Thank you, Mom.",
    theme: {
      bg: ["#fde3ea", "#f7cfd9"],
      glow: "rgba(255, 255, 255, 0.6)",
      accent: "#c2456b",
      text: "#4a1c2b",
      subtext: "#7a4a5a",
      palette: ["#f497b0", "#ffd1dc", "#c2456b", "#ffffff"],
      particles: ["petals", "sparkles"],
      font: "serif",
      music: "gentle",
    },
    prompts: [
      {
        id: "mothers-thanks",
        title: "Thank you, Mom",
        blurb: "Gratitude for everything she does.",
        script: {
          intro: { title: "Happy Mother's Day, {to}", subtitle: "For everything you are" },
          spotlight: ["You taught me what love looks like.", "Thank you for always being there.", "You make everything better."],
          petSpotlight: ["Thanks for all the belly rubs, Mom.", "Best pet mom in the world."],
          group: "{names} — all thanks to you",
          message:
            "For the early mornings, the late nights, the hugs and the endless patience — thank you. We love you more than words can say.",
          closing: { title: "We love you, Mom", subtitle: "{from}" },
        },
      },
    ],
  },
  {
    id: "fathers-day",
    name: "Father's Day",
    group: "holidays",
    emoji: "👔",
    description: "For the dads and father figures.",
    theme: {
      bg: ["#1c3550", "#0b1726"],
      glow: "rgba(140, 190, 255, 0.3)",
      accent: "#f2a65a",
      text: "#f2f7ff",
      subtext: "#b9cde6",
      palette: ["#f2a65a", "#8fb8e6", "#ffffff"],
      particles: ["sparkles"],
      font: "sans",
      music: "warm",
    },
    prompts: [
      {
        id: "fathers-thanks",
        title: "Best dad ever",
        blurb: "Celebrating the guy who does it all.",
        script: {
          intro: { title: "Happy Father's Day, {to}", subtitle: "Thanks for everything, Dad" },
          spotlight: ["You're my hero.", "Thanks for every lesson and every laugh.", "Still the best at dad jokes."],
          petSpotlight: ["Fetch partner for life.", "Thanks for all the walks, Dad."],
          group: "{names} — your biggest fans",
          message: "Thank you for showing up, for cheering us on and for being the steady place we can always come home to.",
          closing: { title: "Love you, Dad", subtitle: "{from}" },
        },
      },
    ],
  },
  {
    id: "independence-day",
    name: "Fourth of July",
    group: "holidays",
    emoji: "🎇",
    description: "Stars, stripes and summer nights.",
    theme: {
      bg: ["#0e1d4a", "#050b1f"],
      glow: "rgba(255, 255, 255, 0.25)",
      accent: "#ff4d5e",
      text: "#ffffff",
      subtext: "#c7d4ff",
      palette: ["#ff4d5e", "#ffffff", "#5c8dff"],
      particles: ["fireworks", "stars"],
      font: "sans",
      music: "anthem",
    },
    prompts: [
      {
        id: "july-fourth",
        title: "Happy Fourth!",
        blurb: "Fireworks, barbecue and good company.",
        script: {
          intro: { title: "Happy Fourth of July, {to}", subtitle: "Have a blast!" },
          spotlight: ["Here's to sunshine and sparklers.", "Grill master in training.", "Red, white and wonderful."],
          petSpotlight: ["Hiding from the fireworks. Send treats.", "Very patriotic. Very sleepy."],
          group: "{names} — celebrating summer",
          message: "Wishing you a day full of sunshine, family, good food and a sky full of fireworks.",
          closing: { title: "Happy Independence Day", subtitle: "From {from}" },
        },
      },
    ],
  },
  {
    id: "diwali",
    name: "Diwali",
    group: "holidays",
    emoji: "🪔",
    description: "The festival of lights.",
    theme: {
      bg: ["#3b0d4a", "#14031c"],
      glow: "rgba(255, 180, 60, 0.4)",
      accent: "#ffb627",
      text: "#fff6e6",
      subtext: "#ffd18a",
      palette: ["#ffb627", "#ff6b35", "#e83f6f", "#ffd700"],
      particles: ["fireflies", "fireworks"],
      font: "serif",
      music: "festive",
    },
    prompts: [
      {
        id: "diwali-light",
        title: "Shubh Deepavali",
        blurb: "Light, sweets and prosperity.",
        script: {
          intro: { title: "Happy Diwali, {to}", subtitle: "Shubh Deepavali" },
          spotlight: ["May your home glow with joy.", "Wishing you sweets and prosperity.", "Light over darkness, always."],
          group: "{names} — celebrating the lights",
          message:
            "May the light of the diyas bring wisdom, the sweets bring joy, and the new year bring prosperity to you and your family.",
          closing: { title: "Happy Diwali", subtitle: "With love, {from}" },
        },
      },
    ],
  },
  {
    id: "halloween",
    name: "Halloween",
    group: "holidays",
    emoji: "🎃",
    description: "Spooky, silly fun.",
    theme: {
      bg: ["#2a1240", "#0c0612"],
      glow: "rgba(255, 140, 30, 0.35)",
      accent: "#ff8c1a",
      text: "#fff3e0",
      subtext: "#ffc27a",
      palette: ["#ff8c1a", "#9b5de5", "#a8ff60"],
      particles: ["bats", "fireflies"],
      font: "sans",
      music: "spooky",
    },
    prompts: [
      {
        id: "halloween-spooky",
        title: "Spooky season",
        blurb: "Tricks, treats and costumes.",
        script: {
          intro: { title: "Happy Halloween, {to}", subtitle: "Trick or treat!" },
          spotlight: ["Spooky, scary and very cute.", "Here for the candy.", "Best costume in town."],
          petSpotlight: ["Wearing the costume under protest.", "Black cat energy."],
          group: "{names} — the spookiest crew",
          message: "Wishing you a night of frights, delights and way too much candy.",
          closing: { title: "Boo!", subtitle: "From {from}" },
        },
      },
    ],
  },
  {
    id: "thanksgiving",
    name: "Thanksgiving",
    group: "holidays",
    emoji: "🦃",
    description: "Gratitude around the table.",
    theme: {
      bg: ["#5a2a0e", "#221004"],
      glow: "rgba(255, 170, 80, 0.35)",
      accent: "#f2a33a",
      text: "#fff4e3",
      subtext: "#f3c98f",
      palette: ["#d9531e", "#f2a33a", "#a0522d", "#e6b422"],
      particles: ["leaves"],
      font: "serif",
      music: "warm",
    },
    prompts: [
      {
        id: "thanksgiving-grateful",
        title: "Grateful for you",
        blurb: "A thankful note from around the table.",
        script: {
          intro: { title: "Happy Thanksgiving, {to}", subtitle: "So much to be thankful for" },
          spotlight: ["Thankful for you, always.", "Saving you a slice of pie.", "Grateful for every moment together."],
          petSpotlight: ["Thankful for dropped turkey.", "Officially on crumb patrol."],
          group: "{names} — gathered and grateful",
          message:
            "This year we're counting our blessings, and you're near the top of the list. Thank you for being part of our story.",
          closing: { title: "Happy Thanksgiving", subtitle: "With gratitude, {from}" },
        },
      },
    ],
  },

  // ─────────────────────────── Celebrations ───────────────────────────
  {
    id: "birthday",
    name: "Birthday",
    group: "celebrations",
    emoji: "🎂",
    description: "Make a wish!",
    theme: {
      bg: ["#ffe9c7", "#ffd0e0"],
      glow: "rgba(255, 255, 255, 0.6)",
      accent: "#e0457b",
      text: "#3a1730",
      subtext: "#6e4660",
      palette: ["#ff5d8f", "#ffc93c", "#4cc9f0", "#7bd389", "#b388eb"],
      particles: ["confetti"],
      font: "sans",
      music: "joyful",
    },
    prompts: [
      {
        id: "birthday-wishes",
        title: "Birthday wishes",
        blurb: "Everyone chimes in to celebrate.",
        script: {
          intro: { title: "Happy Birthday, {to}!", subtitle: "Let's celebrate you" },
          spotlight: ["Hope all your wishes come true!", "Have the best day ever!", "Cake first, questions later.", "Another trip around the sun!"],
          petSpotlight: ["Can I have some cake?", "Birthday zoomies in your honor!"],
          group: "{names} — wishing you the happiest birthday",
          message: "Here's to another year of laughter, adventure and being exactly who you are. We're so lucky to have you.",
          closing: { title: "Happy Birthday!", subtitle: "Love, {from}" },
        },
      },
    ],
  },
  {
    id: "anniversary",
    name: "Anniversary",
    group: "celebrations",
    emoji: "💍",
    description: "Celebrating love that lasts.",
    theme: {
      bg: ["#2b1d2f", "#120b14"],
      glow: "rgba(255, 210, 180, 0.35)",
      accent: "#e8c39e",
      text: "#fff7ef",
      subtext: "#e6cdb6",
      palette: ["#e8c39e", "#ffffff", "#f4a6b8"],
      particles: ["sparkles", "hearts"],
      font: "serif",
      music: "romantic",
    },
    prompts: [
      {
        id: "anniversary-love",
        title: "Still choosing you",
        blurb: "For a partner, or a couple you love.",
        script: {
          intro: { title: "Happy Anniversary, {to}", subtitle: "Here's to us" },
          spotlight: ["Every year better than the last.", "My favorite adventure.", "Still the one."],
          group: "{names} — a love story",
          message: "Through every season and every chapter, you've been my home. Here's to all the years still ahead.",
          closing: { title: "Happy Anniversary", subtitle: "All my love, {from}" },
        },
      },
    ],
  },
  {
    id: "graduation",
    name: "Graduation",
    group: "celebrations",
    emoji: "🎓",
    description: "Caps off to the graduate.",
    theme: {
      bg: ["#101c3d", "#070d1f"],
      glow: "rgba(255, 215, 100, 0.35)",
      accent: "#ffd166",
      text: "#ffffff",
      subtext: "#c9d6ff",
      palette: ["#ffd166", "#ffffff", "#7aa2ff"],
      particles: ["confetti", "sparkles"],
      font: "sans",
      music: "anthem",
    },
    prompts: [
      {
        id: "graduation-proud",
        title: "So proud of you",
        blurb: "Celebrate a big accomplishment.",
        script: {
          intro: { title: "Congratulations, {to}!", subtitle: "You did it!" },
          spotlight: ["So proud of you!", "The future is yours.", "All that hard work paid off."],
          group: "{names} — cheering you on",
          message: "This is just the beginning. Go chase every dream — we'll be in the front row cheering the whole way.",
          closing: { title: "Congrats, Grad!", subtitle: "Love, {from}" },
        },
      },
    ],
  },

  // ─────────────────────── Comfort & remembrance ──────────────────────
  {
    id: "in-memory",
    name: "In loving memory",
    group: "comfort",
    emoji: "🕊️",
    description: "A tribute to someone who has passed.",
    theme: {
      bg: ["#1d2738", "#0b1019"],
      glow: "rgba(255, 228, 190, 0.3)",
      accent: "#e9d3a8",
      text: "#f7f3ec",
      subtext: "#cfc6b5",
      palette: ["#ffe7b3", "#ffffff"],
      particles: ["fireflies", "stars"],
      font: "serif",
      music: "gentle",
    },
    prompts: [
      {
        id: "memory-forever",
        title: "Forever in our hearts",
        blurb: "A gentle tribute celebrating a life and the love left behind.",
        script: {
          intro: { title: "In loving memory", subtitle: "Forever in our hearts" },
          spotlight: [
            "Your love is still all around us.",
            "Your laughter still echoes in our hearts.",
            "We carry you with us, every single day.",
            "The world was brighter with you in it.",
            "Gone from our sight, never from our hearts.",
          ],
          petSpotlight: MEMORIAL_PET_LINES,
          group: "{names} — loved always, missed every day",
          message:
            "Those we love never truly leave us. They live on in the stories we tell, the kindness we share and the love we carry forward.",
          closing: { title: "Always remembered", subtitle: "With love, {from}" },
        },
      },
      {
        id: "memory-letter",
        title: "A letter from them",
        blurb: "Comforting words, as if from the one you lost.",
        script: {
          intro: { title: "Dear {to},", subtitle: "Please don't be sad for long" },
          spotlight: [
            "I'm still with you — in every sunrise.",
            "Look for me in the little things.",
            "I'm so proud of you. I always was.",
            "I'm at peace now. Let your heart rest.",
          ],
          petSpotlight: [
            "I'm running free now — no more aches.",
            "Thank you for choosing me. I'd choose you again.",
            "I'll be waiting, tail wagging, when it's time.",
          ],
          group: "Love never ends. It just changes shape.",
          message:
            "When you miss me, close your eyes and remember how we laughed. That love didn't go anywhere — it's yours to keep, forever.",
          closing: { title: "I'm always with you", subtitle: "For {to}, with love from {from}" },
        },
      },
      {
        id: "memory-heaven",
        title: "Heaven gained an angel",
        blurb: "A faith-centered memorial message.",
        script: {
          intro: { title: "Heaven gained an angel", subtitle: "In loving memory" },
          spotlight: [
            "Resting in peace, held in love.",
            "Watching over us from above.",
            "Until we meet again.",
          ],
          petSpotlight: MEMORIAL_PET_LINES,
          group: "{names} — together in our prayers",
          message:
            "Though our hearts are heavy, we take comfort knowing you are at peace. We will hold you close until we meet again.",
          closing: { title: "Until we meet again", subtitle: "Forever loved by {from}" },
        },
      },
    ],
  },
  {
    id: "pet-memorial",
    name: "Pet memorial",
    group: "comfort",
    emoji: "🌈",
    description: "For a beloved pet who crossed the rainbow bridge.",
    theme: {
      bg: ["#1f3554", "#2d2048"],
      glow: "rgba(255, 220, 240, 0.35)",
      accent: "#ffd6a5",
      text: "#fff9f2",
      subtext: "#e3d4f0",
      palette: ["#ffadad", "#ffd6a5", "#fdffb6", "#caffbf", "#9bf6ff", "#bdb2ff"],
      particles: ["stars", "fireflies"],
      font: "serif",
      music: "gentle",
    },
    prompts: [
      {
        id: "rainbow-bridge",
        title: "Over the rainbow bridge",
        blurb: "A loving goodbye to a furry (or feathered!) friend.",
        script: {
          intro: { title: "Over the rainbow bridge", subtitle: "Forever our good companion" },
          spotlight: MEMORIAL_PET_LINES,
          petSpotlight: MEMORIAL_PET_LINES,
          group: "{names} — loved beyond measure",
          message:
            "Thank you for every greeting at the door, every quiet cuddle and every day you made better just by being you. Run free, sweet friend.",
          closing: { title: "Until we meet again", subtitle: "Love always, {from}" },
        },
      },
    ],
  },
  {
    id: "thinking-of-you",
    name: "Thinking of you",
    group: "comfort",
    emoji: "🤍",
    description: "Comfort for someone who is grieving or going through a hard time.",
    theme: {
      bg: ["#e8eef2", "#d7e3e8"],
      glow: "rgba(255, 255, 255, 0.7)",
      accent: "#5a8a8c",
      text: "#22343a",
      subtext: "#4f6469",
      palette: ["#bcd4d6", "#ffffff", "#f0d9c5"],
      particles: ["petals"],
      font: "serif",
      music: "gentle",
    },
    prompts: [
      {
        id: "sympathy",
        title: "With deepest sympathy",
        blurb: "Support for a friend who has lost someone.",
        script: {
          intro: { title: "Thinking of you, {to}", subtitle: "With deepest sympathy" },
          spotlight: [
            "Holding you close in our hearts.",
            "We're here, whatever you need.",
            "Sending you strength and peace.",
          ],
          petSpotlight: ["Sending you gentle cuddles.", "Here to keep you company."],
          group: "{names} — here for you",
          message:
            "There are no perfect words for a loss like this. Please know you are loved, you are not alone, and we are here for you — today and in the days ahead.",
          closing: { title: "With love and sympathy", subtitle: "{from}" },
        },
      },
      {
        id: "get-well",
        title: "Get well soon",
        blurb: "Healing wishes for someone feeling under the weather.",
        script: {
          intro: { title: "Get well soon, {to}", subtitle: "Sending healing thoughts" },
          spotlight: ["Rest up — we miss you!", "Sending you the biggest hug.", "You've got this."],
          petSpotlight: ["Prescribing one (1) cuddle.", "On duty as your nurse."],
          group: "{names} — rooting for you",
          message: "Take all the time you need to rest and heal. We're thinking of you every day and can't wait to see you feeling better.",
          closing: { title: "Feel better soon", subtitle: "Love, {from}" },
        },
      },
    ],
  },
];

export function getCategory(id: string | null | undefined): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getPrompt(category: Category | undefined, promptId: string | null | undefined): Prompt | undefined {
  return category?.prompts.find((p) => p.id === promptId);
}

export function petLinesFor(category: Category, prompt: Prompt): string[] {
  return prompt.script.petSpotlight ?? (category.group === "comfort" ? MEMORIAL_PET_LINES : DEFAULT_PET_LINES);
}
