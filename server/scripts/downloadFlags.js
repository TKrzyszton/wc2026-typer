const https = require('https');
const fs = require('fs');
const path = require('path');

const FLAG_CODES = [
  'mx','us','ca','ar','br','co','ec','uy','py','de','fr','es','gb-eng','pt','nl',
  'be','ch','hr','at','gb-sct','tr','cz','pl','se','no','jp','kr','au','ir',
  'sa','jo','iq','uz','qa','ma','sn','ng','eg','gh','tn','dz','cd',
  'pa','jm','hn','ht','tt','nz','za','cw','ci','cv','ba',
  // dodatkowe które mogą się pojawić w fazie pucharowej
  'rs','ro','hu','it','ve','cl','pe','sl','ml',
];

const OUT_DIR = path.join(__dirname, '../../client/public/flags');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function download(code) {
  return new Promise((resolve, reject) => {
    const dest = path.join(OUT_DIR, `${code}.png`);
    if (fs.existsSync(dest)) { console.log(`  skip ${code}.png`); return resolve(); }
    const url = `https://flagcdn.com/w40/${code}.png`;
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode !== 200) {
        fs.unlink(dest, () => {});
        return reject(new Error(`${code}: HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); console.log(`  ✓ ${code}.png`); resolve(); });
    }).on('error', err => { fs.unlink(dest, () => {}); reject(err); });
  });
}

(async () => {
  console.log(`Pobieranie flag do ${OUT_DIR}...`);
  for (const code of FLAG_CODES) {
    try { await download(code); } catch (e) { console.warn(`  ✗ ${e.message}`); }
  }
  console.log('Gotowe.');
})();
