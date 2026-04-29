// src/server/utils/_NumberUtils.js

class NumberUtils {
  static formatCurrency(amount, currency = 'IDR', locale = 'id-ID') {
    const num = Number(amount);
    if (isNaN(num)) return amount; // Fallback jika bukan angka
    
    // GAS tidak sepenuhnya mendukung Intl.NumberFormat dengan sempurna di semua kondisi,
    // jadi kita buat manual format Rupiah-nya jika locale id-ID
    if (currency === 'IDR') {
      return 'Rp ' + num.toFixed(0).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    }
    return num.toString(); 
  }

  static round(value, precision = 2) {
    const multiplier = Math.pow(10, precision);
    return Math.round(value * multiplier) / multiplier;
  }

  static parseNumber(val) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    
    // Hapus karakter non-digit selain koma dan titik
    const cleanStr = String(val).replace(/[^\d.,-]/g, '');
    
    // Format Indonesia: titik untuk ribuan, koma untuk desimal
    // Format US: koma untuk ribuan, titik untuk desimal
    // Kita standarisasi ke US format agar bisa di-parse JS
    let standardized = cleanStr;
    if (cleanStr.includes(',') && cleanStr.includes('.')) {
       // Kemungkinan US format misal 1,000.50
       if (cleanStr.indexOf(',') < cleanStr.indexOf('.')) {
         standardized = cleanStr.replace(/,/g, '');
       } else {
         // Kemungkinan ID format misal 1.000,50
         standardized = cleanStr.replace(/\./g, '').replace(',', '.');
       }
    } else if (cleanStr.includes(',')) {
       standardized = cleanStr.replace(',', '.');
    }

    const parsed = parseFloat(standardized);
    return isNaN(parsed) ? 0 : parsed;
  }
}