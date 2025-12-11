// Carrusel de categorías — desplazamiento en píxeles y navegación por grupos
const track = document.querySelector('.carousel-track');
const originalCards = Array.from(document.querySelectorAll('.category-card'));
const prevBtn = document.querySelector('.carousel-control--prev');
const nextBtn = document.querySelector('.carousel-control--next');
const indicators = Array.from(document.querySelectorAll('.indicator'));

const itemsPerView = 4; // máximo visible
let groupIndex = 0; // qué grupo de items mostramos (0..totalGroups-1)
let totalGroups = 0;
let totalOriginal = originalCards.length;

// clones
function setupClones() {
  const startClones = originalCards.slice(-itemsPerView).map(c => c.cloneNode(true));
  const endClones = originalCards.slice(0, itemsPerView).map(c => c.cloneNode(true));
  startClones.forEach(c => track.insertBefore(c, track.firstChild));
  endClones.forEach(c => track.appendChild(c));
}

let allCards = [];
let widths = [];
let prefix = [];
let gap = 0;

function computeMeasurements() {
  allCards = Array.from(track.querySelectorAll('.category-card'));
  widths = allCards.map(el => el.getBoundingClientRect().width);
  prefix = [0];
  for (let i = 0; i < widths.length; i++) prefix.push(prefix[i] + widths[i]);
  const cs = getComputedStyle(track);
  gap = parseFloat(cs.getPropertyValue('gap')) || 0;
  totalOriginal = originalCards.length;
  totalGroups = Math.ceil(totalOriginal / itemsPerView);
}

function offsetForLeftIndex(leftIndex) {
  // leftIndex is index in allCards of the leftmost visible card
  // offset = sum widths of items before leftIndex + gap * leftIndex
  const sumBefore = prefix[leftIndex] || 0;
  const offsetsGaps = gap * leftIndex;
  return sumBefore + offsetsGaps;
}

function updateIndicatorsActive() {
  indicators.forEach((ind, i) => ind.classList.toggle('active', i === groupIndex));
}

let isAnimating = false;
function goToGroup(targetGroup, withTransition = true) {
  if (isAnimating) return;
  isAnimating = true;
  const leftIndex = itemsPerView + targetGroup * itemsPerView; // account for start clones
  if (!withTransition) track.classList.add('no-transition'); else track.classList.remove('no-transition');
  const x = offsetForLeftIndex(leftIndex);
  track.style.transform = `translateX(-${x}px)`;
  // wait for transition end (or immediate if no-transition)
}

track.addEventListener('transitionend', () => {
  // handle seamless jump when hitting clones
  const maxGroup = totalGroups - 1;
  // compute current leftIndex by finding nearest prefix to current transform
  const style = getComputedStyle(track);
  const matrix = new WebKitCSSMatrix(style.transform || 'none');
  const currentX = Math.abs(matrix.m41 || 0);
  // find the leftIndex that matches currentX (tolerance)
  let leftIndex = 0;
  for (let i = 0; i < prefix.length; i++) {
    const off = offsetForLeftIndex(i);
    if (Math.abs(off - currentX) < 1) { leftIndex = i; break; }
  }

  // deduce groupIndex from leftIndex
  const raw = (leftIndex - itemsPerView) / itemsPerView;
  // if we animated into the clones at the end
  if (raw >= totalGroups) {
    groupIndex = 0;
    // jump to first group without transition
    track.classList.add('no-transition');
    const jumpX = offsetForLeftIndex(itemsPerView + groupIndex * itemsPerView);
    track.style.transform = `translateX(-${jumpX}px)`;
  } else if (raw < 0) {
    groupIndex = totalGroups - 1;
    track.classList.add('no-transition');
    const jumpX = offsetForLeftIndex(itemsPerView + groupIndex * itemsPerView);
    track.style.transform = `translateX(-${jumpX}px)`;
  } else {
    groupIndex = Math.floor(raw);
  }

  // small timeout to re-enable transitions
  setTimeout(() => {
    track.classList.remove('no-transition');
    isAnimating = false;
    updateIndicatorsActive();
  }, 20);
});

function moveNext() {
  if (isAnimating) return;
  groupIndex++;
  goToGroup(groupIndex, true);
}
function movePrev() {
  if (isAnimating) return;
  groupIndex--;
  goToGroup(groupIndex, true);
}

// indicator clicks
indicators.forEach((ind, i) => {
  ind.addEventListener('click', () => {
    if (isAnimating) return;
    groupIndex = i;
    goToGroup(groupIndex, true);
  });
});

function init() {
  // limpiar clones si ya existen (evitar duplicados en recarga)
  const existing = track.querySelectorAll('.category-card');
  if (existing.length === originalCards.length) {
    setupClones();
  } else {
    // if clones not present (first load) still ensure clones exist
    const hasClones = existing.length > originalCards.length;
    if (!hasClones) setupClones();
  }

  // measurements after images load
  computeMeasurements();
  // position to first real group
  groupIndex = 0;
  const startLeft = itemsPerView + groupIndex * itemsPerView;
  track.classList.add('no-transition');
  const startX = offsetForLeftIndex(startLeft);
  track.style.transform = `translateX(-${startX}px)`;
  setTimeout(() => track.classList.remove('no-transition'), 20);
  updateIndicatorsActive();
}

window.addEventListener('load', init);
window.addEventListener('resize', () => {
  // recompute sizes and reapply current group position
  computeMeasurements();
  const startLeft = itemsPerView + groupIndex * itemsPerView;
  const x = offsetForLeftIndex(startLeft);
  track.classList.add('no-transition');
  track.style.transform = `translateX(-${x}px)`;
  setTimeout(() => track.classList.remove('no-transition'), 20);
});

nextBtn.addEventListener('click', moveNext);
prevBtn.addEventListener('click', movePrev);
