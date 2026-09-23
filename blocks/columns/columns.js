/**
 * Decorates the columns block to handle responsive layouts and
 * specific sub-block behaviors (Images, Videos, Icons, Accordions).
 * @param {Element} block The columns block element
 */
export default function decorate(block) {
  const firstRow = block.firstElementChild;
  if (!firstRow) return;

  const cols = [...firstRow.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // Process rows and columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      // 1. Identify standalone Image columns
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          picWrapper.classList.add('columns-img-col');
        }
      }

      // 2. Identify standalone Video / Embed columns
      const video = col.querySelector('video, iframe, a[href*="youtube.com"], a[href*="vimeo.com"]');
      if (video) {
        const videoWrapper = video.closest('div');
        if (videoWrapper && videoWrapper.children.length === 1) {
          videoWrapper.classList.add('columns-media-col');
        }
      }

      // 3. Process Icon sub-blocks (converts icon links/spans if applicable)
      const icons = col.querySelectorAll('span.icon');
      icons.forEach((icon) => {
        if (!icon.querySelector('img')) {
          const iconName = [...icon.classList]
            .find((c) => c.startsWith('icon-'))
            ?.replace('icon-', '');
          if (iconName) {
            const img = document.createElement('img');
            img.src = `${window.hlx?.codeBasePath || ''}/icons/${iconName}.svg`;
            img.alt = iconName;
            img.loading = 'lazy';
            icon.appendChild(img);
          }
        }
      });
    });
  });
}
