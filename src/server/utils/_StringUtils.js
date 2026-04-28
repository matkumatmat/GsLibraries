// src/server/utils/_StringUtils.js

class StringUtils {
  static slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Ganti spasi dengan -
      .replace(/[^\w\-]+/g, '')       // Hapus karakter non-word
      .replace(/\-\-+/g, '-')         // Ganti multiple - dengan single -
      .replace(/^-+/, '')             // Trim - dari awal teks
      .replace(/-+$/, '');            // Trim - dari akhir teks
  }

  static truncate(text, length = 50, suffix = '...') {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length).trim() + suffix;
  }

  static capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  static padStart(str, targetLength, padString = '0') {
    return String(str).padStart(targetLength, padString);
  }

  static normalizeWhitespace(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  }
}