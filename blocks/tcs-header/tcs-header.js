import { createOptimizedPicture } from '../../scripts/aem.js';

/* Helper to safely read block properties */
function getProp(block, name, fallback = '') {
  const lower = name.toLowerCase();
  const fieldOrder = ['headerVariant', 'tcsLogo', 'tcsLogoLink', 'tataLogo', 'tataLogoLink'];

  const getValue = (element) => {
    if (!element) return '';
    const image = element.matches('img') ? element : element.querySelector('picture img, img');
    if (image) return image.getAttribute('src') || image.src;
    const anchor = element.matches('a') ? element : element.querySelector('a');
    if (anchor) return anchor.getAttribute('href') || anchor.textContent.trim();
    return element.dataset.value || element.textContent.trim();
  };

  if (block.dataset[name] !== undefined) return block.dataset[name];
  if (block.dataset[lower] !== undefined) return block.dataset[lower];
  const attrElem = block.querySelector(`[data-aue-prop="${name}"], [data-aue-prop="${lower}"]`);
  if (attrElem) return getValue(attrElem);

  const rows = [...block.children];
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const cols = [...row.children];
    if (cols.length >= 2) {
      const key = cols[0].textContent.trim().toLowerCase().replace(/[-_]/g, '');
      if (key === lower.replace(/[-_]/g, '')) {
        return getValue(cols[1]);
      }
    }
  }

  const fieldIndex = fieldOrder.indexOf(name);
  if (fieldIndex >= 0 && rows[fieldIndex]) {
    const cols = [...rows[fieldIndex].children];
    return getValue(cols.length > 1 ? cols[1] : rows[fieldIndex]) || fallback;
  }

  return fallback;
}

function normalizeVariant(value) {
  const normalized = String(value).trim().toLowerCase().replace(/\s+/g, '-');
  return ['standard', 'compact', 'dark', 'centered'].includes(normalized) ? normalized : 'standard';
}

/* ==========================================================================
   QUERY INDEX FETCHING & TAXONOMY BUILDER
   ========================================================================== */
