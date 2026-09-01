/* ============================================================
   i18n.js — Hindi + English strings for every on-screen word
   and every spoken line.

   A 5-year-old cannot read, so most of these strings exist to be
   *spoken* (see audio.speak). Keep them short, warm, and phrased
   as a friendly instruction, not a command.
   ============================================================ */

export const LANGS = ['hi', 'en'];

const STRINGS = {
  hi: {
    /* --- app chrome --- */
    'app.title': 'दिमाग़ का खेल',
    'app.subtitle': '300 खेल · 5 साल के बच्चों के लिए',
    'app.play': 'खेलो',
    'app.home': 'घर',
    'app.back': 'वापस',
    'app.next': 'अगला',
    'app.again': 'फिर से',
    'app.settings': 'सेटिंग',
    'app.listen': 'फिर सुनो',
    'app.stars': 'सितारे',
    'app.locked': 'अभी बंद है',
    'app.loading': 'तैयार हो रहा है…',
    'app.error': 'अरे! ये खेल नहीं खुला।',

    /* --- praise. Rotated so it never feels robotic. --- */
    'praise.1': 'शाबाश!',
    'praise.2': 'बहुत बढ़िया!',
    'praise.3': 'वाह!',
    'praise.4': 'एकदम सही!',
    'praise.5': 'क्या बात है!',
    'praise.6': 'तुम तो बहुत होशियार हो!',

    /* --- gentle nudges. Never "wrong", never "no". --- */
    'oops.1': 'फिर से कोशिश करो',
    'oops.2': 'लगभग सही!',
    'oops.3': 'एक बार और देखो',
    'oops.4': 'कोई बात नहीं, फिर से',

    'hint.look': 'ये देखो!',
    'reward.done': 'हो गया!',
    'reward.world': 'ये दुनिया पूरी हो गई!',

    /* --- game prompts, one per engine --- */
    'p.memory': 'एक जैसे दो कार्ड ढूँढो',
    'p.oddone': 'अलग कौन सा है?',
    'p.sorting': 'हर चीज़ को सही डिब्बे में डालो',
    'p.counting': 'गिनो और सही नंबर दबाओ',
    'p.matching': 'जोड़ी मिलाओ',
    'p.pattern': 'आगे क्या आएगा?',
    'p.ordering': 'छोटे से बड़े के क्रम में लगाओ',
    'p.findhidden': 'ये कहाँ छुपा है?',
    'p.numberline': 'नंबरों को क्रम में लगाओ',
    'p.moreless': 'ज़्यादा किस तरफ़ है?',
    'p.moreless.less': 'कम किस तरफ़ है?',
    'p.simon': 'जो देखा वो दोहराओ',
    'p.spotdiff': 'फ़र्क़ ढूँढो',
    'p.letters': 'जो अक्षर सुना वो दबाओ',
    'p.firstsound': 'कौन सा शब्द इस आवाज़ से शुरू होता है?',
    'p.shadow': 'परछाई किसकी है?',
    'p.jigsaw': 'तस्वीर पूरी करो',
    'p.maze': 'रास्ता ढूँढो',
    'p.tracing': 'लकीर पर उँगली चलाओ',
    'p.shapefit': 'आकार को सही जगह पर रखो',
    'p.addsub.add': 'कुल कितने हुए?',
    'p.addsub.sub': 'कितने बचे?',

    /* --- settings --- */
    'set.title': 'माता-पिता की सेटिंग',
    'set.lang': 'भाषा',
    'set.sound': 'आवाज़',
    'set.voice': 'बोलकर बताना',
    'set.motion': 'हिलती-डुलती तस्वीरें',
    'set.on': 'चालू',
    'set.off': 'बंद',
    'set.reset': 'सारी प्रगति मिटाओ',
    'set.reset.confirm': 'पक्का? सारे सितारे मिट जाएँगे।',
    'set.reset.yes': 'हाँ, मिटाओ',
    'set.reset.no': 'नहीं',
    'set.progress': 'प्रगति',
    'set.progress.val': '{total} में से {done} खेल पूरे · {stars} सितारे',

    /* --- parent gate --- */
    'gate.title': 'बड़ों के लिए',
    'gate.hint': 'तीन सेकंड तक दबाकर रखो',

    /* --- worlds --- */
    'w.memory': 'याददाश्त',
    'w.logic': 'सोच-समझ',
    'w.numbers': 'गिनती',
    'w.letters': 'अक्षर',
    'w.shapes': 'आकार',
    'w.pairs': 'जोड़ी',
    'w.attention': 'ध्यान',
    'w.motor': 'उँगली का खेल',
    'w.pattern': 'पैटर्न',
    'w.master': 'महारत',

    /* --- numbers, spoken --- */
    'n.0': 'शून्य', 'n.1': 'एक', 'n.2': 'दो', 'n.3': 'तीन', 'n.4': 'चार', 'n.5': 'पाँच',
    'n.6': 'छह', 'n.7': 'सात', 'n.8': 'आठ', 'n.9': 'नौ', 'n.10': 'दस',

    /* --- colours, spoken --- */
    'c.red': 'लाल', 'c.orange': 'नारंगी', 'c.yellow': 'पीला', 'c.green': 'हरा',
    'c.blue': 'नीला', 'c.purple': 'बैंगनी', 'c.pink': 'गुलाबी', 'c.brown': 'भूरा',

    /* --- shapes, spoken --- */
    's.circle': 'गोल', 's.square': 'चौकोर', 's.triangle': 'तिकोना',
    's.star': 'तारा', 's.heart': 'दिल', 's.diamond': 'चौकोन',

    /* --- size words --- */
    'z.small': 'छोटा', 'z.big': 'बड़ा',
  },

  en: {
    'app.title': 'Mind Games',
    'app.subtitle': '300 games · for 5-year-olds',
    'app.play': 'Play',
    'app.home': 'Home',
    'app.back': 'Back',
    'app.next': 'Next',
    'app.again': 'Again',
    'app.settings': 'Settings',
    'app.listen': 'Say it again',
    'app.stars': 'Stars',
    'app.locked': 'Locked',
    'app.loading': 'Getting ready…',
    'app.error': 'Oops! That game did not open.',

    'praise.1': 'Well done!',
    'praise.2': 'Awesome!',
    'praise.3': 'Wow!',
    'praise.4': 'That is right!',
    'praise.5': 'Brilliant!',
    'praise.6': 'You are so clever!',

    'oops.1': 'Try again',
    'oops.2': 'Almost!',
    'oops.3': 'Have another look',
    'oops.4': 'No worries, try again',

    'hint.look': 'Look here!',
    'reward.done': 'You did it!',
    'reward.world': 'World complete!',

    'p.memory': 'Find the two cards that match',
    'p.oddone': 'Which one is different?',
    'p.sorting': 'Put each thing in the right box',
    'p.counting': 'Count them and tap the number',
    'p.matching': 'Match the pairs',
    'p.pattern': 'What comes next?',
    'p.ordering': 'Put them in order, small to big',
    'p.findhidden': 'Where is it hiding?',
    'p.numberline': 'Put the numbers in order',
    'p.moreless': 'Which side has more?',
    'p.moreless.less': 'Which side has fewer?',
    'p.simon': 'Repeat what you saw',
    'p.spotdiff': 'Find what is different',
    'p.letters': 'Tap the letter you hear',
    'p.firstsound': 'Which word starts with this sound?',
    'p.shadow': 'Whose shadow is this?',
    'p.jigsaw': 'Finish the picture',
    'p.maze': 'Find the way',
    'p.tracing': 'Trace the line with your finger',
    'p.shapefit': 'Put the shape in its place',
    'p.addsub.add': 'How many altogether?',
    'p.addsub.sub': 'How many are left?',

    'set.title': 'Grown-up settings',
    'set.lang': 'Language',
    'set.sound': 'Sound',
    'set.voice': 'Spoken instructions',
    'set.motion': 'Animations',
    'set.on': 'On',
    'set.off': 'Off',
    'set.reset': 'Erase all progress',
    'set.reset.confirm': 'Sure? All stars will be erased.',
    'set.reset.yes': 'Yes, erase',
    'set.reset.no': 'No',
    'set.progress': 'Progress',
    'set.progress.val': '{done} of {total} games done · {stars} stars',

    'gate.title': 'For grown-ups',
    'gate.hint': 'Press and hold for three seconds',

    'w.memory': 'Memory',
    'w.logic': 'Thinking',
    'w.numbers': 'Numbers',
    'w.letters': 'Letters',
    'w.shapes': 'Shapes',
    'w.pairs': 'Pairs',
    'w.attention': 'Attention',
    'w.motor': 'Finger Fun',
    'w.pattern': 'Patterns',
    'w.master': 'Master',

    'n.0': 'zero', 'n.1': 'one', 'n.2': 'two', 'n.3': 'three', 'n.4': 'four', 'n.5': 'five',
    'n.6': 'six', 'n.7': 'seven', 'n.8': 'eight', 'n.9': 'nine', 'n.10': 'ten',

    'c.red': 'red', 'c.orange': 'orange', 'c.yellow': 'yellow', 'c.green': 'green',
    'c.blue': 'blue', 'c.purple': 'purple', 'c.pink': 'pink', 'c.brown': 'brown',

    's.circle': 'circle', 's.square': 'square', 's.triangle': 'triangle',
    's.star': 'star', 's.heart': 'heart', 's.diamond': 'diamond',

    'z.small': 'small', 'z.big': 'big',
  },
};

