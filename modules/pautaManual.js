/* global docx, saveAs */

import {
  readFirstSheetXlsxToJson,
  splitLines,
  upper,
  normalizeName,
  formatDateBR,
  ordinalFeminino,
} from "../shared/helpers.js";

// ─── Constantes de estilo ─────────────────────────────────────────────────────

const FONT = "Roboto";
const SIZE_HEADER = 22; // 11pt
const SIZE_BODY   = 20; // 10pt

const SPACE_AFTER_PROCESS_LINE  = 120;
const SPACE_AFTER_ORGAO         = 80;
const SPACE_AFTER_TIPO          = 80;
const SPACE_AFTER_INTERESSADO   = 60;
const SPACE_AFTER_ADV           = 50;
const SPACE_AFTER_VINCULACAO    = 50;

// ─── Conselheiros titulares ───────────────────────────────────────────────────

const CONSELHEIROS = [
  "VALDECIR PASCOAL",
  "RANILSON RAMOS",
  "DIRCEU RODOLFO DE MELO JUNIOR",
  "MARCOS LORETO",
  "CARLOS NEVES",
  "EDUARDO LYRA PORTO",
  "RODRIGO NOVAES",
].map(normalizeName);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Retorna o prefixo correto (CONSELHEIRO ou CONSELHEIRO SUBSTITUTO).
 */
function relatorPrefix(relatorRaw) {
  const n = normalizeName(relatorRaw);
  return CONSELHEIROS.some((key) => n.includes(key))
    ? "CONSELHEIRO"
    : "CONSELHEIRO SUBSTITUTO";
}

/**
 * Extrai o número limpo do processo, removendo notas de vinculação.
 * Ex: "12345678-9 (vinculado ao conselheiro Dirceu)" → "12345678-9"
 * Também remove caracteres especiais como ! e ⚠️.
 * @param {string} raw
 * @returns {{ numero: string, vinculacao: string }}
 */
