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

export function generateCardDOM(props) {
  const [
    pictureContainer,
    eyebrow,
    title,
    description,
    cta,
  ] = props;

  // Background Image setup
  const picture = pictureContainer ? pictureContainer.querySelector('picture') : null;
  if (picture) {
    const img = picture.querySelector('img');
    if (img && img.src) {
      const optimizedPicture = createOptimizedPicture(img.src, img.alt || 'Human + Machine', false, [{ width: '750' }]);
      pictureContainer.textContent = '';
      pictureContainer.appendChild(optimizedPicture);
    }
  }

  const hasEyebrow = eyebrow && eyebrow.textContent.trim() !== '';
  const hasTitle = title && title.textContent.trim() !== '';
  const hasDescription = description && description.textContent.trim() !== '';
  const hasCta = cta && cta.querySelector('a');

  // Construct DOM Fragment
  const cardDOM = document.createRange().createContextualFragment(`
    <div class="background">
      ${picture ? pictureContainer.innerHTML : ''}
    </div>
    <div class="foreground">
      <div class="text">
        ${hasEyebrow ? `<div class="eyebrow">${eyebrow.textContent.trim().toUpperCase()}</div>` : ''}
        ${hasTitle ? `<div class="title">${title.innerHTML}</div>` : ''}
        ${hasDescription ? `<div class="description">${description.innerHTML}</div>` : ''}
        ${hasCta ? `<div class="cta">${decorateButtons(cta)}</div>` : ''}
      </div>
    </div>
  `);

  return cardDOM;
}

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const props = rows.map((row) => row.firstElementChild);

  // Extract essential rows corresponding to JSON definition sequence
  const pictureContainer = props[0];
  const eyebrow = props[1];
  const title = props[2];
  const description = props[3];
  const cta = props[4];

  const cardDOM = generateCardDOM([
    pictureContainer,
    eyebrow,
    title,
    description,
    cta,
  ]);

  block.textContent = '';
  block.append(cardDOM);
}
