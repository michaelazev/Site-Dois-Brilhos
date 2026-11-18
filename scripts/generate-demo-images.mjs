// Gera ilustrações SVG de demonstração (claramente marcadas como "EXEMPLO").
// Substitua-as por fotografias reais pelo painel administrativo.
// Uso: npm run gen:images
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'demo');
mkdirSync(out, { recursive: true });

const W = 800;
const H = 1000;

const METALS = {
  gold: ['#F6E7BC', '#DDBB76', '#B08A47', '#EAD49C'],
  silver: ['#FFFFFF', '#D3D5D8', '#8F949A', '#ECEDEF'],
};

const BACKGROUNDS = {
  satin: { a: '#FAF6EF', b: '#EADFCF', band: '#FFFFFF', shade: '#D9CBB6', label: '#9C8C74' },
  white: { a: '#FDFCFA', b: '#ECE9E4', band: '#FFFFFF', shade: '#D6D2CC', label: '#9A948B' },
  champagne: { a: '#F3E6D2', b: '#E2CDAE', band: '#FBF3E6', shade: '#C9AF8A', label: '#8E7655' },
  emerald: { a: '#14503D', b: '#0A2A21', band: '#1F6A52', shade: '#06201A', label: '#C9B27E' },
};

function defs(metal, bg) {
  const m = METALS[metal];
  return `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg.a}"/><stop offset="1" stop-color="${bg.b}"/>
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${m[0]}"/><stop offset=".35" stop-color="${m[1]}"/>
      <stop offset=".7" stop-color="${m[2]}"/><stop offset="1" stop-color="${m[3]}"/>
    </linearGradient>
    <linearGradient id="metalLine" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="160" y2="420" spreadMethod="reflect">
      <stop offset="0" stop-color="${m[0]}"/><stop offset=".4" stop-color="${m[1]}"/>
      <stop offset=".75" stop-color="${m[2]}"/><stop offset="1" stop-color="${m[3]}"/>
    </linearGradient>
    <radialGradient id="pearl" cx=".35" cy=".3" r=".75">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#F3ECE0"/><stop offset="1" stop-color="#CDBFA8"/>
    </radialGradient>
    <radialGradient id="goldball" cx=".35" cy=".3" r=".8">
      <stop offset="0" stop-color="#FFF6D8"/><stop offset=".4" stop-color="#E2C07A"/><stop offset="1" stop-color="#8E6A2E"/>
    </radialGradient>
    <radialGradient id="emeraldstone" cx=".4" cy=".35" r=".8">
      <stop offset="0" stop-color="#7FE0A8"/><stop offset=".45" stop-color="#14935A"/><stop offset="1" stop-color="#05442A"/>
    </radialGradient>
    <radialGradient id="zircon" cx=".4" cy=".35" r=".8">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#E9EEF3"/><stop offset="1" stop-color="#AEB8C2"/>
    </radialGradient>
    <radialGradient id="onyx" cx=".35" cy=".3" r=".8">
      <stop offset="0" stop-color="#4A4A4A"/><stop offset=".5" stop-color="#151515"/><stop offset="1" stop-color="#000"/>
    </radialGradient>
    <filter id="blur40" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>
    <filter id="blur8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity=".18"/>
    </filter>
  </defs>`;
}

function satin(bg, w = W, h = H, seed = 1) {
  const r = rng(seed);
  let bands = '';
  for (let i = 0; i < 5; i++) {
    const x = r() * w * 1.4 - w * 0.2;
    const rot = -35 + r() * 25;
    const light = i % 2 === 0;
    bands += `<rect x="${x.toFixed(0)}" y="${-h * 0.3}" width="${(60 + r() * 120).toFixed(0)}" height="${h * 1.6}" fill="${light ? bg.band : bg.shade}" opacity="${light ? 0.55 : 0.35}" transform="rotate(${rot.toFixed(1)} ${w / 2} ${h / 2})" filter="url(#blur40)"/>`;
  }
  return `<rect width="${w}" height="${h}" fill="url(#bg)"/>${bands}`;
}

