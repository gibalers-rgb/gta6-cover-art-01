// Fixed scenes for screenshots: ?shot=editor shows the page with sample
// photos loaded; ?shot=cover shows the cover alone. The query carries the
// layout, size, caption and which sample each panel uses, e.g.
//   ?shot=cover&layout=poster&size=1920x1080&title=Vice%20City&subtitle=Leonida
// window.__shotReady is set once the cover has been painted.
export async function runShot(shot, query, load) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photos = (query.get('photos') ?? 'hero,street,beach').split(',');
  const title = query.get('title') ?? 'Vice City';
  const subtitle = query.get('subtitle') ?? 'Leonida';
  const layout = query.get('layout') ?? 'poster';
  const grade = query.get('grade') ?? 'sunset';
  const titleStyle = query.get('style') ?? 'bold';
  await load({ photos, title, subtitle, layout, grade, titleStyle });
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
