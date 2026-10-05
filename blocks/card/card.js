import { createOptimizedPicture } from '../../scripts/aem.js';

export function decorateButtons(...buttons) {
  return buttons
    .map((div) => {
      if (!div) return '';
      const a = div.querySelector('a');
      if (a) {
        a.classList.add('button');
        if (div.querySelector('em') || a.parentElement.tagName === 'EM') {
          a.classList.add('secondary');
        } else if (div.querySelector('strong') || a.parentElement.tagName === 'STRONG') {
          a.classList.add('primary');
        }
        return a.outerHTML;
      }
      return '';
    })
    .join('');
}

export default function decorate(block) {
  // Add universal editor model hook to the root element
  block.setAttribute('data-aue-model', 'card');

  const rows = [...block.children];
  if (!rows.length) return;

  const props = rows.map((row) => row.firstElementChild);

  const pictureContainer = props[0];
  const tag = props[1];
  const eyebrow = props[2];
  const title = props[3];
  const description = props[4];
  const cta = props[5];

  // Instrument DOM elements for Universal Editor overlay
  if (pictureContainer) pictureContainer.setAttribute('data-aue-prop', 'fileReference');
  if (tag) tag.setAttribute('data-aue-prop', 'tag');
  if (eyebrow) eyebrow.setAttribute('data-aue-prop', 'eyebrow');
  if (title) title.setAttribute('data-aue-prop', 'title');
  if (description) description.setAttribute('data-aue-prop', 'description');

  // Background Image setup
  const picture = pictureContainer ? pictureContainer.querySelector('picture') : null;
  if (picture) {
    const img = picture.querySelector('img');
    if (img && img.src) {
      const optimizedPicture = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '750' }]);
      pictureContainer.textContent = '';
      pictureContainer.appendChild(optimizedPicture);
    }
  }

  const hasTag = tag && tag.textContent.trim() !== '';
  const hasEyebrow = eyebrow && eyebrow.textContent.trim() !== '';
  const hasTitle = title && title.textContent.trim() !== '';
  const hasDescription = description && description.textContent.trim() !== '';
  const hasCta = cta && cta.querySelector('a');

  // Construct DOM Fragment preserving instrumented Nodes
  const backgroundDiv = document.createElement('div');
  backgroundDiv.className = 'background';
  if (picture) backgroundDiv.appendChild(pictureContainer);

  const foregroundDiv = document.createElement('div');
  foregroundDiv.className = 'foreground';

  const textDiv = document.createElement('div');
  textDiv.className = 'text';

  if (hasTag) {
    const tagEl = document.createElement('div');
    tagEl.className = 'tag';
    tagEl.setAttribute('data-aue-prop', 'tag');
    tagEl.setAttribute('data-aue-type', 'text');
    tagEl.innerHTML = `<span>${tag.textContent.trim()}</span>`;
    textDiv.appendChild(tagEl);
  }

  if (hasEyebrow) {
    const eyebrowEl = document.createElement('div');
    eyebrowEl.className = 'eyebrow';
    eyebrowEl.setAttribute('data-aue-prop', 'eyebrow');
    eyebrowEl.setAttribute('data-aue-type', 'text');
    eyebrowEl.textContent = eyebrow.textContent.trim().toUpperCase();
    textDiv.appendChild(eyebrowEl);
  }

  if (hasTitle) {
    const titleEl = document.createElement('div');
    titleEl.className = 'title';
    titleEl.setAttribute('data-aue-prop', 'title');
    titleEl.setAttribute('data-aue-type', 'text');
    titleEl.innerHTML = title.innerHTML;
    textDiv.appendChild(titleEl);
  }

  if (hasDescription) {
    const descEl = document.createElement('div');
    descEl.className = 'description';
    descEl.setAttribute('data-aue-prop', 'description');
    descEl.setAttribute('data-aue-type', 'richtext');
    descEl.innerHTML = description.innerHTML;
    textDiv.appendChild(descEl);
  }

  if (hasCta) {
    const ctaEl = document.createElement('div');
    ctaEl.className = 'cta';
    ctaEl.innerHTML = decorateButtons(cta);
    textDiv.appendChild(ctaEl);
  }

  foregroundDiv.appendChild(textDiv);

  block.textContent = '';
  block.append(backgroundDiv, foregroundDiv);
}