function rng(seed) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function sparkle(x, y, s, color, op = 0.8) {
  const p = `M0 -1 C0.08 -0.3 0.3 -0.08 1 0 C0.3 0.08 0.08 0.3 0 1 C-0.08 0.3 -0.3 0.08 -1 0 C-0.3 -0.08 -0.08 -0.3 0 -1Z`;
  return `<path d="${p}" transform="translate(${x} ${y}) scale(${s})" fill="${color}" opacity="${op}"/>`;
}

function label(bg, w = W, h = H) {
  return `<text x="${w / 2}" y="${h - 34}" text-anchor="middle" font-family="Georgia, serif" font-size="15" letter-spacing="5" fill="${bg.label}" opacity=".85">EXEMPLO · DOIS BRILHOS</text>`;
}

function chain(cx, top, width, depth, opts = {}) {
  const { stroke = 'url(#metal)', sw = 3.2 } = opts;
  const x1 = cx - width / 2;
  const x2 = cx + width / 2;
  const d = `M${x1} ${top} C${x1 + width * 0.05} ${top + depth * 0.9}, ${cx - width * 0.25} ${top + depth}, ${cx} ${top + depth} S${x2 - width * 0.05} ${top + depth * 0.9}, ${x2} ${top}`;
  return `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="${sw + 2}" transform="translate(3 6)" filter="url(#blur8)"/>
  <path d="${d}" fill="none" stroke="${stroke === 'url(#metal)' ? 'url(#metalLine)' : stroke}" stroke-width="${sw}" stroke-dasharray="5 2.2" stroke-linecap="round"/>`;
}

function verticalChain(x, top, len, pendant) {
  return `<line x1="${x}" y1="${top}" x2="${x}" y2="${top + len}" stroke="#000" stroke-opacity=".1" stroke-width="5" transform="translate(4 4)" filter="url(#blur8)"/>
  <line x1="${x}" y1="${top}" x2="${x}" y2="${top + len}" stroke="url(#metalLine)" stroke-width="4" stroke-dasharray="6 2.4"/>${pendant ? pendant(x, top + len) : ''}`;
}

function heart(x, y, s, stones = true) {
  const d = `M0 14 C-18 2 -26 -8 -26 -18 C-26 -28 -18 -34 -10 -34 C-4 -34 0 -30 0 -26 C0 -30 4 -34 10 -34 C18 -34 26 -28 26 -18 C26 -8 18 2 0 14Z`;
  let dots = '';
  if (stones) {
    for (let t = 0; t < 1; t += 0.07) {
      const a = t * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(a), 3);
      const hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
      dots += `<circle cx="${(hx * 1.3).toFixed(1)}" cy="${(hy * 1.3 - 10).toFixed(1)}" r="2.6" fill="url(#zircon)"/>`;
    }
  }
  return `<g transform="translate(${x} ${y + 32 * s}) scale(${s})" filter="url(#soft)">
    <circle cx="0" cy="-40" r="4" fill="none" stroke="url(#metal)" stroke-width="2"/>
    <path d="${d}" fill="none" stroke="url(#metal)" stroke-width="5" stroke-linejoin="round"/>${dots}
    <circle cx="0" cy="-12" r="7" fill="url(#zircon)" stroke="url(#metal)" stroke-width="1.5"/></g>`;
}

