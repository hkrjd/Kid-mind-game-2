/* ============================================================
   packs.js — every piece of "art" in the game.

   All content is emoji, which means zero image files, instant
   offline loading, and crisp rendering at any size on any tablet.

   Item fields:
     e    emoji
     hi   Hindi name (spoken and shown)
     en   English name
     c    colour family — drives colour sorting and colour prompts
     sh   shape family (shapes pack only)
     sz   1..3 relative real-world size — drives small-to-big ordering
     s    syllable/rhyme key — drives the rhyme game
   ============================================================ */

export const COLORS = {
  red:    { hi: 'लाल',    en: 'Red',    hex: '#e8503a' },
  orange: { hi: 'नारंगी',  en: 'Orange', hex: '#f28c28' },
  yellow: { hi: 'पीला',   en: 'Yellow', hex: '#f5c518' },
  green:  { hi: 'हरा',    en: 'Green',  hex: '#4caf50' },
  blue:   { hi: 'नीला',   en: 'Blue',   hex: '#3d7bd6' },
  purple: { hi: 'बैंगनी',  en: 'Purple', hex: '#9b59b6' },
  brown:  { hi: 'भूरा',   en: 'Brown',  hex: '#8d6e63' },
  pink:   { hi: 'गुलाबी',  en: 'Pink',   hex: '#e8629b' },
};

