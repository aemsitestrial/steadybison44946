import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Safely extracts block property values or datasets from Universal Editor output
 */
function getProp(block, name, fallback = '') {
  const lower = name.toLowerCase();

  if (block.dataset[name] !== undefined) return block.dataset[name];
  if (block.dataset[lower] !== undefined) return block.dataset[lower];

  const attrElem = block.querySelector(`[data-aue-prop="${name}"], [data-aue-prop="${lower}"]`);
  if (attrElem) {
    const img = attrElem.querySelector('img');
    if (img) return img.getAttribute('src') || img.src;
    const a = attrElem.querySelector('a');
    if (a) return a.getAttribute('href') || a.textContent.trim();
    return attrElem.textContent.trim();
  }

  // Row fallback
  const rows = [...block.children];
  let rowValue;
  rows.some((row) => {
    const cols = [...row.children];
    if (cols.length >= 2) {
      const key = cols[0].textContent.trim().toLowerCase().replace(/[-_]/g, '');
      if (key === lower.replace(/[-_]/g, '')) {
        const valCol = cols[1];
        const img = valCol.querySelector('img');
        if (img) {
          rowValue = img.getAttribute('src') || img.src;
          return true;
        }
        const a = valCol.querySelector('a');
        rowValue = a
          ? a.getAttribute('href') || a.textContent.trim()
          : valCol.textContent.trim();
        return true;
      }
    }
    return false;
  });
  return rowValue || fallback;
}

function normalizeVariant(value) {
  const normalized = String(value).trim().toLowerCase().replace(/\s+/g, '-');
  return ['standard', 'compact', 'dark', 'centered', 'floating-bottom'].includes(normalized)
    ? normalized
    : 'standard';
}

/**
 * Processes L1, L2, and L3 list hierarchy into Megamenu markup
 */
function processMenuHierarchy(menuSource) {
  const navList = document.createElement('ul');
  navList.className = 'tcs-nav-list';

  const rootUl = menuSource.querySelector('ul') || menuSource;
  if (!rootUl || rootUl.tagName !== 'UL') return navList;

  [...rootUl.children].forEach((l1Li) => {
    const l1Item = document.createElement('li');
    l1Item.className = 'nav-item-l1';

    const l1Anchor = l1Li.querySelector(':scope > a');
    const l2Ul = l1Li.querySelector(':scope > ul');

    if (l2Ul) {
      // Create Dropdown/Megamenu Toggle Button
      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'nav-menu-toggle';
      toggleBtn.setAttribute('aria-expanded', 'false');

      const labelText = l1Anchor ? l1Anchor.textContent.trim() : l1Li.firstChild.textContent.trim();
      toggleBtn.innerHTML = `<span class="nav-menu-label">${labelText}</span><span class="chevron-icon"></span>`;

      // Build Sub-menu Megamenu (L2 / L3)
      const megaPanel = document.createElement('div');
      megaPanel.className = 'nav-megamenu-panel';

      const l2List = document.createElement('ul');
      l2List.className = 'nav-l2-list';

      [...l2Ul.children].forEach((l2Li) => {
        const l2Item = document.createElement('li');
        l2Item.className = 'nav-item-l2';

        const l2Anchor = l2Li.querySelector(':scope > a');
        if (l2Anchor) {
          l2Anchor.className = 'nav-l2-title';
          l2Item.append(l2Anchor.cloneNode(true));
        } else {
          const titleSpan = document.createElement('span');
          titleSpan.className = 'nav-l2-title';
          titleSpan.textContent = l2Li.firstChild.textContent.trim();
          l2Item.append(titleSpan);
        }

        // L3 Sub-links
        const l3Ul = l2Li.querySelector(':scope > ul');
        if (l3Ul) {
          const l3List = document.createElement('ul');
          l3List.className = 'nav-l3-list';
          [...l3Ul.children].forEach((l3Li) => {
            const l3Item = document.createElement('li');
            l3Item.className = 'nav-item-l3';
            const l3Anchor = l3Li.querySelector('a');
            if (l3Anchor) {
              l3Item.append(l3Anchor.cloneNode(true));
              l3List.append(l3Item);
            }
          });
          l2Item.append(l3List);
        }
        l2List.append(l2Item);
      });

      megaPanel.append(l2List);
      l1Item.append(toggleBtn, megaPanel);

      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';

        // Close other open panels
        navList.querySelectorAll('.nav-menu-toggle').forEach((btn) => {
          btn.setAttribute('aria-expanded', 'false');
        });

        toggleBtn.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
      });
    } else if (l1Anchor) {
      l1Item.append(l1Anchor.cloneNode(true));
    }

    navList.append(l1Item);
  });

  return navList;
}