async function fetchQueryIndex() {
  try {
    const response = await fetch('/query-index.json');
    if (!response.ok) return [];
    const json = await response.json();
    return json.data || [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load query-index.json for navigation:', error);
    return [];
  }
}

/**
 * Builds a hierarchical tree (L1 -> L2 -> L3) from flat query-index rows
 */
function buildTaxonomyFromIndex(indexData) {
  const validItems = indexData.filter((item) => item.path && item.hideInNav !== 'true');

  // Helper to compute path depth (e.g., "/services/cloud" -> 2)
  const getDepth = (path) => path.split('/').filter(Boolean).length;

  const l1Items = validItems
    .filter((item) => getDepth(item.path) === 1)
    .sort((a, b) => (Number(a.navOrder) || 99) - (Number(b.navOrder) || 99));

  return l1Items.map((l1) => {
    const l2Items = validItems
      .filter((item) => getDepth(item.path) === 2 && item.path.startsWith(`${l1.path}/`))
      .sort((a, b) => (Number(a.navOrder) || 99) - (Number(b.navOrder) || 99));

    const l2Children = l2Items.map((l2) => {
      const l3Items = validItems
        .filter((item) => getDepth(item.path) === 3 && item.path.startsWith(`${l2.path}/`))
        .sort((a, b) => (Number(a.navOrder) || 99) - (Number(b.navOrder) || 99))
        .map((l3) => ({
          label: l3.title || l3.path.split('/').pop(),
          link: { href: l3.path },
          children: [],
        }));

      return {
        label: l2.title || l2.path.split('/').pop(),
        link: { href: l2.path },
        children: l3Items,
      };
    });

    return {
      label: l1.title || l1.path.split('/').pop(),
      link: { href: l1.path },
      children: l2Children,
    };
  });
}

/**
 * Detects initial L1/L2 active state from current page URL
 */
function getActiveFromCurrentPath(items, currentPath) {
  const l1Match = items.find((l1) => currentPath === l1.link.href || currentPath.startsWith(`${l1.link.href}/`));
  if (!l1Match) return { activeL1: null, activeL2: null };

  const l2Match = l1Match.children.find((l2) => currentPath === l2.link.href || currentPath.startsWith(`${l2.link.href}/`));
  return { activeL1: l1Match, activeL2: l2Match || null };
}

/* ==========================================================================
   NAVIGATION DOCK DOM BUILDERS
   ========================================================================== */
function createLink(item, className) {
  const link = document.createElement(item.link ? 'a' : 'span');
  link.className = className;
  link.textContent = item.label;
  if (item.link) {
    link.href = item.link.href;
  }
  return link;
}

function createPill(item, onSelect) {
  const button = document.createElement('button');
  button.className = 'dock-pill-btn';
  button.type = 'button';
  button.textContent = item.label;
  button.addEventListener('click', () => onSelect(item, button));

  const chevron = document.createElement('span');
  chevron.className = 'dock-chevron-icon';
  chevron.setAttribute('aria-hidden', 'true');
  button.append(chevron);
  return button;
}

function createLevel(items, className, onSelect) {
  const list = document.createElement('ul');
  list.className = `dock-list ${className}`;

  items.forEach((item) => {
    const listItem = document.createElement('li');
    listItem.className = 'dock-item';
    if (item.children.length) {
      listItem.append(createPill(item, onSelect));
    } else if (item.link) {
      listItem.append(createLink(item, 'dock-pill-btn single-link'));
    } else {
      const label = document.createElement('span');
      label.className = 'dock-pill-btn single-link';
      label.textContent = item.label;
      listItem.append(label);
    }
    list.append(listItem);
  });

  return list;
}

function createThirdLevelPanel(item) {
  const panel = document.createElement('div');
  panel.className = 'dock-megamenu-panel';
  panel.setAttribute('aria-label', `${item.label} links`);

  const list = document.createElement('ul');
  list.className = 'dock-l3-grid';
  item.children.forEach((child) => {
    const listItem = document.createElement('li');
    listItem.className = 'dock-l3-item';
    const link = createLink(child, 'dock-l3-link');
    listItem.append(link);
    list.append(listItem);
  });

  panel.append(list);
  return panel;
}

function decorateNavigationDock(container, taxonomy) {
  const currentPath = window.location.pathname;
  const {
    activeL1: initialActiveL1,
    activeL2: initialActiveL2,
  } = getActiveFromCurrentPath(taxonomy, currentPath);

  let activeL1 = initialActiveL1;
  let activeL2 = initialActiveL2;

  container.className = 'navigation-dock-wrapper floating-bottom-dock';

  const dock = document.createElement('div');
  dock.className = 'dock-inner-wrapper';

  const hamburger = document.createElement('button');
  hamburger.className = 'dock-hamburger-btn';
  hamburger.type = 'button';
  hamburger.setAttribute('aria-label', 'Show main navigation');
  hamburger.innerHTML = '<span aria-hidden="true"></span>';

  const nav = document.createElement('nav');
  nav.className = 'dock-navigation';
  nav.setAttribute('aria-label', 'Primary navigation');

  const render = () => {
    nav.replaceChildren();

    if (!activeL1) {
      nav.append(createLevel(taxonomy, 'dock-level-one', (item, button) => {
        activeL1 = item;
        activeL2 = null;
        render();
        nav.querySelector('.dock-level-two .dock-pill-btn')?.focus();
        button.blur();
      }));
      hamburger.hidden = true;
      return;
    }

    hamburger.hidden = false;
    const levelTwoItems = document.createElement('div');
    levelTwoItems.className = 'dock-level-two-row';
    levelTwoItems.append(createLevel(activeL1.children, 'dock-level-two', (item, button) => {
      activeL2 = activeL2 === item ? null : item;
      render();
      const activeButton = [...nav.querySelectorAll('.dock-level-two .dock-pill-btn')]
        .find((candidate) => candidate.textContent.trim().startsWith(item.label));
      if (activeButton && activeL2) {
        activeButton.setAttribute('aria-expanded', 'true');
        activeButton.setAttribute('aria-controls', 'navigation-third-level-panel');
        activeButton.focus();
      }
      button.blur();
    }));

    if (activeL2?.children.length) {
      const activeButton = [...levelTwoItems.querySelectorAll('.dock-pill-btn')]
        .find((candidate) => candidate.textContent.trim().startsWith(activeL2.label));
      if (activeButton) {
        activeButton.setAttribute('aria-expanded', 'true');
        activeButton.setAttribute('aria-controls', 'navigation-third-level-panel');
      }
      const panel = createThirdLevelPanel(activeL2);
      panel.id = 'navigation-third-level-panel';
      levelTwoItems.prepend(panel);
    }

    nav.append(levelTwoItems);
  };

  hamburger.addEventListener('click', () => {
    activeL1 = null;
    activeL2 = null;
    render();
    nav.querySelector('.dock-level-one .dock-pill-btn')?.focus();
  });

  container.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activeL1) {
      event.stopPropagation();
      if (activeL2) {
        activeL2 = null;
        render();
        nav.querySelector('.dock-level-two .dock-pill-btn')?.focus();
      } else {
        activeL1 = null;
        render();
        nav.querySelector('.dock-level-one .dock-pill-btn')?.focus();
      }
    }
  });

  document.addEventListener('click', (event) => {
    if (!container.contains(event.target) && activeL2) {
      activeL2 = null;
      render();
    }
  });

  dock.append(hamburger, nav);
  container.append(dock);
  render();
}

