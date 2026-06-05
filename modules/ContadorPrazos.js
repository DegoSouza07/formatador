/**
 * contadorPrazos.js
 * Módulo: Contador de Prazos TCE-PE
 * Diretoria de Julgamento — Assistente de Trabalho
 *
 * Padrão de integração:
 *   registry.js → createModuleDef({ type: meta.value, label: meta.label, path: './ContadorPrazos.js' })
 *   app.js      → mod.mount(container)  /  currentModule.destroy()
 */

// ─── Metadados ────────────────────────────────────────────────────────────────

export const meta = {
  value: 'contadorPrazos',
  label: 'Contador de Prazos',
};

// ─── Base de dados completa (Lei Orgânica e Regimento Interno TCE-PE) ─────────

const PRAZOS_DB = {

  // ── 1. Peças de Defesa ────────────────────────────────────────────────────
  defesa_geral: {
    label: 'Defesa prévia — regra geral',
    grupo: '1. Peças de Defesa',
    tipo: 'util', qtd: 30,
    prorrog: 'Sim — até metade do prazo inicial (15 du), 1 única vez',
    condicaoProrrog: 'Pedido motivado feito dentro do prazo original; novo prazo conta do último dia inicial ou da data do deferimento (o que ocorrer por último).',
    obs: 'Prazo contado a partir da notificação válida.',
    mpco: true,
  },
  defesa_fiscal: {
    label: 'Defesa em gestão fiscal / auto de infração',
    grupo: '1. Peças de Defesa',
    tipo: 'util', qtd: 5,
    prorrog: 'Não há previsão de prorrogação.',
    condicaoProrrog: '',
    obs: '',
  },
  defesa_destaque: {
    label: 'Defesa em processo de destaque',
    grupo: '1. Peças de Defesa',
    tipo: 'horas', qtd: 48,
    prorrog: 'Não — improrrogável.',
    condicaoProrrog: '',
    obs: 'Prazo rígido de 48 horas contínuas.',
  },
  manifestacao_gov: {
    label: 'Manifestação do governador (após relatório técnico)',
    grupo: '1. Peças de Defesa',
    tipo: 'util', qtd: 30,
    prorrog: 'Não especificado.',
    condicaoProrrog: '',
    obs: 'Enviada após a conclusão do relatório técnico das contas.',
  },

  // ── 2. Peças Recursais ────────────────────────────────────────────────────
  rec_ordinario: {
    label: 'Recurso ordinário',
    grupo: '2. Peças Recursais',
    tipo: 'util', qtd: 30,
    prorrog: 'Não previsto.',
    condicaoProrrog: '',
    obs: 'Contado a partir da publicação da deliberação.',
    mpco: true,
  },
  rec_embargos: {
    label: 'Embargos de declaração',
    grupo: '2. Peças Recursais',
    tipo: 'util', qtd: 5,
    prorrog: 'Não previsto.',
    condicaoProrrog: '',
    obs: 'Contado da data da publicação da deliberação.',
    mpco: true,
  },
  rec_agravo_padrao: {
    label: 'Agravo — padrão (indeferimento / interlocutória / admissibilidade)',
    grupo: '2. Peças Recursais',
    tipo: 'util', qtd: 5,
    prorrog: 'Não previsto.',
    condicaoProrrog: '',
    obs: 'Cabível contra: indeferimento liminar de recurso, decisão interlocutória do Relator ou decisão do Presidente em juízo de admissibilidade.',
    mpco: true,
  },
  rec_agravo_pres: {
    label: 'Agravo contra atos administrativos do Presidente (ao Pleno)',
    grupo: '2. Peças Recursais',
    tipo: 'corrido', qtd: 15,
    prorrog: 'Não previsto.',
    condicaoProrrog: '',
    obs: 'Prazo em dias corridos; dirigido ao Tribunal Pleno.',
  },
  rec_agravo_vice: {
    label: 'Agravo contra o vice-presidente (nega seguimento a rescisão)',
    grupo: '2. Peças Recursais',
    tipo: 'util', qtd: 15,
    prorrog: 'Não previsto.',
    condicaoProrrog: '',
    obs: 'Cabível quando o Vice-Presidente nega seguimento a Pedido de Rescisão.',
  },
  rec_rescisao: {
    label: 'Pedido de rescisão',
    grupo: '2. Peças Recursais',
    tipo: 'anos', qtd: 2,
    prorrog: 'Não — prazo decadencial.',
    condicaoProrrog: '',
    obs: 'Extingue-se em 2 anos contados do trânsito em julgado da deliberação.',
  },

  // ── 3. Instrução e Técnica ────────────────────────────────────────────────
  mpco_parecer_geral: {
    label: 'MPCO — parecer geral (recursos ordinários / rescisões)',
    grupo: '3. Instrução e Técnica',
    tipo: 'corrido', qtd: 60,
    prorrog: 'Regulamento padrão do MPCO.',
    condicaoProrrog: '',
    obs: 'Regra geral para recursos ordinários e pedidos de rescisão.',
    mpco: true,
  },
  mpco_parecer_consulta: {
    label: 'MPCO — parecer em processos de consulta relevante',
    grupo: '3. Instrução e Técnica',
    tipo: 'corrido', qtd: 45,
    prorrog: 'Regulamento padrão do MPCO.',
    condicaoProrrog: '',
    obs: 'Aplicável quando a questão for relevante.',
    mpco: true,
  },
  mpco_parecer_gov: {
    label: 'MPCO — parecer nas contas do governador',
    grupo: '3. Instrução e Técnica',
    tipo: 'util', qtd: 5,
    prorrog: 'Estipulado pelo Relator conforme o e-TCEPE.',
    condicaoProrrog: '',
    obs: 'Prazo concedido pelo Relator; pode variar por processo.',
    mpco: true,
  },
  relatorio_tecnico_gov: {
    label: 'Relatório técnico das contas do governador',
    grupo: '3. Instrução e Técnica',
    tipo: 'corrido', qtd: 45,
    prorrog: 'Sim — solicitação justificada do Relator ao Tribunal Pleno.',
    condicaoProrrog: 'Requer deliberação do Pleno para deferir a extensão.',
    obs: 'Prazo da equipe técnica, contado do recebimento das contas.',
  },

  // ── 4. Deliberação e Julgamento ───────────────────────────────────────────
  parecer_previo_gov: {
    label: 'Parecer prévio — contas do governador',
    grupo: '4. Deliberação e Julgamento',
    tipo: 'corrido', qtd: 60,
    prorrog: 'Sim — pedido justificado do Relator ao Tribunal Pleno.',
    condicaoProrrog: 'Requer deliberação do Pleno para deferir a extensão.',
    obs: 'TCE-PE deve emitir a partir do recebimento das contas.',
  },
  parecer_previo_prefeito: {
    label: 'Parecer prévio — contas dos prefeitos (data-limite anual)',
    grupo: '4. Deliberação e Julgamento',
    tipo: 'fixo_anual', qtd: 0,
    prorrog: 'Não previsto.',
    condicaoProrrog: '',
    obs: 'TCE-PE deve emitir até o último dia útil de dezembro do ano respectivo.',
  },
  voto_plenario_virtual: {
    label: 'Relator — inserir voto no Plenário Virtual',
    grupo: '4. Deliberação e Julgamento',
    tipo: 'horas', qtd: 96,
    prorrog: 'Não — prazo do sistema e-TCEPE.',
    condicaoProrrog: '',
    obs: 'O voto deve ser inserido até 96 horas antes do início da sessão virtual.',
  },
  declaracao_voto_ata: {
    label: 'Conselheiros — declaração de voto / revisão oral (após sessão presencial)',
    grupo: '4. Deliberação e Julgamento',
    tipo: 'horas', qtd: 48,
    prorrog: 'Não previsto.',
    condicaoProrrog: '',
    obs: 'Prazo para apresentar declaração escrita de voto ou corrigir manifestações orais para constar em ata.',
  },
  ata_sessao: {
    label: 'Atas das sessões — submeter à aprovação',
    grupo: '4. Deliberação e Julgamento',
    tipo: 'sessoes', qtd: 3,
    prorrog: 'Não previsto.',
    condicaoProrrog: '',
    obs: 'As atas devem ser submetidas à discussão e aprovação até a 3ª sessão ordinária subsequente.',
  },

  // ── 5. Pautas de Julgamento ───────────────────────────────────────────────
  pauta_relator_presencial: {
    label: 'Relator — entregar lista de processos (sessão presencial)',
    grupo: '5. Pautas de Julgamento',
    tipo: 'corrido', qtd: 6,
    prorrog: 'Não previsto.',
    condicaoProrrog: '',
    obs: 'Antecedência mínima de 6 dias antes da sessão.',
  },
  pauta_publicacao_diario: {
    label: 'Secretaria — publicar pauta no Diário Eletrônico (sessão presencial)',
    grupo: '5. Pautas de Julgamento',
    tipo: 'corrido', qtd: 5,
    prorrog: 'Não previsto.',
    condicaoProrrog: '',
    obs: 'Antecedência mínima de 5 dias antes da sessão presencial.',
  },
  pauta_virtual_inclusao: {
    label: 'Plenário Virtual — incluir processos na pauta (limite: 12h do penúltimo du)',
    grupo: '5. Pautas de Julgamento',
    tipo: 'info', qtd: 0,
    prorrog: '—',
    condicaoProrrog: '',
    obs: 'Os processos devem ser incluídos até as 12h do penúltimo dia útil anterior à disponibilização da pauta. A pauta é publicada no Diário Oficial Eletrônico no primeiro dia útil da semana que antecede a sessão.',
  },

  // ── 6. Sustentação Oral ───────────────────────────────────────────────────
  sustentacao_requerimento: {
    label: 'Sustentação oral — requerimento / envio de arquivo',
    grupo: '6. Sustentação Oral',
    tipo: 'info', qtd: 0,
    prorrog: '—',
    condicaoProrrog: '',
    obs: 'Para o Plenário Virtual: enviar arquivo de áudio ou texto desde a publicação da pauta até o início da sessão. Em sessões presenciais: requerer até o início da sessão.',
  },
  sustentacao_tempo: {
    label: 'Sustentação oral — tempo de fala (15 min + 15 min)',
    grupo: '6. Sustentação Oral',
    tipo: 'info', qtd: 0,
    prorrog: 'Sim — +15 minutos a critério exclusivo do Presidente.',
    condicaoProrrog: 'Prorrogação a critério exclusivo do Presidente do colegiado.',
    obs: 'Tempo padrão: 15 minutos, prorrogáveis por igual período (mais 15 min).',
  },

  // ── 7. Certidões e Quitação ───────────────────────────────────────────────
  pag_debito: {
    label: 'Pagar débitos e multas (após trânsito em julgado)',
    grupo: '7. Certidões e Quitação',
    tipo: 'corrido', qtd: 15,
    prorrog: 'Sim — +15 dias corridos, 1 única vez',
    condicaoProrrog: 'Prorrogação padrão do rito, salvo manifestação em contrário do Relator.',
    obs: 'Prazo contado do trânsito em julgado da decisão.',
  },
  doc_arrecadacao: {
    label: 'Emissão do Documento de Arrecadação pelo ente credor',
    grupo: '7. Certidões e Quitação',
    tipo: 'util', qtd: 3,
    prorrog: 'Não previsto.',
    condicaoProrrog: '',
    obs: 'O ente credor emite em até 3 dias úteis após solicitação.',
  },
  cert_quitacao: {
    label: 'Certidão de Quitação (após comprovação do pagamento)',
    grupo: '7. Certidões e Quitação',
    tipo: 'util', qtd: 2,
    prorrog: 'Não previsto.',
    condicaoProrrog: '',
    obs: 'Emitida em até 2 dias úteis após comprovação do recolhimento.',
  },

  // ── 8. Prestações de Contas ───────────────────────────────────────────────
  contas_exec_camaras: {
    label: 'Envio de contas — Poder Executivo e Câmaras Municipais',
    grupo: '8. Envio de Prestações de Contas',
    tipo: 'fixo_anual', qtd: 0,
    prorrog: 'Não previsto.',
    condicaoProrrog: '',
    obs: 'Prazo fixo: até 31 de março do exercício subsequente.',
  },
  contas_leg_jud_mp: {
    label: 'Envio de contas — Legislativo Estadual, Judiciário e Ministérios Públicos',
    grupo: '8. Envio de Prestações de Contas',
    tipo: 'fixo_anual', qtd: 0,
    prorrog: 'Não previsto.',
    condicaoProrrog: '',
    obs: 'Prazo fixo: até 30 de março do exercício subsequente.',
  },
  contas_adm_fundos: {
    label: 'Envio de contas — Administração Direta, Indireta e Fundos',
    grupo: '8. Envio de Prestações de Contas',
    tipo: 'corrido', qtd: 90,
    prorrog: 'Não previsto.',
    condicaoProrrog: '',
    obs: 'Até 90 dias após o encerramento do exercício financeiro.',
  },

  // ── 9. Prazos Internos — Posse ────────────────────────────────────────────
  int_posse: {
    label: 'Posse de conselheiro / auditor',
    grupo: '9. Prazos Internos TCE-PE',
    tipo: 'corrido', qtd: 90,
    prorrog: 'Sim — até 180 dias (máximo)',
    condicaoProrrog: 'Solicitação escrita do nomeado + aprovação do Tribunal Pleno.',
    obs: 'Prazo contado da publicação da nomeação.',
  },
};