export const PACKS = {
  animals: {
    id: 'animals', icon: '🐶', hi: 'जानवर', en: 'Animals',
    items: [
      { e: '🐶', hi: 'कुत्ता',  en: 'Dog',      c: 'brown',  sz: 2, s: 'og' },
      { e: '🐱', hi: 'बिल्ली',  en: 'Cat',      c: 'orange', sz: 1, s: 'at' },
      { e: '🐮', hi: 'गाय',     en: 'Cow',      c: 'brown',  sz: 3, s: 'ow' },
      { e: '🐷', hi: 'सुअर',    en: 'Pig',      c: 'pink',   sz: 2, s: 'ig' },
      { e: '🐭', hi: 'चूहा',    en: 'Mouse',    c: 'brown',  sz: 1, s: 'ouse' },
      { e: '🐰', hi: 'खरगोश',   en: 'Rabbit',   c: 'brown',  sz: 1, s: 'it' },
      { e: '🦁', hi: 'शेर',     en: 'Lion',     c: 'yellow', sz: 3, s: 'ion' },
      { e: '🐯', hi: 'बाघ',     en: 'Tiger',    c: 'orange', sz: 3, s: 'er' },
      { e: '🐘', hi: 'हाथी',    en: 'Elephant', c: 'brown',  sz: 3, s: 'ant' },
      { e: '🐵', hi: 'बंदर',    en: 'Monkey',   c: 'brown',  sz: 2, s: 'ey' },
      { e: '🐴', hi: 'घोड़ा',   en: 'Horse',    c: 'brown',  sz: 3, s: 'orse' },
      { e: '🐑', hi: 'भेड़',    en: 'Sheep',    c: 'brown',  sz: 2, s: 'eep' },
      { e: '🐐', hi: 'बकरी',    en: 'Goat',     c: 'brown',  sz: 2, s: 'oat' },
      { e: '🐻', hi: 'भालू',    en: 'Bear',     c: 'brown',  sz: 3, s: 'ear' },
    ],
  },

  fruits: {
    id: 'fruits', icon: '🍎', hi: 'फल', en: 'Fruits',
    items: [
      { e: '🍎', hi: 'सेब',     en: 'Apple',      c: 'red',    sz: 1, s: 'apple' },
      { e: '🍌', hi: 'केला',    en: 'Banana',     c: 'yellow', sz: 2, s: 'ana' },
      { e: '🍇', hi: 'अंगूर',   en: 'Grapes',     c: 'purple', sz: 1, s: 'apes' },
      { e: '🍊', hi: 'संतरा',   en: 'Orange',     c: 'orange', sz: 1, s: 'ange' },
      { e: '🍓', hi: 'स्ट्रॉबेरी', en: 'Strawberry', c: 'red',   sz: 1, s: 'erry' },
      { e: '🍉', hi: 'तरबूज',   en: 'Watermelon', c: 'green',  sz: 3, s: 'elon' },
      { e: '🍍', hi: 'अनानास',  en: 'Pineapple',  c: 'yellow', sz: 2, s: 'apple' },
      { e: '🥭', hi: 'आम',      en: 'Mango',      c: 'orange', sz: 2, s: 'ango' },
      { e: '🍑', hi: 'आड़ू',    en: 'Peach',      c: 'pink',   sz: 1, s: 'each' },
      { e: '🍐', hi: 'नाशपाती',  en: 'Pear',       c: 'green',  sz: 1, s: 'ear' },
      { e: '🍋', hi: 'नींबू',    en: 'Lemon',      c: 'yellow', sz: 1, s: 'emon' },
      { e: '🥥', hi: 'नारियल',  en: 'Coconut',    c: 'brown',  sz: 2, s: 'ut' },
    ],
  },

  vehicles: {
    id: 'vehicles', icon: '🚗', hi: 'गाड़ियाँ', en: 'Vehicles',
    items: [
      { e: '🚗', hi: 'कार',      en: 'Car',      c: 'blue',   sz: 2, s: 'ar' },
      { e: '🚌', hi: 'बस',       en: 'Bus',      c: 'yellow', sz: 3, s: 'us' },
      { e: '🚲', hi: 'साइकिल',   en: 'Bicycle',  c: 'green',  sz: 1, s: 'icle' },
      { e: '✈️', hi: 'हवाई जहाज़', en: 'Aeroplane', c: 'blue',  sz: 3, s: 'ane' },
      { e: '🚂', hi: 'रेलगाड़ी',  en: 'Train',    c: 'brown',  sz: 3, s: 'ain' },
      { e: '🚁', hi: 'हेलीकॉप्टर', en: 'Helicopter', c: 'red',  sz: 3, s: 'er' },
      { e: '🚜', hi: 'ट्रैक्टर',   en: 'Tractor',  c: 'green',  sz: 3, s: 'or' },
      { e: '🛵', hi: 'स्कूटर',    en: 'Scooter',  c: 'red',    sz: 2, s: 'er' },
      { e: '🚑', hi: 'एम्बुलेंस',  en: 'Ambulance', c: 'red',   sz: 3, s: 'ance' },
      { e: '🚒', hi: 'दमकल',     en: 'Fire Truck', c: 'red',   sz: 3, s: 'uck' },
      { e: '⛵', hi: 'नाव',      en: 'Boat',     c: 'blue',   sz: 2, s: 'oat' },
      { e: '🚀', hi: 'रॉकेट',    en: 'Rocket',   c: 'purple', sz: 3, s: 'et' },
    ],
  },

  shapes: {
    id: 'shapes', icon: '🔷', hi: 'आकार', en: 'Shapes',
    /* Three shape families in a matching colour set — lets one pack
       drive both "sort by shape" and "sort by colour". */
    items: [
      { e: '🔴', hi: 'लाल गोला',    en: 'Red circle',    c: 'red',    sh: 'circle', sz: 2 },
      { e: '🟠', hi: 'नारंगी गोला',  en: 'Orange circle', c: 'orange', sh: 'circle', sz: 2 },
      { e: '🟡', hi: 'पीला गोला',   en: 'Yellow circle', c: 'yellow', sh: 'circle', sz: 2 },
      { e: '🟢', hi: 'हरा गोला',    en: 'Green circle',  c: 'green',  sh: 'circle', sz: 2 },
      { e: '🔵', hi: 'नीला गोला',   en: 'Blue circle',   c: 'blue',   sh: 'circle', sz: 2 },
      { e: '🟣', hi: 'बैंगनी गोला',  en: 'Purple circle', c: 'purple', sh: 'circle', sz: 2 },
      { e: '🟥', hi: 'लाल चौकोर',   en: 'Red square',    c: 'red',    sh: 'square', sz: 2 },
      { e: '🟧', hi: 'नारंगी चौकोर', en: 'Orange square', c: 'orange', sh: 'square', sz: 2 },
      { e: '🟨', hi: 'पीला चौकोर',  en: 'Yellow square', c: 'yellow', sh: 'square', sz: 2 },
      { e: '🟩', hi: 'हरा चौकोर',   en: 'Green square',  c: 'green',  sh: 'square', sz: 2 },
      { e: '🟦', hi: 'नीला चौकोर',  en: 'Blue square',   c: 'blue',   sh: 'square', sz: 2 },
      { e: '🟪', hi: 'बैंगनी चौकोर', en: 'Purple square', c: 'purple', sh: 'square', sz: 2 },
      { e: '❤️', hi: 'लाल दिल',    en: 'Red heart',     c: 'red',    sh: 'heart',  sz: 2 },
      { e: '🧡', hi: 'नारंगी दिल',  en: 'Orange heart',  c: 'orange', sh: 'heart',  sz: 2 },
      { e: '💛', hi: 'पीला दिल',   en: 'Yellow heart',  c: 'yellow', sh: 'heart',  sz: 2 },
      { e: '💚', hi: 'हरा दिल',    en: 'Green heart',   c: 'green',  sh: 'heart',  sz: 2 },
      { e: '💙', hi: 'नीला दिल',   en: 'Blue heart',    c: 'blue',   sh: 'heart',  sz: 2 },
      { e: '💜', hi: 'बैंगनी दिल',  en: 'Purple heart',  c: 'purple', sh: 'heart',  sz: 2 },
    ],
  },

  nature: {
    id: 'nature', icon: '🌳', hi: 'प्रकृति', en: 'Nature',
    items: [
      { e: '🌳', hi: 'पेड़',    en: 'Tree',     c: 'green',  sz: 3, s: 'ee' },
      { e: '🌻', hi: 'सूरजमुखी', en: 'Sunflower', c: 'yellow', sz: 2, s: 'ower' },
      { e: '🌹', hi: 'गुलाब',   en: 'Rose',     c: 'red',    sz: 1, s: 'ose' },
      { e: '☀️', hi: 'सूरज',    en: 'Sun',      c: 'yellow', sz: 3, s: 'un' },
      { e: '🌙', hi: 'चाँद',    en: 'Moon',     c: 'yellow', sz: 3, s: 'oon' },
      { e: '⭐', hi: 'तारा',    en: 'Star',     c: 'yellow', sz: 2, s: 'ar' },
      { e: '☁️', hi: 'बादल',    en: 'Cloud',    c: 'blue',   sz: 3, s: 'oud' },
      { e: '🌈', hi: 'इंद्रधनुष', en: 'Rainbow',  c: 'purple', sz: 3, s: 'ow' },
      { e: '🍂', hi: 'पत्ता',   en: 'Leaf',     c: 'brown',  sz: 1, s: 'eaf' },
      { e: '🌵', hi: 'नागफनी',  en: 'Cactus',   c: 'green',  sz: 2, s: 'us' },
      { e: '🔥', hi: 'आग',      en: 'Fire',     c: 'orange', sz: 2, s: 'ire' },
      { e: '💧', hi: 'पानी',    en: 'Water',    c: 'blue',   sz: 1, s: 'ater' },
    ],
  },

  toys: {
    id: 'toys', icon: '🧸', hi: 'खिलौने', en: 'Toys',
    items: [
      { e: '🧸', hi: 'टेडी',    en: 'Teddy',   c: 'brown',  sz: 2, s: 'eddy' },
      { e: '⚽', hi: 'गेंद',    en: 'Ball',    c: 'green',  sz: 2, s: 'all' },
      { e: '🎈', hi: 'गुब्बारा', en: 'Balloon', c: 'red',    sz: 2, s: 'oon' },
      { e: '🪁', hi: 'पतंग',    en: 'Kite',    c: 'orange', sz: 2, s: 'ite' },
      { e: '🎁', hi: 'तोहफ़ा',  en: 'Gift',    c: 'pink',   sz: 2, s: 'ift' },
      { e: '🧩', hi: 'पहेली',   en: 'Puzzle',  c: 'blue',   sz: 1, s: 'uzzle' },
      { e: '🎨', hi: 'रंग',     en: 'Paints',  c: 'purple', sz: 2, s: 'aints' },
      { e: '🥁', hi: 'ढोल',     en: 'Drum',    c: 'red',    sz: 2, s: 'um' },
      { e: '🪀', hi: 'लट्टू',   en: 'Yo-yo',   c: 'red',    sz: 1, s: 'oyo' },
      { e: '🎺', hi: 'तुरही',   en: 'Trumpet', c: 'yellow', sz: 2, s: 'et' },
      { e: '🎲', hi: 'पासा',      en: 'Dice',      c: 'red',  sz: 1, s: 'ice' },
      { e: '🎪', hi: 'सर्कस',   en: 'Circus',  c: 'red',    sz: 3, s: 'us' },
    ],
  },

  food: {
    id: 'food', icon: '🍕', hi: 'खाना', en: 'Food',
    items: [
      { e: '🍕', hi: 'पिज़्ज़ा',  en: 'Pizza',   c: 'orange', sz: 2, s: 'izza' },
      { e: '🍔', hi: 'बर्गर',   en: 'Burger',  c: 'brown',  sz: 2, s: 'er' },
      { e: '🍞', hi: 'रोटी',    en: 'Bread',   c: 'brown',  sz: 2, s: 'ead' },
      { e: '🥚', hi: 'अंडा',    en: 'Egg',     c: 'yellow', sz: 1, s: 'egg' },
      { e: '🧀', hi: 'पनीर',    en: 'Cheese',  c: 'yellow', sz: 1, s: 'eese' },
      { e: '🍪', hi: 'बिस्कुट',  en: 'Cookie',  c: 'brown',  sz: 1, s: 'ookie' },
      { e: '🍰', hi: 'केक',     en: 'Cake',    c: 'pink',   sz: 2, s: 'ake' },
      { e: '🍦', hi: 'आइसक्रीम', en: 'Ice cream', c: 'pink', sz: 1, s: 'eam' },
      { e: '🥕', hi: 'गाजर',    en: 'Carrot',  c: 'orange', sz: 1, s: 'ot' },
      { e: '🌽', hi: 'भुट्टा',   en: 'Corn',    c: 'yellow', sz: 2, s: 'orn' },
      { e: '🥔', hi: 'आलू',     en: 'Potato',  c: 'brown',  sz: 1, s: 'ato' },
      { e: '🍅', hi: 'टमाटर',   en: 'Tomato',  c: 'red',    sz: 1, s: 'ato' },
    ],
  },

  sea: {
    id: 'sea', icon: '🐟', hi: 'समुंदर', en: 'Sea',
    items: [
      { e: '🐟', hi: 'मछली',   en: 'Fish',      c: 'blue',   sz: 1, s: 'ish' },
      { e: '🐙', hi: 'ऑक्टोपस', en: 'Octopus',   c: 'purple', sz: 2, s: 'us' },
      { e: '🦀', hi: 'केकड़ा',  en: 'Crab',      c: 'red',    sz: 1, s: 'ab' },
      { e: '🐬', hi: 'डॉल्फ़िन', en: 'Dolphin',   c: 'blue',   sz: 3, s: 'in' },
      { e: '🐳', hi: 'व्हेल',   en: 'Whale',     c: 'blue',   sz: 3, s: 'ale' },
      { e: '🦈', hi: 'शार्क',   en: 'Shark',     c: 'blue',   sz: 3, s: 'ark' },
      { e: '🐚', hi: 'सीप',     en: 'Shell',     c: 'pink',   sz: 1, s: 'ell' },
      { e: '🐢', hi: 'कछुआ',    en: 'Turtle',    c: 'green',  sz: 2, s: 'urtle' },
      { e: '🦐', hi: 'झींगा',   en: 'Prawn',     c: 'orange', sz: 1, s: 'awn' },
      { e: '🐊', hi: 'मगरमच्छ',   en: 'Crocodile', c: 'green',  sz: 3, s: 'ile' },
      { e: '🐧', hi: 'पेंगुइन',  en: 'Penguin',   c: 'blue',   sz: 2, s: 'in' },
      { e: '🦭', hi: 'सील',     en: 'Seal',      c: 'brown',  sz: 3, s: 'eal' },
    ],
  },

  birds: {
    id: 'birds', icon: '🦜', hi: 'पक्षी', en: 'Birds',
    items: [
      { e: '🦜', hi: 'तोता',    en: 'Parrot',   c: 'green',  sz: 2, s: 'ot' },
      { e: '🦉', hi: 'उल्लू',   en: 'Owl',      c: 'brown',  sz: 2, s: 'owl' },
      { e: '🐦', hi: 'चिड़िया',  en: 'Bird',     c: 'blue',   sz: 1, s: 'ird' },
      { e: '🦅', hi: 'चील',     en: 'Eagle',    c: 'brown',  sz: 3, s: 'agle' },
      { e: '🦆', hi: 'बत्तख',   en: 'Duck',     c: 'yellow', sz: 2, s: 'uck' },
      { e: '🦢', hi: 'हंस',     en: 'Swan',     c: 'blue',   sz: 3, s: 'an' },
      { e: '🐔', hi: 'मुर्गी',   en: 'Hen',      c: 'brown',  sz: 2, s: 'en' },
      { e: '🐣', hi: 'चूज़ा',   en: 'Chick',    c: 'yellow', sz: 1, s: 'ick' },
      { e: '🦚', hi: 'मोर',     en: 'Peacock',  c: 'blue',   sz: 3, s: 'ock' },
      { e: '🕊️', hi: 'कबूतर',  en: 'Dove',     c: 'blue',   sz: 2, s: 'ove' },
      { e: '🦩', hi: 'राजहंस',  en: 'Flamingo', c: 'pink',   sz: 3, s: 'ingo' },
      { e: '🦃', hi: 'टर्की',   en: 'Turkey',   c: 'brown',  sz: 3, s: 'ey' },
    ],
  },

  home: {
    id: 'home', icon: '🏠', hi: 'घर की चीज़ें', en: 'Home',
    items: [
      { e: '🪑', hi: 'कुर्सी',  en: 'Chair',   c: 'brown',  sz: 2, s: 'air' },
      { e: '🛏️', hi: 'बिस्तर',  en: 'Bed',     c: 'blue',   sz: 3, s: 'ed' },
      { e: '🚪', hi: 'दरवाज़ा', en: 'Door',    c: 'brown',  sz: 3, s: 'oor' },
      { e: '🪟', hi: 'खिड़की',  en: 'Window',  c: 'blue',   sz: 2, s: 'ow' },
      { e: '🕰️', hi: 'घड़ी',   en: 'Clock',   c: 'brown',  sz: 2, s: 'ock' },
      { e: '💡', hi: 'बल्ब',    en: 'Lamp',    c: 'yellow', sz: 1, s: 'amp' },
      { e: '🧹', hi: 'झाड़ू',   en: 'Broom',   c: 'brown',  sz: 2, s: 'oom' },
      { e: '🥄', hi: 'चम्मच',   en: 'Spoon',   c: 'blue',   sz: 1, s: 'oon' },
      { e: '🍽️', hi: 'थाली',   en: 'Plate',   c: 'blue',   sz: 1, s: 'ate' },
      { e: '☕', hi: 'कप',      en: 'Cup',     c: 'brown',  sz: 1, s: 'up' },
      { e: '🪣', hi: 'बाल्टी',  en: 'Bucket',  c: 'blue',   sz: 2, s: 'et' },
      { e: '📚', hi: 'किताब',   en: 'Book',    c: 'red',    sz: 1, s: 'ook' },
    ],
  },
};