function parseProcesso(raw) {
  const str = String(raw ?? "").replace(/[!⚠️]/g, "").trim();

  // Tenta capturar nota de vinculação entre parênteses ou após hífen longo
  const matchVinc = str.match(/^([^\(]+?)\s*[\(\-–]\s*(vinculad[oa].+)/i);
  if (matchVinc) {
    return {
      numero: matchVinc[1].trim(),
      vinculacao: matchVinc[2].replace(/[\(\)]/g, "").trim(),
    };
  }

  // Sem nota de vinculação — retorna string limpa
  return { numero: str, vinculacao: "" };
}

/**
 * Detecta o sistema de tramitação pelo número do processo.
 * Regra DOE: 9 caracteres (ex: 12345678-9) → AP.
 * @param {string} numero  número já limpo
 * @returns {"AP"|"E-TCE"|""}
 */
function inferSistemaDOE(numero) {
  // Remove espaços para contar apenas os caracteres do número
  const cleaned = numero.replace(/\s/g, "");
  return cleaned.length === 9 ? "AP" : "";
}

/**
 * Resolve label e cor do sistema de tramitação.
 * @param {string} sistema  valor da coluna "Sistema de Tramitação" (pode ser vazio no DOE)
 * @param {string} numero   número limpo do processo
 * @param {boolean} isDOE   indica se o input veio do DOE
 */
function resolveLabel(sistema, numero, isDOE = false) {
  const s = upper(sistema ?? "");

  if (s === "E-TCE")  return { label: "PROCESSO ELETRÔNICO eTCE", color: "FF0000" };
  if (s === "AP")     return { label: "PROCESSO DIGITAL TCE",     color: "0070C0" };

  // Inferência dinâmica para input DOE
  if (isDOE) {
    const inferido = inferSistemaDOE(numero);
    if (inferido === "AP") return { label: "PROCESSO DIGITAL TCE", color: "0070C0" };
  }

  return { label: "PROCESSO", color: "000000" };
}

/**
 * Ordena processos por número crescente (antiguidade).
 * Extrai a parte numérica inicial para comparação.
 * @param {object[]} processos
 * @returns {object[]}
 */
function sortByProcesso(processos) {
  return [...processos].sort((a, b) => {
    const na = String(a["Processo"] ?? "").replace(/\D/g, "");
    const nb = String(b["Processo"] ?? "").replace(/\D/g, "");
    return parseInt(na || "0", 10) - parseInt(nb || "0", 10);
  });
}

// ─── Geração de parágrafos DOCX ───────────────────────────────────────────────

function buildDocxParagraphs(rows, headerData, isDOE = false) {
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = window.docx;

  const { sessionNumber, sessionType, dateBR } = headerData;

  const children = [];

  const separator = () =>
    new Paragraph({
      children: [
        new TextRun(
          "______________________________________________________________________________________"
        ),
      ],
      spacing: { before: 0, after: 0 },
    });

  const blankLine = (after = 80) =>
    new Paragraph({
      children: [new TextRun(" ")],
      spacing: { after },
    });

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `PAUTA DA ${sessionNumber} SESSÃO ORDINÁRIA DO ${sessionType}`,
          bold: true,
          size: SIZE_HEADER,
          font: FONT,
        }),
      ],
      spacing: { after: 120 },
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `DATA: ${dateBR}`,
          bold: true,
          size: SIZE_HEADER,
          font: FONT,
        }),
      ],
      spacing: { after: 80 },
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `HORÁRIO: 10h`,
          bold: true,
          size: SIZE_HEADER,
          font: FONT,
        }),
      ],
      spacing: { after: 140 },
    })
  );

  children.push(separator());

  // ── Agrupamento por relator ────────────────────────────────────────────────
  if (isDOE) {
    // DOE: fluxo linear, sem reordenação, sem reagrupamento
    let relatorAtual = null;

    for (const row of rows) {
      const relator = String(row["Relator"] ?? "").trim();

      // Novo relator → imprime cabeçalho
      if (relator !== relatorAtual) {
        relatorAtual = relator;
        const prefix = relatorPrefix(relator);

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `RELATOR: ${prefix} ${upper(relator)}`,
                bold: true,
                size: SIZE_HEADER,
                font: FONT,
              }),
            ],
            spacing: { before: 240, after: 0 },
          })
        );
        children.push(blankLine(120));
      }

      buildProcessoParagraphs(children, row, isDOE, { Paragraph, TextRun });
      children.push(blankLine(120));
    }

    children.push(separator());

  } else {
    // XLSX: agrupa por relator, ordena processos por antiguidade
    const grouped = new Map();
    for (const r of rows) {
      const rel = String(r["Relator"] ?? "").trim();
      if (!grouped.has(rel)) grouped.set(rel, []);
      grouped.get(rel).push(r);
    }

    for (const [relator, processos] of grouped.entries()) {
      const prefix = relatorPrefix(relator);

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `RELATOR: ${prefix} ${upper(relator)}`,
              bold: true,
              size: SIZE_HEADER,
              font: FONT,
            }),
          ],
          spacing: { before: 240, after: 0 },
        })
      );
      children.push(blankLine(120));

      // Ordenação por antiguidade crescente
      const ordenados = sortByProcesso(processos);

      for (const row of ordenados) {
        buildProcessoParagraphs(children, row, isDOE, { Paragraph, TextRun });
        children.push(blankLine(120));
      }

      children.push(separator());
    }
  }

  return children;
}

/**
 * Adiciona os parágrafos de um único processo ao array children.
 */
