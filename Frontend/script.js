'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'http://localhost:5000';

  // URL Shortener Form Elements
  const shortenerForm = document.getElementById('shortenerForm');
  const longUrlInput = document.getElementById('longUrlInput');
  const customAliasInput = document.getElementById('customAliasInput');
  const expirationInput = document.getElementById('expirationInput');
  const formAlert = document.getElementById('formAlert');
  const formAlertMessage = document.getElementById('formAlertMessage');
  const clearBtn = document.getElementById('clearBtn');

  // Result Card Elements
  const resultCard = document.getElementById('resultCard');
  const shortUrlLink = document.getElementById('shortUrlLink');
  const copyBtn = document.getElementById('copyBtn');
  const copyBtnText = document.getElementById('copyBtnText');
  const resOriginalUrl = document.getElementById('resOriginalUrl');
  const resShortCode = document.getElementById('resShortCode');
  const resExpiration = document.getElementById('resExpiration');
  const trackInAnalyticsBtn = document.getElementById('trackInAnalyticsBtn');

  // Analytics Elements
  const analyticsSearchForm = document.getElementById('analyticsSearchForm');
  const analyticsCodeInput = document.getElementById('analyticsCodeInput');
  const analyticsAlert = document.getElementById('analyticsAlert');
  const analyticsAlertMessage = document.getElementById('analyticsAlertMessage');
  const analyticsContent = document.getElementById('analyticsContent');
  const metricClicks = document.getElementById('metricClicks');
  const metricLastAccessed = document.getElementById('metricLastAccessed');
  const metricStatus = document.getElementById('metricStatus');
  const metricShortCode = document.getElementById('metricShortCode');

  // Navigation & Mobile Toggle Elements
  const navShorten = document.getElementById('navShorten');
  const navAnalytics = document.getElementById('navAnalytics');
  const navHowItWorks = document.getElementById('navHowItWorks');
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  // Default demo short code
  const DEFAULT_DEMO_CODE = 'aB72xK';


  // --------------------------------------------------------------------------
  // 2. HELPER FUNCTIONS FOR VALIDATION & UI ALERTS
  // --------------------------------------------------------------------------

  /**
   * Displays an error message inside the shortener form alert box.
   * @param {string} message - Validation error description.
   */
  function showFormError(message) {
    formAlertMessage.textContent = message;
    formAlert.classList.remove('hidden');
    longUrlInput.classList.add('input-error');
  }

  /**
   * Clears the shortener form error alert box and resets input error styles.
   */
  function clearFormError() {
    formAlert.classList.add('hidden');
    formAlertMessage.textContent = '';
    longUrlInput.classList.remove('input-error');
    customAliasInput.classList.remove('input-error');
  }

  /**
   * Displays an error message inside the analytics alert box.
   * @param {string} message - Validation error description.
   */
  function showAnalyticsError(message) {
    analyticsAlertMessage.textContent = message;
    analyticsAlert.classList.remove('hidden');
    analyticsCodeInput.classList.add('input-error');
  }

  /**
   * Clears the analytics error alert box and resets input styles.
   */
  function clearAnalyticsError() {
    analyticsAlert.classList.add('hidden');
    analyticsAlertMessage.textContent = '';
    analyticsCodeInput.classList.remove('input-error');
  }

  /**
   * Validates custom alias string (letters, numbers, and hyphens only).
   * @param {string} alias 
   * @returns {boolean}
   */
  function isValidAlias(alias) {
    // Regular expression: only alphanumeric characters and hyphens
    const aliasRegex = /^[a-zA-Z0-9-]+$/;
    return aliasRegex.test(alias);
  }


  // --------------------------------------------------------------------------
  // 3. SHORTEN URL FORM SUBMISSION
  // --------------------------------------------------------------------------

  shortenerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    clearFormError();

    const rawUrl = longUrlInput.value.trim();
    const rawAlias = customAliasInput.value.trim();
    const rawExpiration = expirationInput.value;

    // Validate URL
    if (!rawUrl) {
      showFormError('Please enter a destination URL to shorten.');
      longUrlInput.focus();
      return;
    }

    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      showFormError(
        'URL must begin with http:// or https://'
      );
      longUrlInput.focus();
      return;
    }

    // Validate custom alias on frontend
    if (rawAlias !== '' && !isValidAlias(rawAlias)) {
      customAliasInput.classList.add('input-error');

      showFormError(
        'Custom alias can only contain letters, numbers, and hyphens.'
      );

      customAliasInput.focus();
      return;
    }

    try {
      const requestData = {
        originalUrl: rawUrl,
        customAlias: rawAlias || null,
        expiresAt: rawExpiration || null
      };


      const response = await fetch(`${API_URL}/api/shorten`, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      // Backend returned an error
      if (!response.ok) {
        showFormError(result.message || 'Unable to shorten URL.');
        return;
      }

      // Display REAL backend response
      const data = result.data;

      shortUrlLink.textContent = data.shortUrl;
      shortUrlLink.href = data.shortUrl;

      resOriginalUrl.textContent = data.originalUrl;
      resOriginalUrl.title = data.originalUrl;

      resShortCode.textContent = data.shortCode;

      // Expiration
      if (data.expiresAt) {
        const expDate = new Date(data.expiresAt);

        resExpiration.textContent =
          `Expires: ${expDate.toLocaleString()}`;

        resExpiration.classList.remove('meta-badge-gray');
      } else {
        resExpiration.textContent =
          'No expiration (Permanent)';

        resExpiration.classList.add('meta-badge-gray');
      }

      resetCopyButton();

      resultCard.classList.remove('hidden');

      resultCard.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });

    } catch (error) {
      console.error('Shorten URL error:', error);

      showFormError(
        'Unable to connect to server. Make sure your backend is running.'
      );
    }
  });


  // --------------------------------------------------------------------------
  // 4. COPY BUTTON WITH BROWSER CLIPBOARD API
  // --------------------------------------------------------------------------

  let copyTimeout = null;

  function resetCopyButton() {
    if (copyTimeout) {
      clearTimeout(copyTimeout);
      copyTimeout = null;
    }
    copyBtn.classList.remove('copied');
    copyBtnText.textContent = 'Copy';
  }

  copyBtn.addEventListener('click', () => {
    const textToCopy = shortUrlLink.textContent.trim();

    if (!textToCopy) return;

    // Use standard browser Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => triggerCopySuccess())
        .catch(() => fallbackCopy(textToCopy));
    } else {
      fallbackCopy(textToCopy);
    }
  });

  function triggerCopySuccess() {
    copyBtn.classList.add('copied');
    copyBtnText.textContent = 'Copied!';

    if (copyTimeout) clearTimeout(copyTimeout);

    copyTimeout = setTimeout(() => {
      resetCopyButton();
    }, 2000);
  }

  // Graceful fallback for environments where navigator.clipboard might be restricted
  function fallbackCopy(text) {
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = text;
    tempTextArea.style.position = 'fixed';
    tempTextArea.style.left = '-9999px';
    tempTextArea.style.top = '0';
    document.body.appendChild(tempTextArea);
    tempTextArea.focus();
    tempTextArea.select();
    try {
      document.execCommand('copy');
      triggerCopySuccess();
    } catch (err) {
      console.error('Fallback clipboard copy failed:', err);
    }
    document.body.removeChild(tempTextArea);
  }


  // --------------------------------------------------------------------------
  // 5. CLEAR BUTTON BEHAVIOR
  // --------------------------------------------------------------------------

  clearBtn.addEventListener('click', () => {
    // Clear form inputs
    longUrlInput.value = '';
    customAliasInput.value = '';
    expirationInput.value = '';

    // Clear error messages
    clearFormError();

    // Hide the result card
    resultCard.classList.add('hidden');
    resetCopyButton();

    longUrlInput.focus();
  });


  // --------------------------------------------------------------------------
  // 6. ANALYTICS SECTION INTERACTION
  // --------------------------------------------------------------------------

  /**
   * Updates analytics cards with static demonstration data.
   * @param {string} code - Short code to display.
   */
  async function displayAnalytics(code) {
    try {
      const response = await fetch(
        `${API_URL}/api/analytics/${encodeURIComponent(code)}`
      );

      const result = await response.json();

      if (!response.ok) {
        showAnalyticsError(result.message || 'Unable to fetch analytics.');
        return;
      }

      const data = result.data;

      metricClicks.textContent = data.clicks;

      if (data.lastAccessed) {
        const date = new Date(data.lastAccessed);

        metricLastAccessed.textContent = date.toLocaleString([], {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        metricLastAccessed.textContent = 'Never';
      }

      metricStatus.innerHTML =
        data.status === 'Active'
          ? '<span class="pulse-dot"></span> Active'
          : 'Expired';

      metricShortCode.textContent = data.shortCode;

      analyticsContent.classList.remove('hidden');

    } catch (error) {
      console.error('Analytics error:', error);

      showAnalyticsError(
        'Unable to connect to server. Make sure your backend is running.'
      );
    }
  }


  analyticsSearchForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    clearAnalyticsError();

    const shortCode = analyticsCodeInput.value.trim();

    if (!shortCode) {
      showAnalyticsError('Please enter a short code to view analytics.');
      analyticsCodeInput.focus();
      return;
    }

    await displayAnalytics(shortCode);
  });


  trackInAnalyticsBtn.addEventListener('click', async () => {
    const code = resShortCode.textContent.trim();

    if (!code) return;

    analyticsCodeInput.value = code;

    clearAnalyticsError();

    await displayAnalytics(code);

    const analyticsSection = document.getElementById('analytics');

    if (analyticsSection) {
      analyticsSection.scrollIntoView({
        behavior: 'smooth'
      });
    }
  });


  // --------------------------------------------------------------------------
  // 7. SMOOTH NAVIGATION & MOBILE MENU TOGGLE
  // --------------------------------------------------------------------------

  // Smooth scroll handler for nav items
  function scrollToSection(targetId) {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
    // Close mobile menu if open
    navMenu.classList.remove('open');
  }

  if (navShorten) {
    navShorten.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToSection('shorten');
    });
  }

  if (navAnalytics) {
    navAnalytics.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToSection('analytics');
    });
  }

  if (navHowItWorks) {
    navHowItWorks.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToSection('how-it-works');
    });
  }

  // Mobile navigation hamburger toggle
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });
  }

  // Close mobile navigation when clicking anywhere outside
  document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('open') &&
      !navMenu.contains(e.target) &&
      !mobileToggle.contains(e.target)) {
      navMenu.classList.remove('open');
    }
  });

});
