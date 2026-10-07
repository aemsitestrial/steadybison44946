function getMenuSource(block) {
  const property = block.querySelector('[data-aue-prop="menu"]');
  if (property) return property;

  const menuRow = [...block.children].find((row) => {
    const label = row.firstElementChild?.textContent.trim().toLowerCase();
    return label === 'menu';
  });
  return menuRow?.children[1] || block.querySelector('ul');
}

function getMenuItems(list) {
  return [...list.children].filter((item) => item.tagName === 'LI').map((item) => {
    const content = item.cloneNode(true);
    content.querySelectorAll('ul').forEach((nestedList) => nestedList.remove());
    const link = content.querySelector('a[href]');
    const label = content.textContent.trim();
    const childList = [...item.children].find((child) => child.tagName === 'UL');

    return {
      label,
      href: link?.getAttribute('href') || '',
      children: childList ? getMenuItems(childList) : [],
    };
  }).filter((item) => item.label);
}

function createLink(item) {
  const link = document.createElement('a');
  link.className = 'navigation-link';
  link.textContent = item.label;
  link.href = item.href;
  return link;
}

function createBackButton(label, onClick) {
  const button = document.createElement('button');
  button.className = 'navigation-back';
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.innerHTML = '<span aria-hidden="true">&#8592;</span>';
  button.addEventListener('click', onClick);
  return button;
}

function createLevel(items, className, onSelect) {
  const list = document.createElement('div');
  list.className = `navigation-level ${className}`;
  list.setAttribute('role', 'list');

  items.forEach((item) => {
    const itemWrapper = document.createElement('div');
    itemWrapper.className = 'navigation-item';
    itemWrapper.setAttribute('role', 'listitem');

    if (item.children.length) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'navigation-choice';
      button.textContent = item.label;
      button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', () => onSelect(item, button));
      itemWrapper.append(button);
    } else if (item.href) {
      itemWrapper.append(createLink(item));
    } else {
      const label = document.createElement('span');
      label.className = 'navigation-link';
      label.textContent = item.label;
      itemWrapper.append(label);
    }

    list.append(itemWrapper);
  });

  return list;
}

export default function decorate(block) {
  const menuSource = getMenuSource(block);
  const sourceList = menuSource?.matches('ul') ? menuSource : menuSource?.querySelector('ul');
  const items = sourceList ? getMenuItems(sourceList) : [];
  const instanceId = `navigation-submenu-${Math.random().toString(36).slice(2, 9)}`;
  let activeTopLevel = null;
  let activeSecondLevel = null;

  block.replaceChildren();
  block.classList.add('navigation-ready');

  const nav = document.createElement('nav');
  nav.className = 'navigation-menu';
  nav.setAttribute('aria-label', 'Primary navigation');
  const content = document.createElement('div');
  content.className = 'navigation-content';

  const render = () => {
    content.replaceChildren();

    if (!activeTopLevel) {
      content.append(createLevel(items, 'navigation-level-one', (item) => {
        activeTopLevel = item;
        render();
      }));
      return;
    }

    const secondLevel = document.createElement('div');
    secondLevel.className = 'navigation-level-row';
    secondLevel.append(createBackButton('Back to main menu', () => {
      activeTopLevel = null;
      activeSecondLevel = null;
      render();
    }));
    secondLevel.append(createLevel(activeTopLevel.children, 'navigation-level-two', (item, button) => {
      if (activeSecondLevel === item) {
        activeSecondLevel = null;
      } else {
        activeSecondLevel = item;
      }
      render();
      const activeButton = [...content.querySelectorAll('.navigation-level-two .navigation-choice')]
        .find((candidate) => candidate.textContent === activeSecondLevel?.label);
      if (activeButton) {
        activeButton.setAttribute('aria-expanded', 'true');
        activeButton.setAttribute('aria-controls', instanceId);
      }
      button.blur();
    }));
    content.append(secondLevel);

    if (activeSecondLevel) {
      const panel = document.createElement('div');
      panel.className = 'navigation-submenu';
      panel.id = instanceId;
      panel.setAttribute('aria-label', `${activeSecondLevel.label} links`);
      panel.append(createLevel(activeSecondLevel.children, 'navigation-level-three', () => {}));
      content.prepend(panel);
    }
  };

  nav.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activeTopLevel) {
      event.stopPropagation();
      if (activeSecondLevel) {
        activeSecondLevel = null;
      } else {
        activeTopLevel = null;
      }
      render();
    }
  });

  document.addEventListener('click', (event) => {
    if (activeTopLevel && !block.contains(event.target)) {
      activeTopLevel = null;
      activeSecondLevel = null;
      render();
    }
  });

  nav.append(content);
  block.append(nav);
  render();
}
