const getChevronSvg = () => `
  <svg class="chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
`;

function formatHtmlPath(path) {
  if (!path || path === '/') return path || '#';
  let resolvedPath = path;
  if (!resolvedPath.startsWith('/content/')) {
    resolvedPath = `/content/2026/39/briskdeer43959${resolvedPath.startsWith('/') ? '' : '/'}${resolvedPath}`;
  }
  return resolvedPath.endsWith('.html') ? resolvedPath : `${resolvedPath}.html`;
}

async function fetchHierarchicalNavData() {
  try {
    const response = await fetch('/query-index.json');
    if (!response.ok) return [];
    const json = await response.json();
    const data = json.data || json;

    if (!Array.isArray(data)) return [];

    const navTree = {};
    const excludedPages = ['footer', 'header', 'tcs-footer', 'tcs-header', 'blocks', 'home', 'home-page', 'homepage', 'demo', 'nav', 'iconlist', 'qa', 'test'];

    data.forEach((item) => {
      const rawPath = item?.path || '';
      if (!rawPath) return;

      const segments = rawPath.split('/').filter(Boolean);
      let locale = '';
      if (segments[0] && segments[0].length === 2) {
        locale = segments.shift();
      }

      if (segments.length === 0) return;

      const lastSegment = segments[segments.length - 1].toLowerCase().replace(/\s+/g, '-');
      if (excludedPages.includes(lastSegment)) return;

      const l1Key = segments[0];
      if (excludedPages.includes(l1Key.toLowerCase())) return;

      if (!navTree[l1Key]) {
        navTree[l1Key] = {
          key: l1Key,
          title: item.title && segments.length === 1 ? item.title : l1Key.replace(/-/g, ' '),
          path: formatHtmlPath(`/${locale ? `${locale}/` : ''}${l1Key}`),
          children: {},
        };
      }

      if (segments.length >= 2) {
        const l2Key = segments[1];
        if (excludedPages.includes(l2Key.toLowerCase())) return;

        if (!navTree[l1Key].children[l2Key]) {
          navTree[l1Key].children[l2Key] = {
            key: l2Key,
            title: item.title && segments.length === 2 ? item.title : l2Key.replace(/-/g, ' '),
            path: formatHtmlPath(`/${locale ? `${locale}/` : ''}${l1Key}/${l2Key}`),
            children: [],
          };
        }

        if (segments.length >= 3) {
          const l3Key = segments[2];
          if (excludedPages.includes(l3Key.toLowerCase())) return;

          navTree[l1Key].children[l2Key].children.push({
            key: l3Key,
            title: item.title || l3Key.replace(/-/g, ' '),
            path: formatHtmlPath(`/${locale ? `${locale}/` : ''}${l1Key}/${l2Key}/${l3Key}`),
          });
        }
      }
    });

    return Object.values(navTree).map((l1) => ({
      ...l1,
      children: Object.values(l1.children).map((l2) => ({
        ...l2,
        children: l2.children || [],
      })),
    }));
  } catch (error) {
    console.error('Failed to load navigation index:', error);
    return [];
  }
}

