export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // Setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      // 1. Handle Images
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          picWrapper.classList.add('columns-img-col');
        }
      }

      // 2. Handle Videos (Embed or HTML5 video link conversion)
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
          // Responsive iframe container for Youtube / Vimeo embeds
          const embedContainer = document.createElement('div');
          embedContainer.className = 'columns-video-embed';

          let embedSrc = url;
          if (url.includes('youtube.com/watch?v=')) {
            embedSrc = `https://www.youtube.com/embed/${new URL(url).searchParams.get('v')}`;
          } else if (url.includes('youtu.be/')) {
            embedSrc = `https://www.youtube.com/embed/${url.split('/').pop()}`;
          } else if (url.includes('vimeo.com/')) {
            embedSrc = `https://player.vimeo.com/video/${url.split('/').pop()}`;
          }

          embedContainer.innerHTML = `<iframe src="${embedSrc}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
          link.replaceWith(embedContainer);
        }
      });

      // 3. Handle CTA Variations (Primary, Secondary, Outline, Text Link)
      const ctas = col.querySelectorAll('a');
      ctas.forEach((cta) => {
        // Skip links converted to videos
        if (cta.closest('.columns-video-embed') || cta.tagName === 'VIDEO') return;

        const parent = cta.parentElement;
        if (parent.tagName === 'P' || parent.tagName === 'DIV') {
          if (cta.classList.contains('primary') || parent.classList.contains('primary')) {
            cta.className = 'button primary';
          } else if (cta.classList.contains('secondary') || parent.classList.contains('secondary')) {
            cta.className = 'button secondary';
          } else if (cta.classList.contains('outline') || parent.classList.contains('outline')) {
            cta.className = 'button outline';
          } else if (cta.classList.contains('text-link') || parent.classList.contains('text-link')) {
            cta.className = 'cta-text-link';
          }
        }
      });

      // 4. Handle Accordion Items
      const accordionHeaders = col.querySelectorAll('.accordion-header, h3, h4');
      accordionHeaders.forEach((header) => {
        if (header.closest('.accordion')) return; // Avoid re-wrapping if already decorated

        const accordionWrapper = document.createElement('details');
        accordionWrapper.className = 'columns-accordion';

        const summary = document.createElement('summary');
        summary.className = 'columns-accordion-title';
        summary.innerHTML = header.innerHTML;

        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'columns-accordion-content';

        // Gather siblings until next header or end
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
    });
  });
}