function clover(x, y, s, fill = 'url(#onyx)') {
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(45)" filter="url(#soft)">
    ${[0, 90, 180, 270].map((r) => `<circle cx="0" cy="-11" r="11" fill="${fill}" stroke="url(#metal)" stroke-width="2" transform="rotate(${r})"/>`).join('')}
    <circle r="3" fill="url(#metal)"/></g>`;
}

function solitaire(x, y, s, stone = 'url(#zircon)') {
  return `<g transform="translate(${x} ${y + 16 * s}) scale(${s})" filter="url(#soft)">
    <circle r="15" fill="url(#metal)"/><circle r="12" fill="${stone}"/>
    <path d="M-6 -4 L0 -10 L6 -4 L0 8Z" fill="#fff" opacity=".5"/>
    ${sparkle(5, -6, 5, '#fff', 0.9)}</g>`;
}

function stud(x, y, r, type) {
  const fills = { pearl: 'url(#pearl)', gold: 'url(#goldball)', emerald: 'url(#emeraldstone)', zircon: 'url(#zircon)' };
  const facet = type === 'emerald' || type === 'zircon'
    ? `<path d="M${x - r * 0.5} ${y - r * 0.2} L${x} ${y - r * 0.7} L${x + r * 0.5} ${y - r * 0.2} L${x} ${y + r * 0.6}Z" fill="#fff" opacity=".28"/>${sparkle(x + r * 0.35, y - r * 0.35, r * 0.35, '#fff', 0.95)}`
    : `<ellipse cx="${x - r * 0.3}" cy="${y - r * 0.35}" rx="${r * 0.28}" ry="${r * 0.18}" fill="#fff" opacity=".7"/>`;
  const bezel = type === 'emerald' || type === 'zircon'
    ? `<circle cx="${x}" cy="${y}" r="${r + 4}" fill="url(#metal)"/>` : '';
  return `<ellipse cx="${x + 6}" cy="${y + r + 8}" rx="${r * 0.9}" ry="${r * 0.28}" fill="#000" opacity=".16" filter="url(#blur8)"/>
  ${bezel}<circle cx="${x}" cy="${y}" r="${r}" fill="${fills[type]}"/>${facet}`;
}

function hoop(x, y, r, stones = true) {
  let dots = '';
  if (stones) {
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * 0.15 + (i / 8) * Math.PI * 0.7;
      dots += `<circle cx="${(x + Math.cos(a) * r).toFixed(1)}" cy="${(y + Math.sin(a) * r * 1.1).toFixed(1)}" r="4.2" fill="url(#zircon)" stroke="url(#metal)" stroke-width="1.2"/>`;
    }
  }
  return `<ellipse cx="${x + 8}" cy="${y + r * 1.15 + 10}" rx="${r * 0.8}" ry="10" fill="#000" opacity=".14" filter="url(#blur8)"/>
  <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.1}" fill="none" stroke="url(#metal)" stroke-width="13"/>
  <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.1}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-dasharray="${r * 0.6} ${r * 6}"/>${dots}`;
}

function bracelet(cx, cy, rx, ry, charm) {
  return `<ellipse cx="${cx + 8}" cy="${cy + 14}" rx="${rx}" ry="${ry}" fill="none" stroke="#000" stroke-opacity=".13" stroke-width="8" filter="url(#blur8)"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="url(#metal)" stroke-width="4" stroke-dasharray="7 3"/>
  ${charm ? charm(cx, cy + ry) : ''}`;
}

function ring(cx, cy, r, stone = 'url(#zircon)', band = 'url(#metal)') {
  return `<ellipse cx="${cx + 10}" cy="${cy + r * 0.62 + 12}" rx="${r * 1.05}" ry="${r * 0.22}" fill="#000" opacity=".16" filter="url(#blur8)"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.62}" fill="none" stroke="${band}" stroke-width="14"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.62}" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="2.5" stroke-dasharray="${r * 0.9} ${r * 8}" stroke-dashoffset="${r * 0.2}"/>
  ${stone ? `<g transform="translate(${cx} ${cy - r * 0.62 - 12})" filter="url(#soft)"><path d="M-16 6 L-10 -8 L10 -8 L16 6 L0 22Z" fill="url(#metal)"/><path d="M-18 -2 L-9 -18 L9 -18 L18 -2 L0 16Z" fill="${stone}" stroke="url(#metal)" stroke-width="2"/>${sparkle(6, -10, 7, '#fff', 1)}</g>` : ''}`;
}

function svg(content, metal, bgName, w = W, h = H, seed = 1, withLabel = true) {
  const bg = BACKGROUNDS[bgName];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${defs(metal, bg)}${satin(bg, w, h, seed)}${content}${withLabel ? label(bg, w, h) : ''}</svg>`;
}

