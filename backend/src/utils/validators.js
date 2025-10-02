const validateCountryCode = (code) => {
  if (!code || typeof code !== 'string') {
    return false;
  }
  return /^[A-Z]{2}$/.test(code);
};

const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  return input.trim().replace(/[<>]/g, '');
};

module.exports = {
  validateCountryCode,
  validateEmail,
  validateUrl,
  sanitizeInput
};