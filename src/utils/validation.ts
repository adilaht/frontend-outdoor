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

const POPULAR_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];

// Helper Levenshtein distance untuk deteksi typo cerdas (fuzzy matching)
function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// 💡 1. Rekomendasi Autocomplete Cepat saat mengetik (misal: "budi@" -> "@gmail.com", "@yahoo.com")
export const getEmailDomainSuggestions = (email: string): string[] => {
  if (!email || !email.includes('@')) return [];
  const parts = email.split('@');
  if (parts.length !== 2) return [];
  const [user, domain] = parts;
  if (!user.trim()) return [];

  const lowerDomain = domain.toLowerCase().trim();
  // Jika domain sudah valid sempurna, tidak perlu saran lagi
  if (POPULAR_DOMAINS.includes(lowerDomain)) return [];

  // Munculkan opsi domain populer yang cocok dengan awalan domain yang sedang diketik
  return POPULAR_DOMAINS
    .filter((d) => d.startsWith(lowerDomain) || lowerDomain === '')
    .slice(0, 3)
    .map((d) => `${user}@${d}`);
};

// 💡 2. Deteksi Saltik / Typo Domain Cerdas (misal: gmai, gmaill, gmail.con, gamil.com, yaho.com)
export const suggestEmailCorrection = (email: string): string | null => {
  if (!email || !email.includes('@')) return null;
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  const [user, rawDomain] = parts;
  if (!user || !rawDomain) return null;

  const domain = rawDomain.toLowerCase().trim();

  // Jika domain sudah benar persis, tidak perlu saran
  if (POPULAR_DOMAINS.includes(domain)) return null;

  // Kamus langsung untuk typo umum (baik yang belum ada .com maupun salah ekstensi seperti .con)
  const commonTypos: Record<string, string> = {
    // Gmail
    'gmai.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'gmaill.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'gma.com': 'gmail.com',
    'gmil.com': 'gmail.com',
    'gnail.com': 'gmail.com',
    'gmail.con': 'gmail.com',
    'gmail.co': 'gmail.com',
    'gmail.cpm': 'gmail.com',
    'gmail.om': 'gmail.com',
    'gmail.cm': 'gmail.com',
    'gmail.comm': 'gmail.com',
    'gmail': 'gmail.com',
    'gmai': 'gmail.com',
    'gamil': 'gmail.com',
    'gmial': 'gmail.com',
    'gmaill': 'gmail.com',
    'gmal': 'gmail.com',

    // Yahoo
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com',
    'ymail.com': 'yahoo.com',
    'yhoo.com': 'yahoo.com',
    'yahoo.con': 'yahoo.com',
    'yahoo.co': 'yahoo.com',
    'yahoo': 'yahoo.com',
    'yaho': 'yahoo.com',

    // Outlook
    'outlok.com': 'outlook.com',
    'outllok.com': 'outlook.com',
    'ootlook.com': 'outlook.com',
    'outlook.con': 'outlook.com',
    'outlook': 'outlook.com',
    'outlok': 'outlook.com',

    // Hotmail
    'hotmial.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com',
    'hotmali.com': 'hotmail.com',
    'hotmail.con': 'hotmail.com',
    'hotmail': 'hotmail.com',
  };

  if (commonTypos[domain]) {
    return `${user}@${commonTypos[domain]}`;
  }

  // Cek typo akhiran ekstensi (.con, .cpm, .om, .cm)
  const typoExtensions = ['.con', '.cpm', '.om', '.cm', '.comm'];
  for (const ext of typoExtensions) {
    if (domain.endsWith(ext)) {
      const baseDomain = domain.slice(0, -ext.length);
      const candidate = `${baseDomain}.com`;
      if (POPULAR_DOMAINS.includes(candidate)) {
        return `${user}@${candidate}`;
      }
    }
  }

  // Fuzzy check dengan jarak Levenshtein (maksimal beda 2 karakter dari domain populer)
  for (const popular of POPULAR_DOMAINS) {
    if (domain.length >= 4 && Math.abs(domain.length - popular.length) <= 2) {
      if (getLevenshteinDistance(domain, popular) <= 2) {
        return `${user}@${popular}`;
      }
    }
  }

  return null;
};