// ─── Helpers de data ──────────────────────────────────────────────────────────

function isFimDeSemana(d) { const w = d.getDay(); return w === 0 || w === 6; }

function proximoDiaUtil(d) {
  const r = new Date(d);
  while (isFimDeSemana(r)) r.setDate(r.getDate() + 1);
  return r;
}

function adicionarDiasUteis(inicio, dias) {
  let d = new Date(inicio), n = 0;
  while (n < dias) { d.setDate(d.getDate() + 1); if (!isFimDeSemana(d)) n++; }
  return proximoDiaUtil(d);
}

function adicionarDiasCorridos(inicio, dias) {
  const d = new Date(inicio);
  d.setDate(d.getDate() + dias);
  return proximoDiaUtil(d);
}

function calcularVencimento(inicio, prazo, qtd) {
  switch (prazo.tipo) {
    case 'util':    return adicionarDiasUteis(inicio, qtd);
    case 'corrido': return adicionarDiasCorridos(inicio, qtd);
    case 'horas': { const d = new Date(inicio); d.setHours(d.getHours() + qtd); return d; }
    case 'anos':  { const d = new Date(inicio); d.setFullYear(d.getFullYear() + qtd); return proximoDiaUtil(d); }
    default: return null;
  }
}

function diasRestantes(venc) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  return Math.ceil((venc - hoje) / 86400000);
}

