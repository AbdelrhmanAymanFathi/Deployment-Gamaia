const { Sequelize } = require('sequelize');
const sqlite3 = require('sqlite3');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false,
  dialectModule: sqlite3,
  dialectOptions: {
    mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE | sqlite3.OPEN_FULLMUTEX
  }
});

// ✅ Enable WAL mode for better concurrency
sequelize.authenticate().then(() => {
  return sequelize.query("PRAGMA journal_mode = WAL;");
}).then(() => {
  console.log('SQLite in WAL mode. Concurrency improved.');
}).catch(err => {
  console.error('Failed to enable WAL mode:', err);
});

module.exports = sequelize;
