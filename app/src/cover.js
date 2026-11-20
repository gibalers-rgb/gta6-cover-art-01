// Sunset Cover Studio — the cover engine.
//
// drawCover(canvas, state) paints a multi-panel GTA-poster-style cover:
// photos in white-guttered panels, a Vice City sunset / neon colour grade,
// a halftone print texture, and bold outlined caption lettering with a
// Leonida ribbon. Everything is drawn with the 2D canvas API; no font
// files, no network, no Rockstar artwork — the lettering is system bold
// type, stroked and filled by hand.
//
// A panel is { photo, zoom, panX, panY } where photo is an HTMLImageElement
// (or null for a solid panel) and zoom/pan crop and position it inside the
// panel. state is:
//   { layout: 'poster' | 'trio' | 'duo',
//     size: { w, h },            // the canvas's own pixel size
//     panels: [panel, ...],      // one photo per panel slot
//     title, subtitle,           // caption lines
//     titleStyle: 'bold' | 'outline' | 'neon',
//     grade: 'sunset' | 'neon' | 'noir' | 'none' }

const GUTTER = 0.012; // white gutter between panels, as a share of the short side

/** Panel rectangles for a layout, in fractions of the cover (x, y, w, h). */
export function layoutPanels(layout) {
  if (layout === 'trio') {
    return [
      [0, 0, 1 / 3, 1],
      [1 / 3, 0, 1 / 3, 1],
      [2 / 3, 0, 1 / 3, 1],
    ];
  }
  if (layout === 'duo') {
    return [
      [0, 0, 0.55, 1],
      [0.55, 0, 0.45, 1],
    ];
  }
  // poster: one tall hero panel left, two stacked panels right.
  return [
    [0, 0, 0.58, 1],
    [0.58, 0, 0.42, 0.5],
    [0.58, 0.5, 0.42, 0.5],
  ];
}

/** Draws one photo into a panel rect, honouring zoom (1 = cover-fit) and pan (-1..1). */
export function drawPanelPhoto(ctx, photo, rect, zoom, panX, panY) {
  const [x, y, w, h] = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (!photo) {
    ctx.fillStyle = '#2b1838';
    ctx.fillRect(x, y, w, h);
  } else {
    const base = Math.max(w / photo.naturalWidth, h / photo.naturalHeight);
    const scale = base * (zoom || 1);
    const pw = photo.naturalWidth * scale;
    const ph = photo.naturalHeight * scale;
    const ox = (w - pw) / 2 + (panX || 0) * (pw - w) * 0.5;
    const oy = (h - ph) / 2 + (panY || 0) * (ph - h) * 0.5;
    ctx.drawImage(photo, x + ox, y + oy, pw, ph);
  }
  ctx.restore();
}