/* ==========================================================================
   MAIN DECORATE EXPORT
   ========================================================================== */
export default async function decorate(block) {
  const config = {
    headerVariant: normalizeVariant(getProp(block, 'headerVariant', 'standard')),
    tcsLogo: getProp(block, 'tcsLogo'),
    tcsLogoLink: getProp(block, 'tcsLogoLink', '/'),
    tataLogo: getProp(block, 'tataLogo'),
    tataLogoLink: getProp(block, 'tataLogoLink', 'https://www.tata.com'),
  };

  block.textContent = '';
  block.classList.remove('variant-standard', 'variant-compact', 'variant-dark', 'variant-centered');
  block.classList.add(`variant-${config.headerVariant}`);
  block.dataset.variant = config.headerVariant;

  /* 1. Build Top Header Bar */
  const navWrapper = document.createElement('div');
  navWrapper.className = 'tcs-nav-wrapper';

  const nav = document.createElement('nav');
  nav.id = 'tcs-nav';
  nav.setAttribute('aria-expanded', 'false');

  const brandPrimary = document.createElement('div');
  brandPrimary.className = 'nav-brand-primary';
  const primaryAnchor = document.createElement('a');
  primaryAnchor.href = config.tcsLogoLink;

  if (config.tcsLogo) {
    primaryAnchor.append(createOptimizedPicture(
      config.tcsLogo,
      'Tata Consultancy Services',
      false,
      [{ width: '300' }],
    ));
  } else {
    primaryAnchor.textContent = 'TCS';
  }
  brandPrimary.append(primaryAnchor);

  const brandSecondary = document.createElement('div');
  brandSecondary.className = 'nav-brand-secondary';
  const secondaryAnchor = document.createElement('a');
  secondaryAnchor.href = config.tataLogoLink;
  secondaryAnchor.target = '_blank';
  secondaryAnchor.rel = 'noopener noreferrer';

  if (config.tataLogo) {
    secondaryAnchor.append(createOptimizedPicture(
      config.tataLogo,
      'TATA Group',
      false,
      [{ width: '160' }],
    ));
  } else {
    secondaryAnchor.textContent = 'TATA';
  }
  brandSecondary.append(secondaryAnchor);

  nav.append(brandPrimary, brandSecondary);
  navWrapper.append(nav);
  block.append(navWrapper);

  /* 2. Asynchronously Fetch Query Index and Render Contextual Bottom Dock */
  const navDockContainer = document.createElement('div');
  block.append(navDockContainer);

  const rawIndex = await fetchQueryIndex();
  const taxonomy = buildTaxonomyFromIndex(rawIndex);

  if (taxonomy.length > 0) {
    decorateNavigationDock(navDockContainer, taxonomy);
  }
}
