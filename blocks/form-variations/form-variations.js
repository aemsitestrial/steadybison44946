/* Region Directory Contact Data for Press & Media */
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

/* Helper: Real-Time Character Counter */
function setupCharCounter(textarea, maxChars) {
  const counterDiv = document.createElement('div');
  counterDiv.className = 'char-counter';
  counterDiv.textContent = `(0/${maxChars})`;
  textarea.parentElement.appendChild(counterDiv);

  textarea.addEventListener('input', () => {
    const len = textarea.value.length;
    counterDiv.textContent = `(${len}/${maxChars})`;
  });
}

/* Helper: Conditional Field Toggling for Analyst Relations */
function handleAnalystRelationsToggle(container, selectedAction) {
  const dynamicWrapper = container.querySelector('.dynamic-analyst-fields');
  if (!dynamicWrapper) return;

  if (selectedAction === 'Unsubscribe') {
    dynamicWrapper.innerHTML = `
      <p style="font-size: 0.88rem; color: #a0aec0; margin-bottom: 24px;">Unsubscribe from TCS' Analyst Relations Updates</p>
      <div class="form-variations-group">
        <input type="email" id="email" class="form-variations-field" placeholder=" " required />
        <label for="email" class="form-variations-label">Email*</label>
      </div>
      <div class="form-variations-checkbox-group">
        <input type="checkbox" id="consent" class="form-variations-checkbox" required />
        <label for="consent" class="checkbox-label">
          I want to stop receiving Analyst Relations mailers, related event notifications and invitations from TCS.
        </label>
      </div>
      <div class="mandatory-note">For further details on how your personal data will be processed and how your consent can be managed, refer to the <a href="#" style="color:#fff;text-decoration:underline;">TCS Privacy Notice</a>.<br><br>*Mandatory fields</div>
      <button type="submit" class="form-variations-submit-btn">Unsubscribe</button>
    `;
  } else {
    dynamicWrapper.innerHTML = `
      <p style="font-size: 0.88rem; color: #a0aec0; margin-bottom: 24px;">Subscribe to receive our latest analyst relations updates</p>
      <div class="form-variations-row">
        <div class="form-variations-group">
          <input type="text" id="firstName" class="form-variations-field" placeholder=" " required />
          <label for="firstName" class="form-variations-label">First name*</label>
        </div>
        <div class="form-variations-group">
          <input type="text" id="lastName" class="form-variations-field" placeholder=" " required />
          <label for="lastName" class="form-variations-label">Last name*</label>
        </div>
      </div>
      <div class="form-variations-group">
        <input type="email" id="email" class="form-variations-field" placeholder=" " required />
        <label for="email" class="form-variations-label">Email*</label>
      </div>
      <div class="form-variations-group">
        <input type="text" id="company" class="form-variations-field" placeholder=" " required />
        <label for="company" class="form-variations-label">Company*</label>
      </div>
      <div class="form-variations-checkbox-group">
        <input type="checkbox" id="consent" class="form-variations-checkbox" required />
        <label for="consent" class="checkbox-label">
          I consent to processing of my personal data entered above for the purpose of receiving Analyst Relations mailers, related event notifications and invitations from TCS.
        </label>
      </div>
      <div class="mandatory-note">For further details on how your personal data will be processed and how your consent can be managed, refer to the <a href="#" style="color:#fff;text-decoration:underline;">TCS Privacy Notice</a>.<br><br>*Mandatory fields</div>
      <button type="submit" class="form-variations-submit-btn">Subscribe</button>
    `;
  }
}

/* Helper: Render Region Contacts for Press & Media Directory */
function handleRegionSelection(region, resultContainer) {
  const contact = REGION_CONTACTS[region];
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
}

