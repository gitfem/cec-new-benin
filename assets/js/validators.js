/**
 * SiteValidators - Universal Phone & Email Validation for CE New Benin
 * Validates local (Nigerian 11-digit) and international (+... 8-15 digit) phone numbers
 * Rejects fake, dummy, sequential, and repeated phone numbers and emails
 */
(function(window) {
  'use strict';

  var SiteValidators = {
    isEmpty: function(val) {
      return val === null || val === undefined || String(val).trim() === '';
    },

    /**
     * Validate Phone Number (local Nigerian or international)
     * @param {string} phone
     * @param {boolean} required
     * @returns {{valid: boolean, message?: string, formatted?: string}}
     */
    validatePhone: function(phone, required) {
      if (required === undefined) required = true;
      if (this.isEmpty(phone)) {
        return required ? { valid: false, message: 'Please enter your phone number.' } : { valid: true, formatted: '' };
      }

      var raw = String(phone).trim();
      var cleaned = raw.replace(/[\s\-\(\)\.]/g, '');

      // Must be between 8 and 15 digits (optional leading +)
      if (!/^\+?[0-9]{8,15}$/.test(cleaned)) {
        return {
          valid: false,
          message: 'Please enter a valid phone number (8 to 15 digits, local or international with country code).'
        };
      }

      var digitsOnly = cleaned.replace(/^\+/, '');

      // 1. Reject all identical digits: e.g. 0000000000, 1111111111
      if (/^(\d)\1+$/.test(digitsOnly)) {
        return {
          valid: false,
          message: 'Please enter an active phone number, not repeated digits.'
        };
      }

      // 2. Reject obvious sequential test numbers: e.g. 12345678, 87654321
      var dummySequences = ['12345678', '87654321', '01234567', '76543210', '98765432'];
      for (var i = 0; i < dummySequences.length; i++) {
        if (digitsOnly.indexOf(dummySequences[i]) !== -1) {
          return {
            valid: false,
            message: 'Please enter an active phone number, not a sequential test number.'
          };
        }
      }

      // 3. Reject numbers that have fewer than 3 distinct digits (e.g. 08000000000, 08080808080)
      var digitMap = {};
      for (var d = 0; d < digitsOnly.length; d++) {
        digitMap[digitsOnly[d]] = true;
      }
      if (Object.keys(digitMap).length < 3) {
        return {
          valid: false,
          message: 'Please enter a genuine active phone number.'
        };
      }

      // 4. Local Nigerian phone format (starts with 0, must be 11 digits)
      if (cleaned.charAt(0) === '0') {
        if (cleaned.length !== 11) {
          return {
            valid: false,
            message: 'Local Nigerian phone numbers must be 11 digits (e.g. 08023456789).'
          };
        }
        // Valid Nigerian prefixes: 070, 080, 081, 090, 091, 01, 02, etc.
        if (!/^0(?:[789][01]\d{8}|[1-9]\d{7,8})$/.test(cleaned)) {
          return {
            valid: false,
            message: 'Please enter a valid Nigerian phone number prefix (e.g. 080, 081, 070, 090, 091).'
          };
        }
        var sub = cleaned.slice(3);
        if (/^(\d)\1+$/.test(sub)) {
          return {
            valid: false,
            message: 'Please enter a genuine active phone number.'
          };
        }
        return { valid: true, formatted: cleaned };
      }

      // 5. Nigerian International format (+234 or 234)
      if (cleaned.indexOf('+234') === 0 || cleaned.indexOf('234') === 0) {
        var norm = cleaned.indexOf('+234') === 0 ? cleaned.slice(4) : cleaned.slice(3);
        if (norm.charAt(0) === '0') {
          norm = norm.slice(1);
        }
        if (norm.length !== 10) {
          return {
            valid: false,
            message: 'Nigerian international numbers must have 10 digits after +234 (e.g. +234 802 345 6789).'
          };
        }
        if (!/^[789][01]\d{8}$|^[1-9]\d{7,8}$/.test(norm)) {
          return {
            valid: false,
            message: 'Invalid Nigerian phone number format after +234.'
          };
        }
        if (/^(\d)\1+$/.test(norm.slice(2))) {
          return {
            valid: false,
            message: 'Please enter a genuine active phone number.'
          };
        }
        return { valid: true, formatted: '+234' + norm };
      }

      // 6. International phone format
      if (digitsOnly.length < 8 || digitsOnly.length > 15) {
        return {
          valid: false,
          message: 'International phone numbers must be between 8 and 15 digits.'
        };
      }

      return { valid: true, formatted: cleaned };
    },

    /**
     * Validate Email Address
     * @param {string} email
     * @param {boolean} required
     * @returns {{valid: boolean, message?: string, formatted?: string}}
     */
    validateEmail: function(email, required) {
      if (required === undefined) required = false;
      if (this.isEmpty(email)) {
        return required ? { valid: false, message: 'Please enter your email address.' } : { valid: true, formatted: '' };
      }

      var raw = String(email).trim().toLowerCase();

      var placeholders = ['name@email.com', 'you@example.com', 'johndoe@gmail.com', 'email@email.com'];
      for (var p = 0; p < placeholders.length; p++) {
        if (raw === placeholders[p]) {
          return {
            valid: false,
            message: 'Please enter your actual email address, not placeholder text.'
          };
        }
      }

      var pattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      if (!pattern.test(raw)) {
        return {
          valid: false,
          message: 'Please enter a valid email address (e.g. name@domain.com).'
        };
      }

      var parts = raw.split('@');
      if (parts.length !== 2) {
        return { valid: false, message: 'Please enter a valid email address.' };
      }

      var user = parts[0];
      var domain = parts[1];

      var domainParts = domain.split('.');
      var tld = domainParts[domainParts.length - 1];
      if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
        return {
          valid: false,
          message: 'Please enter an email with a valid domain extension (e.g. .com, .org, .ng).'
        };
      }

      var dummyUsers = ['test', 'testing', 'fake', 'none', 'noemail', 'dummy', 'asdf', 'sample', 'random', 'fakemail'];
      for (var u = 0; u < dummyUsers.length; u++) {
        if (user === dummyUsers[u]) {
          return {
            valid: false,
            message: '"' + user + '" is not a valid email username. Please use your real email.'
          };
        }
      }

      if (user.length >= 4 && /^([a-zA-Z0-9])\1+$/.test(user)) {
        return {
          valid: false,
          message: 'Please enter an active email address.'
        };
      }

      var fakeDomains = [
        'test.com', 'fake.com', 'none.com', 'domain.com', 'sample.com', 'noemail.com',
        'mailinator.com', 'tempmail.com', 'guerrillamail.com', '10minutemail.com',
        'throwawaymail.com', 'sharklasers.com', 'yopmail.com', 'trashmail.com',
        'example.com', 'example.org', 'xyz.com', 'abc.com'
      ];
      for (var f = 0; f < fakeDomains.length; f++) {
        if (domain === fakeDomains[f]) {
          return {
            valid: false,
            message: '"' + domain + '" is not an active email provider. Please use your real email (e.g. @gmail.com, @yahoo.com).'
          };
        }
      }

      return { valid: true, formatted: raw };
    }
  };

  window.SiteValidators = SiteValidators;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SiteValidators;
  }
})(typeof window !== 'undefined' ? window : global);
