const fs = require('fs');
const path = require('path');

function transformFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  let original = code;
  let changed = false;

  // ========== 1. Pindahkan static fields ke luar class ==========
  // Pattern: static nama = value;
  const staticFieldRegex = /^\s*static\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);/gm;
  let staticMatches = [];
  let match;
  while ((match = staticFieldRegex.exec(code)) !== null) {
    staticMatches.push({ name: match[1], value: match[2] });
  }
  if (staticMatches.length > 0) {
    // Hapus semua baris static field dari kode
    code = code.replace(staticFieldRegex, '');
    // Cari nama class (asumsi hanya satu class utama per file)
    const classMatch = code.match(/class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\{/);
    if (classMatch) {
      const className = classMatch[1];
      // Cari posisi kurung tutup class yang seimbang (sederhana: hitung brace)
      let braceCount = 0;
      let classEndIndex = -1;
      for (let i = 0; i < code.length; i++) {
        if (code[i] === '{') braceCount++;
        else if (code[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            classEndIndex = i;
            break;
          }
        }
      }
      if (classEndIndex !== -1) {
        const assignments = staticMatches.map(m => `${className}.${m.name} = ${m.value};`).join('\n');
        const insertPoint = classEndIndex + 1; // setelah }
        code = code.slice(0, insertPoint) + '\n\n// Static properties moved outside class\n' + assignments + '\n' + code.slice(insertPoint);
        changed = true;
      }
    }
  }

  // ========== 2. Ganti optional chaining ?. ==========
  // a?.b -> (a && a.b)
  // a?.b.c -> (a && a.b.c)  (tetap a.b.c dievaluasi, tidak masalah karena a sudah false)
  // a?.[b] -> (a && a[b])  (bracket)
  // a?.() -> (a && a())
  // Perhatikan: tidak menangani chaining multiple seperti a?.b?.c secara optimal, tapi akan diurai bertahap jika regex diulang.
  let prev;
  do {
    prev = code;
    // Optional chaining with dot: a?.b
    code = code.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\?\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g, '($1 && $1.$2)');
    // Optional chaining with bracket: a?.[expr]
    code = code.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\?\.\[([^\]]+)\]/g, '($1 && $1[$2])');
    // Optional chaining call: a?.()
    code = code.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\?\.\(/g, '($1 && $1(');
  } while (code !== prev);
  if (code !== original) changed = true;

  // ========== 3. Ganti nullish coalescing ?? ==========
  // a ?? b -> (a !== null && a !== undefined ? a : b)
  // Bisa bersarang: a ?? b ?? c -> diubah bertahap
  do {
    prev = code;
    code = code.replace(/([^??(][^??]*?)\?\?([^\n;]+)/, (match, left, right) => {
      left = left.trim();
      right = right.trim();
      return `((${left} !== null && ${left} !== undefined) ? ${left} : ${right})`;
    });
  } while (code !== prev);
  if (code !== original) changed = true;

  if (changed) {
    fs.writeFileSync(filePath, code, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  return false;
}

// Proses semua file .js di src/server dan src/clients
const folders = ['src/server', 'src/clients'];
for (const folder of folders) {
  if (!fs.existsSync(folder)) continue;
  const files = fs.readdirSync(folder, { recursive: true }).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const fullPath = path.join(folder, file);
    transformFile(fullPath);
  }
}
console.log('Transformasi selesai. Silakan jalankan clasp push.');