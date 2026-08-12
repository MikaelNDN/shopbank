export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

export function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number.parseInt(digits[i], 10) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (check !== Number.parseInt(digits[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number.parseInt(digits[i], 10) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  return check === Number.parseInt(digits[10], 10);
}

export function isValidZipCode(zipCode: string): boolean {
  return /^\d{8}$/.test(zipCode.replace(/\D/g, ''));
}