function fmtData(d) {
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── CSS (injetado uma única vez) ─────────────────────────────────────────────

const CSS_ID = 'cp-module-styles';

function injectStyles() {
  if (document.getElementById(CSS_ID)) return;
  const s = document.createElement('style');
  s.id = CSS_ID;
  s.textContent = `
/* ── Contador de Prazos TCE-PE — prefixo .cp- ── */
.cp-tabs { display:flex; border-bottom:2px solid #dee3ef; margin-bottom:1.25rem; }
.cp-tab {
  background:none; border:none; cursor:pointer;
  padding:8px 16px; font-size:13px; font-weight:500; color:#7a8baa;
  border-bottom:2.5px solid transparent; margin-bottom:-2px;
  transition:color .15s;
}
.cp-tab.active { color:#1e3a6e; border-bottom-color:#1e3a6e; }
.cp-tab:hover  { color:#1e3a6e; }
.cp-panel { display:none; }
.cp-panel.active { display:block; }
.cp-section-label {
  font-size:11px; font-weight:700; letter-spacing:.07em;
  text-transform:uppercase; color:#7a8baa; margin:1.25rem 0 .6rem;
}
/* Form */
.cp-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px; }
.cp-form-grid.one { grid-template-columns:1fr; }
.cp-field { display:flex; flex-direction:column; gap:4px; }
.cp-field label { font-size:12px; font-weight:600; color:#7a8baa; }
.cp-field .form-select, .cp-field .form-control { font-size:13px; color:#1e3a6e; }
.cp-row-mpco { display:none; }
.cp-row-mpco.visible { display:grid; }
.cp-btn-calc {
  width:100%; margin-top:8px; background:#1e3a6e; color:#fff;
  border:none; border-radius:6px; padding:10px; font-size:14px; font-weight:600;
  cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
  transition:background .15s, transform .1s;
}
.cp-btn-calc:hover  { background:#162e58; }
.cp-btn-calc:active { transform:scale(.98); }
/* Resultado */
.cp-result {
  display:none; margin-top:1rem; border:1px solid #dee3ef; border-radius:10px;
  background:#fff; padding:1rem 1.25rem; animation:cp-in .2s ease;
}
.cp-result.show { display:block; }
@keyframes cp-in { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
.cp-result-header { display:flex; align-items:flex-start; gap:12px; margin-bottom:.75rem; }
.cp-result-icon {
  width:42px; height:42px; border-radius:9px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
}
.cp-result-icon.ok     { background:#edf7e6; color:#2d7a1f; }
.cp-result-icon.warn   { background:#fff4e0; color:#9a6200; }
.cp-result-icon.danger { background:#fdecea; color:#b71c1c; }
.cp-result-icon.info   { background:#e8eef9; color:#1e3a6e; }
.cp-result-title { font-size:15px; font-weight:700; color:#1e3a6e; }
.cp-result-sub   { font-size:12px; color:#7a8baa; margin-top:2px; }
.cp-days-big { font-size:34px; font-weight:800; margin:.4rem 0; }
.cp-days-big.ok     { color:#2d7a1f; }
.cp-days-big.warn   { color:#9a6200; }
.cp-days-big.danger { color:#b71c1c; }
.cp-days-big.info   { color:#1e3a6e; font-size:18px; line-height:1.5; }
.cp-detail-row {
  display:flex; justify-content:space-between; align-items:flex-start;
  padding:7px 0; border-top:1px solid #f0f2f7; font-size:13px; gap:10px;
}
.cp-detail-key   { color:#7a8baa; white-space:nowrap; }
.cp-detail-value { font-weight:600; color:#1e3a6e; text-align:right; font-size:12px; }
.cp-obs {
  background:#e8eef9; border-left:3px solid #1e3a6e; border-radius:0 6px 6px 0;
  padding:9px 12px; font-size:12px; color:#1e3a6e; line-height:1.55; margin-top:.75rem;
}
.cp-prorrog-box {
  background:#fff8e8; border-left:3px solid #e07b1a; border-radius:0 6px 6px 0;
  padding:9px 12px; font-size:12px; color:#7a3f00; line-height:1.55; margin-top:.5rem;
}
/* Badges */
.cp-badge { display:inline-block; font-size:11px; font-weight:700; padding:2px 8px; border-radius:99px; }
.cp-badge-util    { background:#dce9fa; color:#1e3a6e; }
.cp-badge-corrido { background:#e6f4ea; color:#2d7a1f; }
.cp-badge-horas   { background:#fff4e0; color:#9a6200; }
.cp-badge-anos    { background:#fdecea; color:#b71c1c; }
.cp-badge-info    { background:#f0f2f7; color:#7a8baa; }
/* Lista de referência */
.cp-ref-list { display:flex; flex-direction:column; gap:6px; }
.cp-ref-item {
  display:flex; justify-content:space-between; align-items:center;
  background:#f4f6fb; border-radius:8px; padding:10px 12px; gap:10px;
}
.cp-ref-name   { font-size:13px; font-weight:600; color:#1e3a6e; }
.cp-ref-detail { font-size:11px; color:#7a8baa; margin-top:2px; line-height:1.4; }
.cp-ref-right  { text-align:right; flex-shrink:0; }
.cp-ref-qty    { font-size:17px; font-weight:800; color:#1e3a6e; }
.cp-ref-unit   { font-size:11px; color:#7a8baa; }
/* Regras */
.cp-rule { background:#f4f6fb; border-radius:8px; padding:12px 14px; margin-bottom:8px; }
.cp-rule-header { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
.cp-rule-title  { font-size:13px; font-weight:700; color:#1e3a6e; }
.cp-rule-body   { font-size:13px; color:#556; line-height:1.6; }
.cp-rule-body strong { color:#1e3a6e; }
/* Prorrogações */
.cp-prorrog-list { display:flex; flex-direction:column; gap:8px; margin-top:.5rem; }
.cp-prorrog-item {
  border:1px solid #dee3ef; border-radius:8px; background:#fff; padding:10px 14px;
}
.cp-prorrog-item-title { font-size:13px; font-weight:700; color:#1e3a6e; margin-bottom:3px; }
.cp-prorrog-item-prazo {
  display:inline-block; font-size:11px; font-weight:700;
  background:#fff8e8; color:#7a3f00; border-radius:99px; padding:2px 8px; margin-bottom:5px;
}
.cp-prorrog-item-body { font-size:12px; color:#556; line-height:1.55; }
/* Anuais */
.cp-anuais { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:.5rem; }
.cp-anual-card { background:#fff; border:1px solid #dee3ef; border-radius:8px; padding:10px 12px; }
.cp-anual-date  { font-size:19px; font-weight:800; color:#1e3a6e; }
.cp-anual-label { font-size:11px; color:#7a8baa; margin-top:2px; line-height:1.4; }
@media(max-width:540px){
  .cp-form-grid { grid-template-columns:1fr; }
  .cp-anuais    { grid-template-columns:1fr; }
}
  `;
  document.head.appendChild(s);
}

// ─── Helpers de renderização ──────────────────────────────────────────────────

function badge(tipo) {
  const map = {
    util:       ['cp-badge-util',    'dias úteis'],
    corrido:    ['cp-badge-corrido', 'dias corridos'],
    horas:      ['cp-badge-horas',   'horas'],
    anos:       ['cp-badge-anos',    'anos'],
    fixo_anual: ['cp-badge-info',    'data fixa'],
    sessoes:    ['cp-badge-info',    'sessões'],
    info:       ['cp-badge-info',    'ver obs.'],
  };
  const [cls, lbl] = map[tipo] || ['cp-badge-info', tipo];
  return `<span class="cp-badge ${cls}">${lbl}</span>`;
}

function statusClass(rem) { return rem > 10 ? 'ok' : rem > 0 ? 'warn' : 'danger'; }

// Tipos que não têm cálculo de data
const TIPOS_INFO = new Set(['fixo_anual', 'sessoes', 'info']);

// ─── Construção do HTML ───────────────────────────────────────────────────────

function buildSelectOptions() {
  const grupos = {};
  Object.entries(PRAZOS_DB).forEach(([k, p]) => {
    (grupos[p.grupo] = grupos[p.grupo] || []).push({ k, label: p.label });
  });
  return Object.entries(grupos).map(([g, items]) =>
    `<optgroup label="${g}">${items.map(i =>
      `<option value="${i.k}">${i.label}</option>`
    ).join('')}</optgroup>`
  ).join('');
}

function buildRefHTML() {
  const grupos = {};
  Object.entries(PRAZOS_DB).forEach(([k, p]) => {
    (grupos[p.grupo] = grupos[p.grupo] || []).push({ k, ...p });
  });
  return Object.entries(grupos).map(([g, items]) => `
    <div class="cp-section-label">${g}</div>
    <div class="cp-ref-list">
      ${items.map(p => {
        const qty = TIPOS_INFO.has(p.tipo) ? '—'
          : p.tipo === 'anos'  ? `${p.qtd}a`
          : p.tipo === 'horas' ? `${p.qtd}h`
          : `${p.qtd}d`;
        const unit = TIPOS_INFO.has(p.tipo) ? 'ver obs.'
          : p.tipo === 'anos'    ? 'anos'
          : p.tipo === 'horas'   ? 'horas'
          : p.tipo === 'util'    ? 'úteis'
          : 'corridos';
        const prorrogTxt = p.prorrog && p.prorrog !== 'Não previsto.' && p.prorrog !== '—'
          ? ` · <em>Prorrog.: ${p.prorrog}</em>` : '';
        return `
          <div class="cp-ref-item">
            <div>
              <div class="cp-ref-name">${p.label}</div>
              <div class="cp-ref-detail">${badge(p.tipo)}${prorrogTxt}</div>
              ${p.obs ? `<div class="cp-ref-detail" style="margin-top:3px">${p.obs}</div>` : ''}
            </div>
            <div class="cp-ref-right">
              <div class="cp-ref-qty">${qty}</div>
              <div class="cp-ref-unit">${unit}</div>
            </div>
          </div>`;
      }).join('')}
    </div>`
  ).join('');
}

function buildHTML(uid) {
  return `
  <div class="cp-tabs" role="tablist">
    <button class="cp-tab active" onclick="cpTab_${uid}('calc')">Calcular prazo</button>
    <button class="cp-tab"        onclick="cpTab_${uid}('ref')">Tabela de prazos</button>
    <button class="cp-tab"        onclick="cpTab_${uid}('regras')">Regras e prorrogações</button>
  </div>

  <!-- CALCULAR -->
  <div class="cp-panel active" id="cp-panel-calc-${uid}">
    <div class="cp-section-label">Configurar cálculo</div>
    <div class="cp-form-grid">
      <div class="cp-field">
        <label for="cp-tipo-${uid}">Tipo de prazo</label>
        <select id="cp-tipo-${uid}" class="form-select" onchange="cpOnTipo_${uid}()">
          ${buildSelectOptions()}
        </select>
      </div>
      <div class="cp-field">
        <label for="cp-data-${uid}">Data inicial (notificação / publicação)</label>
        <input type="date" id="cp-data-${uid}" class="form-control" />
      </div>
    </div>
    <div class="cp-form-grid one cp-row-mpco" id="cp-row-mpco-${uid}">
      <div class="cp-field">
        <label for="cp-mpco-${uid}">É Ministério Público de Contas (MPCO)?</label>
        <select id="cp-mpco-${uid}" class="form-select">
          <option value="0">Não</option>
          <option value="1">Sim — prazo em dobro</option>
        </select>
      </div>
    </div>
    <button class="cp-btn-calc" onclick="cpCalc_${uid}()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <rect x="4" y="2" width="16" height="20" rx="2"/>
        <line x1="8" y1="7" x2="16" y2="7"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
        <line x1="8" y1="17" x2="12" y2="17"/>
      </svg>
      Calcular prazo
    </button>
    <div class="cp-result" id="cp-result-${uid}">
      <div class="cp-result-header">
        <div class="cp-result-icon" id="cp-icon-${uid}"></div>
        <div>
          <div class="cp-result-title" id="cp-title-${uid}"></div>
          <div class="cp-result-sub"   id="cp-sub-${uid}"></div>
        </div>
      </div>
      <div class="cp-days-big" id="cp-days-${uid}"></div>
      <div id="cp-rows-${uid}"></div>
      <div class="cp-prorrog-box" id="cp-prorrog-${uid}" style="display:none"></div>
      <div class="cp-obs"         id="cp-obs-${uid}"     style="display:none"></div>
    </div>
  </div>

  <!-- TABELA -->
  <div class="cp-panel" id="cp-panel-ref-${uid}">
    ${buildRefHTML()}
  </div>

  <!-- REGRAS E PRORROGAÇÕES -->
  <div class="cp-panel" id="cp-panel-regras-${uid}">

    <div class="cp-section-label">Regra geral de contagem</div>
    <div class="cp-rule">
      <div class="cp-rule-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a6e" stroke-width="2" stroke-linecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span class="cp-rule-title">Finais de semana e feriados — prorrogação automática</span>
      </div>
      <p class="cp-rule-body">Em qualquer contagem processual, se o dia de início ou de vencimento cair em sábado, domingo, feriado ou dia de suspensão (total ou parcial) do expediente no Tribunal, o prazo é <strong>automaticamente prorrogado até o primeiro dia útil seguinte</strong>.</p>
    </div>
    <div class="cp-rule">
      <div class="cp-rule-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9a6200" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span class="cp-rule-title">Dias úteis vs. dias corridos</span>
      </div>
      <p class="cp-rule-body"><strong>Dias úteis</strong> (seg–sex, excluindo feriados): a maioria dos prazos de defesa e recursos. <strong>Dias corridos</strong>: correm sem pausa nos fins de semana (ex.: pagamento de débitos, relatório do governador). <strong>Horas</strong> e <strong>anos</strong>: contagem contínua.</p>
    </div>
    <div class="cp-rule">
      <div class="cp-rule-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b71c1c" stroke-width="2" stroke-linecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <circle cx="12" cy="17" r=".5" fill="#b71c1c"/>
        </svg>
        <span class="cp-rule-title">MPCO — prazos em dobro</span>
      </div>
      <p class="cp-rule-body">O Ministério Público de Contas dispõe de <strong>prazos em dobro</strong> para interpor recursos (Recurso Ordinário, Embargos, Agravo) e emitir pareceres. Use a opção "MPCO — prazo em dobro" na calculadora para obter o prazo correto.</p>
    </div>

    <div class="cp-section-label" style="margin-top:1.5rem">Regras de prorrogação detalhadas</div>
    <div class="cp-prorrog-list">

      <div class="cp-prorrog-item">
        <div class="cp-prorrog-item-title">1. Defesa Prévia (regra geral — 30 du)</div>
        <div class="cp-prorrog-item-prazo">+15 dias úteis — 1 única vez</div>
        <p class="cp-prorrog-item-body">O pedido deve ser feito <strong>dentro do prazo ordinário original</strong>, de forma <strong>motivada e justificada</strong>. Se deferido, o novo prazo começa a correr do último dia do prazo inicial ou da data do deferimento — <em>o que ocorrer por último</em>.</p>
      </div>

      <div class="cp-prorrog-item">
        <div class="cp-prorrog-item-title">2. Sustentação Oral</div>
        <div class="cp-prorrog-item-prazo">+15 minutos — a critério do Presidente</div>
        <p class="cp-prorrog-item-body">O tempo padrão é de 15 minutos. A prorrogação por igual período fica a <strong>critério exclusivo do Presidente do colegiado</strong>.</p>
      </div>

      <div class="cp-prorrog-item">
        <div class="cp-prorrog-item-title">3. Pagamento de Débitos e Multas</div>
        <div class="cp-prorrog-item-prazo">+15 dias corridos — 1 única vez</div>
        <p class="cp-prorrog-item-body">A extensão é padrão do rito (incide automaticamente), <strong>salvo manifestação em contrário do Relator</strong>. Não é necessário pedido formal da parte para a primeira prorrogação.</p>
      </div>

      <div class="cp-prorrog-item">
        <div class="cp-prorrog-item-title">4. Parecer Prévio e Relatório das Contas do Governador</div>
        <div class="cp-prorrog-item-prazo">Extensão por deliberação do Pleno</div>
        <p class="cp-prorrog-item-body">Requer <strong>solicitação justificada do Relator</strong> submetida ao <strong>Tribunal Pleno</strong> para deliberação. Não há limite máximo expresso no Regimento.</p>
      </div>

      <div class="cp-prorrog-item">
        <div class="cp-prorrog-item-title">5. Posse de Conselheiro / Auditor</div>
        <div class="cp-prorrog-item-prazo">De 90 até no máximo 180 dias</div>
        <p class="cp-prorrog-item-body">Requer <strong>solicitação escrita do nomeado</strong> e <strong>aprovação do Tribunal Pleno</strong>. O prazo máximo total (incluindo a prorrogação) não pode superar 180 dias contados da publicação da nomeação.</p>
      </div>

    </div>

    <div class="cp-section-label" style="margin-top:1.5rem">Datas anuais fixas de prestação de contas</div>
    <div class="cp-anuais">
      <div class="cp-anual-card">
        <div class="cp-anual-date">31/03</div>
        <div class="cp-anual-label">Poder Executivo e Câmaras Municipais</div>
      </div>
      <div class="cp-anual-card">
        <div class="cp-anual-date">30/03</div>
        <div class="cp-anual-label">Legislativo Estadual, Judiciário e Ministérios Públicos</div>
      </div>
      <div class="cp-anual-card">
        <div class="cp-anual-date">90 dias</div>
        <div class="cp-anual-label">Adm. Direta, Indireta e Fundos — após encerramento do exercício</div>
      </div>
      <div class="cp-anual-card">
        <div class="cp-anual-date">Últ. du</div>
        <div class="cp-anual-label">Parecer prévio dos prefeitos — TCE-PE emite até o último dia útil de dezembro</div>
      </div>
    </div>

  </div>`;
}

// ─── Lógica de UI ─────────────────────────────────────────────────────────────

function wireUI(uid) {

  window[`cpTab_${uid}`] = (name) => {
    const tabs   = document.querySelectorAll(`#cp-root-${uid} .cp-tab`);
    const panels = document.querySelectorAll(`#cp-root-${uid} .cp-panel`);
    const names  = ['calc', 'ref', 'regras'];
    tabs.forEach((t, i) => t.classList.toggle('active', names[i] === name));
    panels.forEach(p => p.classList.remove('active'));
    document.getElementById(`cp-panel-${name}-${uid}`).classList.add('active');
  };

  window[`cpOnTipo_${uid}`] = () => {
    const key = document.getElementById(`cp-tipo-${uid}`).value;
    const row = document.getElementById(`cp-row-mpco-${uid}`);
    row.classList.toggle('visible', !!PRAZOS_DB[key]?.mpco);
  };

  window[`cpCalc_${uid}`] = () => {
    const key     = document.getElementById(`cp-tipo-${uid}`).value;
    const dataStr = document.getElementById(`cp-data-${uid}`).value;
    if (!dataStr) { alert('Informe a data inicial.'); return; }

    const p      = PRAZOS_DB[key];
    const inicio = new Date(dataStr + 'T12:00:00');
    const mpco   = p.mpco && document.getElementById(`cp-mpco-${uid}`).value === '1';
    const qtd    = p.qtd * (mpco ? 2 : 1);

    const resultEl   = document.getElementById(`cp-result-${uid}`);
    const iconEl     = document.getElementById(`cp-icon-${uid}`);
    const titleEl    = document.getElementById(`cp-title-${uid}`);
    const subEl      = document.getElementById(`cp-sub-${uid}`);
    const daysEl     = document.getElementById(`cp-days-${uid}`);
    const rowsEl     = document.getElementById(`cp-rows-${uid}`);
    const prorrogEl  = document.getElementById(`cp-prorrog-${uid}`);
    const obsEl      = document.getElementById(`cp-obs-${uid}`);

    titleEl.textContent = p.label + (mpco ? ' (MPCO — dobro)' : '');

    // Tipos sem cálculo de data
    if (TIPOS_INFO.has(p.tipo)) {
      iconEl.className  = 'cp-result-icon info';
      iconEl.innerHTML  = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
      subEl.textContent = 'Prazo de referência — sem cálculo de data';
      daysEl.className  = 'cp-days-big info';
      daysEl.textContent = '';
      rowsEl.innerHTML  = '';
      prorrogEl.style.display = 'none';
      obsEl.textContent = p.obs;
      obsEl.style.display = 'block';
      resultEl.classList.add('show');
      return;
    }

    const venc = calcularVencimento(inicio, p, qtd);
    const rem  = diasRestantes(venc);
    const st   = statusClass(rem);

    const icones = {
      ok:     `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`,
      warn:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>`,
      danger: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    };

    const subTipo = p.tipo === 'horas' ? `Prazo de ${qtd} horas contínuas`
                  : p.tipo === 'anos'  ? `Prazo de ${qtd} ano${qtd > 1 ? 's' : ''}`
                  : `Prazo de ${qtd} ${p.tipo === 'util' ? 'dias úteis' : 'dias corridos'}`;

    let daysText;
    if      (rem > 0)   daysText = rem === 1 ? '1 dia restante' : `${rem} dias restantes`;
    else if (rem === 0) daysText = 'Vence hoje!';
    else                daysText = `Vencido há ${Math.abs(rem)} dia${Math.abs(rem) === 1 ? '' : 's'}`;

    iconEl.className  = `cp-result-icon ${st}`;
    iconEl.innerHTML  = icones[st];
    subEl.textContent = subTipo;
    daysEl.textContent = daysText;
    daysEl.className  = `cp-days-big ${st}`;

    rowsEl.innerHTML = `
      <div class="cp-detail-row">
        <span class="cp-detail-key">Data inicial</span>
        <span class="cp-detail-value">${fmtData(inicio)}</span>
      </div>
      <div class="cp-detail-row">
        <span class="cp-detail-key">Data de vencimento</span>
        <span class="cp-detail-value">${fmtData(venc)}</span>
      </div>
      <div class="cp-detail-row">
        <span class="cp-detail-key">Tipo de contagem</span>
        <span class="cp-detail-value">${badge(p.tipo)}</span>
      </div>
      <div class="cp-detail-row">
        <span class="cp-detail-key">Prorrogação</span>
        <span class="cp-detail-value">${p.prorrog}</span>
      </div>`;

    if (p.condicaoProrrog) {
      prorrogEl.innerHTML = `<strong>Condição de prorrogação:</strong> ${p.condicaoProrrog}`;
      prorrogEl.style.display = 'block';
    } else {
      prorrogEl.style.display = 'none';
    }

    if (p.obs) { obsEl.textContent = p.obs; obsEl.style.display = 'block'; }
    else         obsEl.style.display = 'none';

    resultEl.classList.add('show');
  };

  // Data padrão = hoje
  document.getElementById(`cp-data-${uid}`).value = new Date().toISOString().split('T')[0];
  window[`cpOnTipo_${uid}`]();
}

// ─── Exportação pública (padrão do projeto) ───────────────────────────────────

/**
 * @param {HTMLElement} container — #moduleContainer do index.html
 * @returns {{ destroy: () => void }}
 */
export function mount(container) {
  if (!container) return { destroy: () => {} };
  injectStyles();

  const uid     = Math.random().toString(36).slice(2, 7);
  const wrapper = document.createElement('div');
  wrapper.id    = `cp-root-${uid}`;
  wrapper.innerHTML = buildHTML(uid);
  container.innerHTML = '';
  container.appendChild(wrapper);
  wireUI(uid);

  return {
    destroy() {
      delete window[`cpTab_${uid}`];
      delete window[`cpOnTipo_${uid}`];
      delete window[`cpCalc_${uid}`];
      container.innerHTML = '';
    },
  };
}