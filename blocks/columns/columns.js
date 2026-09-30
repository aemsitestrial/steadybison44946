import { createOptimizedPicture } from '../../scripts/aem.js';

/* Helper: Decorate images safely */
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

/* Helper: Decorate Badges (handles both static HTML and freshly dropped editor instances) */
export function decorateBadges(col) {
  const badges = col.querySelectorAll('.badge, [data-badge-text], .columns-card-badge, [data-aue-model="badge"]');
  badges.forEach((badge) => {
    badge.classList.add('columns-card-badge');
    badge.setAttribute('data-aue-type', 'component');
    badge.setAttribute('data-aue-model', 'badge');
    badge.setAttribute('data-aue-label', 'Badge Tag');
  });
}

/* Helper: Decorate Card Header Metadata Row */
export function decorateCardMeta(col) {
  const metaWrappers = col.querySelectorAll('.card-metadata, [data-aue-model="card-metadata"]');
  metaWrappers.forEach((metaWrapper) => {
    metaWrapper.classList.add('columns-card-meta-row');
    metaWrapper.setAttribute('data-aue-type', 'component');
    metaWrapper.setAttribute('data-aue-model', 'card-metadata');
    metaWrapper.setAttribute('data-aue-label', 'Card Metadata');

    const topics = metaWrapper.querySelector('.topics') || metaWrapper.children[0];
    if (topics) topics.classList.add('card-meta-topics');
    const readTime = metaWrapper.querySelector('.read-time') || metaWrapper.children[1];
    if (readTime) readTime.classList.add('card-meta-readtime');
  });
}

/* Helper: Decorate Author Metadata Profiles */
export function decorateAuthor(col) {
  const authorWrappers = col.querySelectorAll('.author, [data-aue-model="author"]');
  authorWrappers.forEach((authorWrapper) => {
    authorWrapper.classList.add('columns-card-author');
    authorWrapper.setAttribute('data-aue-type', 'component');
    authorWrapper.setAttribute('data-aue-model', 'author');
    authorWrapper.setAttribute('data-aue-label', 'Author Profile');

    const img = authorWrapper.querySelector('img');
    if (img) img.classList.add('author-avatar');

    const info = authorWrapper.querySelector('div') || authorWrapper;
    if (info) {
      info.classList.add('author-info');
      const name = info.querySelector('strong, span:first-child');
      if (name) name.classList.add('author-name');
      const role = info.querySelector('span:last-child');
      if (role && role !== name) role.classList.add('author-role');
    }
  });
}

/* Helper: Decorate Card Footer Taxonomy List */
export function decorateTaxonomy(col) {
  const taxonomies = col.querySelectorAll('.card-footer-taxonomy, [data-aue-model="card-footer-taxonomy"]');
  taxonomies.forEach((taxonomy) => {
    taxonomy.classList.add('columns-footer-taxonomy');
    taxonomy.setAttribute('data-aue-type', 'component');
    taxonomy.setAttribute('data-aue-model', 'card-footer-taxonomy');
    taxonomy.setAttribute('data-aue-label', 'Card Footer Taxonomy');
  });
}

/* Helper: Convert video links into interactive HTML5 or responsive Embeds */
export function decorateVideo(col) {
  const videoLinks = col.querySelectorAll('a[href*=".mp4"], a[href*="youtube.com"], a[href*="youtu.be"], a[href*="vimeo.com"], [data-aue-model="video"]');
  videoLinks.forEach((link) => {
    if (link.tagName === 'A') {
      const url = link.href;
      if (url && url.endsWith('.mp4')) {
        const video = document.createElement('video');
        video.src = url;
        video.controls = true;
        video.playsInline = true;
        video.className = 'columns-video';
        video.setAttribute('data-aue-type', 'component');
        video.setAttribute('data-aue-model', 'video');
        video.setAttribute('data-aue-label', 'Video');
        link.replaceWith(video);
      } else if (url) {
        const embedContainer = document.createElement('div');
        embedContainer.className = 'columns-video-embed';
        embedContainer.setAttribute('data-aue-type', 'component');
        embedContainer.setAttribute('data-aue-model', 'video');
        embedContainer.setAttribute('data-aue-label', 'Video');

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
    }
  });
}

/* Helper: Style CTAs */
export function decorateButtons(col) {
  const ctas = col.querySelectorAll('a, [data-aue-model="cta"]');
  ctas.forEach((cta) => {
    if (cta.closest('.columns-video-embed') || cta.tagName === 'VIDEO') return;

    const parent = cta.parentElement;
    cta.classList.add('button');
    cta.setAttribute('data-aue-type', 'component');
    cta.setAttribute('data-aue-model', 'cta');
    cta.setAttribute('data-aue-label', 'CTA Link');

    if (parent && (parent.tagName === 'STRONG' || cta.classList.contains('primary') || parent.classList.contains('primary'))) {
      cta.classList.add('primary');
    } else if (parent && (parent.tagName === 'EM' || cta.classList.contains('secondary') || parent.classList.contains('secondary'))) {
      cta.classList.add('secondary');
    } else if (cta.classList.contains('outline') || (parent && parent.classList.contains('outline'))) {
      cta.classList.add('outline');
    } else if (cta.classList.contains('text-link') || (parent && parent.classList.contains('text-link'))) {
      cta.classList.remove('button');
      cta.classList.add('cta-text-link');
    }
  });
}

/* Helper: Wrap accordion structures */
export function decorateAccordion(col) {
  const accordionHeaders = col.querySelectorAll('.accordion-header, h3, h4, [data-aue-model="accordion"]');
  accordionHeaders.forEach((header) => {
    if (header.closest('.columns-accordion')) return;

    const accordionWrapper = document.createElement('details');
    accordionWrapper.className = 'columns-accordion';
    accordionWrapper.setAttribute('data-aue-type', 'component');
    accordionWrapper.setAttribute('data-aue-model', 'accordion');
    accordionWrapper.setAttribute('data-aue-label', 'Accordion');

    const summary = document.createElement('summary');
    summary.className = 'columns-accordion-title';
    summary.innerHTML = header.innerHTML || 'Accordion Title';

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
  const cols = [...block.firstElementChild?.children || []];
  block.classList.add(`columns-${cols.length}-cols`);

  const backgroundColor = [...block.classList].find((cls) => cls.startsWith('bg-'));
  if (backgroundColor) {
    block.style.setProperty('--columns-background-color', `var(--${backgroundColor.substring(3)})`);
  }

  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      col.setAttribute('data-aue-filter', 'column');
      col.setAttribute('data-aue-type', 'container');
      col.setAttribute('data-aue-label', 'Column Container');

      decorateImage(col);
      decorateBadges(col);
      decorateCardMeta(col);
      decorateAuthor(col);
      decorateTaxonomy(col);
      decorateVideo(col);
      decorateButtons(col);
      decorateAccordion(col);
    });
  });
}
