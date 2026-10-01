/**
 * Decorates the sub-card block.
 * @param {Element} block The sub-card block element.
 */
export default function decorate(block) {
  // Guard against duplicate execution on Universal Editor re-renders / asset uploads
  if (block.dataset.decorated) {
    return;
  }
  block.dataset.decorated = 'true';

  const rows = [...block.children];

  rows.forEach((row) => {
    row.classList.add('sub-card-item');

    // Handle card background picture/image wrapper
    const pic = row.querySelector('picture');
    if (pic) {
      const picContainer = pic.closest('div');
      if (picContainer) {
        picContainer.classList.add('sub-card-media');
      }
      row.classList.add('has-image');
    }

    // Process typography and stat metrics
    const elements = [...row.querySelectorAll('p, h1, h2, h3, h4, h5, h6')];

    elements.forEach((el) => {
      const text = el.textContent.trim();

      if (/^\d+[KkM%]?\+?$/.test(text) && !el.classList.contains('sub-card-stat')) {
        el.classList.add('sub-card-stat');
      } else if (text.toLowerCase() === 'overline') {
        el.classList.add('sub-card-overline');
      }
    });

    // Decorate CTA links with arrow element
    const links = row.querySelectorAll('a');
    links.forEach((link) => {
      link.classList.add('sub-card-cta');
      if (!link.querySelector('.arrow')) {
        const arrow = document.createElement('span');
        arrow.classList.add('arrow');
        arrow.textContent = ' →';
        link.appendChild(arrow);
      }
    });
  });
}
