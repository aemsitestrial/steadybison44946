/**
 * Bottom Floating Dock Navigation with Megamenu
 * Matched to Figma Specs: 863px container, 48px height pills, 12px gap
 */
function processMenuHierarchy(menuSource) {
  const navList = document.createElement('ul');
  navList.className = 'dock-list';

  const rootUl = menuSource.querySelector('ul') || menuSource;
  if (!rootUl || rootUl.tagName !== 'UL') return navList;

  [...rootUl.children].forEach((l1Li) => {
    const l1Item = document.createElement('li');
    l1Item.className = 'dock-item-l1';

    const l1Anchor = l1Li.querySelector(':scope > a');
    const l2Ul = l1Li.querySelector(':scope > ul');

    if (l2Ul) {
      // Filter Pill Toggle Button (Active / Inactive)
      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'dock-pill-btn';
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.setAttribute('aria-haspopup', 'true');

      const labelText = l1Anchor ? l1Anchor.textContent.trim() : l1Li.firstChild.textContent.trim();
      toggleBtn.innerHTML = `
        <span class="dock-pill-label">${labelText}</span>
        <span class="dock-chevron-icon"></span>
      `;

      // Megamenu Panel
      const megaPanel = document.createElement('div');
      megaPanel.className = 'dock-megamenu-panel';

      const l2List = document.createElement('ul');
      l2List.className = 'dock-l2-grid';

      [...l2Ul.children].forEach((l2Li) => {
        const l2Item = document.createElement('li');
        l2Item.className = 'dock-l2-item';

        const l2Anchor = l2Li.querySelector('a');
        const textContent = l2Anchor ? l2Anchor.textContent.trim() : l2Li.textContent.trim();
        const targetHref = l2Anchor ? l2Anchor.getAttribute('href') : '#';

        l2Item.innerHTML = `
          <a href="${targetHref}" class="dock-l2-link">
            <span>${textContent}</span>
            <span class="dock-arrow-right">→</span>
          </a>
        `;

        l2List.append(l2Item);
      });

      megaPanel.append(l2List);
      l1Item.append(toggleBtn, megaPanel);

      // Toggle Actions
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';

        // Close other active pills
        navList.querySelectorAll('.dock-pill-btn').forEach((btn) => {
          btn.setAttribute('aria-expanded', 'false');
        });

        toggleBtn.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
      });
    } else if (l1Anchor) {
      l1Anchor.className = 'dock-pill-btn single-link';
      l1Item.append(l1Anchor.cloneNode(true));
    }

    navList.append(l1Item);
  });

  return navList;
}

export default function decorate(block) {
  // Extract menu rich text dynamically for Universal Editor
  const menuSource = block.querySelector('[data-aue-prop="menu"]')
    || block.querySelector('ul')
    || block;

  const navList = processMenuHierarchy(menuSource);

  // Clear original content
  block.textContent = '';
  block.classList.add('floating-bottom-dock');

  const dockWrapper = document.createElement('div');
  dockWrapper.className = 'dock-inner-wrapper';

  // Left Hamburger Menu Action
  const hamburgerBtn = document.createElement('button');
  hamburgerBtn.className = 'dock-hamburger-btn';
  hamburgerBtn.type = 'button';
  hamburgerBtn.setAttribute('aria-label', 'Open navigation menu');
  hamburgerBtn.innerHTML = `
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 1H17M1 7H17M1 13H17" stroke="#3874FF" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;

  dockWrapper.append(hamburgerBtn, navList);
  block.append(dockWrapper);

  // Click & Keyboard Backdrop Dismissal
  document.addEventListener('click', (e) => {
    if (!block.contains(e.target)) {
      block.querySelectorAll('.dock-pill-btn').forEach((btn) => {
        btn.setAttribute('aria-expanded', 'false');
      });
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      block.querySelectorAll('.dock-pill-btn').forEach((btn) => {
        btn.setAttribute('aria-expanded', 'false');
      });
    }
  });
}