function zoomed(content, scale, ox = 400, oy = 500) {
  return `<g transform="translate(${ox} ${oy}) scale(${scale}) translate(${-ox} ${-oy})">${content}</g>`;
}

const sparkles = (bg) => [
  sparkle(150, 180, 9, bg === 'emerald' ? '#D8BE8A' : '#FFFFFF', 0.9),
  sparkle(660, 260, 6, bg === 'emerald' ? '#D8BE8A' : '#FFFFFF', 0.8),
  sparkle(610, 820, 7, bg === 'emerald' ? '#D8BE8A' : '#FFFFFF', 0.7),
].join('');

// ---------- produtos ----------
const products = {
  'colar-coracao-cravejado-prata': { metal: 'silver', draw: () => chain(400, 120, 520, 520) + heart(400, 640, 2.4) },
  'colar-coracao-cravejado-dourado': { metal: 'gold', draw: () => chain(400, 120, 520, 520) + heart(400, 640, 2.4) },
  'colar-trevo-preto': {
    metal: 'gold',
    draw: () => chain(400, 110, 560, 600) + clover(225, 470, 1.8) + clover(400, 718, 2.2) + clover(575, 470, 1.8),
  },
  'colar-ponto-de-luz': { metal: 'silver', draw: () => chain(400, 120, 480, 540) + solitaire(400, 660, 2.6) },
  'brinco-perola-classico': { metal: 'gold', draw: () => stud(300, 480, 62, 'pearl') + stud(510, 520, 62, 'pearl') },
  'brinco-bola-dourada': { metal: 'gold', draw: () => stud(300, 480, 56, 'gold') + stud(510, 520, 56, 'gold') },
  'brinco-ponto-de-luz-verde': { metal: 'gold', draw: () => stud(300, 480, 46, 'emerald') + stud(510, 520, 46, 'emerald') },
  'brinco-ponto-de-luz-zirconia': { metal: 'silver', draw: () => stud(300, 480, 46, 'zircon') + stud(510, 520, 46, 'zircon') },
  'argola-cravejada-dourada': { metal: 'gold', draw: () => hoop(285, 470, 92) + hoop(525, 520, 92) },
  'pulseira-elos-prata': {
    metal: 'silver',
    draw: () => bracelet(400, 470, 250, 150, (x, y) => `<g transform="translate(${x} ${y + 30})">${heart(0, 0, 1.3, false)}</g>`),
  },
  'pulseira-riviera-dourada': {
    metal: 'gold',
    draw: () => {
      let s = bracelet(400, 480, 250, 150);
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        s += `<circle cx="${(400 + Math.cos(a) * 250).toFixed(1)}" cy="${(480 + Math.sin(a) * 150).toFixed(1)}" r="7" fill="url(#zircon)" stroke="url(#metal)" stroke-width="2"/>`;
      }
      return s;
    },
  },
  'anel-solitario-prata': { metal: 'silver', draw: () => ring(400, 540, 150) },
  'anel-aparador-dourado': {
    metal: 'gold',
    draw: () => {
      let s = ring(400, 540, 150, null);
      for (let i = 0; i < 11; i++) {
        const a = Math.PI * 1.15 + (i / 10) * Math.PI * 0.7;
        s += `<circle cx="${(400 + Math.cos(a) * 150).toFixed(1)}" cy="${(540 + Math.sin(a) * 93).toFixed(1)}" r="6" fill="url(#zircon)"/>`;
      }
      return s;
    },
  },
  'conjunto-coracao-dourado': {
    metal: 'gold',
    draw: () => chain(400, 100, 440, 440) + heart(400, 540, 2) + stud(250, 820, 34, 'zircon') + stud(550, 820, 34, 'zircon'),
  },
  'conjunto-ponto-de-luz-verde': {
    metal: 'silver',
    draw: () => chain(400, 100, 440, 440) + solitaire(400, 560, 2.3, 'url(#emeraldstone)') + stud(250, 820, 30, 'emerald') + stud(550, 820, 30, 'emerald'),
  },
};

