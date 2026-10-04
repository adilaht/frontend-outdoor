export const sanitizeString = (input: string): string => {
  if (!input) return input;
  // Hapus tag HTML < dan > untuk mencegah XSS standar
  let sanitized = input.replace(/[<>]/g, "");
  return sanitized.trim();
};

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  // Hanya memperbolehkan angka, tanda plus di awal, spasi, atau strip
  return /^[+0-9\-\s]{9,15}$/.test(phone);
};

export const validateSecurity = (input: string): boolean => {
  if (!input) return true; // Empty is safe (handled by required validation instead)
  
  // Deteksi pattern XSS dan SQL Injection yang lebih dalam
  const dangerousPattern = /(<script.*?>.*?<\/script>|<.*?on\w+=.*?>|javascript:|vbscript:|expression\(|onload|onerror|alert\(|prompt\(|confirm\(|SELECT\s+.*?\s+FROM|UPDATE\s+.*?\s+SET|INSERT\s+INTO|DELETE\s+FROM|DROP\s+TABLE|UNION\s+SELECT|--\s)/i;
  
  return !dangerousPattern.test(input);
};

export const validateFormText = (text: string, fieldName: string): { isValid: boolean; error: string } => {
  const sanitized = sanitizeString(text);
  
  if (!validateSecurity(sanitized)) {
    return { isValid: false, error: `${fieldName} mengandung karakter yang tidak diizinkan atau berbahaya.` };
  }
  
  return { isValid: true, error: '' };
};
