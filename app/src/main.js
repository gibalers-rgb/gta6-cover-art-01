// Sunset Cover Studio — wires the page: pick photos, crop and position each
// panel, choose a layout, grade and caption, then export the cover as a PNG
// in a post size. A `?shot=` query sets up a fixed scene for a screenshot
// instead (./shots.js). Photos are read on this machine and never uploaded.
import { drawCover, layoutPanels } from './cover.js';
import { runShot } from './shots.js';

const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080 · square post' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350 · portrait post' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080 · wide post' },
};
const SAMPLES = ['hero', 'street', 'beach'];

const canvas = document.getElementById('cover');
const preview = document.getElementById('preview');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const layoutInput = document.getElementById('layout');
const gradeInput = document.getElementById('grade');
const titleStyleInput = document.getElementById('titleStyle');
const sizeInput = document.getElementById('size');
const status = document.getElementById('status');
const panelList = document.getElementById('panels');

// One panel state per layout slot; a photo is an image, or null.
let panels = [];
let activePanel = 0;

function blankPanels(layout) {
  return layoutPanels(layout).map(() => ({ photo: null, zoom: 1, panX: 0, panY: 0 }));
}

function state() {
  return {
    layout: layoutInput.value,
    panels,
    title: titleInput.value,
    subtitle: subtitleInput.value,
    titleStyle: titleStyleInput.value,
    grade: gradeInput.value,
  };
}

function redraw() {
  drawCover(preview, state());
  drawCover(canvas, state());
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function renderPanelControls() {
  panelList.innerHTML = '';
  panels.forEach((panel, i) => {
    const card = document.createElement('div');
    card.className = 'panel-card' + (i === activePanel ? ' active' : '');
    card.innerHTML = `
      <div class="panel-head">Panel ${i + 1}</div>
      <label>Photo <input type="file" accept="image/*" data-panel="${i}"></label>
      <label>Sample
        <select data-sample="${i}">
          <option value="">— your photo —</option>
          ${SAMPLES.map((s) => `<option value="${s}" ${panel.sample === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </label>
      <label>Zoom <input type="range" min="1" max="2.5" step="0.05" value="${panel.zoom}" data-zoom="${i}"></label>
      <label>Pan left–right <input type="range" min="-1" max="1" step="0.05" value="${panel.panX}" data-panx="${i}"></label>
      <label>Pan up–down <input type="range" min="-1" max="1" step="0.05" value="${panel.panY}" data-pany="${i}"></label>`;
    card.addEventListener('click', () => { activePanel = i; renderPanelControls(); });
    panelList.appendChild(card);
  });
}

panelList.addEventListener('change', async (e) => {
  const t = e.target;
  const i = Number(t.dataset.panel ?? t.dataset.sample ?? t.dataset.zoom ?? t.dataset.panx ?? t.dataset.pany);
  if (t.dataset.panel !== undefined) {
    const file = t.files[0];
    if (!file) return;
    panels[i].photo = await loadImage(URL.createObjectURL(file));
    panels[i].sample = '';
  } else if (t.dataset.sample !== undefined) {
    panels[i].sample = t.value;
    panels[i].photo = t.value ? await loadImage(`samples/${t.value}.jpg`) : null;
  }
  renderPanelControls();
  redraw();
});

panelList.addEventListener('input', (e) => {
  const t = e.target;
  const i = Number(t.dataset.zoom ?? t.dataset.panx ?? t.dataset.pany);
  if (t.dataset.zoom !== undefined) panels[i].zoom = Number(t.value);
  if (t.dataset.panx !== undefined) panels[i].panX = Number(t.value);
  if (t.dataset.pany !== undefined) panels[i].panY = Number(t.value);
  redraw();
});

async function applySample(i, name) {
  panels[i].sample = name;
  panels[i].photo = await loadImage(`samples/${name}.jpg`);
}

async function loadDefaults() {
  panels = blankPanels(layoutInput.value);
  const picks = ['hero', 'street', 'beach'];
  for (let i = 0; i < panels.length; i++) await applySample(i, picks[i % picks.length]);
  renderPanelControls();
  redraw();
}

layoutInput.addEventListener('change', loadDefaults);
for (const el of [titleInput, subtitleInput, gradeInput, titleStyleInput]) {
  el.addEventListener('input', redraw);
  el.addEventListener('change', redraw);
}
sizeInput.addEventListener('change', () => {
  const size = SIZES[sizeInput.value];
  canvas.width = size.w;
  canvas.height = size.h;
  preview.width = size.w;
  preview.height = size.h;
  redraw();
});

document.getElementById('export').addEventListener('click', () => {
  const size = SIZES[sizeInput.value];
  redraw();
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cover-${size.w}x${size.h}.png`;
    a.click();
    status.textContent = `Saved cover-${size.w}x${size.h}.png — ${size.label}.`;
  }, 'image/png');
});

document.getElementById('shuffle').addEventListener('click', async () => {
  const order = [...SAMPLES].sort(() => Math.random() - 0.5);
  for (let i = 0; i < panels.length; i++) await applySample(i, order[i % order.length]);
  renderPanelControls();
  redraw();
  status.textContent = 'Shuffled the sample photos.';
});

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  const size = query.get('size') ?? '1920x1080';
  const [w, h] = size.split('x').map(Number);
  if (w && h) {
    canvas.width = w;
    canvas.height = h;
    preview.width = w;
    preview.height = h;
  }
  runShot(shot, query, async (scene) => {
    layoutInput.value = scene.layout;
    gradeInput.value = scene.grade;
    titleStyleInput.value = scene.titleStyle;
    titleInput.value = scene.title;
    subtitleInput.value = scene.subtitle;
    panels = blankPanels(scene.layout);
    for (let i = 0; i < panels.length; i++) {
      await applySample(i, scene.photos[i % scene.photos.length]);
    }
    renderPanelControls();
    redraw();
  });
} else {
  loadDefaults();
}
