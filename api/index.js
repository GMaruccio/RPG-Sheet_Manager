// Entrada da aplicação para a Vercel (Node.js Serverless Function).
// Na Vercel usamos armazenamento em memória: o filesystem da Function é temporário.
const { buildApp } = require('../src/app-factory');

module.exports = buildApp();
