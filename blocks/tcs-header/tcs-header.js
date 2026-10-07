import { createOptimizedPicture } from '../../scripts/aem.js';
import { decorateNavigation } from '../navigation/navigation.js';

const NAVIGATION_STYLESHEET = `${window.hlx.codeBasePath}/blocks/navigation/navigation.css`;

function loadNavigationStyles() {
  if (document.querySelector(`link[href="${NAVIGATION_STYLESHEET}"]`)) return;
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = NAVIGATION_STYLESHEET;
  document.head.append(stylesheet);
}

/**
 * Helper to safely extract property elements or child values
 */
function getProp(block, name, fallback = '') {
  const lower = name.toLowerCase();
  const fieldOrder = ['headerVariant', 'tcsLogo', 'tcsLogoLink', 'tataLogo', 'tataLogoLink', 'menu'];

  const getValue = (element) => {
    if (!element) return '';
    const image = element.matches('img') ? element : element.querySelector('picture img, img');
    if (image) return image.getAttribute('src') || image.src;
    const anchor = element.matches('a') ? element : element.querySelector('a');
    if (anchor) return anchor.getAttribute('href') || anchor.textContent.trim();
    return element.dataset.value || element.textContent.trim();
  };

  // 1. Direct dataset or data-aue-prop lookup
  if (block.dataset[name] !== undefined) return block.dataset[name];
  if (block.dataset[lower] !== undefined) return block.dataset[lower];
  const attrElem = block.querySelector(`[data-aue-prop="${name}"], [data-aue-prop="${lower}"]`);
  if (attrElem) return getValue(attrElem);

  // 2. Table row fallback scanning
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

  // 3. Published Universal Editor content stores model fields in row order fallback
  const fieldIndex = fieldOrder.indexOf(name);
  if (fieldIndex >= 0 && rows[fieldIndex]) {
    const cols = [...rows[fieldIndex].children];
    return getValue(cols.length > 1 ? cols[1] : rows[fieldIndex]) || fallback;
  }

  return fallback;
}

function normalizeVariant(value) {
  const normalized = String(value).trim().toLowerCase().replace(/\s+/g, '-');
  return ['standard', 'compact', 'dark', 'centered'].includes(normalized)
    ? normalized
    : 'standard';
}

export default function decorate(block) {
  // 1. Extract Basic Properties
  const config = {
    headerVariant: normalizeVariant(getProp(block, 'headerVariant', 'standard')),
    tcsLogo: getProp(block, 'tcsLogo'),
    tcsLogoLink: getProp(block, 'tcsLogoLink', '/'),
    tataLogo: getProp(block, 'tataLogo'),
    tataLogoLink: getProp(block, 'tataLogoLink', 'https://www.tata.com'),
  };
  const menuSource = block.querySelector('[data-aue-prop="menu"]')
    || ([...block.children][5]?.children[1])
    || block.querySelector('ul');
  const menuContent = menuSource?.cloneNode(true);
  const supportedVariants = ['standard', 'compact', 'dark', 'centered'];
  if (!supportedVariants.includes(config.headerVariant)) config.headerVariant = 'standard';

  // 3. Rebuild Clean Block DOM
  block.textContent = '';
  block.classList.remove('variant-standard', 'variant-compact', 'variant-dark', 'variant-centered');
  block.classList.add(`variant-${config.headerVariant}`);
  block.dataset.variant = config.headerVariant;

  const navWrapper = document.createElement('div');
  navWrapper.className = 'tcs-nav-wrapper';

  const nav = document.createElement('nav');
  nav.id = 'tcs-nav';
  nav.setAttribute('aria-expanded', 'false');

  // TCS Logo
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

  // Tata Logo
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

  // Assemble
  nav.append(brandPrimary, brandSecondary);
  navWrapper.append(nav);
  block.append(navWrapper);

  const navigation = document.createElement('div');
  navigation.className = 'navigation tcs-header-navigation';
  block.append(navigation);
  loadNavigationStyles();
  if (menuContent) decorateNavigation(navigation, menuContent);
}