/** The colour grade: a warm sunset wash, a pink/cyan neon wash, or a noir duotone. */
export function gradePanel(ctx, rect, grade) {
  const [x, y, w, h] = rect;
  if (grade === 'none') return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (grade === 'noir') {
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
    const wash = ctx.createLinearGradient(x, y, x + w, y + h);
    wash.addColorStop(0, 'rgba(40, 20, 80, 0.25)');
    wash.addColorStop(1, 'rgba(255, 90, 120, 0.18)');
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, w, h);
  } else if (grade === 'neon') {
    const top = ctx.createLinearGradient(x, y, x, y + h * 0.55);
    top.addColorStop(0, 'rgba(255, 45, 149, 0.28)');
    top.addColorStop(1, 'rgba(255, 45, 149, 0)');
    ctx.fillStyle = top;
    ctx.fillRect(x, y, w, h);
    const bottom = ctx.createLinearGradient(x, y + h * 0.45, x, y + h);
    bottom.addColorStop(0, 'rgba(0, 229, 255, 0)');
    bottom.addColorStop(1, 'rgba(0, 229, 255, 0.30)');
    ctx.fillStyle = bottom;
    ctx.fillRect(x, y, w, h);
  } else {
    // sunset (the default): amber from the top, magenta rising from the foot.
    const wash = ctx.createLinearGradient(x, y, x, y + h);
    wash.addColorStop(0, 'rgba(255, 170, 60, 0.16)');
    wash.addColorStop(0.55, 'rgba(255, 120, 80, 0.05)');
    wash.addColorStop(1, 'rgba(214, 40, 140, 0.38)');
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

/** A faint halftone dot print over a rect, for the comic-poster feel. */
export function halftone(ctx, rect, spacing, alpha) {
  const [x, y, w, h] = rect;
  ctx.save();
  ctx.fillStyle = `rgba(20, 8, 30, ${alpha})`;
  for (let yy = y + spacing / 2; yy < y + h; yy += spacing) {
    for (let xx = x + spacing / 2; xx < x + w; xx += spacing) {
      ctx.beginPath();
      ctx.arc(xx, yy, spacing * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `900 ${size}px 'Arial Black', 'Helvetica Neue', Arial, sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 2;
    ctx.font = `900 ${size}px 'Arial Black', 'Helvetica Neue', Arial, sans-serif`;
  }
  return size;
}

/** The bold caption: outlined capitals with a gradient fill, slightly skewed. */
export function drawTitle(ctx, w, h, title, subtitle, style) {
  const text = (title || '').trim().toUpperCase();
  if (!text) return;
  const baseline = h * 0.9;
  const size = fitFont(ctx, text, w * 0.92, h * 0.13);
  ctx.save();
  ctx.translate(w / 2, baseline);
  ctx.transform(1, 0, -0.06, 1, 0, 0); // a slight forward lean
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = size * 0.18;
  ctx.shadowOffsetY = size * 0.05;
  if (style === 'neon') {
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = size * 0.16;
    ctx.strokeText(text, 0, 0);
    const fill = ctx.createLinearGradient(0, -size, 0, 0);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(0.5, '#ffd319');
    fill.addColorStop(1, '#ff2975');
    ctx.fillStyle = fill;
    ctx.fillText(text, 0, 0);
  } else if (style === 'outline') {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = size * 0.1;
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = 'rgba(20, 8, 30, 0.55)';
    ctx.fillText(text, 0, 0);
  } else {
    ctx.strokeStyle = '#14081e';
    ctx.lineWidth = size * 0.18;
    ctx.strokeText(text, 0, 0);
    const fill = ctx.createLinearGradient(0, -size, 0, 0);
    fill.addColorStop(0, '#fff7d6');
    fill.addColorStop(0.55, '#ffb347');
    fill.addColorStop(1, '#ff2975');
    ctx.fillStyle = fill;
    ctx.fillText(text, 0, 0);
  }
  ctx.restore();

  const sub = (subtitle || '').trim().toUpperCase();
  if (sub) {
    const subSize = Math.max(12, h * 0.028);
    ctx.save();
    ctx.font = `700 ${subSize}px 'Arial Black', 'Helvetica Neue', Arial, sans-serif`;
    const pad = subSize * 0.9;
    const tw = ctx.measureText(sub).width + pad * 2;
    const bx = (w - tw) / 2;
    const by = baseline + h * 0.018;
    ctx.fillStyle = '#14081e';
    ctx.fillRect(bx, by, tw, subSize * 1.9);
    ctx.fillStyle = '#ffd319';
    ctx.fillRect(bx, by, tw, subSize * 0.28);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sub, w / 2, by + subSize * 1.05);
    ctx.restore();
  }
}

/** Paints the whole cover onto the canvas at its own pixel size. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const short = Math.min(w, h);
  const g = Math.max(2, Math.round(short * GUTTER));
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  const rects = layoutPanels(state.layout);
  rects.forEach((frac, i) => {
    const panel = state.panels[i] || {};
    const rect = [
      Math.round(frac[0] * w) + g,
      Math.round(frac[1] * h) + g,
      Math.round(frac[2] * w) - g * 2,
      Math.round(frac[3] * h) - g * 2,
    ];
    drawPanelPhoto(ctx, panel.photo || null, rect, panel.zoom, panel.panX, panel.panY);
    gradePanel(ctx, rect, state.grade);
    halftone(ctx, rect, Math.max(7, Math.round(short / 90)), 0.05);
  });

  // A thin sunset band along the foot, under the lettering.
  const band = ctx.createLinearGradient(0, h * 0.78, 0, h);
  band.addColorStop(0, 'rgba(20, 8, 30, 0)');
  band.addColorStop(1, 'rgba(20, 8, 30, 0.55)');
  ctx.fillStyle = band;
  ctx.fillRect(0, h * 0.78, w, h * 0.22);

  drawTitle(ctx, w, h, state.title, state.subtitle, state.titleStyle);
}
