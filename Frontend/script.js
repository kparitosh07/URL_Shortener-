/**
 * ============================================================================
 * Shortify — Vanilla JavaScript Frontend Interactions
 * ============================================================================
 * IMPORTANT:
 * - This script contains ONLY frontend UI manipulation and event handling.
 * - NO backend, NO fetch/Axios, NO API endpoints, NO database calls.
 * - Works completely standalone in the browser by opening index.html.
 * ============================================================================
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------------------------
  // 1. DOM ELEMENT REFERENCES
  // --------------------------------------------------------------------------
  
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

  shortenerForm.addEventListener('submit', (e) => {
    // Prevent default form submission / page reload
    e.preventDefault();

    // Reset previous errors
    clearFormError();

    const rawUrl = longUrlInput.value.trim();
    const rawAlias = customAliasInput.value.trim();
    const rawExpiration = expirationInput.value;

    // Requirement 1: Check whether the URL input is empty
    if (!rawUrl) {
      showFormError('Please enter a destination URL to shorten.');
      longUrlInput.focus();
      return;
    }

    // Requirement 2: Check that the URL starts with http:// or https://
    const startsWithHttp = rawUrl.startsWith('http://') || rawUrl.startsWith('https://');
    if (!startsWithHttp) {
      showFormError('URL must begin with http:// or https:// (e.g. https://example.com)');
      longUrlInput.focus();
      return;
    }

    // Requirement 3: Validate custom alias if provided
    let finalCode = DEFAULT_DEMO_CODE;

    if (rawAlias !== '') {
      // Check for allowed characters: letters, numbers, and hyphens only
      if (!isValidAlias(rawAlias)) {
        customAliasInput.classList.add('input-error');
        showFormError('Custom alias can only contain letters, numbers, and hyphens.');
        customAliasInput.focus();
        return;
      }

      // Check demonstration conflict rule: "portfolio" alias demo conflict
      if (rawAlias.toLowerCase() === 'portfolio') {
        customAliasInput.classList.add('input-error');
        showFormError('Demo: This alias is already in use. Please try another custom alias.');
        customAliasInput.focus();
        return;
      }

      // Use user's custom alias as short code
      finalCode = rawAlias;
    }

    // Construct demo short URL
    const demoShortUrl = `https://shortify.demo/${finalCode}`;

    // Update Result Card contents
    shortUrlLink.textContent = demoShortUrl;
    shortUrlLink.href = rawUrl; // Opens destination URL in new tab for demo preview
    resOriginalUrl.textContent = rawUrl;
    resOriginalUrl.title = rawUrl;
    resShortCode.textContent = finalCode;

    // Format Expiration Date (if provided)
    if (rawExpiration) {
      const expDate = new Date(rawExpiration);
      const formattedDate = expDate.toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      resExpiration.textContent = `Expires: ${formattedDate}`;
      resExpiration.classList.remove('meta-badge-gray');
    } else {
      resExpiration.textContent = 'No expiration (Permanent)';
      resExpiration.classList.add('meta-badge-gray');
    }

    // Reset copy button state in case it was previously clicked
    resetCopyButton();

    // Display result card
    resultCard.classList.remove('hidden');

    // Smoothly scroll down so result card is clearly visible
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
  function displayDemoAnalytics(code) {
    // Static demo values as specified in requirements:
    // Total Clicks: 24
    // Last Accessed: Today, 09:15 AM
    // Status: Active
    // Short Code: <searched code or aB72xK>
    metricClicks.textContent = '24';
    metricLastAccessed.textContent = 'Today, 09:15 AM';
    metricStatus.innerHTML = '<span class="pulse-dot"></span> Active';
    metricShortCode.textContent = code;

    // Ensure analytics content is visible
    analyticsContent.classList.remove('hidden');
  }

  analyticsSearchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearAnalyticsError();

    const shortCode = analyticsCodeInput.value.trim();

    // Requirement: If empty, show a validation message
    if (!shortCode) {
      showAnalyticsError('Please enter a short code to view analytics.');
      analyticsCodeInput.focus();
      return;
    }

    // Display static demo analytics
    displayDemoAnalytics(shortCode);
  });

  // Result card helper: "View Analytics for this Link"
  trackInAnalyticsBtn.addEventListener('click', () => {
    const code = resShortCode.textContent.trim() || DEFAULT_DEMO_CODE;
    analyticsCodeInput.value = code;
    clearAnalyticsError();
    displayDemoAnalytics(code);

    const analyticsSection = document.getElementById('analytics');
    if (analyticsSection) {
      analyticsSection.scrollIntoView({ behavior: 'smooth' });
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