let lang = 'hi';

export function setLang(l) {
  if (LANGS.includes(l)) {
    lang = l;
    document.documentElement.lang = l;
  }
}

export function getLang() {
  return lang;
}

/** BCP-47 tag for speechSynthesis voice matching. */
export function speechLocale() {
  return lang === 'hi' ? 'hi-IN' : 'en-IN';
}

/**
 * Look up a string. Falls back English -> key so a missing
 * translation shows something usable instead of blank UI.
 * `{name}` placeholders are filled from `params`.
 */
export function t(key, params) {
  let s = STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
  if (params) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in params ? params[k] : m));
  return s;
}

/** The name of a pack item in the current language. */
export function itemName(item) {
  return item?.[lang] ?? item?.en ?? '';
}

/** A number as a spoken word (0-10), else the digits. */
export function numWord(n) {
  return n >= 0 && n <= 10 ? t(`n.${n}`) : String(n);
}

export function randomPraise(rng) {
  return t(`praise.${(rng ? rng.int(1, 6) : 1 + Math.floor(Math.random() * 6))}`);
}

export function randomOops(rng) {
  return t(`oops.${(rng ? rng.int(1, 4) : 1 + Math.floor(Math.random() * 4))}`);
}

/** Dev guard: both languages must define exactly the same keys. */
export function missingKeys() {
  const hi = Object.keys(STRINGS.hi);
  const en = Object.keys(STRINGS.en);
  return {
    missingInHi: en.filter((k) => !hi.includes(k)),
    missingInEn: hi.filter((k) => !en.includes(k)),
  };
}
