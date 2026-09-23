/**
 * Decorates action buttons using Teaser button structure conventions
 */
export function decorateButtons(...buttons) {
  return buttons
    .map((div) => {
      if (!div) return '';
      const a = div.querySelector('a');
      if (a) {
        a.classList.add('button');
        if (a.parentElement.tagName === 'EM') a.classList.add('secondary');
        if (a.parentElement.tagName === 'STRONG') a.classList.add('primary');
        return a.outerHTML;
      }
      const text = div.textContent ? div.textContent.trim() : '';
      if (text) {
        return `<button type="submit" class="button primary form-submit-btn">${text}</button>`;
      }
      return '';
    })
    .join('');
}

/**
 * Parses dynamic child field rows into structured objects
 */
export function parseFieldsTable(fieldsContainer) {
  const fields = [];
  if (!fieldsContainer) return fields;

  const tableRows = fieldsContainer.querySelectorAll ? fieldsContainer.querySelectorAll('tr') : [];
  if (tableRows.length > 0) {
    tableRows.forEach((row) => {
      const cols = [...row.children].map((c) => c.innerHTML.trim());
      if (cols.length >= 3) {
        const label = cols[0] || '';
        const key = cols[1]
          ? cols[1].replace(/<[^>]*>/g, '').trim()
          : label.toLowerCase().replace(/\s+/g, '_');
        const typeRaw = cols[2]
          ? cols[2].replace(/<[^>]*>/g, '').toLowerCase().trim()
          : 'string';
        const width = cols[3] ? cols[3].replace(/<[^>]*>/g, '').trim() : '100%';
        const mandatoryRaw = cols[4]
          ? cols[4].replace(/<[^>]*>/g, '').toLowerCase().trim()
          : 'no';
        const modeCondition = cols[5]
          ? cols[5].replace(/<[^>]*>/g, '').trim()
          : 'all';

        let type = typeRaw;
        let options = [];
        let maxCharacters = 1500;

        if (typeRaw.startsWith('select(')) {
          type = 'select';
          const optsString = typeRaw.substring(typeRaw.indexOf('(') + 1, typeRaw.lastIndexOf(')'));
          options = optsString.split(',').map((o) => o.trim());
        } else if (typeRaw.startsWith('textarea')) {
          type = 'textarea';
          if (typeRaw.includes('(')) {
            const charStr = typeRaw.substring(typeRaw.indexOf('(') + 1, typeRaw.lastIndexOf(')'));
            maxCharacters = parseInt(charStr, 10) || 1500;
          }
        }

        const isRequired = mandatoryRaw === 'yes'
          || mandatoryRaw === 'true'
          || label.includes('*');

        fields.push({
          label: label.replace(/\*/g, '').trim(),
          key,
          type,
          options,
          width,
          isRequired,
          maxCharacters,
          modeCondition,
          rawLabelHTML: label,
        });
      }
    });

    return fields;
  }

  let multifieldItems = [];
  if (fieldsContainer.matches) {
    if (fieldsContainer.matches('.form-field-item, [data-model="form-field-item"]')) {
      multifieldItems = [fieldsContainer];
    } else {
      multifieldItems = fieldsContainer.querySelectorAll('.form-field-item, [data-model="form-field-item"]');
    }
  }

  if (multifieldItems.length > 0) {
    multifieldItems.forEach((item) => {
      const getValue = (name) => {
        const node = item.querySelector(`[data-name="${name}"]`)
          || item.querySelector(`[name="${name}"]`)
          || item.querySelector(`[data-field-name="${name}"]`);

        if (!node) return '';
        if (node.value !== undefined && node.value !== null) {
          return String(node.value).trim();
        }
        return String(node.textContent || '').trim();
      };

      const label = getValue('label') || getValue('fieldLabel') || '';
      const key = getValue('key') || getValue('name') || label.toLowerCase().replace(/\s+/g, '_');
      const typeRaw = getValue('type') || 'string';
      const width = getValue('width') || '100%';
      const mandatoryRaw = getValue('mandatory') || 'no';
      const modeCondition = getValue('modeCondition') || 'all';

      let type = typeRaw.toLowerCase();
      let options = [];
      let maxCharacters = 1500;

      if (typeRaw.toLowerCase().startsWith('select(')) {
        type = 'select';
        const optsString = typeRaw.substring(typeRaw.indexOf('(') + 1, typeRaw.lastIndexOf(')'));
        options = optsString.split(',').map((o) => o.trim());
      } else if (type.startsWith('textarea')) {
        type = 'textarea';
        if (typeRaw.includes('(')) {
          const charStr = typeRaw.substring(typeRaw.indexOf('(') + 1, typeRaw.lastIndexOf(')'));
          maxCharacters = parseInt(charStr, 10) || 1500;
        }
      }

      const isRequired = mandatoryRaw === 'yes'
        || mandatoryRaw === 'true'
        || String(label).includes('*');

      fields.push({
        label: String(label).replace(/\*/g, '').trim(),
        key,
        type,
        options,
        width,
        isRequired,
        maxCharacters,
        modeCondition,
        rawLabelHTML: label,
      });
    });

    return fields;
  }

  const directChildren = [...fieldsContainer.children];
  directChildren.forEach((child) => {
    if (child.matches && child.matches('.form-field-item, [data-model="form-field-item"]')) {
      fields.push(...parseFieldsTable(child));
    }
  });

  return fields;
}