/* Main Block Decorator Function */
export default function decorate(block) {
  const formWrapper = document.createElement('div');
  formWrapper.className = 'form-variations-wrapper';

  const isPressMedia = block.classList.contains('press-media');
  const isAnalyst = block.classList.contains('analyst-updates');
  const isPartnerships = block.classList.contains('partnerships');

  if (isPressMedia) {
    formWrapper.innerHTML = `
      <div class="form-variations-header">
        <div class="form-variations-category-tag">&lt; BACK &nbsp;&nbsp;|&nbsp;&nbsp; PRESS AND MEDIA</div>
        <div class="form-variations-title">We're so glad you reached out! Connecting you to our experts on the ground is a priority for us. Tell us which region you're looking to find out more about, and we'll put you in touch.</div>
      </div>
      <div class="form-variations-group">
        <select id="regionSelect" class="form-variations-field form-variations-field-select" required>
          <option value="" disabled selected hidden></option>
          <option value="Asia Pacific">Asia Pacific</option>
          <option value="Australia & New Zealand">Australia & New Zealand</option>
          <option value="USA & Canada">USA & Canada</option>
          <option value="India">India</option>
          <option value="Europe">Europe</option>
          <option value="Latin America">Latin America</option>
          <option value="Japan">Japan</option>
          <option value="UK">UK</option>
          <option value="Middle East & Africa">Middle East & Africa</option>
        </select>
        <label for="regionSelect" class="form-variations-label">Region</label>
      </div>
      <div id="directoryResult"></div>
    `;

    const select = formWrapper.querySelector('#regionSelect');
    const resultDiv = formWrapper.querySelector('#directoryResult');
    select.addEventListener('change', (e) => handleRegionSelection(e.target.value, resultDiv));
  } else if (isAnalyst) {
    formWrapper.innerHTML = `
      <div class="form-variations-header">
        <div class="form-variations-category-tag">&lt; BACK &nbsp;&nbsp;|&nbsp;&nbsp; LOOKING FOR THE LATEST ANALYST UPDATES?</div>
        <div class="form-variations-title">Let us know how we can help.</div>
      </div>
      <div class="form-variations-group">
        <select id="actionSelect" class="form-variations-field form-variations-field-select" required>
          <option value="Subscribe" selected>Subscribe</option>
          <option value="Unsubscribe">Unsubscribe</option>
        </select>
        <label for="actionSelect" class="form-variations-label">I'D LIKE TO</label>
      </div>
      <form class="dynamic-analyst-fields"></form>
    `;

    const select = formWrapper.querySelector('#actionSelect');
    select.addEventListener('change', (e) => handleAnalystRelationsToggle(formWrapper, e.target.value));
    handleAnalystRelationsToggle(formWrapper, 'Subscribe');
  } else {
    // Default Website Feedback / Partnerships / CSR Forms
    formWrapper.innerHTML = `
      <div class="form-variations-header">
        <div class="form-variations-category-tag">&lt; BACK &nbsp;&nbsp;|&nbsp;&nbsp; ${isPartnerships ? 'PARTNERSHIPS' : 'WEBSITE FEEDBACK'}</div>
        <div class="form-variations-title">${isPartnerships ? "We're passionate about our partnerships. If you're looking to know more about how we set-up for success, or to incubate a new idea, do get in touch." : 'Let us know what you think of the tcs.com experience. We welcome your suggestions, comments, and opinions.'}</div>
      </div>
      <form>
        <div class="form-variations-row">
          <div class="form-variations-group">
            <input type="text" id="firstName" class="form-variations-field" placeholder=" " required />
            <label for="firstName" class="form-variations-label">First name*</label>
          </div>
          <div class="form-variations-group">
            <input type="text" id="lastName" class="form-variations-field" placeholder=" " required />
            <label for="lastName" class="form-variations-label">Last name*</label>
          </div>
        </div>
        <div class="${isPartnerships ? 'form-variations-row' : 'form-variations-group'}">
          <div class="form-variations-group">
            <input type="email" id="email" class="form-variations-field" placeholder=" " required />
            <label for="email" class="form-variations-label">${isPartnerships ? 'Email ID*' : 'Email*'}</label>
          </div>
          ${isPartnerships ? `
            <div class="form-variations-group">
              <select id="sector" class="form-variations-field form-variations-field-select" required>
                <option value="" disabled selected hidden></option>
                <option value="Technology">Technology</option>
                <option value="Sport">Sport</option>
              </select>
              <label for="sector" class="form-variations-label">Sector*</label>
            </div>
          ` : ''}
        </div>
        <div class="form-variations-group">
          <textarea id="message" class="form-variations-field" placeholder=" " maxlength="1500" required></textarea>
          <label for="message" class="form-variations-label">How can we help you?*</label>
        </div>
        <div class="form-variations-checkbox-group">
          <input type="checkbox" id="consent" class="form-variations-checkbox" required />
          <label for="consent" class="checkbox-label">
            I consent to processing of my personal data entered above for ${isPartnerships ? 'TCS to contact me.*' : 'the purpose of recording the feedback.*'}
          </label>
        </div>
        <div class="mandatory-note">For further details on how your personal data will be processed and how your consent can be managed, refer to the <a href="#" style="color:#fff;text-decoration:underline;">TCS Privacy Notice</a>.<br><br>*Mandatory fields</div>
        <button type="submit" class="form-variations-submit-btn">Send</button>
      </form>
    `;

    const textarea = formWrapper.querySelector('textarea');
    if (textarea) setupCharCounter(textarea, 1500);
  }

  block.replaceChildren(formWrapper);
}
