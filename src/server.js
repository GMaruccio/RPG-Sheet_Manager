const path = require('path');
const { buildApp } = require('./app');
const { createStore } = require('./store');

const port = process.env.PORT || 3000;
const dataFile = process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'characters.json');

buildApp({ store: createStore(dataFile) }).listen(port, () =>
  console.log(`Ficha D&D rodando em http://localhost:${port} (dados em ${dataFile})`));
