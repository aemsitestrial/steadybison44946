export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // 1. Add grid column count class
  const columnCount = rows[0].children.length;
  block.classList.add(`columns-${columnCount}-cols`);

  rows.forEach((row) => {
    row.classList.add('columns-row');
    const columns = [...row.children];

    columns.forEach((column) => {
      column.classList.add('columns-col');
      const allTextElements = [...column.querySelectorAll('p, div, span')];
      allTextElements.forEach((el) => {
        const text = el.textContent.trim().toLowerCase();
        if (text === 'default-light' || text === 'default-dark') {
          column.classList.add(text);
          el.remove(); // Prevents "default-light" from rendering as visible text on page
        }
      });

      // --- Detect element types ---
      const picture = column.querySelector('picture');
      const heading = column.querySelector('h1, h2, h3, h4, h5, h6');
      const list = column.querySelector('ul, ol');
      const hasParagraph = column.querySelector('p');
      const hasBlock = column.querySelector('[class*="block"]');

      // Check if image column (handles standalone <picture> or single <picture> inside <p>)
      const isImageCol = picture && (
        column.children.length === 1
        || (column.children.length === 1 && column.firstElementChild.tagName === 'P' && column.firstElementChild.children.length === 1)
      );

      if (isImageCol) {
        column.classList.add('columns-img-col');
      }

      if (heading || list || hasBlock || hasParagraph) {
        column.classList.add('columns-text-col');
      }

      // --- Link List arrow injection ---
      if (list) {
        list.classList.add('columns-link-list');
        list.querySelectorAll('a').forEach((link) => {
          link.classList.add('columns-link');
          if (!link.querySelector('.columns-link-arrow')) {
            const arrow = document.createElement('span');
            arrow.className = 'columns-link-arrow';
            arrow.setAttribute('aria-hidden', 'true');
            arrow.textContent = '→';
            link.appendChild(arrow);
          }
        });
      }
    });

    // --- 2-Column Variants ---
    if (columns.length === 2) {
      const [firstCol, secondCol] = columns;
      const firstHasImage = firstCol.querySelector('picture');
      const secondHasHeading = secondCol.querySelector('h1, h2, h3, h4, h5, h6');
      const secondHasList = secondCol.querySelector('ul, ol');

      if (firstHasImage && secondHasHeading) {
        block.classList.add('columns-variant-image-copy');
      }
      if (secondHasList && secondCol.querySelector('p')) {
        block.classList.add('columns-variant-text-links');
      }
    }
  });
}
