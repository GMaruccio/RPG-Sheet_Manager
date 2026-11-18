// Lê os JSONs do Jest em results/ e gera um resumo em Markdown
// (exibido na aba "Summary" do GitHub Actions via $GITHUB_STEP_SUMMARY).
const fs = require('fs');
const path = require('path');

const suites = [
  ['🧪 Unitários', 'unit.json'],
  ['🔗 Integração', 'integration.json'],
  ['🚀 Performance', 'performance.json'],
];

let md = '# Resultados dos testes\n\n| Suíte | Testes | ✅ Passaram | ❌ Falharam | Status |\n|---|---|---|---|---|\n';
let failed = false;

for (const [label, file] of suites) {
  const p = path.join('results', file);
  if (!fs.existsSync(p)) { md += `| ${label} | - | - | - | ⚠️ sem resultado |\n`; failed = true; continue; }
  const r = JSON.parse(fs.readFileSync(p, 'utf8'));
  const ok = r.numFailedTests === 0 && r.success;
  if (!ok) failed = true;
  md += `| ${label} | ${r.numTotalTests} | ${r.numPassedTests} | ${r.numFailedTests} | ${ok ? '🟢 OK' : '🔴 Falhou'} |\n`;
}

const cov = path.join('results', 'coverage', 'coverage-summary.json');
if (fs.existsSync(cov)) {
  const t = JSON.parse(fs.readFileSync(cov, 'utf8')).total;
  md += `\n**Cobertura (unitários):** linhas ${t.lines.pct}% · branches ${t.branches.pct}% · funções ${t.functions.pct}%\n`;
}

console.log(md);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
process.exit(failed ? 1 : 0);
