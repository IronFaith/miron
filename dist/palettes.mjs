export const palettes = [
  { name: 'Original', main: '#000000', accent: '#ffffff' },
  { name: 'Slate', main: '#171d26', accent: '#c3cfdb' },
  { name: 'Navy & gold', main: '#101c2a', accent: '#d7b77a' },
  { name: 'Evergreen', main: '#142b25', accent: '#dce7ca' },
  { name: 'Warm stone', main: '#f2efe8', accent: '#514b40' },
  { name: 'Gallery', main: '#fafafa', accent: '#171717' }
];

export function normalizeHex(value) {
  if (typeof value !== 'string') return null;
  const hex = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(hex)) return hex;
  if (/^#[0-9a-f]{3}$/.test(hex)) return `#${[...hex.slice(1)].map(char => char + char).join('')}`;
  return null;
}

const rgb = hex => hex.slice(1).match(/../g).map(value => parseInt(value, 16));
const luminance = hex => rgb(hex).map(value => {
  const channel = value / 255;
  return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
}).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);

export const contrast = (first, second) => {
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
};
const ink = background => contrast('#000000', background) >= contrast('#ffffff', background) ? '#000000' : '#ffffff';
const mix = (first, second, amount) => {
  const a = rgb(first), b = rgb(second);
  return '#' + a.map((value, i) => Math.round(value + (b[i] - value) * amount).toString(16).padStart(2, '0')).join('');
};

export function themeColors(mainInput, accentInput) {
  const main = normalizeHex(mainInput), accent = normalizeHex(accentInput);
  if (!main || !accent) throw new TypeError('Choose valid hex colors.');
  const text = ink(main), onAccent = ink(accent);
  const surface = amount => {
    const candidate = mix(main, text, amount);
    return contrast(text, candidate) >= 4.5 ? candidate : mix(main, text === '#000000' ? '#ffffff' : '#000000', amount);
  };
  const panel = surface(.06), field = surface(.1);
  const hover = mix(accent, onAccent, .1);
  const readable = color => {
    for (let step = 0; step <= 100; step++) {
      const candidate = mix(color, text, step / 100);
      if ([main, panel, field].every(background => contrast(candidate, background) >= 4.5)) return candidate;
    }
    return text;
  };
  return {
    main, accent, text, onAccent, panel, field,
    muted: readable(mix(main, text, .67)),
    line: mix(main, text, .3),
    accentInk: readable(accent),
    accentHover: contrast(onAccent, hover) >= 4.5 ? hover : mix(accent, onAccent === '#000000' ? '#ffffff' : '#000000', .1),
    scheme: text === '#ffffff' ? 'dark' : 'light',
    accentScheme: onAccent === '#ffffff' ? 'dark' : 'light'
  };
}
