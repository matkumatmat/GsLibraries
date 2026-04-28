// src/server/utils/_SpreadsheetUtils.js

class SpreadsheetUtils {
  static columnIndexToLetter(colIndex) {
    let temp, letter = '';
    while (colIndex > 0) {
      temp = (colIndex - 1) % 26;
      letter = String.fromCharCode(temp + 65) + letter;
      colIndex = (colIndex - temp - 1) / 26;
    }
    return letter;
  }

  static letterToColumnIndex(letter) {
    let column = 0;
    const length = letter.length;
    for (let i = 0; i < length; i++) {
      column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
    }
    return column;
  }

  static a1Notation(row, col) {
    return `${this.columnIndexToLetter(col)}${row}`;
  }
}P