export default function decorate(block) {
  const config = {
    headerVariant: normalizeVariant(getProp(block, 'headerVariant', 'standard')),
    tcsLogo: getProp(block, 'tcsLogo'),
    tcsLogoLink: getProp(block, 'tcsLogoLink', '/'),
    tataLogo: getProp(block, 'tataLogo'),
    tataLogoLink: getProp(block, 'tataLogoLink', 'https://www.tata.com'),
  };

  // Dynamic selector fixes issues where hardcoded row indexing broke in Universal Editor
  const menuSource = block.querySelector('[data-aue-prop="menu"]')
    || block.querySelector('.tcs-nav-list')
    || block.querySelector('ul')
    || block;

  const navList = processMenuHierarchy(menuSource);

  block.textContent = '';
  block.classList.remove('variant-standard', 'variant-compact', 'variant-dark', 'variant-centered', 'variant-floating-bottom');
  block.classList.add(`variant-${config.headerVariant}`);
  block.dataset.variant = config.headerVariant;

  const navWrapper = document.createElement('div');
  navWrapper.className = 'tcs-nav-wrapper';

  const nav = document.createElement('nav');
  nav.id = 'tcs-nav';
  nav.setAttribute('aria-expanded', 'false');

  // TCS Primary Logo
  const brandPrimary = document.createElement('div');
  brandPrimary.className = 'nav-brand-primary';
  const primaryAnchor = document.createElement('a');
  primaryAnchor.href = config.tcsLogoLink;

  if (config.tcsLogo) {
    primaryAnchor.append(createOptimizedPicture(config.tcsLogo, 'Tata Consultancy Services', false, [{ width: '300' }]));
  } else {
    primaryAnchor.textContent = 'TCS';
  }
  brandPrimary.append(primaryAnchor);

  // Navigation Links / Megamenu
  const navSections = document.createElement('div');
  navSections.className = 'nav-sections';
  navSections.append(navList);

  // Tata Secondary Logo
  const brandSecondary = document.createElement('div');
  brandSecondary.className = 'nav-brand-secondary';
  const secondaryAnchor = document.createElement('a');
  secondaryAnchor.href = config.tataLogoLink;
  secondaryAnchor.target = '_blank';
  secondaryAnchor.rel = 'noopener noreferrer';

  if (config.tataLogo) {
    secondaryAnchor.append(createOptimizedPicture(config.tataLogo, 'TATA Group', false, [{ width: '160' }]));
  } else {
    secondaryAnchor.textContent = 'TATA';
  }
  brandSecondary.append(secondaryAnchor);

  // Mobile / Centered Hamburger Toggle
  const hamburgerWrapper = document.createElement('div');
  hamburgerWrapper.className = 'nav-hamburger';
  const hamburgerButton = document.createElement('button');
  hamburgerButton.type = 'button';
  hamburgerButton.setAttribute('aria-controls', 'tcs-nav');
  hamburgerButton.setAttribute('aria-label', 'Open menu');
  hamburgerButton.setAttribute('aria-expanded', 'false');
  hamburgerButton.innerHTML = '<span class="nav-hamburger-icon"></span>';

  const toggleMenu = (openState) => {
    const isExpanded = openState !== undefined ? openState : nav.getAttribute('aria-expanded') !== 'true';
    nav.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    hamburgerButton.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    hamburgerButton.setAttribute('aria-label', isExpanded ? 'Close menu' : 'Open menu');

    const isDesktop = window.innerWidth >= 1025;
    document.body.style.overflowY = !isExpanded || isDesktop ? '' : 'hidden';
  };

  hamburgerButton.addEventListener('click', () => toggleMenu());

  // Close megamenu when clicking outside
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) {
      nav.querySelectorAll('.nav-menu-toggle').forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
    }
  });

  window.addEventListener('resize', () => toggleMenu(false));

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      nav.querySelectorAll('.nav-menu-toggle').forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
      if (nav.getAttribute('aria-expanded') === 'true') {
        toggleMenu(false);
        hamburgerButton.focus();
      }
    }
  });

  hamburgerWrapper.append(hamburgerButton);
  nav.append(hamburgerWrapper, brandPrimary, navSections, brandSecondary);
  navWrapper.append(nav);
  block.append(navWrapper);
}
