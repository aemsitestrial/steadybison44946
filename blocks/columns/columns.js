import { createOptimizedPicture } from '../../scripts/aem.js';

/* Helper: Decorate images with createOptimizedPicture */
export function decorateImage(col) {
  const pic = col.querySelector('picture');
  if (pic) {
    const img = pic.querySelector('img');
    if (img && img.src) {
      const optimizedPicture = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '750' }]);
      pic.replaceWith(optimizedPicture);
    }
    const picWrapper = col.querySelector('picture')?.closest('div');
    if (picWrapper && picWrapper.children.length === 1) {
      picWrapper.classList.add('columns-img-col');
    }
  }
}

/* Helper: Convert video links into interactive HTML5 or responsive Embeds */
export function decorateVideo(col) {
  const videoLinks = col.querySelectorAll('a[href*=".mp4"], a[href*="youtube.com"], a[href*="youtu.be"], a[href*="vimeo.com"]');
  videoLinks.forEach((link) => {
    const url = link.href;
    if (url.endsWith('.mp4')) {
      const video = document.createElement('video');
      video.src = url;
      video.controls = true;
      video.playsInline = true;
      video.className = 'columns-video';
      link.replaceWith(video);
    } else {
      const embedContainer = document.createElement('div');
      embedContainer.className = 'columns-video-embed';

      let embedSrc = url;
      if (url.includes('youtube.com/watch?v=')) {
        embedSrc = `https://www.youtube.com/embed/${new URL(url).searchParams.get('v')}`;
      } else if (url.includes('youtu.be/')) {
        embedSrc = `https://player.vimeo.com/video/${url.split('/').pop()}`;
      } else if (url.includes('vimeo.com/')) {
        embedSrc = `https://player.vimeo.com/video/${url.split('/').pop()}`;
      }

      embedContainer.innerHTML = `<iframe src="${embedSrc}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
      link.replaceWith(embedContainer);
    }
  });
}

/* Helper: Style CTAs with primary/secondary/outline/text-link variations */
export function decorateButtons(col) {
  const ctas = col.querySelectorAll('a');
  ctas.forEach((cta) => {
    if (cta.closest('.columns-video-embed') || cta.tagName === 'VIDEO') return;

    const parent = cta.parentElement;
    cta.classList.add('button');

    if (parent.tagName === 'STRONG' || cta.classList.contains('primary') || parent.classList.contains('primary')) {
      cta.classList.add('primary');
    } else if (parent.tagName === 'EM' || cta.classList.contains('secondary') || parent.classList.contains('secondary')) {
      cta.classList.add('secondary');
    } else if (cta.classList.contains('outline') || parent.classList.contains('outline')) {
      cta.classList.add('outline');
    } else if (cta.classList.contains('text-link') || parent.classList.contains('text-link')) {
      cta.classList.remove('button');
      cta.classList.add('cta-text-link');
    }
  });
}

/* Helper: Wrap accordion structures in native <details>/<summary> tags */
export function decorateAccordion(col) {
  const accordionHeaders = col.querySelectorAll('.accordion-header, h3, h4');
  accordionHeaders.forEach((header) => {
    if (header.closest('.columns-accordion')) return;

    const accordionWrapper = document.createElement('details');
    accordionWrapper.className = 'columns-accordion';

    const summary = document.createElement('summary');
    summary.className = 'columns-accordion-title';
    summary.innerHTML = header.innerHTML;

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'columns-accordion-content';

    let sibling = header.nextElementSibling;
    const siblingsToMove = [];
    while (sibling && !sibling.matches('h3, h4, .accordion-header')) {
      siblingsToMove.push(sibling);
      sibling = sibling.nextElementSibling;
    }

    siblingsToMove.forEach((el) => contentWrapper.appendChild(el));

    accordionWrapper.appendChild(summary);
    accordionWrapper.appendChild(contentWrapper);
    header.replaceWith(accordionWrapper);
  });
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // Set dynamic background color variable if class starts with bg-
  const backgroundColor = [...block.classList].find((cls) => cls.startsWith('bg-'));
  if (backgroundColor) {
    block.style.setProperty('--columns-background-color', `var(--${backgroundColor.substring(3)})`);
  }

  // Iterate rows and columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      decorateImage(col);
      decorateVideo(col);
      decorateButtons(col);
      decorateAccordion(col);
    });
  });
}