export default function decorate(block) {
  const ariaLabel = block.textContent.trim() || 'Open navigation menu';

  const wrapper = document.createElement('div');
  wrapper.className = 'tcs-footer-hamburger-wrapper';

  const hamburgerBtn = document.createElement('button');
  hamburgerBtn.className = 'tcs-footer-hamburger';
  hamburgerBtn.setAttribute('aria-label', ariaLabel);
  hamburgerBtn.setAttribute('aria-expanded', 'false');
  hamburgerBtn.innerHTML = `
    <span class="icon-hamburger">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </span>
    <span class="icon-close hidden">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </span>
  `;

  const panelContainer = document.createElement('div');
  panelContainer.className = 'tcs-hamburger-nav-panel hidden';

  const navPillsRow = document.createElement('div');
  navPillsRow.className = 'tcs-footer-nav-pills-row';

  const subMenuPanel = document.createElement('div');
  subMenuPanel.className = 'tcs-footer-submenu-panel hidden';

  panelContainer.append(navPillsRow, subMenuPanel);
  wrapper.append(hamburgerBtn);

  block.textContent = '';
  block.append(wrapper, panelContainer);

  let isNavOpen = false;
  let navTreeData = null;
  let currentViewLevel = 'L1';

  const renderSubmenuCard = (items) => {
    if (!items || items.length === 0) {
      subMenuPanel.classList.add('hidden');
      return;
    }

    subMenuPanel.innerHTML = `
      <div class="tcs-submenu-grid">
        ${items
    .map(
      (item) => `
            <a href="${item.path}" class="tcs-submenu-item">
              <span>${item.title}</span>
              <span class="arrow">→</span>
            </a>
          `,
    )
    .join('')}
      </div>
    `;
    subMenuPanel.classList.remove('hidden');
  };

  const updateIcons = (level) => {
    currentViewLevel = level;
    const hamburgerIcon = hamburgerBtn.querySelector('.icon-hamburger');
    const closeIcon = hamburgerBtn.querySelector('.icon-close');

    if (level === 'L1') {
      hamburgerIcon.classList.add('hidden');
      closeIcon.classList.remove('hidden');
    } else {
      hamburgerIcon.classList.remove('hidden');
      closeIcon.classList.add('hidden');
    }
  };

  const renderL2SubNavigation = (l1Data) => {
    navPillsRow.innerHTML = '';
    updateIcons('L2');

    const l2Group = document.createElement('div');
    l2Group.className = 'tcs-l2-pills-group';

    l1Data.children.forEach((l2) => {
      const l2Pill = document.createElement('div');
      l2Pill.className = 'tcs-nav-pill l2-pill';
      const hasL3 = l2.children && l2.children.length > 0;

      l2Pill.innerHTML = `
        <a href="${l2.path}" class="tcs-pill-link">${l2.title}</a>
        ${hasL3 ? `<button class="chevron-btn" aria-label="Expand subpages">${getChevronSvg()}</button>` : ''}
      `;

      const triggerL3View = (e) => {
        if (e) e.stopPropagation();
        l2Group.querySelectorAll('.tcs-nav-pill').forEach((p) => p.classList.remove('active'));
        l2Pill.classList.add('active');

        if (hasL3) {
          renderSubmenuCard(l2.children);
        } else {
          subMenuPanel.classList.add('hidden');
        }
      };

      l2Pill.addEventListener('mouseenter', triggerL3View);
      const chevronBtn = l2Pill.querySelector('.chevron-btn');
      if (chevronBtn) chevronBtn.addEventListener('click', triggerL3View);

      l2Group.append(l2Pill);
    });

    navPillsRow.append(l2Group);
  };

  const renderL1ParentNavigation = async () => {
    navPillsRow.innerHTML = '';
    subMenuPanel.classList.add('hidden');
    updateIcons('L1');

    if (!navTreeData) {
      navTreeData = await fetchHierarchicalNavData();
    }

    navTreeData.forEach((l1, idx) => {
      const l1Pill = document.createElement('div');
      l1Pill.className = `tcs-nav-pill ${idx === 0 ? 'active' : ''}`;
      const hasL2 = l1.children && l1.children.length > 0;

      l1Pill.innerHTML = `
        <a href="${l1.path}" class="tcs-pill-link">${l1.title}</a>
        ${hasL2 ? `<button class="chevron-btn" aria-label="Expand subpages">${getChevronSvg()}</button>` : ''}
      `;

      const enterSubPageNavigation = (e) => {
        if (e) e.stopPropagation();
        if (hasL2) renderL2SubNavigation(l1);
      };

      l1Pill.addEventListener('mouseenter', () => {
        navPillsRow.querySelectorAll('.tcs-nav-pill').forEach((p) => p.classList.remove('active'));
        l1Pill.classList.add('active');
        if (hasL2) renderSubmenuCard(l1.children);
      });

      const chevronBtn = l1Pill.querySelector('.chevron-btn');
      if (chevronBtn) chevronBtn.addEventListener('click', enterSubPageNavigation);

      navPillsRow.append(l1Pill);
    });

    if (navTreeData[0] && navTreeData[0].children && navTreeData[0].children.length > 0) {
      renderSubmenuCard(navTreeData[0].children);
    }
  };

  const closeAllNavigation = () => {
    isNavOpen = false;
    currentViewLevel = 'L1';
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.querySelector('.icon-hamburger').classList.remove('hidden');
    hamburgerBtn.querySelector('.icon-close').classList.add('hidden');
    panelContainer.classList.add('hidden');
    subMenuPanel.classList.add('hidden');
  };

  hamburgerBtn.addEventListener('click', async () => {
    if (currentViewLevel === 'L2' || currentViewLevel === 'L3') {
      await renderL1ParentNavigation();
      return;
    }

    if (!isNavOpen) {
      isNavOpen = true;
      hamburgerBtn.setAttribute('aria-expanded', 'true');
      panelContainer.classList.remove('hidden');
      await renderL1ParentNavigation();
    } else {
      closeAllNavigation();
    }
  });

  block.addEventListener('mouseleave', () => {
    subMenuPanel.classList.add('hidden');
    navPillsRow.querySelectorAll('.tcs-nav-pill').forEach((p) => p.classList.remove('active'));
  });
}
