(function () {
  'use strict';

  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function isNonEmptyTrimmed(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  function isValidEmail(value) {
    if (typeof value !== 'string') {
      return false;
    }
    var trimmed = value.trim();
    return trimmed.length > 0 && EMAIL_PATTERN.test(trimmed);
  }

  function isValidMessage(value) {
    return typeof value === 'string' && value.trim().length >= 10;
  }

  function validateContactForm(fields) {
    var errors = {};

    if (!isNonEmptyTrimmed(fields.name)) {
      errors.name = 'Name is required.';
    }

    if (!fields.email || fields.email.trim().length === 0) {
      errors.email = 'Email is required.';
    } else if (!EMAIL_PATTERN.test(fields.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!fields.message || fields.message.trim().length === 0) {
      errors.message = 'Message is required.';
    } else if (fields.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters.';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors: errors
    };
  }

  function clearFieldError(input, errorEl) {
    input.removeAttribute('aria-invalid');
    errorEl.textContent = '';
  }

  function setFieldError(input, errorEl, message) {
    input.setAttribute('aria-invalid', 'true');
    errorEl.textContent = message;
  }

  function bindContactForm(form) {
    var nameInput = form.querySelector('#contact-name');
    var emailInput = form.querySelector('#contact-email');
    var messageInput = form.querySelector('#contact-message');
    var nameError = form.querySelector('#contact-name-error');
    var emailError = form.querySelector('#contact-email-error');
    var messageError = form.querySelector('#contact-message-error');
    var successEl = form.querySelector('#contact-form-success');
    var fieldOrder = [
      { key: 'name', input: nameInput, errorEl: nameError },
      { key: 'email', input: emailInput, errorEl: emailError },
      { key: 'message', input: messageInput, errorEl: messageError }
    ];

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      fieldOrder.forEach(function (field) {
        clearFieldError(field.input, field.errorEl);
      });
      if (successEl) {
        successEl.textContent = '';
      }

      var result = validateContactForm({
        name: nameInput.value,
        email: emailInput.value,
        message: messageInput.value
      });

      if (!result.valid) {
        var firstInvalid = null;

        fieldOrder.forEach(function (field) {
          if (result.errors[field.key]) {
            setFieldError(field.input, field.errorEl, result.errors[field.key]);
            if (!firstInvalid) {
              firstInvalid = field.input;
            }
          }
        });

        if (firstInvalid) {
          firstInvalid.focus();
        }
        return;
      }

      if (successEl) {
        successEl.textContent = 'Thank you! Your message is ready to send.';
      }
      form.reset();
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      isNonEmptyTrimmed: isNonEmptyTrimmed,
      isValidEmail: isValidEmail,
      isValidMessage: isValidMessage,
      validateContactForm: validateContactForm,
      bindContactForm: bindContactForm
    };
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      var form = document.getElementById('contact-form');
      if (form) {
        bindContactForm(form);
      }
    });
  }
})();