/** Every pack an engine may draw generic items from. */
export const GENERIC_PACK_IDS = ['animals', 'fruits', 'vehicles', 'nature', 'toys', 'food', 'sea', 'birds', 'home'];

export function getPack(id) {
  return PACKS[id] || PACKS.animals;
}

/* ------------------------------------------------------------
   Letters — English A-Z and the Hindi varnamala.
   `sound` is what the voice says when asking for the letter.
   ------------------------------------------------------------ */

export const LETTERS = {
  en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((ch) => ({
    e: ch, hi: ch, en: ch, sound: ch,
  })),
  hi: [
    'क', 'ख', 'ग', 'घ', 'च', 'छ', 'ज', 'झ', 'ट', 'ठ', 'ड', 'ढ',
    'त', 'थ', 'द', 'ध', 'न', 'प', 'फ', 'ब', 'भ', 'म',
    'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह',
  ].map((ch) => ({ e: ch, hi: ch, en: ch, sound: ch })),
};

/** Vowels/starters shown first — the easiest tier. */
export const EASY_LETTERS = {
  en: 'ABCDEFGHIJ'.split('').map((ch) => ({ e: ch, hi: ch, en: ch, sound: ch })),
  hi: ['क', 'ख', 'ग', 'घ', 'च', 'छ', 'ज', 'ट', 'ड', 'त'].map((ch) => ({ e: ch, hi: ch, en: ch, sound: ch })),
};

