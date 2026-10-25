import { HindiTypingConverter, normalizeDevanagariOrder } from './hindiTyping';

const convertKey = (converter, key, shiftKey = false, text = '', cursor = text.length) => {
  const event = {
    key,
    shiftKey,
    altKey: false,
    preventDefault: jest.fn(),
  };
  return converter.handleKeyPress(event, text, cursor, cursor);
};

describe('HindiTypingConverter fixed keyboard layouts', () => {
  test.each(Object.entries({
    a: 'ं', s: 'े', d: 'क', f: 'ि', g: 'ह', h: 'ी', j: 'र', k: 'ा', l: 'स',
    ';': 'य', "'": 'श्', '\\': '(', q: 'ु', w: 'ू', e: 'म', r: 'त', t: 'ज',
    y: 'ल', u: 'न', i: 'प', o: 'व', p: 'च', '[': 'ख', ']': ',', z: '्र',
    x: 'ग', c: 'ब', v: 'अ', b: 'इ', n: 'द', m: 'उ', ',': 'ए', '.': 'ण्',
    '/': 'ध्', '`': '़', '-': ';', '=': 'ृ',
  }))('Remington %s produces %s', (key, expected) => {
    expect(convertKey(new HindiTypingConverter('remington'), key).char).toBe(expected);
  });

  test.each(Object.entries({
    A: 'ा', S: 'ै', D: 'क्', F: 'थ्', G: 'ळ', H: 'भ्', J: 'श्र', K: 'ज्ञ',
    L: 'स्', ':': 'रु', '"': 'ष्', '|': ')', Q: 'फ', W: 'ॅ', E: 'म्',
    R: 'त्', T: 'ज्', Y: 'ल्', U: 'न्', I: 'प्', O: 'व्', P: 'च्',
    '{': 'क्ष्', '}': 'द्व', Z: 'र्', X: 'ग्', C: 'ब्', V: 'ट', B: 'ठ',
    N: 'छ', M: 'ड', '<': 'ढ', '>': 'झ', '?': 'घ', '~': 'द्य', '!': '।',
    '@': '/', '#': 'ः', '$': '*', '%': '-', '^': "'", '&': "'", '*': 'द्ध',
    '(': 'त्र', ')': 'ऋ', _: '.', '+': '्',
  }))('Shift+Remington %s produces %s', (key, expected) => {
    expect(convertKey(new HindiTypingConverter('remington'), key, true).char).toBe(expected);
  });

  test.each(Object.entries({
    a: 'ो', s: 'े', d: '्', f: 'ि', g: 'ु', h: 'प', j: 'र', k: 'क', l: 'त',
    ';': 'च', "'": 'ट', '\\': 'ॉ', q: 'ौ', w: 'ै', e: 'ा', r: 'ी', t: 'ू',
    y: 'ब', u: 'ह', i: 'ग', o: 'द', p: 'ज', '[': 'ड', ']': '़', x: 'ं',
    c: 'म', v: 'न', b: 'व', n: 'ल', m: 'स', ',': ',', '.': '.', '/': 'य',
    '`': 'ो', '-': '-', '=': 'ृ',
  }))('Inscript %s produces %s', (key, expected) => {
    expect(convertKey(new HindiTypingConverter('inscript'), key).char).toBe(expected);
  });

  test.each(Object.entries({
    A: 'ओ', S: 'ए', D: 'अ', F: 'इ', G: 'उ', H: 'फ', K: 'ख', L: 'थ',
    ':': 'च', '"': 'ट', Q: 'औ', W: 'ऐ', E: 'आ', R: 'ई', T: 'ऊ', Y: 'भ',
    U: 'ङ', I: 'घ', O: 'ध', P: 'झ', '{': 'ड', '}': 'ञ', X: 'ँ', C: 'ण',
    N: 'ळ', M: 'श', '<': ',', '>': '.', '?': 'य', '~': 'ओ', '@': 'ॅ',
    '#': '्र', '$': 'र्', '%': 'ज्ञ', '^': 'त्र', '&': 'क्ष', '*': 'श्र',
    '(': '(', ')': ')', _: 'ः', '+': 'ऋ',
  }))('Shift+Inscript %s produces %s', (key, expected) => {
    expect(convertKey(new HindiTypingConverter('inscript'), key, true).char).toBe(expected);
  });

  test('Remington inserts each key without rewriting earlier text', () => {
    const converter = new HindiTypingConverter('remington');
    const first = convertKey(converter, 'd', false, '', 0);
    const second = convertKey(converter, 'r', false, first.char, first.char.length);

    expect(first.char + second.char).toBe('कत');
    expect(second.replaceStart).toBe(first.char.length);
    expect(second.replaceLength).toBe(0);
  });

  test('batch conversion preserves Shift mappings for mobile input', () => {
    expect(new HindiTypingConverter('remington').convertText('dD!')).toBe('कक्।');
    expect(new HindiTypingConverter('inscript').convertText('kK@')).toBe('कखॅ');
  });

  test.each(['z', 'Z', 'V', 'B', 'J'])('Inscript silent key %s is consumed', (key) => {
    const result = convertKey(
      new HindiTypingConverter('inscript'),
      key,
      key !== key.toLowerCase()
    );
    expect(result.char).toBe('');
  });
});

describe('normalizeDevanagariOrder', () => {
  test('moves short i-matra onto the consonant typed before it', () => {
    expect(normalizeDevanagariOrder('िकताब')).toBe('किताब');
    expect(normalizeDevanagariOrder('िमत्र')).toBe('मित्र');
    expect(normalizeDevanagariOrder('अिधक')).toBe('अधिक');
    expect(normalizeDevanagariOrder('िक्त')).toBe('क्ति');
    expect(normalizeDevanagariOrder('क्ित')).toBe('क्ति');
  });

  test('leaves Unicode order and long matras unchanged', () => {
    expect(normalizeDevanagariOrder('किताब')).toBe('किताब');
    expect(normalizeDevanagariOrder('का की कू के कु')).toBe('का की कू के कु');
  });

  test('joins a half letter when a space sits on the halant', () => {
    expect(normalizeDevanagariOrder('क ् त')).toBe('क्त');
    expect(normalizeDevanagariOrder('ज\n्\nञान')).toBe('ज्ञान');
  });

  test('joins अ and a following matra into one vowel', () => {
    expect(normalizeDevanagariOrder('अा')).toBe('आ');
    expect(normalizeDevanagariOrder('अी')).toBe('ई');
    expect(normalizeDevanagariOrder('का')).toBe('का');
    expect(normalizeDevanagariOrder('अिधक')).toBe('अधिक');
  });

  test('typing v then f puts the long i-matra on the right of अ', () => {
    expect(normalizeDevanagariOrder('अि', true)).toBe('अी');
    expect(normalizeDevanagariOrder('अित', true)).toBe('अति');
    expect(normalizeDevanagariOrder('िक', true)).toBe('कि');
  });

  test('typing v f / k joins the half letter and puts the short i-matra on ध', () => {
    expect(normalizeDevanagariOrder('ध्ा')).toBe('ध');
    expect(normalizeDevanagariOrder('अिध्ा', true)).toBe('अधि');
    expect(normalizeDevanagariOrder('अीध्ा', true)).toBe('अधि');
    expect(normalizeDevanagariOrder('अिध्ाक', true)).toBe('अधिक');
    expect(normalizeDevanagariOrder('अी', true)).toBe('ई');
    expect(normalizeDevanagariOrder('क्त')).toBe('क्त');
  });
});