let seed = 3;
for (const [slug, p] of Object.entries(products)) {
  seed += 7;
  const main = svg(p.draw() + sparkles('satin'), p.metal, seed % 2 ? 'satin' : 'white', W, H, seed);
  const alt = svg(zoomed(p.draw(), 1.45, 400, 560) + sparkles('emerald'), p.metal, 'emerald', W, H, seed + 1);
  writeFileSync(join(out, `${slug}-1.svg`), main);
  writeFileSync(join(out, `${slug}-2.svg`), alt);
}

// ---------- categorias ----------
const cats = {
  colares: { metal: 'gold', bg: 'champagne', draw: () => chain(400, 140, 520, 520) + heart(400, 660, 2.3) },
  pulseiras: { metal: 'gold', bg: 'satin', draw: () => products['pulseira-riviera-dourada'].draw() },
  brincos: { metal: 'gold', bg: 'white', draw: () => stud(260, 430, 50, 'pearl') + stud(540, 430, 50, 'gold') + stud(260, 640, 40, 'emerald') + stud(540, 640, 40, 'zircon') },
  aneis: { metal: 'silver', bg: 'champagne', draw: () => ring(400, 540, 150) },
  conjuntos: { metal: 'gold', bg: 'satin', draw: () => products['conjunto-coracao-dourado'].draw() },
};
for (const [slug, c] of Object.entries(cats)) {
  seed += 5;
  writeFileSync(join(out, `categoria-${slug}.svg`), svg(c.draw() + sparkles(c.bg), c.metal, c.bg, W, H, seed));
}

// ---------- coleções (paisagem) ----------
const CW = 1200;
const CH = 800;
const collections = {
  'colecao-coracao': { metal: 'gold', bg: 'champagne', draw: () => verticalChain(380, 0, 430, (x, y) => heart(x, y, 2)) + verticalChain(600, 0, 520, (x, y) => heart(x, y, 2.4)) + verticalChain(820, 0, 380, (x, y) => heart(x, y, 1.8)) },
  'colecao-ponto-de-luz': { metal: 'silver', bg: 'white', draw: () => verticalChain(420, 0, 460, (x, y) => solitaire(x, y, 2.2)) + verticalChain(780, 0, 400, (x, y) => solitaire(x, y, 2.2, 'url(#emeraldstone)')) + stud(600, 600, 34, 'zircon') },
  'colecao-prata-925': { metal: 'silver', bg: 'emerald', draw: () => ring(380, 430, 130) + stud(700, 380, 44, 'zircon') + stud(840, 440, 44, 'zircon') + hoop(760, 600, 70, false) },
};
for (const [slug, c] of Object.entries(collections)) {
  seed += 11;
  writeFileSync(join(out, `${slug}.svg`), svg(c.draw() + sparkle(150, 140, 10, '#fff', 0.8) + sparkle(1060, 160, 7, '#fff', 0.7), c.metal, c.bg, CW, CH, seed));
}