function buildProcessoParagraphs(children, row, isDOE, { Paragraph, TextRun }) {
  const { numero, vinculacao } = parseProcesso(row["Processo"]);
  const { label, color } = resolveLabel(row["Sistema de Tramitação"], numero, isDOE);

  const modalidade  = upper(String(row["Modalidade"]  ?? "").trim());
  const tipoProcess = upper(String(row["Tipo Processo"] ?? "").trim());

  // Linha do processo
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `${label} `, bold: true, color, size: SIZE_BODY, font: FONT }),
        new TextRun({ text: `Nº ${numero}`, bold: true, color: "000000", size: SIZE_BODY, font: FONT }),
      ],
      spacing: { after: SPACE_AFTER_PROCESS_LINE },
    })
  );

  // Órgão
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: upper(row["Órgão"] ?? ""), bold: true, size: SIZE_BODY, font: FONT }),
      ],
      spacing: { after: SPACE_AFTER_ORGAO },
    })
  );

  // Modalidade + Tipo Processo (ambos em negrito e caixa alta)
  const tipoTexto = [modalidade, tipoProcess].filter(Boolean).join(" ");
  if (tipoTexto) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: tipoTexto, bold: true, size: SIZE_BODY, font: FONT }),
        ],
        spacing: { after: SPACE_AFTER_TIPO },
      })
    );
  }

  // Interessados
  splitLines(row["Interessados"]).forEach((i) => {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: i, bold: false, size: SIZE_BODY, font: FONT })],
        spacing: { after: SPACE_AFTER_INTERESSADO },
      })
    );
  });

  // Advogados
  splitLines(row["Advogados"]).forEach((a) => {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `(Adv. ${a})`, bold: false, size: SIZE_BODY, font: FONT })],
        spacing: { after: SPACE_AFTER_ADV },
      })
    );
  });

  // Vinculação (última linha do bloco, em itálico)
  if (vinculacao) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `(${vinculacao})`,
            bold: false,
            italics: true,
            size: SIZE_BODY - 2, // levemente menor
            font: FONT,
            color: "555555",
          }),
        ],
        spacing: { after: SPACE_AFTER_VINCULACAO },
      })
    );
  }
}

// ─── Componente UI ────────────────────────────────────────────────────────────

