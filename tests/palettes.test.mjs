import test from 'node:test';
import assert from 'node:assert/strict';
import { palettes, normalizeHex, themeColors, contrast } from '../dist/palettes.mjs';

test('custom hex colors normalize safely without accepting invalid values', () => {
  assert.equal(normalizeHex(' #AbC '), '#aabbcc');
  assert.equal(normalizeHex('#142B25'), '#142b25');
  for (const value of ['', 'red', '#12345', '#12345678', 'url(example)', null, {}]) {
    assert.equal(normalizeHex(value), null);
    assert.throws(() => themeColors(value, '#fff'), TypeError);
  }
});

test('palettes and custom colors preserve chosen colors with readable page and button text', () => {
  assert.equal(contrast('#000000', '#ffffff'), 21);
  assert.equal(themeColors('#fff', '#000').scheme, 'light');
  assert.equal(themeColors('#000', '#fff').scheme, 'dark');
  const choices = [...palettes, ...['#808080', '#ff0000', '#00ff00', '#0000ff', '#777777', '#ffffff', '#000000'].map(main => ({ main, accent: main }))];
  for (const choice of choices) {
    const theme = themeColors(choice.main, choice.accent);
    assert.equal(theme.main, choice.main);
    assert.equal(theme.accent, choice.accent);
    assert.ok(contrast(theme.onAccent, theme.accent) >= 4.5);
    assert.ok(contrast(theme.onAccent, theme.accentHover) >= 4.5);
    for (const background of [theme.main, theme.panel, theme.field]) {
      for (const foreground of [theme.text, theme.muted, theme.accentInk]) {
        assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background}`);
      }
    }
  }
});