// ---------- hero (retrato grande, colares pendurados como no Instagram) ----------
{
  const HW = 1200;
  const HH = 1500;
  const strands = [
    [180, 760, (x, y) => heart(x, y, 2.2)],
    [330, 1000, (x, y) => clover(x, y + 30, 2.2)],
    [480, 640, (x, y) => solitaire(x, y, 2.4)],
    [630, 1120, (x, y) => heart(x, y, 2.6)],
    [780, 840, (x, y) => clover(x, y + 30, 2.2)],
    [930, 1060, (x, y) => heart(x, y, 2.2)],
    [1060, 700, (x, y) => solitaire(x, y, 2.2, 'url(#emeraldstone)')],
  ];
  let content = '';
  strands.forEach(([x, len, p], i) => {
    content += `<g>${defsMetalSwap(i)}${verticalChain(x, -10, len, p)}</g>`;
  });
  content += sparkle(240, 1300, 12, '#fff', 0.9) + sparkle(1000, 260, 9, '#fff', 0.9) + sparkle(560, 1380, 7, '#fff', 0.7);
  writeFileSync(join(out, 'hero.svg'), svg(content, 'gold', 'white', HW, HH, 77));
}
function defsMetalSwap() {
  return '';
}

// ---------- sobre (esmeralda, cartelas com a marca) ----------
{
  const AW = 1000;
  const AH = 1200;
  const card = (x, y, rot, type) => `<g transform="translate(${x} ${y}) rotate(${rot})" filter="url(#soft)">
    <rect x="-150" y="-200" width="300" height="400" rx="6" fill="#0E3B2E" stroke="#D8BE8A" stroke-opacity=".35"/>
    <text x="0" y="-110" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="#EFE3C8">Dois</text>
    <text x="0" y="-70" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="#EFE3C8">Brilhos</text>
    ${sparkle(58, -122, 12, '#D8BE8A', 1)}
    ${stud(-55, 50, 34, type)}${stud(55, 50, 34, type)}</g>`;
  const content = card(330, 560, -8, 'zircon') + card(670, 640, 7, 'emerald') + sparkle(160, 200, 12, '#D8BE8A', 0.9) + sparkle(860, 1020, 9, '#D8BE8A', 0.8);
  writeFileSync(join(out, 'sobre.svg'), svg(content, 'gold', 'champagne', AW, AH, 91));
}

// ---------- Open Graph ----------
{
  const OW = 1200;
  const OH = 630;
  const content = `<text x="600" y="300" text-anchor="middle" font-family="Georgia, serif" font-size="110" fill="#EFE3C8" letter-spacing="2">Dois Brilhos</text>
  <text x="600" y="380" text-anchor="middle" font-family="Georgia, serif" font-size="26" letter-spacing="10" fill="#D8BE8A">PRATA 925 · AÇO · FOLHEADOS PREMIUM</text>
  ${sparkle(905, 205, 26, '#D8BE8A', 1)}`;
  writeFileSync(join(root, 'public', 'og-image.svg'), svg(content, 'gold', 'emerald', OW, OH, 5, false));
}

console.log('Imagens de demonstração geradas em public/demo');

// ---------- rasterização ----------
// SVGs com filtros de desfoque são caríssimos para o celular desenhar
// (testado: ~4,6 s de travamento no carregamento). Convertemos tudo para WebP.
// Também geramos uma versão pequena (-sm) usada nos cards de produto.
const sharp = (await import('sharp')).default;
const { readdirSync, unlinkSync } = await import('node:fs');
for (const file of readdirSync(out).filter((f) => f.endsWith('.svg'))) {
  const src = join(out, file);
  const base = file.replace(/\.svg$/, '');
  const img = sharp(src, { density: 96 });
  await img.clone().webp({ quality: 82 }).toFile(join(out, `${base}.webp`));
  if (/-\d\.svg$/.test(file)) {
    await img.clone().resize({ width: 480 }).webp({ quality: 78 }).toFile(join(out, `${base}-sm.webp`));
  }
  unlinkSync(src);
}
// Imagem de compartilhamento (WhatsApp/Facebook não aceitam SVG)
await sharp(join(root, 'public', 'og-image.svg')).jpeg({ quality: 86 }).toFile(join(root, 'public', 'og-image.jpg'));
console.log('Convertidas para WebP + og-image.jpg');
