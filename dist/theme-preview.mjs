import { palettes, normalizeHex, themeColors } from './palettes.mjs';

const root = document.documentElement;
const panel = document.querySelector('#palette-panel');
const toggle = document.querySelector('#palette-toggle');
const presets = document.querySelector('#palette-presets');
const message = document.querySelector('#palette-message');
const error = document.querySelector('#palette-error');
const storageKey = 'miron-color-preview';
const controls = Object.fromEntries(['main', 'accent'].map(key => [key, {
  color: document.querySelector(`#palette-${key}`),
  hex: document.querySelector(`#palette-${key}-hex`)
}]));
const variables = {
  '--black': 'main', '--white': 'text', '--muted': 'muted', '--line': 'line', '--panel': 'panel',
  '--preview-field': 'field', '--preview-accent': 'accent', '--preview-accent-ink': 'accentInk',
  '--preview-on-accent': 'onAccent', '--preview-accent-hover': 'accentHover', '--preview-accent-scheme': 'accentScheme'
};
let current = { main: palettes[0].main, accent: palettes[0].accent };

function apply(colors, save = true) {
  const theme = themeColors(colors.main, colors.accent);
  current = { main: theme.main, accent: theme.accent };
  const original = current.main === palettes[0].main && current.accent === palettes[0].accent;
  if (original) {
    delete root.dataset.colorPreview;
    root.style.removeProperty('color-scheme');
    Object.keys(variables).forEach(key => root.style.removeProperty(key));
  } else {
    root.dataset.colorPreview = theme.scheme;
    root.style.colorScheme = theme.scheme;
    Object.entries(variables).forEach(([variable, key]) => root.style.setProperty(variable, theme[key]));
  }
  document.querySelector('meta[name="theme-color"]').content = current.main;
  Object.entries(controls).forEach(([key, control]) => {
    control.color.value = current[key];
    control.hex.value = current[key].toUpperCase();
    control.hex.removeAttribute('aria-invalid');
  });
  presets.querySelectorAll('button').forEach((button, index) => {
    const preset = palettes[index];
    button.setAttribute('aria-pressed', String(preset.main === current.main && preset.accent === current.accent));
  });
  toggle.style.setProperty('--palette-main', current.main);
  toggle.style.setProperty('--palette-accent', current.accent);
  error.textContent = '';
  if (save) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(current));
      message.textContent = 'Saved in this browser. Preview only.';
    } catch {
      message.textContent = 'Preview only. Colors will reset when you reload.';
    }
  }
}

palettes.forEach(palette => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'palette-preset';
  button.setAttribute('aria-pressed', 'false');
  const swatches = document.createElement('span');
  swatches.className = 'palette-swatches';
  swatches.setAttribute('aria-hidden', 'true');
  for (const color of [palette.main, palette.accent]) {
    const swatch = document.createElement('i');
    swatch.style.backgroundColor = color;
    swatches.append(swatch);
  }
  const label = document.createElement('span');
  label.textContent = palette.name;
  button.append(swatches, label);
  button.addEventListener('click', () => apply(palette));
  presets.append(button);
});

Object.entries(controls).forEach(([key, control]) => {
  control.color.addEventListener('input', () => apply({ ...current, [key]: control.color.value }));
  control.hex.addEventListener('change', () => {
    const value = normalizeHex(control.hex.value);
    if (!value) {
      control.hex.setAttribute('aria-invalid', 'true');
      error.textContent = 'Use a hex color such as #142B25.';
      return;
    }
    apply({ ...current, [key]: value });
  });
});

function closePanel(restoreFocus = false) {
  panel.hidden = true;
  toggle.setAttribute('aria-expanded', 'false');
  if (restoreFocus) toggle.focus();
}
toggle.addEventListener('click', () => {
  const opening = panel.hidden;
  panel.hidden = !opening;
  toggle.setAttribute('aria-expanded', String(opening));
  if (opening) panel.querySelector('.palette-close').focus();
});
panel.querySelector('.palette-close').addEventListener('click', () => closePanel(true));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !panel.hidden) { closePanel(true); event.preventDefault(); }
});
document.addEventListener('pointerdown', event => {
  if (!panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target)) closePanel();
});
document.querySelectorAll('[data-sell],[data-call]').forEach(link => link.addEventListener('click', () => closePanel()));
document.querySelector('#palette-reset').addEventListener('click', () => {
  apply(palettes[0], false);
  try { localStorage.removeItem(storageKey); } catch { /* Preview still resets without storage. */ }
  message.textContent = 'Original black and white restored.';
});

try {
  const stored = JSON.parse(localStorage.getItem(storageKey));
  if (normalizeHex(stored?.main) && normalizeHex(stored?.accent)) current = stored;
} catch { /* A fresh preview works when storage is unavailable. */ }
apply(current, false);
toggle.hidden = false;
