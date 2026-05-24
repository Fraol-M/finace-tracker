/**
 * Shared validation helpers for user accounts, usernames, email formats, and passwords.
 */

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePhone = (phone: string): boolean => {
  if (phone.trim() === '-' || phone.trim() === '') return true;
  return /^\+?[\d\s\-()]+$/.test(phone);
};

export const validatePassword = (pass: string): boolean => {
  return pass.length >= 8 && /[0-9]/.test(pass) && /[!@#$%^&*(),.?":{}|<>]/.test(pass);
};

export const validateUsername = (user: string): boolean => {
  return user.length > 0 && !/\s/.test(user);
};
