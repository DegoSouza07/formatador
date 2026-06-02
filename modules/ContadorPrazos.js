/**
 * contadorPrazos.js
 * Módulo: Contador de Prazos TCE-PE
 * Diretoria de Julgamento — Assistente de Trabalho
 *
 * Padrão de integração (igual aos outros módulos):
 *
 *   // em app.js — registrar no select
 *   import { meta as contadorPrazosMeta, init as initContadorPrazos }
 *     from './modules/contadorPrazos.js';
 *
 *   // na lista de módulos disponíveis
 *   const modulos = [
 *     ...outrosModulos,
 *     { value: 'contadorPrazos', label: contadorPrazosMeta.label },
 *   ];
 *
 *   // no handler do select (switch/case ou mapa)
 *   case 'contadorPrazos':
 *     initContadorPrazos(moduleContainer);
 *     break;
 */

// ─── Metadados do módulo (mesmo padrão dos outros módulos) ────────────────────

export const meta = {
  value: 'contadorPrazos',
  label: 'Contador de Prazos',
};

// ─── Base de dados ────────────────────────────────────────────────────────────

const PRAZOS_DB = {
  defesa_geral: {
    label: 'Defesa prévia — geral',
    grupo: 'Defesas e respostas',
    tipo: 'util', qtd: 30,
    prorrog: '15 dias úteis (solicitar antes do vencimento)',
    obs: 'O pedido deve ser feito antes do prazo original acabar, com justificativa.',
    mpco: true,
  },
  defesa_fiscal: {
    label: 'Defesa em gestão fiscal / auto de infração',
    grupo: 'Defesas e respostas',
    tipo: 'util', qtd: 5,
    prorrog: 'Não há previsão de prorrogação.',
    obs: '',
  },
  defesa_destaque: {
    label: 'Defesa em processo de destaque',
    grupo: 'Defesas e respostas',
    tipo: 'horas', qtd: 48,
    prorrog: 'Não — improrrogável.',
    obs: 'Prazo rígido de 48 horas contínuas.',
  },
  manifestacao_gov: {
    label: 'Manifestação do governador',
    grupo: 'Defesas e respostas',
    tipo: 'util', qtd: 30,
    prorrog: 'Não especificado.',
    obs: '',
  },
  rec_ordinario: {
    label: 'Recurso ordinário',
    grupo: 'Recursos',
    tipo: 'util', qtd: 30,
    prorrog: '—',
    obs: 'Contado a partir da publicação da decisão.',
    mpco: true,
  },
  rec_embargos: {
    label: 'Embargos de declaração',
    grupo: 'Recursos',
    tipo: 'util', qtd: 5,
    prorrog: '—',
    obs: 'Contado da publicação da decisão.',
    mpco: true,
  },
  rec_agravo: {
    label: 'Agravo — padrão',
    grupo: 'Recursos',
    tipo: 'util', qtd: 5,
    prorrog: '—',
    obs: '',
    mpco: true,
  },
  rec_agravo_pres: {
    label: 'Agravo contra o presidente',
    grupo: 'Recursos',
    tipo: 'corrido', qtd: 15,
    prorrog: '—',
    obs: 'Para atos administrativos do Presidente enviados ao Plenário.',
  },
  rec_agravo_vice: {
    label: 'Agravo contra o vice-presidente',
    grupo: 'Recursos',
    tipo: 'util', qtd: 15,
    prorrog: '—',
    obs: 'Contra rejeição de pedido de rescisão.',
  },
  rec_rescisao: {
    label: 'Pedido de rescisão',
    grupo: 'Recursos',
    tipo: 'anos', qtd: 2,
    prorrog: '—',
    obs: 'Após a decisão se tornar definitiva (não cabe mais recurso).',
  },
  pag_debito: {
    label: 'Pagar débitos e multas',
    grupo: 'Pagamentos e certidões',
    tipo: 'corrido', qtd: 15,
    prorrog: '+15 dias (uma única vez)',
    obs: 'O prazo pode ser dobrado uma única vez, mediante pedido.',
  },
  cert_quitacao: {
    label: 'Certidão de quitação (nada consta)',
    grupo: 'Pagamentos e certidões',
    tipo: 'util', qtd: 2,
    prorrog: '—',
    obs: 'Emitida após comprovação do pagamento.',
  },
  doc_arrecadacao: {
    label: 'Boleto de arrecadação',
    grupo: 'Pagamentos e certidões',
    tipo: 'util', qtd: 3,
    prorrog: '—',
    obs: 'O órgão credor emite em até 3 dias úteis após a condenação.',
  },
  int_relatorio_gov: {
    label: 'Relatório de contas do governador',
    grupo: 'Prazos internos TCE-PE',
    tipo: 'corrido', qtd: 45,
    prorrog: 'Sim — Relator solicita ao Tribunal Pleno.',
    obs: '',
  },
  int_parecer_gov: {
    label: 'Parecer prévio — contas do governador',
    grupo: 'Prazos internos TCE-PE',
    tipo: 'corrido', qtd: 60,
    prorrog: 'Sim — pedido justificado ao Tribunal Pleno.',
    obs: '',
  },
  int_mpco_geral: {
    label: 'MPCO — parecer geral (recursos/rescisões)',
    grupo: 'Prazos internos TCE-PE',
    tipo: 'corrido', qtd: 60,
    prorrog: 'Regulamento padrão.',
    obs: '',
  },
  int_mpco_consultas: {
    label: 'MPCO — consultas relevantes',
    grupo: 'Prazos internos TCE-PE',
    tipo: 'corrido', qtd: 45,
    prorrog: 'Regulamento padrão.',
    obs: '',
  },
  int_mpco_gov: {
    label: 'MPCO — parecer nas contas do governador',
    grupo: 'Prazos internos TCE-PE',
    tipo: 'util', qtd: 5,
    prorrog: 'Estipulado pelo Relator.',
    obs: '',
  },
  int_relator_virtual: {
    label: 'Relator — voto no Plenário Virtual',
    grupo: 'Prazos internos TCE-PE',
    tipo: 'horas', qtd: 96,
    prorrog: '—',
    obs: '96 horas antes da sessão — prazo do sistema e-TCEPE.',
  },
  int_relator_presencial: {
    label: 'Relator — lista de processos (sessão presencial)',
    grupo: 'Prazos internos TCE-PE',
    tipo: 'corrido', qtd: 6,
    prorrog: '—',
    obs: 'Antecedência mínima de 6 dias.',
  },
  int_secretaria_pauta: {
    label: 'Secretaria — publicar pauta no Diário Eletrônico',
    grupo: 'Prazos internos TCE-PE',
    tipo: 'corrido', qtd: 5,
    prorrog: '—',
    obs: 'Antecedência mínima de 5 dias.',
  },
  int_conselheiros_voto: {
    label: 'Conselheiros — entregar voto escrito / corrigir fala',
    grupo: 'Prazos internos TCE-PE',
    tipo: 'horas', qtd: 48,
    prorrog: '—',
    obs: 'Até 48 horas após a sessão presencial, para constar em ata.',
  },
  int_posse: {
    label: 'Posse de conselheiro / auditor',
    grupo: 'Prazos internos TCE-PE',
    tipo: 'corrido', qtd: 90,
    prorrog: 'Até 180 dias (aprovação do Plenário)',
    obs: 'Contado a partir da nomeação.',
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
    default: return new Date(inicio);
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
/* ── Contador de Prazos — estilos isolados com prefixo .cp- ── */
.cp-tabs { display:flex; border-bottom:2px solid #dee3ef; margin-bottom:1.25rem; gap:0; }
.cp-tab {
  background:none; border:none; cursor:pointer;
  padding:8px 18px; font-size:13px; font-weight:500; color:#7a8baa;
  border-bottom:2.5px solid transparent; margin-bottom:-2px;
  transition:color .15s;
}
.cp-tab.active { color:#1e3a6e; border-bottom-color:#1e3a6e; }
.cp-tab:hover  { color:#1e3a6e; }

.cp-panel { display:none; }
.cp-panel.active { display:block; }

.cp-section-label {
  font-size:11px; font-weight:700; letter-spacing:.07em;
  text-transform:uppercase; color:#7a8baa;
  margin:1.25rem 0 .6rem;
}

/* Formulário */
.cp-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px; }
.cp-form-grid.one { grid-template-columns:1fr; }
.cp-field { display:flex; flex-direction:column; gap:4px; }
.cp-field label { font-size:12px; font-weight:600; color:#7a8baa; }
.cp-field .form-select,
.cp-field .form-control { font-size:13px; color:#1e3a6e; }
.cp-row-mpco { display:none; }
.cp-row-mpco.visible { display:grid; }

.cp-btn-calc {
  width:100%; margin-top:8px;
  background:#1e3a6e; color:#fff;
  border:none; border-radius:6px;
  padding:10px; font-size:14px; font-weight:600;
  cursor:pointer; display:flex; align-items:center;
  justify-content:center; gap:8px;
  transition:background .15s, transform .1s;
}
.cp-btn-calc:hover  { background:#162e58; }
.cp-btn-calc:active { transform:scale(.98); }

/* Card de resultado */
.cp-result {
  display:none; margin-top:1rem;
  border:1px solid #dee3ef; border-radius:10px;
  background:#fff; padding:1rem 1.25rem;
  animation:cp-in .2s ease;
}
.cp-result.show { display:block; }
@keyframes cp-in { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

.cp-result-header { display:flex; align-items:flex-start; gap:12px; margin-bottom:.75rem; }
.cp-result-icon {
  width:42px; height:42px; border-radius:9px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; font-size:20px;
}
.cp-result-icon.ok     { background:#edf7e6; color:#2d7a1f; }
.cp-result-icon.warn   { background:#fff4e0; color:#9a6200; }
.cp-result-icon.danger { background:#fdecea; color:#b71c1c; }
.cp-result-title { font-size:15px; font-weight:700; color:#1e3a6e; }
.cp-result-sub   { font-size:12px; color:#7a8baa; margin-top:2px; }

.cp-days-big { font-size:34px; font-weight:800; margin:.4rem 0; }
.cp-days-big.ok     { color:#2d7a1f; }
.cp-days-big.warn   { color:#9a6200; }
.cp-days-big.danger { color:#b71c1c; }

.cp-detail-row {
  display:flex; justify-content:space-between; align-items:center;
  padding:7px 0; border-top:1px solid #f0f2f7; font-size:13px;
}
.cp-detail-key   { color:#7a8baa; }
.cp-detail-value { font-weight:600; color:#1e3a6e; text-align:right; max-width:270px; font-size:12px; }

.cp-obs {
  background:#e8eef9; border-left:3px solid #1e3a6e;
  border-radius:0 6px 6px 0; padding:9px 12px;
  font-size:12px; color:#1e3a6e; line-height:1.55; margin-top:.75rem;
}

/* Badges */
.cp-badge {
  display:inline-block; font-size:11px; font-weight:700;
  padding:2px 8px; border-radius:99px;
}
.cp-badge-util    { background:#dce9fa; color:#1e3a6e; }
.cp-badge-corrido { background:#e6f4ea; color:#2d7a1f; }
.cp-badge-horas   { background:#fff4e0; color:#9a6200; }
.cp-badge-anos    { background:#fdecea; color:#b71c1c; }

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
.cp-rule {
  background:#f4f6fb; border-radius:8px;
  padding:12px 14px; margin-bottom:8px;
}
.cp-rule-header { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
.cp-rule-title  { font-size:13px; font-weight:700; color:#1e3a6e; }
.cp-rule-body   { font-size:13px; color:#7a8baa; line-height:1.55; }

/* Anuais */
.cp-anuais { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:.5rem; }
.cp-anual-card {
  background:#fff; border:1px solid #dee3ef;
  border-radius:8px; padding:10px 12px;
}
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
    util:    ['cp-badge-util',    'dias úteis'],
    corrido: ['cp-badge-corrido', 'dias corridos'],
    horas:   ['cp-badge-horas',   'horas'],
    anos:    ['cp-badge-anos',    'anos'],
  };
  const [cls, lbl] = map[tipo] || ['', tipo];
  return `<span class="cp-badge ${cls}">${lbl}</span>`;
}

function statusClass(rem) {
  return rem > 10 ? 'ok' : rem > 0 ? 'warn' : 'danger';
}

// ─── Monta HTML do módulo ─────────────────────────────────────────────────────

function buildSelectOptions() {
  const grupos = {};
  Object.entries(PRAZOS_DB).forEach(([k, p]) => {
    (grupos[p.grupo] = grupos[p.grupo] || []).push({ k, label: p.label });
  });
  return Object.entries(grupos).map(([g, items]) =>
    `<optgroup label="${g}">${items.map(i => `<option value="${i.k}">${i.label}</option>`).join('')}</optgroup>`
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
        const qty  = p.tipo === 'anos' ? `${p.qtd}a` : p.tipo === 'horas' ? `${p.qtd}h` : `${p.qtd}d`;
        const unit = p.tipo === 'anos' ? 'anos' : p.tipo === 'horas' ? 'horas' : p.tipo === 'util' ? 'úteis' : 'corridos';
        const ext  = p.prorrog && p.prorrog !== '—' ? ` · Prorrog.: ${p.prorrog}` : '';
        return `
          <div class="cp-ref-item">
            <div>
              <div class="cp-ref-name">${p.label}</div>
              <div class="cp-ref-detail">${badge(p.tipo)}${ext}</div>
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
    <button class="cp-tab"        onclick="cpTab_${uid}('regras')">Regras gerais</button>
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
      <div class="cp-obs" id="cp-obs-${uid}" style="display:none"></div>
    </div>
  </div>

  <!-- TABELA -->
  <div class="cp-panel" id="cp-panel-ref-${uid}">
    ${buildRefHTML()}
  </div>

  <!-- REGRAS -->
  <div class="cp-panel" id="cp-panel-regras-${uid}">
    <div class="cp-section-label">3 regras de ouro</div>
    <div class="cp-rule">
      <div class="cp-rule-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a6e" stroke-width="2" stroke-linecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span class="cp-rule-title">Finais de semana e feriados</span>
      </div>
      <p class="cp-rule-body">Se o prazo vencer em sábado, domingo ou feriado, avança automaticamente para o próximo dia útil.</p>
    </div>
    <div class="cp-rule">
      <div class="cp-rule-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9a6200" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span class="cp-rule-title">Dias úteis vs. dias corridos</span>
      </div>
      <p class="cp-rule-body">Defesas e recursos contam <strong>dias úteis</strong> (seg–sex, excluindo feriados). Prazos em horas ou anos correm continuamente, sem pausar nos fins de semana.</p>
    </div>
    <div class="cp-rule">
      <div class="cp-rule-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b71c1c" stroke-width="2" stroke-linecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r=".5" fill="#b71c1c"/>
        </svg>
        <span class="cp-rule-title">Peça prorrogação antes do vencimento</span>
      </div>
      <p class="cp-rule-body">Prazos prorrogáveis exigem pedido <strong>antes</strong> do prazo original terminar. Pedido após o vencimento não será aceito.</p>
    </div>

    <div class="cp-section-label" style="margin-top:1.5rem">Datas anuais fixas</div>
    <div class="cp-anuais">
      <div class="cp-anual-card">
        <div class="cp-anual-date">31/03</div>
        <div class="cp-anual-label">Prefeitos e câmaras municipais — entrega de contas</div>
      </div>
      <div class="cp-anual-card">
        <div class="cp-anual-date">30/03</div>
        <div class="cp-anual-label">Deputados, juízes e MP — entrega de contas</div>
      </div>
      <div class="cp-anual-card">
        <div class="cp-anual-date">90 dias</div>
        <div class="cp-anual-label">Gov. direta/indireta e fundos — após fim do ano financeiro</div>
      </div>
      <div class="cp-anual-card">
        <div class="cp-anual-date">Últ. du</div>
        <div class="cp-anual-label">Parecer prévio de prefeitos — TCE-PE emite até o último dia útil de dezembro</div>
      </div>
    </div>
  </div>`;
}

// ─── Lógica de UI (funções nomeadas com uid para evitar conflito global) ───────

function wireUI(uid) {
  // Troca de abas
  window[`cpTab_${uid}`] = (name) => {
    const tabs   = document.querySelectorAll(`#cp-root-${uid} .cp-tab`);
    const panels = document.querySelectorAll(`#cp-root-${uid} .cp-panel`);
    const names  = ['calc', 'ref', 'regras'];
    tabs.forEach((t, i) => t.classList.toggle('active', names[i] === name));
    panels.forEach(p => p.classList.remove('active'));
    document.getElementById(`cp-panel-${name}-${uid}`).classList.add('active');
  };

  // Mostra/esconde campo MPCO
  window[`cpOnTipo_${uid}`] = () => {
    const key = document.getElementById(`cp-tipo-${uid}`).value;
    const row = document.getElementById(`cp-row-mpco-${uid}`);
    row.classList.toggle('visible', !!PRAZOS_DB[key]?.mpco);
  };

  // Cálculo
  window[`cpCalc_${uid}`] = () => {
    const key     = document.getElementById(`cp-tipo-${uid}`).value;
    const dataStr = document.getElementById(`cp-data-${uid}`).value;
    if (!dataStr) { alert('Informe a data inicial.'); return; }

    const p      = PRAZOS_DB[key];
    const inicio = new Date(dataStr + 'T12:00:00');
    const mpco   = p.mpco && document.getElementById(`cp-mpco-${uid}`).value === '1';
    const qtd    = p.qtd * (mpco ? 2 : 1);
    const venc   = calcularVencimento(inicio, p, qtd);
    const rem    = diasRestantes(venc);
    const st     = statusClass(rem);

    const icones = {
      ok:     `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`,
      warn:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>`,
      danger: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    };

    const subTipo = p.tipo === 'horas'  ? `Prazo de ${qtd} horas contínuas`
                  : p.tipo === 'anos'   ? `Prazo de ${qtd} ano${qtd > 1 ? 's' : ''}`
                  : `Prazo de ${qtd} ${p.tipo === 'util' ? 'dias úteis' : 'dias corridos'}`;

    let daysText;
    if      (rem > 0)  daysText = rem === 1 ? '1 dia restante' : `${rem} dias restantes`;
    else if (rem === 0) daysText = 'Vence hoje!';
    else               daysText = `Vencido há ${Math.abs(rem)} dia${Math.abs(rem) === 1 ? '' : 's'}`;

    const rows = `
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

    // Atualiza DOM
    const icon = document.getElementById(`cp-icon-${uid}`);
    icon.className = `cp-result-icon ${st}`;
    icon.innerHTML = icones[st];
    document.getElementById(`cp-title-${uid}`).textContent = p.label + (mpco ? ' (MPCO — dobro)' : '');
    document.getElementById(`cp-sub-${uid}`).textContent   = subTipo;
    const daysEl = document.getElementById(`cp-days-${uid}`);
    daysEl.textContent = daysText;
    daysEl.className   = `cp-days-big ${st}`;
    document.getElementById(`cp-rows-${uid}`).innerHTML = rows;
    const obsEl = document.getElementById(`cp-obs-${uid}`);
    if (p.obs) { obsEl.textContent = p.obs; obsEl.style.display = 'block'; }
    else          obsEl.style.display = 'none';
    document.getElementById(`cp-result-${uid}`).classList.add('show');
  };

  // Data padrão = hoje
  document.getElementById(`cp-data-${uid}`).value = new Date().toISOString().split('T')[0];
  window[`cpOnTipo_${uid}`]();
}

// ─── Exportação pública ───────────────────────────────────────────────────────

/**
 * Monta o módulo Contador de Prazos no container informado.
 * Segue o padrão do projeto: export function mount(container) + retorna { destroy }
 *
 * @param {HTMLElement} container — o #moduleContainer do index.html
 * @returns {{ destroy: () => void }}
 */
export function mount(container) {
  if (!container) return { destroy: () => {} };
  injectStyles();

  // uid garante que múltiplas instâncias não conflitem
  const uid = Math.random().toString(36).slice(2, 7);

  const wrapper = document.createElement('div');
  wrapper.id = `cp-root-${uid}`;
  wrapper.innerHTML = buildHTML(uid);
  container.innerHTML = '';
  container.appendChild(wrapper);

  wireUI(uid);

  return {
    destroy() {
      // Limpa funções globais registradas para este uid
      delete window[`cpTab_${uid}`];
      delete window[`cpOnTipo_${uid}`];
      delete window[`cpCalc_${uid}`];
      container.innerHTML = '';
    },
  };
}