/**
 * Generates field input markup
 */
function renderFieldHTML(field) {
  const reqAsterisk = field.isRequired ? '<span class="required-asterisk">*</span>' : '';
  const reqAttr = field.isRequired ? 'required aria-required="true"' : '';
  const conditionAttr = field.modeCondition !== 'all' ? `data-mode-condition="${field.modeCondition}"` : '';

  let inputHTML = '';

  switch (field.type) {
    case 'email':
      inputHTML = `<input type="email" id="${field.key}" name="${field.key}" class="form-input-underline" ${reqAttr} />`;
      break;

    case 'select': {
      const optionsHTML = field.options
        .map((opt) => `<option value="${opt}">${opt}</option>`)
        .join('');
      inputHTML = `
        <select id="${field.key}" name="${field.key}" class="form-select-underline" ${reqAttr}>
          <option value="" disabled selected hidden></option>
          ${optionsHTML}
        </select>
      `;
      break;
    }

    case 'textarea':
      inputHTML = `
        <textarea id="${field.key}" name="${field.key}" class="form-textarea-underline" maxlength="${field.maxCharacters}" ${reqAttr}></textarea>
        <div class="char-counter"><span class="current-count">0</span>/${field.maxCharacters}</div>
      `;
      break;

    case 'checkbox':
      inputHTML = `
        <label class="checkbox-container">
          <input type="checkbox" id="${field.key}" name="${field.key}" ${reqAttr} />
          <span class="checkmark"></span>
          <span class="checkbox-label">${field.rawLabelHTML} ${reqAsterisk}</span>
        </label>
      `;
      break;

    case 'content':
      return `<div class="form-content-block" ${conditionAttr}>${field.rawLabelHTML}</div>`;

    case 'string':
    default:
      inputHTML = `<input type="text" id="${field.key}" name="${field.key}" class="form-input-underline" ${reqAttr} />`;
      break;
  }

  if (field.type === 'checkbox') {
    return `
      <div class="field-wrapper width-100 type-checkbox" ${conditionAttr}>${inputHTML}</div>
    `;
  }

  return `
    <div class="field-wrapper width-${field.width.replace('%', '')}" ${conditionAttr}>
      <label for="${field.key}" class="field-label">${field.label}${reqAsterisk}</label>
      ${inputHTML}
    </div>
  `;
}

/**
 * Builds overall Form Variations DOM using createContextualFragment
 * (matching generateTeaserDOM pattern)
 */
export function generateFormVariationsDOM(props, classes, fields) {
  // Extract properties in exact same row sequence as in JSON model
  const [eyebrow, title, description, formMode, endpoint, submitLabel] = props;
  const modeVal = formMode ? formMode.textContent.trim().toLowerCase() : 'standard';
  const endpointUrl = endpoint
    ? (endpoint.querySelector('a')?.href || endpoint.textContent.trim())
    : '#';

  let fieldsHTML = '';
  let inRow = false;

  fields.forEach((field, idx) => {
    const isHalf = field.width === '50%';
    const nextFieldIsHalf = fields[idx + 1] && fields[idx + 1].width === '50%';

    if (isHalf && !inRow) {
      fieldsHTML += '<div class="form-row flex-grid">';
      inRow = true;
    }

    fieldsHTML += renderFieldHTML(field);

    if (inRow && (!isHalf || !nextFieldIsHalf)) {
      fieldsHTML += '</div>';
      inRow = false;
    }
  });

  const actionSelectorHTML = modeVal === 'conditional_switcher'
    ? `
      <div class="field-wrapper width-100 action-switcher-wrapper">
        <label for="actionSwitcher" class="field-label">I'D LIKE TO</label>
        <select id="actionSwitcher" class="form-select-underline action-switcher">
          <option value="subscribe" selected>Subscribe</option>
          <option value="unsubscribe">Unsubscribe</option>
        </select>
      </div>
    `
    : '';

  const formDOM = document.createRange().createContextualFragment(`
    <div class="foreground">
      <div class="text">
        ${eyebrow && eyebrow.textContent.trim() !== '' ? `<div class="eyebrow">${eyebrow.textContent.trim().toUpperCase()}</div>` : ''}
        ${title ? `<div class="title">${title.innerHTML}</div>` : ''}
        ${description ? `<div class="long-description">${description.innerHTML}</div>` : ''}
      </div>

      <form class="dynamic-form" action="${endpointUrl}" method="POST" data-mode="${modeVal}">
        ${actionSelectorHTML}
        <div class="fields-container">
          ${fieldsHTML}
        </div>

        <div class="directory-card-output" style="display: none;"></div>

        <div class="form-footer">
          <div class="disclaimer-note">*Mandatory fields</div>
          <div class="cta">
            ${decorateButtons(submitLabel)}
          </div>
        </div>
      </form>
    </div>
  `);

  // Handle mobile background color variables exactly like Teaser reference
  const backgroundColor = [...classes].find((cls) => cls.startsWith('tcs-background-'));
  if (backgroundColor) {
    formDOM
      .querySelector('.foreground')
      .style.setProperty('--form-background-color', `var(--${backgroundColor})`);
  }

  return formDOM;
}

