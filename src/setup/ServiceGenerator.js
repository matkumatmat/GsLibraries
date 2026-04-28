const fs = require('fs');
const path = require('path');

// Ambil argumen dari terminal
const domainArg = process.argv[2];
const sheetNameArg = process.argv[3] || 'NAMA_SHEET';

if (!domainArg) {
  console.error('Error: Harap masukkan nama domain.');
  console.error('Penggunaan: node src/setup/ServiceGenerator.js <NamaDomain> <NamaSheet>');
  console.error('Contoh: node src/setup/ServiceGenerator.js Product MASTER_PRODUCT');
  process.exit(1);
}

// Formatting nama domain
const Domain = domainArg.charAt(0).toUpperCase() + domainArg.slice(1);
const camelDomain = domainArg.charAt(0).toLowerCase() + domainArg.slice(1);

// Definisi path (relatif terhadap root project saat script dijalankan)
const rootDir = process.cwd();
const domainDir = path.join(rootDir, 'src', 'server', 'domain', camelDomain);
const domainRegistryPath = path.join(rootDir, 'src', 'server', 'main', 'DomainRegistry.js');
const postRegistryPath = path.join(rootDir, 'src', 'server', 'main', 'PostRegistry.js');

// 1. Buat direktori domain jika belum ada
if (!fs.existsSync(domainDir)) {
  fs.mkdirSync(domainDir, { recursive: true });
}

// 2. Konten file Repository
const repoContent = `// src/server/domain/${camelDomain}/${Domain}Repo.js

class ${Domain}Repo extends BaseRepo {
  constructor(driver, tableKeys, startRow = 2) {
    if (!driver) throw new AppError('Database driver must be injected', 'SYS_ERROR', 500);
    super(driver, tableKeys, startRow);
  }

  // Tambahkan custom query/logic database khusus ${Domain} di sini
}
`;

// 3. Konten file Service
const serviceContent = `// src/server/domain/${camelDomain}/${Domain}Service.js

class ${Domain}Service extends BaseService {
  constructor(repo) {
    super(repo);
    this.defaultLimit = 100;
  }

  getPaginatedData(page = 1, limit = null, filterConfig = null) {
    const limitNum = limit ? parseInt(limit) : this.defaultLimit;
    const rawData = this.repo.query().limit(limitNum).offset((page - 1) * limitNum).get();
    return this._filter(rawData, filterConfig);
  }

  create(payload) {
    return this.repo.create(payload);
  }

  update(id, payload) {
    return this.repo.update(id, payload);
  }

  delete(id) {
    return this.repo.softDelete(id);
  }
}
`;

// 4. Tulis file Repo dan Service
fs.writeFileSync(path.join(domainDir, `${Domain}Repo.js`), repoContent);
fs.writeFileSync(path.join(domainDir, `${Domain}Service.js`), serviceContent);
console.log(`[+] Created: src/server/domain/${camelDomain}/${Domain}Repo.js`);
console.log(`[+] Created: src/server/domain/${camelDomain}/${Domain}Service.js`);

// 5. Fungsi helper untuk menyisipkan kode ke dalam object Registry
function appendToRegistry(filePath, snippet) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[!] File tidak ditemukan, lewati: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  // Mencari penutup object "};" di akhir file dan menyisipkan snippet tepat sebelum penutup tersebut
  const newContent = content.replace(/(};\s*)$/, snippet + '\n$1');
  fs.writeFileSync(filePath, newContent);
}

// 6. Snippet untuk DomainRegistry
const domainRegistrySnippet = `
  'get${Domain}s': {
    factory: () => {
      const driver = new SheetDriver(EnvConfig.get('SHEET_ID_${Domain.toUpperCase()}'), '${sheetNameArg}');
      const keys = ['id', 'nama', 'status', 'createdAt', 'updatedAt'];
      const repo = new ${Domain}Repo(driver, keys, 2);
      return new ${Domain}Service(repo);
    },
    cacheGroup: '${sheetNameArg}',
    method: 'getPaginatedData'
  },`;

// 7. Snippet untuk PostRegistry
const postRegistrySnippet = `
  'create${Domain}': {
    factory: () => {
      const driver = new SheetDriver(EnvConfig.get('SHEET_ID_${Domain.toUpperCase()}'), '${sheetNameArg}');
      const keys = ['id', 'nama', 'status', 'createdAt', 'updatedAt'];
      const repo = new ${Domain}Repo(driver, keys, 2);
      return new ${Domain}Service(repo);
    },
    method: 'create',
    roles: ['ADMIN']
  },
  'update${Domain}': {
    factory: () => {
      const driver = new SheetDriver(EnvConfig.get('SHEET_ID_${Domain.toUpperCase()}'), '${sheetNameArg}');
      const keys = ['id', 'nama', 'status', 'createdAt', 'updatedAt'];
      const repo = new ${Domain}Repo(driver, keys, 2);
      return new ${Domain}Service(repo);
    },
    method: 'update',
    roles: ['ADMIN']
  },`;

// 8. Eksekusi modifikasi registry
appendToRegistry(domainRegistryPath, domainRegistrySnippet);
console.log(`[+] Modified: src/server/main/DomainRegistry.js`);

appendToRegistry(postRegistryPath, postRegistrySnippet);
console.log(`[+] Modified: src/server/main/PostRegistry.js`);

console.log('\nBerhasil. Scaffold sudah di-generate. Silakan periksa file Anda.');