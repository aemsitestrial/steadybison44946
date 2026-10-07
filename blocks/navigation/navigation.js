function getItemLabel(item) {
  const copy = item.cloneNode(true);
  copy.querySelectorAll('ul').forEach((list) => list.remove());
  return copy.textContent.trim();
}

function getItemLink(item) {
  const link = item.querySelector(':scope > a[href], :scope > p > a[href]');
  return link ? { href: link.getAttribute('href'), target: link.target } : null;
}

function getItems(list) {
  return [...list.children]
    .filter((item) => item.tagName === 'LI')
    .map((item) => {
      const nestedList = [...item.children].find((child) => child.tagName === 'UL');
      return {
        label: getItemLabel(item),
        link: getItemLink(item),
        children: nestedList ? getItems(nestedList) : [],
      };
    })
    .filter((item) => item.label);
}

function createLink(item, className) {
  const link = document.createElement(item.link ? 'a' : 'span');
  link.className = className;
  link.textContent = item.label;
  if (item.link) {
    link.href = item.link.href;
    if (item.link.target) link.target = item.link.target;
    if (item.link.target === '_blank') link.rel = 'noopener noreferrer';
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

export function decorateNavigation(block, menuSource = block) {
  const rootList = menuSource.matches('ul') ? menuSource : menuSource.querySelector('ul');
  const items = rootList ? getItems(rootList) : [];
  let activeL1 = null;
  let activeL2 = null;

  block.replaceChildren();
  block.classList.add('floating-bottom-dock');

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
      nav.append(createLevel(items, 'dock-level-one', (item, button) => {
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

  block.addEventListener('keydown', (event) => {
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
    if (!block.contains(event.target) && activeL2) {
      activeL2 = null;
      render();
    }
  });

  dock.append(hamburger, nav);
  block.append(dock);
  render();
}

export default function decorate(block) {
  decorateNavigation(block, block.querySelector('[data-aue-prop="menu"]') || block);
}