export function mount(container) {
  container.innerHTML = `
    <div class="module-card">
      <div class="card">
        <div class="card-body">

          <div class="row g-3 mb-3">
            <div class="col-md-3">
              <label for="sessionNumber" class="form-label">Nº da sessão</label>
              <input
                id="sessionNumber"
                type="number"
                min="1"
                step="1"
                class="form-control"
                placeholder="Ex: 1"
                required
              />
            </div>

            <div class="col-md-5">
              <label for="sessionType" class="form-label">Tipo de sessão</label>
              <select id="sessionType" class="form-select" required>
                <option value="" selected>Selecione...</option>
                <option value="PLENO">Pleno</option>
                <option value="PRIMEIRA CÂMARA">Primeira Câmara</option>
                <option value="SEGUNDA CÂMARA">Segunda Câmara</option>
              </select>
            </div>

            <div class="col-md-4">
              <label for="sessionDate" class="form-label">Data</label>
              <input id="sessionDate" type="date" class="form-control" required />
            </div>
          </div>

          <!-- Seletor de tipo de input -->
          <div class="mb-3">
            <label class="form-label">Tipo de entrada</label>
            <div class="d-flex gap-3">
              <div class="form-check">
                <input class="form-check-input" type="radio" name="inputType"
                  id="inputXlsx" value="xlsx" checked />
                <label class="form-check-label" for="inputXlsx">
                  Planilha XLSX
                </label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="inputType"
                  id="inputDOE" value="doe" />
                <label class="form-check-label" for="inputDOE">
                  Documento do DOE
                </label>
              </div>
            </div>
          </div>

          <!-- Input XLSX -->
          <div id="xlsxSection">
            <label for="fileInput" class="form-label">Selecione o arquivo .xlsx</label>
            <input class="form-control" type="file" id="fileInput" accept=".xlsx" />
          </div>

          <!-- Input DOE -->
          <div id="doeSection" style="display:none">
            <label for="doeTextarea" class="form-label">
              Cole aqui o conteúdo do DOE
              <span class="text-muted small">(formato: Relator / Processo / Órgão / Tipo / Interessados / Advogados — um por linha ou bloco)</span>
            </label>
            <textarea
              id="doeTextarea"
              class="form-control font-monospace"
              rows="12"
              placeholder="Cole aqui o texto extraído do DOE..."
            ></textarea>
            <div class="form-text">
              Processos com 9 caracteres (ex: <code>12345678-9</code>) serão automaticamente classificados como
              <span style="color:#0070C0;font-weight:600">PROCESSO DIGITAL TCE</span>.
            </div>
          </div>

          <div class="d-flex gap-2 mt-3">
            <button id="btnPreview" class="btn btn-outline-secondary" disabled>
              Pré-visualizar (10 linhas)
            </button>
            <button id="btnGenerate" class="btn btn-primary" disabled>
              Gerar DOCX
            </button>
          </div>

          <div class="mt-3">
            <div id="status" class="small text-muted">Nenhum arquivo selecionado.</div>
          </div>
        </div>
      </div>

      <div class="mt-4">
        <h2 class="h6">Prévia</h2>
        <pre id="preview" class="p-3 bg-light border rounded small"></pre>
      </div>
    </div>
  `;

  // ── DOM ──────────────────────────────────────────────────────────────────────
  const fileInput      = container.querySelector("#fileInput");
  const doeTextarea    = container.querySelector("#doeTextarea");
  const xlsxSection    = container.querySelector("#xlsxSection");
  const doeSection     = container.querySelector("#doeSection");
  const btnPreview     = container.querySelector("#btnPreview");
  const btnGenerate    = container.querySelector("#btnGenerate");
  const statusEl       = container.querySelector("#status");
  const previewEl      = container.querySelector("#preview");
  const sessionNumberEl = container.querySelector("#sessionNumber");
  const sessionTypeEl  = container.querySelector("#sessionType");
  const sessionDateEl  = container.querySelector("#sessionDate");
  const radioXlsx      = container.querySelector("#inputXlsx");
  const radioDOE       = container.querySelector("#inputDOE");

  // ── Estado ───────────────────────────────────────────────────────────────────
  let rows   = null;
  let isDOE  = false;

  const listeners = [];
  function on(el, evt, fn) {
    el.addEventListener(evt, fn);
    listeners.push(() => el.removeEventListener(evt, fn));
  }

  // ── Helpers UI ───────────────────────────────────────────────────────────────
  function setStatus(msg) { statusEl.textContent = msg; }

  function headerOk() {
    return (
      !!ordinalFeminino(sessionNumberEl?.value) &&
      !!String(sessionTypeEl?.value  || "").trim() &&
      !!String(sessionDateEl?.value  || "").trim()
    );
  }

  function updateButtons() {
    btnPreview.disabled  = !rows;
    btnGenerate.disabled = !(rows && headerOk());
  }

  // ── Troca de tipo de entrada ─────────────────────────────────────────────────
  function switchInputType() {
    isDOE = radioDOE.checked;
    xlsxSection.style.display = isDOE ? "none"  : "block";
    doeSection.style.display  = isDOE ? "block" : "none";
    rows = null;
    previewEl.textContent = "";
    setStatus("Nenhum dado carregado.");
    updateButtons();
  }

  on(radioXlsx, "change", switchInputType);
  on(radioDOE,  "change", switchInputType);

  // ── Validação header ─────────────────────────────────────────────────────────
  [sessionNumberEl, sessionTypeEl, sessionDateEl].forEach((el) => {
    on(el, "input",  updateButtons);
    on(el, "change", updateButtons);
  });

  // ── Leitura XLSX ─────────────────────────────────────────────────────────────
  on(fileInput, "change", async (e) => {
    previewEl.textContent = "";
    rows = null;
    updateButtons();

    const file = e.target.files?.[0];
    if (!file) { setStatus("Nenhum arquivo selecionado."); return; }

    setStatus("Lendo XLSX...");
    try {
      rows = await readFirstSheetXlsxToJson(file);
      setStatus(`XLSX OK. Linhas: ${rows.length}.`);
      updateButtons();
    } catch (err) {
      console.error(err);
      setStatus(err?.message || "Erro ao ler XLSX. Abra o Console (F12).");
      rows = null;
      updateButtons();
    }
  });

  // ── Parser DOE ───────────────────────────────────────────────────────────────
  /**
   * Converte o texto colado do DOE em um array de objetos
   * compatíveis com o mesmo schema do XLSX.
   *
   * Formato esperado (blocos separados por linha em branco):
   *   Relator: <nome>
   *   Processo: <numero>
   *   Órgão: <orgao>
   *   Modalidade: <modalidade>       (opcional)
   *   Tipo Processo: <tipo>
   *   Interessados: <interessados>   (opcional)
   *   Advogados: <advogados>         (opcional)
   */
  function parseDOE(text) {
    const parsed = [];
    const blocks = text.split(/\n{2,}/);

    for (const block of blocks) {
      if (!block.trim()) continue;

      const obj = {};
      const lines = block.split("\n");

      for (const line of lines) {
        const sep = line.indexOf(":");
        if (sep === -1) continue;
        const key = line.slice(0, sep).trim();
        const val = line.slice(sep + 1).trim();
        obj[key] = val;
      }

      // Normaliza chaves para o schema esperado
      const row = {
        "Relator":                obj["Relator"]          ?? "",
        "Processo":               obj["Processo"]         ?? "",
        "Órgão":                  obj["Órgão"]            ?? obj["Orgao"] ?? "",
        "Modalidade":             obj["Modalidade"]       ?? "",
        "Tipo Processo":          obj["Tipo Processo"]    ?? obj["Tipo"]  ?? "",
        "Interessados":           obj["Interessados"]     ?? "",
        "Advogados":              obj["Advogados"]        ?? "",
        "Sistema de Tramitação":  "",  // será inferido dinamicamente
      };

      if (row["Relator"] || row["Processo"]) parsed.push(row);
    }

    return parsed;
  }

  // Monitora textarea do DOE
  on(doeTextarea, "input", () => {
    const text = doeTextarea.value.trim();
    if (!text) {
      rows = null;
      setStatus("Nenhum dado colado.");
    } else {
      rows = parseDOE(text);
      setStatus(`DOE OK. Processos encontrados: ${rows.length}.`);
    }
    updateButtons();
  });

  // ── Prévia ───────────────────────────────────────────────────────────────────
  on(btnPreview, "click", () => {
    if (!rows) return;
    previewEl.textContent = JSON.stringify(rows.slice(0, 10), null, 2);
  });

  // ── Geração DOCX ─────────────────────────────────────────────────────────────
  on(btnGenerate, "click", async () => {
    if (!rows) return;
    if (!headerOk()) { setStatus("Preencha Nº da sessão, Tipo de sessão e Data."); return; }
    if (!window.docx || !window.saveAs) { setStatus("Bibliotecas docx/FileSaver não carregadas (CDN)."); return; }

    setStatus("Gerando DOCX...");

    try {
      const { Document, Packer } = window.docx;

      const sessionNumber = ordinalFeminino(sessionNumberEl.value);
      const sessionType   = upper(sessionTypeEl.value);
      const dateBR        = formatDateBR(sessionDateEl.value);

      const headerData = { sessionNumber, sessionType, dateBR };
      const children   = buildDocxParagraphs(rows, headerData, isDOE);

      const doc  = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);

      const suffix   = isDOE ? "doe" : "xlsx";
      const filename = `pauta_${dateBR.replaceAll("/", "-")}_${suffix}.docx`;
      saveAs(blob, filename);

      setStatus(`DOCX gerado: ${filename}`);
    } catch (err) {
      console.error(err);
      setStatus("Erro ao gerar DOCX. Abra o Console (F12) e veja o erro.");
    }
  });

  updateButtons();

  return {
    destroy() {
      listeners.forEach((off) => off());
    },
  };
}