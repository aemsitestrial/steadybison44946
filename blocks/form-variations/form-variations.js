/* Region Directory Data Mapping */
const REGION_CONTACTS = {
  'Asia Pacific': {
    name: 'Iris Tham',
    email: 'y.tham@tcs.com',
    phone: '+65 6372 4822',
  },
  India: {
    name: 'Santosh Castelino',
    email: 'santosh.castelino@tcs.com',
    phone: '+91 22 6778 9098',
    altEmail: 'corporate.communications@tcs.com',
  },
  'USA & Canada': {
    name: 'North America Media Desk',
    email: 'na.media@tcs.com',
    phone: '+1 212 555 0199',
  },
  Europe: {
    name: 'Europe Press Office',
    email: 'europe.media@tcs.com',
    phone: '+44 20 7877 2000',
  },
};

/* Helper: Character Counter Decoration */
export function decorateCharCounter(groupEl, maxChars = 1500) {
  const textarea = groupEl.querySelector('textarea');
  if (!textarea) return;

  const counterDiv = document.createElement('div');
  counterDiv.className = 'char-counter';
  counterDiv.textContent = `(0/${maxChars})`;
  textarea.parentElement.appendChild(counterDiv);

  textarea.addEventListener('input', () => {
    counterDiv.textContent = `(${textarea.value.length}/${maxChars})`;
  });
}

/* Helper: Case 1 Conditional Logic Renderer */
export function setupConditionalToggling(formWrapper) {
  const masterDropdown = formWrapper.querySelector('.master-type-dropdown');
  if (!masterDropdown) return;

  const conditionalFields = formWrapper.querySelectorAll('[data-show-if]');

  const applyCondition = (selectedVal) => {
    conditionalFields.forEach((field) => {
      const condition = field.getAttribute('data-show-if');
      const input = field.querySelector('input, select, textarea');

      if (!condition || condition.trim().toLowerCase() === selectedVal.trim().toLowerCase()) {
        field.style.display = 'block';
        if (input && field.hasAttribute('data-originally-required')) {
          input.setAttribute('required', '');
        }
      } else {
        field.style.display = 'none';
        if (input) {
          input.removeAttribute('required');
        }
      }
    });
  };

  masterDropdown.addEventListener('change', (e) => applyCondition(e.target.value));
  applyCondition(masterDropdown.value);
}

/* Helper: Render Directory Contacts for Regional Directory Field */
export function decorateDirectory(formWrapper) {
  const regionSelect = formWrapper.querySelector('.directory-region-select');
  const resultContainer = formWrapper.querySelector('.directory-result-container');
  if (!regionSelect || !resultContainer) return;

  regionSelect.addEventListener('change', (e) => {
    const contact = REGION_CONTACTS[e.target.value];
    if (!contact) {
      resultContainer.innerHTML = '';
      return;
    }

    resultContainer.innerHTML = `
      <div class="press-directory-result">
        <div class="expert-intro">Here you go - the expert(s) listed below are waiting to hear from you.</div>
        <div class="expert-card">
          <div class="expert-name">${contact.name}</div>
          <a href="mailto:${contact.email}" class="expert-contact-link">✉ ${contact.email}</a>
          ${contact.phone ? `<a href="tel:${contact.phone}" class="expert-contact-link">📞 ${contact.phone}</a>` : ''}
          ${contact.altEmail ? `<a href="mailto:${contact.altEmail}" class="expert-contact-link">✉ ${contact.altEmail}</a>` : ''}
        </div>
        <button type="button" class="form-variations-submit-btn" onclick="window.history.back()">Back to website</button>
      </div>
    `;
  });
}

/* Main Decorator Function */
export default function decorate(block) {
  const formWrapper = document.createElement('form');
  formWrapper.className = 'form-variations-wrapper';

  const children = [...block.children];

  children.forEach((row) => {
    const fieldType = row.firstElementChild?.textContent?.trim().toLowerCase();
    const configCols = [...row.children].slice(1);

    const group = document.createElement('div');
    group.className = 'form-variations-group';

    // Parse Case 1 conditional parameters if defined in authoring
    const showIf = configCols[2]?.textContent?.trim();
    if (showIf) {
      group.setAttribute('data-show-if', showIf);
    }

    const labelText = configCols[0]?.textContent?.trim() || 'Label';
    const isRequired = configCols[1]?.textContent?.trim() === 'true';

    if (isRequired) {
      group.setAttribute('data-originally-required', 'true');
    }

    switch (fieldType) {
      case 'form-type-dropdown': {
        const options = (configCols[1]?.textContent || 'Type 1,Type 2')
          .split(',')
          .map((opt) => opt.trim());

        group.innerHTML = `
          <select id="masterType" class="form-variations-field form-variations-field-select master-type-dropdown" ${isRequired ? 'required' : ''}>
            ${options.map((opt, i) => `<option value="${opt}" ${i === 0 ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
          <label for="masterType" class="form-variations-label">${labelText}</label>
        `;
        break;
      }

      case 'text-input':
      case 'email-input': {
        const inputType = fieldType === 'email-input' ? 'email' : 'text';
        group.innerHTML = `
          <input type="${inputType}" class="form-variations-field" placeholder=" " ${isRequired ? 'required' : ''} />
          <label class="form-variations-label">${labelText}${isRequired ? '*' : ''}</label>
        `;
        break;
      }

      case 'textarea-field': {
        const maxChars = parseInt(configCols[1]?.textContent?.trim() || '1500', 10);
        group.innerHTML = `
          <textarea class="form-variations-field" placeholder=" " maxlength="${maxChars}" ${isRequired ? 'required' : ''}></textarea>
          <label class="form-variations-label">${labelText}${isRequired ? '*' : ''}</label>
        `;
        decorateCharCounter(group, maxChars);
        break;
      }

      case 'checkbox-field': {
        group.className = 'form-variations-checkbox-group';
        if (showIf) group.setAttribute('data-show-if', showIf);
        group.innerHTML = `
          <input type="checkbox" class="form-variations-checkbox" ${isRequired ? 'required' : ''} />
          <label class="checkbox-label">${labelText}${isRequired ? '*' : ''}</label>
        `;
        break;
      }

      case 'contact-directory': {
        group.innerHTML = `
          <select class="form-variations-field form-variations-field-select directory-region-select" ${isRequired ? 'required' : ''}>
            <option value="" disabled selected hidden></option>
            ${Object.keys(REGION_CONTACTS).map((region) => `<option value="${region}">${region}</option>`).join('')}
          </select>
          <label class="form-variations-label">${labelText}</label>
          <div class="directory-result-container"></div>
        `;
        break;
      }

      case 'submit-button': {
        group.innerHTML = `
          <button type="submit" class="form-variations-submit-btn">${labelText}</button>
        `;
        break;
      }

      default:
        break;
    }

    formWrapper.appendChild(group);
  });

  block.replaceChildren(formWrapper);

  // Initialize Case 1 conditional toggles & directory logic
  setupConditionalToggling(formWrapper);
  decorateDirectory(formWrapper);
}
