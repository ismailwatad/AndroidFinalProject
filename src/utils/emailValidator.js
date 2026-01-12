/**
 * Email Validation Utility
 * Validates email format including @ symbol and proper structure
 */

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {Object} Validation result with success status and error message
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    return {
      isValid: false,
      error: 'E-posta adresi gereklidir'
    };
  }

  // Check for @ symbol
  if (!email.includes('@')) {
    return {
      isValid: false,
      error: 'E-posta adresi @ içermelidir'
    };
  }

  // Check for at least one character before @
  const parts = email.split('@');
  if (parts.length !== 2) {
    return {
      isValid: false,
      error: 'Geçersiz e-posta formatı'
    };
  }

  const [localPart, domainPart] = parts;

  // Check local part (before @)
  if (!localPart || localPart.trim() === '') {
    return {
      isValid: false,
      error: '@ işaretinden önce metin bulunmalıdır'
    };
  }

  if (localPart.length > 64) {
    return {
      isValid: false,
      error: '@ işaretinden önceki kısım çok uzun'
    };
  }

  // Check domain part (after @)
  if (!domainPart || domainPart.trim() === '') {
    return {
      isValid: false,
      error: '@ işaretinden sonra domain bulunmalıdır'
    };
  }

  // Check for dot in domain
  if (!domainPart.includes('.')) {
    return {
      isValid: false,
      error: 'Domain nokta (.) içermelidir'
    };
  }

  // Check domain extension (TLD)
  const domainParts = domainPart.split('.');
  if (domainParts.length < 2 || domainParts[domainParts.length - 1].length < 2) {
    return {
      isValid: false,
      error: 'Geçersiz domain uzantısı'
    };
  }

  // Basic regex validation for email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Geçersiz e-posta formatı'
    };
  }

  // Check for invalid characters
  const invalidChars = /[<>()[\]\\.,;:\s"]/;
  if (invalidChars.test(localPart)) {
    return {
      isValid: false,
      error: 'E-posta geçersiz karakterler içeriyor'
    };
  }

  // Check for consecutive dots
  if (localPart.includes('..') || domainPart.includes('..')) {
    return {
      isValid: false,
      error: 'E-posta ardışık noktalar içeremez'
    };
  }

  // Check for leading/trailing dots
  if (localPart.startsWith('.') || localPart.endsWith('.') || 
      domainPart.startsWith('.') || domainPart.endsWith('.')) {
    return {
      isValid: false,
      error: 'E-posta nokta ile başlayamaz veya bitemez'
    };
  }

  return {
    isValid: true,
    error: null
  };
};

/**
 * Simple email validation (quick check)
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid
 */
export const isValidEmail = (email) => {
  return validateEmail(email).isValid;
};