/**
 * Binds interactivity for character counters, mode switchers, and directory lookups
 */
function attachFormBehavior(block) {
  const form = block.querySelector('form.dynamic-form');
  if (!form) return;

  const { mode } = form.dataset;

  // 1. Live Character Counter for Textareas
  block.querySelectorAll('.field-wrapper').forEach((wrapper) => {
    const textarea = wrapper.querySelector('textarea');
    const counterSpan = wrapper.querySelector('.char-counter .current-count');
    if (textarea && counterSpan) {
      textarea.addEventListener('input', () => {
        counterSpan.textContent = textarea.value.length;
      });
    }
  });

  // 2. Conditional Action Switcher (Subscribe vs Unsubscribe)
  const actionSwitcher = block.querySelector('#actionSwitcher');
  const submitBtn = block.querySelector('.form-submit-btn');

  if (actionSwitcher) {
    const handleSwitch = () => {
      const selectedMode = actionSwitcher.value;
      block.querySelectorAll('[data-mode-condition]').forEach((el) => {
        const cond = el.dataset.modeCondition;
        if (cond === 'all' || cond === selectedMode) {
          el.style.display = '';
          el.querySelectorAll('input, select, textarea').forEach((input) => input.removeAttribute('disabled'));
        } else {
          el.style.display = 'none';
          el.querySelectorAll('input, select, textarea').forEach((input) => input.setAttribute('disabled', 'true'));
        }
      });

      if (submitBtn) {
        submitBtn.textContent = selectedMode === 'unsubscribe' ? 'Unsubscribe' : 'Subscribe';
      }
    };

    actionSwitcher.addEventListener('change', handleSwitch);
    handleSwitch();
  }

  // 3. Dynamic Directory Lookup (Press & Media Contact Cards)
  if (mode === 'directory_lookup') {
    const regionSelect = block.querySelector('select[name="region"], select');
    const directoryOutput = block.querySelector('.directory-card-output');

    const directoryData = {
      'asia pacific': { name: 'Iris Tham', email: 'y.tham@tcs.com', phone: '+65 6372 4822' },
      india: {
        name: 'Santosh Castelino', email: 'santosh.castelino@tcs.com', phone: '+91 22 6778 9098', groupEmail: 'corporate.communications@tcs.com',
      },
    };

    if (regionSelect && directoryOutput) {
      regionSelect.addEventListener('change', () => {
        const val = regionSelect.value.toLowerCase().trim();
        const contact = directoryData[val];

        if (contact) {
          directoryOutput.innerHTML = `
            <div class="directory-card">
              <p class="directory-intro">Here you go - the expert(s) listed below are waiting to hear from you.</p>
              <h4 class="expert-name">${contact.name}</h4>
              <p class="expert-email"><a href="mailto:${contact.email}">${contact.email}</a></p>
              ${contact.phone ? `<p class="expert-phone">${contact.phone}</p>` : ''}
              ${contact.groupEmail ? `<p class="expert-email"><a href="mailto:${contact.groupEmail}">${contact.groupEmail}</a></p>` : ''}
            </div>
          `;
          directoryOutput.style.display = 'block';

          if (submitBtn) {
            submitBtn.textContent = 'Back to website';
            submitBtn.type = 'button';
            submitBtn.onclick = () => { window.location.href = '/'; };
          }
        }
      });
    }
  }

  // 4. Form Submission Listener
  if (form && mode !== 'directory_lookup') {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let isValid = true;

      form.querySelectorAll('[required]:not([disabled])').forEach((input) => {
        if (input.type === 'checkbox' && !input.checked) {
          isValid = false;
          input.closest('.checkbox-container')?.classList.add('error');
        } else if (!input.value.trim()) {
          isValid = false;
          input.classList.add('error');
        } else {
          input.classList.remove('error');
        }
      });

      if (isValid) {
        if (submitBtn) submitBtn.textContent = 'Sending...';
        setTimeout(() => {
          form.innerHTML = '<div class="form-success-message"><h3>Thank you!</h3><p>Your request has been submitted successfully.</p></div>';
        }, 1000);
      }
    });
  }
}

export default function decorate(block) {
  // Extract cells from each row using Teaser pattern
  const children = [...block.children];
  const props = children.slice(0, 7).map((row) => row.firstElementChild);
  const fieldsTable = children[7] ? children[7].firstElementChild : null;

  const fields = parseFieldsTable(fieldsTable);
  const formDOM = generateFormVariationsDOM(props, block.classList, fields);

  block.textContent = '';
  block.append(formDOM);

  attachFormBehavior(block);
}
