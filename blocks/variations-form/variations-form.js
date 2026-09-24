/* Helper: Handle Dynamic Conditional Field Display */
function updateVisibility(form) {
  const selects = form.querySelectorAll('select');
  const activeValues = {};
  selects.forEach((sel) => {
    activeValues[sel.name] = sel.value;
  });

  const conditionalElements = form.querySelectorAll('[data-depends-on]');
  conditionalElements.forEach((el) => {
    const dependency = el.dataset.dependsOn.trim();
    if (!dependency) return;

    const isVisible = Object.values(activeValues).includes(dependency);
    if (isVisible) {
      el.classList.remove('hidden-field');
      el.querySelectorAll('input, select, textarea').forEach((input) => {
        if (input.dataset.wasRequired === 'true') input.required = true;
      });
    } else {
      el.classList.add('hidden-field');
      el.querySelectorAll('input, select, textarea').forEach((input) => {
        if (input.required) {
          input.dataset.wasRequired = 'true';
          input.required = false;
        }
      });
    }
  });
}

/* Helper: Build Dynamic Contact Card Output */
function createContactCard(region, name, emails, phones) {
  const card = document.createElement('div');
  card.className = 'variations-form-contact-card hidden-field';
  card.dataset.dependsOn = region;

  let html = `<div class="contact-name">${name}</div><div class="contact-details">`;

  if (emails) {
    emails.split(',').forEach((email) => {
      const cleanEmail = email.trim();
      html += `<div class="contact-link email-link">
        <a href="mailto:${cleanEmail}">${cleanEmail}</a>
      </div>`;
    });
  }

  if (phones) {
    phones.split(',').forEach((phone) => {
      const cleanPhone = phone.trim();
      html += `<div class="contact-link phone-link">
        <a href="tel:${cleanPhone.replace(/\s+/g, '')}">${cleanPhone}</a>
      </div>`;
    });
  }

  html += '</div>';
  card.innerHTML = html;
  return card;
}

export default function decorate(block) {
  const formWrapper = document.createElement('form');
  formWrapper.className = 'variations-form-container';
  formWrapper.setAttribute('novalidate', '');

  const rows = [...block.children];

  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;

    const type = cells[0].textContent.trim().toLowerCase();
    const config = cells[1];

    if (type === 'field-text') {
      const [
        fieldId,
        labelText,
        inputType,
        required,
        dependsOn,
      ] = [...config.children].map((c) => c.textContent.trim());
      const isReq = required?.toLowerCase() === 'true';

      const group = document.createElement('div');
      group.className = `variations-form-group ${fieldId.includes('name') ? 'half-width' : 'full-width'}`;
      if (dependsOn) group.dataset.dependsOn = dependsOn;

      group.innerHTML = `
        <label for="${fieldId}">${labelText}${isReq ? '*' : ''}</label>
        <input type="${inputType || 'text'}" id="${fieldId}" name="${fieldId}" ${isReq ? 'required' : ''} />
      `;
      formWrapper.appendChild(group);
    } else if (type === 'field-select') {
      const [
        fieldId,
        labelText,
        required,
        optionsStr,
        dependsOn,
      ] = [...config.children].map((c) => c.textContent.trim());
      const isReq = required?.toLowerCase() === 'true';

      const group = document.createElement('div');
      group.className = 'variations-form-group full-width';
      if (dependsOn) group.dataset.dependsOn = dependsOn;

      const options = optionsStr.split(',').map((opt) => `<option value="${opt.trim()}">${opt.trim()}</option>`).join('');

      group.innerHTML = `
        <label for="${fieldId}">${labelText}${isReq ? '*' : ''}</label>
        <select id="${fieldId}" name="${fieldId}" ${isReq ? 'required' : ''}>
          <option value="" disabled selected>Select an option</option>
          ${options}
        </select>
      `;
      formWrapper.appendChild(group);
    } else if (type === 'field-textarea') {
      const [
        fieldId,
        labelText,
        maxLen,
        required,
        dependsOn,
      ] = [...config.children].map((c) => c.textContent.trim());
      const isReq = required?.toLowerCase() === 'true';
      const limit = maxLen || 1500;

      const group = document.createElement('div');
      group.className = 'variations-form-group full-width textarea-group';
      if (dependsOn) group.dataset.dependsOn = dependsOn;

      group.innerHTML = `
        <label for="${fieldId}">${labelText}${isReq ? '*' : ''}</label>
        <textarea id="${fieldId}" name="${fieldId}" maxlength="${limit}" ${isReq ? 'required' : ''}></textarea>
        <span class="char-counter">(0/${limit})</span>
      `;

      const textarea = group.querySelector('textarea');
      const counter = group.querySelector('.char-counter');
      textarea.addEventListener('input', () => {
        counter.textContent = `(${textarea.value.length}/${limit})`;
      });

      formWrapper.appendChild(group);
    } else if (type === 'field-checkbox') {
      const [fieldId, labelHtml, , dependsOn] = [...config.children].map((c) => c.innerHTML.trim());
      const isReq = config.children[2]?.textContent.trim().toLowerCase() === 'true';

      const group = document.createElement('div');
      group.className = 'variations-form-group full-width checkbox-group';
      if (dependsOn) group.dataset.dependsOn = dependsOn;

      group.innerHTML = `
        <label class="checkbox-label">
          <input type="checkbox" id="${fieldId}" name="${fieldId}" ${isReq ? 'required' : ''} />
          <span class="checkbox-custom"></span>
          <span class="label-text">${labelHtml} ${isReq ? '*' : ''}</span>
        </label>
      `;
      formWrapper.appendChild(group);
    } else if (type === 'contact-card') {
      const [region, name, emails, phones] = [...config.children].map((c) => c.textContent.trim());
      const card = createContactCard(region, name, emails, phones);
      formWrapper.appendChild(card);
    } else if (type === 'field-submit') {
      const [btnLabel, dependsOn] = [...config.children].map((c) => c.textContent.trim());

      const group = document.createElement('div');
      group.className = 'variations-form-group full-width submit-group';
      if (dependsOn) group.dataset.dependsOn = dependsOn;

      group.innerHTML = `<button type="submit" class="button primary submit-btn">${btnLabel || 'Send'}</button>`;
      formWrapper.appendChild(group);
    }
  });

  formWrapper.addEventListener('change', () => updateVisibility(formWrapper));

  block.textContent = '';
  block.appendChild(formWrapper);

  updateVisibility(formWrapper);
}
