const Database = require('better-sqlite3');
const path = 'c:\\Users\\KomPhone\\git\\recruit-planner\\database.sqlite';

console.log('Connecting to DB at:', path);
const db = new Database(path);

console.log('--- Ads in DB ---');
const ads = db.prepare('SELECT * FROM ads').all();
console.log(JSON.stringify(ads, null, 2));

const targetId = 1;
console.log(`--- Attempting to delete ID ${targetId} ---`);
const stmt = db.prepare('DELETE FROM ads WHERE id = ?');
const result = stmt.run(targetId);
console.log('Delete result:', result);

console.log('--- Ads in DB after delete ---');
const adsAfter = db.prepare('SELECT * FROM ads').all();
console.log(JSON.stringify(adsAfter, null, 2));