/* ------------------------------------------------------------
   Numbers 1-10, with a countable emoji face.
   ------------------------------------------------------------ */

export const NUMBERS = Array.from({ length: 11 }, (_, n) => ({
  n,
  e: ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][n],
}));

/* ------------------------------------------------------------
   Pair relations for the matching game — each is a real-world
   association a 5-year-old already knows.
   ------------------------------------------------------------ */

export const PAIR_SETS = {
  homes: {
    id: 'homes', hi: 'किसका घर?', en: 'Whose home?',
    pairs: [
      { a: '🐶', b: '🏠', ahi: 'कुत्ता', bhi: 'घर',    aen: 'Dog',   ben: 'Kennel' },
      { a: '🐝', b: '🍯', ahi: 'मधुमक्खी', bhi: 'शहद', aen: 'Bee',   ben: 'Honey' },
      { a: '🐦', b: '🪹', ahi: 'चिड़िया', bhi: 'घोंसला', aen: 'Bird', ben: 'Nest' },
      { a: '🐟', b: '🌊', ahi: 'मछली',  bhi: 'पानी',   aen: 'Fish',  ben: 'Water' },
      { a: '🐴', b: '🌾', ahi: 'घोड़ा', bhi: 'खेत',    aen: 'Horse', ben: 'Field' },
      { a: '🐻', b: '🕳️', ahi: 'भालू', bhi: 'गुफा',   aen: 'Bear',  ben: 'Cave' },
    ],
  },
  babies: {
    id: 'babies', hi: 'किसका बच्चा?', en: 'Whose baby?',
    pairs: [
      { a: '🐔', b: '🐣', ahi: 'मुर्गी', bhi: 'चूज़ा',  aen: 'Hen',   ben: 'Chick' },
      { a: '🐮', b: '🐄', ahi: 'गाय',   bhi: 'बछड़ा',  aen: 'Cow',   ben: 'Calf' },
      { a: '🐶', b: '🐕', ahi: 'कुत्ता', bhi: 'पिल्ला', aen: 'Dog',   ben: 'Puppy' },
      { a: '🐱', b: '🐈', ahi: 'बिल्ली', bhi: 'बिल्ली का बच्चा', aen: 'Cat', ben: 'Kitten' },
      { a: '🦆', b: '🐤', ahi: 'बत्तख', bhi: 'बत्तख का बच्चा', aen: 'Duck', ben: 'Duckling' },
      { a: '🐸', b: '🐛', ahi: 'मेंढक', bhi: 'लार्वा', aen: 'Frog',  ben: 'Tadpole' },
    ],
  },
  goestogether: {
    id: 'goestogether', hi: 'क्या किसके साथ?', en: 'What goes together?',
    pairs: [
      { a: '🌧️', b: '☂️', ahi: 'बारिश', bhi: 'छाता',  aen: 'Rain',  ben: 'Umbrella' },
      { a: '🔒', b: '🔑', ahi: 'ताला',  bhi: 'चाबी',   aen: 'Lock',  ben: 'Key' },
      { a: '🪥', b: '🦷', ahi: 'ब्रश',  bhi: 'दाँत',   aen: 'Brush', ben: 'Tooth' },
      { a: '🦶', b: '🧦', ahi: 'पैर',   bhi: 'मोज़ा',  aen: 'Foot',  ben: 'Sock' },
      { a: '✏️', b: '📄', ahi: 'पेंसिल', bhi: 'कागज़', aen: 'Pencil', ben: 'Paper' },
      { a: '🕯️', b: '🎂', ahi: 'मोमबत्ती', bhi: 'केक', aen: 'Candle', ben: 'Cake' },
    ],
  },
};

export const PAIR_SET_IDS = Object.keys(PAIR_SETS);
