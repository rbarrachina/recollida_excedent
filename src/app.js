const state = {
  educationStage: 'SECUNDARIA',
  rowsByStage: {
    SECUNDARIA: [],
    PRIMARIA: [],
  },
  fileNameByStage: {
    SECUNDARIA: '',
    PRIMARIA: '',
  },
  selectedSsttByStage: {
    SECUNDARIA: '',
    PRIMARIA: '',
  },
  activeView: 'MANAGEMENT',
  managementRows: [],
  managementRowsByKey: new Map(),
  charts: {
    receivedVsTotal: null,
    neededReceivedDonut: null,
    neededVsReceivedBySstt: null,
  },
};

const fileInput = document.getElementById('fileInput');
const fileStatusEl = document.getElementById('fileStatus');
const emptyStateEl = document.getElementById('emptyState');
const dashboardEl = document.getElementById('dashboard');
const secondaryModuleBtn = document.getElementById('secondaryModuleBtn');
const primaryModuleBtn = document.getElementById('primaryModuleBtn');
const appInfoBtn = document.getElementById('appInfoBtn');
const primaryNoticeEl = document.getElementById('primaryNotice');
const stageInlineLabelEl = document.getElementById('stageInlineLabel');
const globalSsttFilterEl = document.getElementById('globalSsttFilter');
const selectedSsttDisplayEl = document.getElementById('selectedSsttDisplay');
const viewManagementBtn = document.getElementById('viewManagementBtn');
const viewChartsBtn = document.getElementById('viewChartsBtn');
const fileTriggerEl = document.querySelector('label[for="fileInput"]');
const summaryCardsEl = document.getElementById('summaryCards');
const chartsGridSectionEl = document.getElementById('chartsGridSection');
const bySsttSectionEl = document.getElementById('bySsttSection');
const neededReceivedSectionEl = document.getElementById('neededReceivedSection');
const yesNoSectionEl = document.getElementById('yesNoSection');
const secondaryActionSectionEl = document.getElementById('secondaryActionSection');
const managementSectionTitleEl = document.getElementById('managementSectionTitle');
const managementSectionSubtitleEl = document.getElementById('managementSectionSubtitle');
const secondaryActionCountEl = document.getElementById('secondaryActionCount');
const secondaryActionTableEl = document.getElementById('secondaryActionTable');
const primaryJointActionTableSectionEl = document.getElementById('primaryJointActionTableSection');
const primaryJointActionTableEl = document.getElementById('primaryJointActionTable');
const primaryAdvisorTableSectionEl = document.getElementById('primaryAdvisorTableSection');
const primaryAdvisorTableEl = document.getElementById('primaryAdvisorTable');
const centreInfoModalEl = document.getElementById('centreInfoModal');
const centreInfoTitleEl = document.getElementById('centreInfoTitle');
const centreInfoContentEl = document.getElementById('centreInfoContent');
const closeCentreInfoBtn = document.getElementById('closeCentreInfoBtn');
const aboutModalEl = document.getElementById('aboutModal');
const closeAboutModalBtn = document.getElementById('closeAboutModalBtn');
const stageMismatchModalEl = document.getElementById('stageMismatchModal');
const closeStageMismatchBtn = document.getElementById('closeStageMismatchBtn');
const stageMismatchTextEl = document.getElementById('stageMismatchText');
const yesNoTableEl = document.getElementById('yesNoTable');
const neededReceivedTableEl = document.getElementById('neededReceivedTable');

const receivedVsTotalCtx = document.getElementById('receivedVsTotalChart').getContext('2d');
const neededReceivedDonutCtx = document.getElementById('neededReceivedDonutChart').getContext('2d');
const neededVsReceivedBySsttCtx = document.getElementById('neededVsReceivedBySsttChart').getContext('2d');

if (window.ChartDataLabels) {
  Chart.register(window.ChartDataLabels);
}

const centerTotalTextPlugin = {
  id: 'centerTotalText',
  beforeDraw(chart, _args, pluginOptions) {
    if (!pluginOptions || !pluginOptions.display) return;
    const dataset = chart.data.datasets?.[0];
    if (!dataset || !dataset.data) return;

    const total = dataset.data.reduce((acc, item) => acc + Number(item || 0), 0);
    const meta = chart.getDatasetMeta(0);
    if (!meta?.data?.length) return;

    const x = meta.data[0].x;
    const y = meta.data[0].y;
    const ctx = chart.ctx;
    const fontSize = pluginOptions.fontSize || 34;

    ctx.save();
    ctx.fillStyle = pluginOptions.color || '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${fontSize}px sans-serif`;
    ctx.fillText(total.toLocaleString('ca-ES'), x, y);
    ctx.restore();
  },
};

Chart.register(centerTotalTextPlugin);

const STAGE_CONFIG = {
  SECUNDARIA: {
    stageLabel: 'SECUNDÀRIA',
    summary: {
      firstYesNoField: 'disposen del total del equips a retirar ?',
      firstYesNoLabel: 'Disposen del total a retirar',
      neededField: 'e-Valisa necessaria?',
      receivedField: 'e-Valisa rebuda',
      receivedStatusField: '',
    },
    yesNoFields: [
      { raw: 'disposen del total del equips a retirar ?', label: 'Disposen del total dels equips a retirar?' },
      { raw: 'e-Valisa necessaria?', label: 'e-Valisa necessària?' },
      { raw: 'e-Valisa sol licitada', label: 'e-Valisa sol·licitada' },
      { raw: 'e-Valisa rebuda', label: 'e-Valisa rebuda' },
    ],
  },
  PRIMARIA: {
    stageLabel: 'PRIMÀRIA',
    summary: {
      firstYesNoField: 'Existeixen discrepàncies SI/NO',
      firstYesNoLabel: 'Existeixen discrepàncies (SI)',
      neededField: 'e-Valisa neccesària',
      receivedField: 'e-Valisa rebuda',
      receivedStatusField: 'Estat e-Valisa',
    },
    yesNoFields: [
      { raw: 'CentreTancat', label: 'Centre tancat' },
      { raw: 'Existeixen discrepàncies SI/NO', label: 'Existeixen discrepàncies SI/NO' },
      { raw: 'e-Valisa neccesària', label: 'e-Valisa neccesària' },
      { raw: 'e-Valisa rebuda', label: 'e-Valisa rebuda' },
    ],
  },
};

const ALL_SSTT = ['APA', 'BLL', 'BNS', 'CCE', 'CEB', 'GIR', 'LLE', 'MVO', 'PEN', 'TAR', 'TEB', 'VOC'];

function normalizeHeader(value) {
  return value
    .replace(/^\uFEFF/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeBoolean(value) {
  if (!value) return null;
  const clean = value
    .toString()
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (['SI', 'S', 'YES', 'Y', 'TRUE', '1'].includes(clean)) return true;
  if (['NO', 'N', 'FALSE', '0'].includes(clean)) return false;
  return null;
}

function normalizeCategoryText(value) {
  if (value === null || value === undefined) return '';
  return value
    .toString()
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getRowValue(row, candidateFields) {
  for (const field of candidateFields) {
    const value = row[normalizeHeader(field)];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return '';
}

function getRowKey(row) {
  const id = getRowValue(row, ['IDPeticion']);
  const codi = getRowValue(row, ['Codi']);
  const nom = getRowValue(row, ['Nom']);
  const sstt = getRowValue(row, ['SSTT']);
  const date = getRowValue(row, ['DataPlanificada', 'Data Planificada']);
  return [id, codi, nom, sstt, date].join('|');
}

function classifyReceivedStatus(value) {
  const clean = normalizeCategoryText(value);
  if (!clean) return 'NO';
  if (['SI', 'S', 'YES', 'Y', 'TRUE', '1'].includes(clean)) return 'SI';
  if (['NO', 'N', 'FALSE', '0'].includes(clean)) return 'NO';
  if (['INVALIDA', 'NO VALIDA'].includes(clean)) return 'INVALIDA';
  return 'INVALIDA';
}

function splitCsvLine(line, delimiter) {
  const result = [];
  let value = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === delimiter && !insideQuotes) {
      result.push(value);
      value = '';
      continue;
    }

    value += char;
  }

  result.push(value);
  return result;
}

function parseCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (!lines.length) return [];

  const looksLikeHeader = (line, delimiter) => {
    const headers = splitCsvLine(line, delimiter).map((h) => normalizeHeader(h));
    const mustHave = ['idpeticion', 'codi', 'nom', 'sstt'];
    const hits = mustHave.filter((field) => headers.includes(field)).length;
    const hasEvalisa = headers.some((header) => header.includes('e valisa'));
    return hits >= 3 && hasEvalisa;
  };

  const delimiters = [';', ','];
  let headerIndex = -1;
  let delimiter = ';';

  for (const candidate of delimiters) {
    const foundIndex = lines.findIndex((line) => looksLikeHeader(line, candidate));
    if (foundIndex !== -1) {
      headerIndex = foundIndex;
      delimiter = candidate;
      break;
    }
  }

  if (headerIndex === -1) return [];

  const headers = splitCsvLine(lines[headerIndex], delimiter).map((h) => h.trim());
  const rows = [];

  for (let i = headerIndex + 1; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i], delimiter);
    const row = {};

    headers.forEach((header, index) => {
      row[normalizeHeader(header)] = (cols[index] || '').trim();
    });

    if (Object.values(row).some((v) => v !== '')) {
      rows.push(row);
    }
  }

  return rows;
}

async function readCsvWithEncodingFallback(file) {
  const buffer = await file.arrayBuffer();
  const encodings = ['utf-8', 'windows-1252', 'iso-8859-1'];
  let bestText = '';
  let bestRows = [];
  let bestEncoding = encodings[0];
  let bestScore = -1;

  for (const encoding of encodings) {
    const text = new TextDecoder(encoding).decode(buffer);
    const rows = parseCsv(text);
    const replacementCount = (text.match(/\uFFFD/g) || []).length;
    const mojibakeCount = (text.match(/Ã|Â|ï»¿/g) || []).length;
    const score = rows.length * 1000 - replacementCount - mojibakeCount;

    if (score > bestScore) {
      bestText = text;
      bestRows = rows;
      bestEncoding = encoding;
      bestScore = score;
    }
  }

  return { text: bestText, rows: bestRows, encoding: bestEncoding };
}

function normalizeNameForDetection(value) {
  return (value || '')
    .toString()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function detectFileStageFromNames(rows) {
  const nameField = normalizeHeader('Nom');
  let schoolCount = 0;
  let instituteCount = 0;

  rows.forEach((row) => {
    const name = normalizeNameForDetection(row[nameField]);
    if (!name) return;

    if (name.includes('ESCOLA')) schoolCount += 1;
    if (name.includes('INSTITUT') || name.startsWith('INS ') || name.includes(' INS ')) instituteCount += 1;
  });

  if (!schoolCount && !instituteCount) return null;
  return schoolCount >= instituteCount ? 'PRIMARIA' : 'SECUNDARIA';
}

function openStageMismatchModal(message) {
  if (!stageMismatchModalEl || !stageMismatchTextEl) return;
  stageMismatchTextEl.textContent = message;
  stageMismatchModalEl.classList.remove('hidden');
  stageMismatchModalEl.classList.add('flex');
}

function closeStageMismatchModal() {
  if (!stageMismatchModalEl) return;
  stageMismatchModalEl.classList.add('hidden');
  stageMismatchModalEl.classList.remove('flex');
}

function countYesNo(rows, rawFieldName) {
  const field = normalizeHeader(rawFieldName);
  let yes = 0;
  let no = 0;
  let empty = 0;

  rows.forEach((row) => {
    const val = normalizeBoolean(row[field]);
    if (val === true) yes += 1;
    else if (val === false) no += 1;
    else empty += 1;
  });

  return { yes, no, empty };
}

function getPalette() {
  if (state.educationStage === 'PRIMARIA') {
    return {
      accent: '#d97706',
      accentBorder: '#b45309',
      soft: '#fef3c7',
      softBorder: '#fde68a',
      invalid: '#fdba74',
      invalidBorder: '#fb923c',
      secondary: '#f59e0b',
      secondaryBorder: '#d97706',
    };
  }

  return {
    accent: '#0284c7',
    accentBorder: '#0369a1',
    soft: '#e2e8f0',
    softBorder: '#cbd5e1',
    invalid: '#7dd3fc',
    invalidBorder: '#38bdf8',
    secondary: '#94a3b8',
    secondaryBorder: '#64748b',
  };
}

function getActiveStageConfig() {
  return STAGE_CONFIG[state.educationStage] || STAGE_CONFIG.SECUNDARIA;
}

function applyThemeForEducationStage(stage) {
  state.educationStage = stage;
  document.body.classList.toggle('theme-primary', stage === 'PRIMARIA');
}

function updateModuleButtons(stage) {
  secondaryModuleBtn?.classList.toggle('active', stage === 'SECUNDARIA');
  primaryModuleBtn?.classList.toggle('active', stage === 'PRIMARIA');
}

function buildSsttOptions(rows) {
  const ssttField = normalizeHeader('SSTT');
  return [...new Set(rows.map((row) => (row[ssttField] || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

function populateGlobalSsttFilter(rows) {
  if (!globalSsttFilterEl) return;
  if (!rows.length) {
    globalSsttFilterEl.innerHTML = '<option value="">Tria SSTT</option>';
    globalSsttFilterEl.value = '';
    globalSsttFilterEl.disabled = true;
    state.selectedSsttByStage[state.educationStage] = '';
    return;
  }

  globalSsttFilterEl.disabled = false;
  const options = buildSsttOptions(rows);
  const selected = state.selectedSsttByStage[state.educationStage] || '';
  globalSsttFilterEl.innerHTML = [
    '<option value="">Tria SSTT</option>',
    '<option value="ALL">Tots</option>',
    ...options.map((sstt) => `<option value="${sstt}">${sstt}</option>`),
  ].join('');
  const allowedValues = new Set(['', 'ALL', ...options]);
  globalSsttFilterEl.value = allowedValues.has(selected) ? selected : '';
  state.selectedSsttByStage[state.educationStage] = globalSsttFilterEl.value;
}

function updateSelectedSsttDisplay() {
  if (!selectedSsttDisplayEl) return;
  const selected = state.selectedSsttByStage[state.educationStage] || '';
  if (!selected) {
    selectedSsttDisplayEl.textContent = '-';
    return;
  }
  selectedSsttDisplayEl.textContent = selected === 'ALL' ? 'TOTS' : selected;
}

function getFilteredRowsByGlobalSstt(rows) {
  const selectedSstt = state.selectedSsttByStage[state.educationStage] || 'ALL';
  if (selectedSstt === 'ALL') return rows;
  const ssttField = normalizeHeader('SSTT');
  return rows.filter((row) => (row[ssttField] || '').trim() === selectedSstt);
}

function applyActiveView() {
  const showManagement = state.activeView === 'MANAGEMENT';

  secondaryActionSectionEl?.classList.toggle('hidden', !showManagement);
  summaryCardsEl?.classList.toggle('hidden', showManagement);
  chartsGridSectionEl?.classList.toggle('hidden', showManagement);
  bySsttSectionEl?.classList.toggle('hidden', showManagement);
  neededReceivedSectionEl?.classList.toggle('hidden', showManagement);
  yesNoSectionEl?.classList.toggle('hidden', showManagement);

  viewManagementBtn?.classList.toggle('active', showManagement);
  viewChartsBtn?.classList.toggle('active', !showManagement);
}

function setActiveView(view) {
  state.activeView = view;
  applyActiveView();
}

function renderActiveStageData() {
  const rows = state.rowsByStage[state.educationStage] || [];
  const fileName = state.fileNameByStage[state.educationStage];
  populateGlobalSsttFilter(rows);
  updateSelectedSsttDisplay();
  const selectedSstt = state.selectedSsttByStage[state.educationStage] || '';
  const filteredRows = getFilteredRowsByGlobalSstt(rows);

  if (!rows.length) {
    dashboardEl.classList.add('hidden');
    emptyStateEl.classList.remove('hidden');
    emptyStateEl.innerHTML = 'Selecciona un fitxer CSV per mostrar els gràfics i els resums.';
    fileStatusEl.textContent = '';
    primaryNoticeEl?.classList.toggle('hidden', state.educationStage !== 'PRIMARIA');
    return;
  }

  if (!selectedSstt) {
    dashboardEl.classList.add('hidden');
    emptyStateEl.classList.remove('hidden');
    emptyStateEl.innerHTML = `
      <div class="space-y-3">
        <p class="text-6xl leading-none">✅</p>
        <p class="text-lg font-semibold text-slate-700">Fitxer carregat</p>
        <p class="text-sm text-slate-600 break-all">${escapeHtml(fileName || '')}</p>
        <p class="text-sm text-slate-600">${rows.length} files carregades</p>
        <p class="text-2xl font-extrabold text-slate-600">👉 TRIA SSTT 👈</p>
      </div>
    `;
    primaryNoticeEl?.classList.add('hidden');
    fileStatusEl.textContent = '';
    return;
  }

  renderAll(filteredRows);
  showDashboard();
  primaryNoticeEl?.classList.add('hidden');
  applyActiveView();

  if (!filteredRows.length && selectedSstt !== 'ALL') {
    fileStatusEl.textContent = '';
    return;
  }

  fileStatusEl.textContent = '';
}

function setEducationStage(stage) {
  applyThemeForEducationStage(stage);
  updateModuleButtons(stage);
  state.activeView = 'MANAGEMENT';
  if (stageInlineLabelEl) {
    stageInlineLabelEl.textContent = getActiveStageConfig().stageLabel;
  }

  if (fileInput) fileInput.disabled = false;
  fileTriggerEl?.classList.remove('disabled');

  renderActiveStageData();
  applyActiveView();
}

function renderSummary(rows) {
  const stageConfig = getActiveStageConfig();
  const { firstYesNoField, firstYesNoLabel, neededField, receivedField } = stageConfig.summary;
  const totalCentres = rows.length;
  const firstYesNo = countYesNo(rows, firstYesNoField).yes;
  const eValisaNeeded = countYesNo(rows, neededField).yes;
  const eValisaReceived = countYesNo(rows, receivedField).yes;

  const cards = [
    { label: 'Total centres', value: totalCentres },
    { label: firstYesNoLabel, value: firstYesNo },
    { label: 'e-Valisa necessària (SI)', value: eValisaNeeded },
    { label: 'e-Valisa rebuda (SI)', value: eValisaReceived },
  ];

  summaryCardsEl.innerHTML = cards
    .map(
      (card) => `
      <article class="rounded-2xl bg-white p-4 shadow">
        <p class="text-sm text-slate-500">${card.label}</p>
        <p class="mt-2 text-3xl font-bold text-slate-900">${card.value}</p>
      </article>
    `,
    )
    .join('');
}

function renderReceivedVsTotalChart(rows) {
  const neededField = getActiveStageConfig().summary.neededField;
  const neededCounts = countYesNo(rows, neededField);
  const neededYes = neededCounts.yes;
  const neededNo = neededCounts.no;
  const neededEmpty = neededCounts.empty;
  const palette = getPalette();

  if (state.charts.receivedVsTotal) {
    state.charts.receivedVsTotal.destroy();
  }

  state.charts.receivedVsTotal = new Chart(receivedVsTotalCtx, {
    type: 'doughnut',
    data: {
      labels: ['e-Valisa necessària (SI)', 'e-Valisa necessària (NO)', 'e-Valisa necessària (EN BLANC)'],
      datasets: [
        {
          data: [neededYes, neededNo, neededEmpty],
          backgroundColor: [palette.accent, palette.soft, '#f1f5f9'],
          borderColor: [palette.accentBorder, palette.softBorder, '#cbd5e1'],
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        centerTotalText: {
          display: true,
          color: '#0f172a',
          fontSize: 48,
        },
        datalabels: {
          color: '#0f172a',
          font: { weight: '700', size: 30 },
          formatter: (value) => value,
        },
        legend: { position: 'bottom' },
      },
    },
  });
}

function renderNeededReceivedDonutChart(rows) {
  const { receivedYes, receivedNo, receivedInvalid } = computeNeededReceivedStatus(rows);
  const palette = getPalette();

  if (state.charts.neededReceivedDonut) {
    state.charts.neededReceivedDonut.destroy();
  }

  state.charts.neededReceivedDonut = new Chart(neededReceivedDonutCtx, {
    type: 'doughnut',
    data: {
      labels: ['e-Valisa rebuda (SI)', 'e-Valisa rebuda (NO)', 'e-Valisa rebuda (INVÀLIDA)'],
      datasets: [
        {
          data: [receivedYes, receivedNo, receivedInvalid],
          backgroundColor: [palette.accent, palette.soft, palette.invalid],
          borderColor: [palette.accentBorder, palette.softBorder, palette.invalidBorder],
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        centerTotalText: {
          display: true,
          color: '#0f172a',
          fontSize: 48,
        },
        datalabels: {
          color: '#0f172a',
          font: { weight: '700', size: 30 },
          formatter: (value) => value,
        },
        legend: { position: 'bottom' },
      },
    },
  });
}

function computeNeededReceivedStatus(rows) {
  const stageConfig = getActiveStageConfig();
  const neededField = normalizeHeader(stageConfig.summary.neededField);
  const receivedField = normalizeHeader(stageConfig.summary.receivedField);
  const receivedStatusField = normalizeHeader(stageConfig.summary.receivedStatusField || '');
  let receivedYes = 0;
  let receivedNo = 0;
  let receivedInvalid = 0;

  rows.forEach((row) => {
    const needed = normalizeBoolean(row[neededField]) === true;
    if (!needed) return;

    const explicitStatus = receivedStatusField ? normalizeCategoryText(row[receivedStatusField]) : '';
    let status = classifyReceivedStatus(row[receivedField]);

    // Regla Primària: "Invàlida" sobreescriu només els casos rebuda=SI.
    if (status === 'SI' && explicitStatus.includes('INVALIDA')) {
      status = 'INVALIDA';
    }

    if (status === 'SI') receivedYes += 1;
    else if (status === 'NO') receivedNo += 1;
    else receivedInvalid += 1;
  });

  return { receivedYes, receivedNo, receivedInvalid };
}

function computeNeededReceivedBySstt(rows, includeEmpty = false) {
  const ssttField = normalizeHeader('SSTT');
  const stageConfig = getActiveStageConfig();
  const neededField = normalizeHeader(stageConfig.summary.neededField);
  const receivedField = normalizeHeader(stageConfig.summary.receivedField);
  const selectedSstt = state.selectedSsttByStage[state.educationStage] || '';
  const map = new Map();

  rows.forEach((row) => {
    const sstt = row[ssttField] || 'Sense SSTT';
    const needed = normalizeBoolean(row[neededField]) === true;
    const received = normalizeBoolean(row[receivedField]) === true;

    if (!map.has(sstt)) {
      map.set(sstt, { neededTotal: 0, receivedTotal: 0 });
    }

    if (needed) {
      const item = map.get(sstt);
      item.neededTotal += 1;
      if (received) item.receivedTotal += 1;
    }
  });

  if (includeEmpty) {
    if (selectedSstt && selectedSstt !== 'ALL') {
      const values = map.get(selectedSstt) || { neededTotal: 0, receivedTotal: 0 };
      return [{ sstt: selectedSstt, ...values }];
    }

    const rowSstt = [...new Set(rows.map((row) => row[ssttField]).filter(Boolean))];
    const unknownSstt = rowSstt.filter((sstt) => !ALL_SSTT.includes(sstt)).sort((a, b) => a.localeCompare(b));
    const orderedSstt = [...ALL_SSTT, ...unknownSstt];

    return orderedSstt.map((sstt) => {
      const values = map.get(sstt) || { neededTotal: 0, receivedTotal: 0 };
      return { sstt, ...values };
    });
  }

  return [...map.entries()]
    .map(([sstt, data]) => ({ sstt, ...data }))
    .filter((item) => item.neededTotal > 0)
    .sort((a, b) => b.neededTotal - a.neededTotal || a.sstt.localeCompare(b.sstt));
}

function renderNeededVsReceivedBySsttChart(rows) {
  const data = computeNeededReceivedBySstt(rows, true);
  const labels = data.map((item) => item.sstt);
  const neededValues = data.map((item) => item.neededTotal);
  const receivedValues = data.map((item) => item.receivedTotal);
  const palette = getPalette();

  if (state.charts.neededVsReceivedBySstt) {
    state.charts.neededVsReceivedBySstt.destroy();
  }

  state.charts.neededVsReceivedBySstt = new Chart(neededVsReceivedBySsttCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Necessària (SI)',
          data: neededValues,
          backgroundColor: palette.secondary,
          borderColor: palette.secondaryBorder,
          borderWidth: 1,
        },
        {
          label: 'Rebuda (SI)',
          data: receivedValues,
          backgroundColor: palette.accent,
          borderColor: palette.accentBorder,
          borderWidth: 1,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
        },
      },
      plugins: {
        datalabels: {
          color: '#0f172a',
          font: { weight: '700' },
          anchor: 'center',
          align: 'center',
          formatter: (value) => (value ? value : ''),
        },
        legend: { position: 'bottom' },
      },
    },
  });
}

function renderNeededReceivedTable(rows) {
  const data = computeNeededReceivedBySstt(rows, true);

  const body = data.map((item) => `
      <tr class="border-b border-slate-100">
        <td class="px-3 py-2 font-medium text-slate-700">${item.sstt}</td>
        <td class="px-3 py-2">${item.neededTotal}</td>
        <td class="px-3 py-2">${item.receivedTotal}</td>
      </tr>
    `).join('');

  neededReceivedTableEl.innerHTML = `
    <table class="min-w-full text-left text-sm">
      <thead>
        <tr class="border-b border-slate-200 text-slate-600">
          <th class="px-3 py-2">SSTT</th>
          <th class="px-3 py-2">Necessària (SI)</th>
          <th class="px-3 py-2">Rebuda (SI)</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

function renderYesNoTable(rows) {
  const tableRows = getActiveStageConfig().yesNoFields.map((fieldDef) => {
    const counters = countYesNo(rows, fieldDef.raw);
    const total = counters.yes + counters.no + counters.empty;

    return `
      <tr class="border-b border-slate-100">
        <td class="px-3 py-2 font-medium text-slate-700">${fieldDef.label}</td>
        <td class="px-3 py-2 text-green-700">${counters.yes}</td>
        <td class="px-3 py-2 text-rose-700">${counters.no}</td>
        <td class="px-3 py-2 text-slate-500">${counters.empty}</td>
        <td class="px-3 py-2">${total}</td>
      </tr>
    `;
  }).join('');

  yesNoTableEl.innerHTML = `
    <table class="min-w-full text-left text-sm">
      <thead>
        <tr class="border-b border-slate-200 text-slate-600">
          <th class="px-3 py-2">Camp</th>
          <th class="px-3 py-2">SI</th>
          <th class="px-3 py-2">NO</th>
          <th class="px-3 py-2">Buit/Altres</th>
          <th class="px-3 py-2">Total</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  `;
}

function renderSecondaryActionView(rows) {
  if (!secondaryActionSectionEl) return;
  secondaryActionSectionEl.classList.remove('hidden');

  const stageConfig = getActiveStageConfig();
  const neededField = normalizeHeader(stageConfig.summary.neededField);
  const ssttField = normalizeHeader('SSTT');
  const codiFields = ['Codi'];
  const nomFields = ['Nom'];
  const requestedFields = ['e-Valisa sol·licitada', 'e-Valisa sol licitada', 'e-Valisa solicitada'];
  const receivedFields = [stageConfig.summary.receivedField];
  const receivedStatusFields = [stageConfig.summary.receivedStatusField || ''];
  const assessorActionFields = ['Acció assessors', 'Accio assessors'];
  const reasonFields = ['MOTIU discrepancia', 'Motiu discrepància', 'Motiu discrepancia'];
  const notesFields = ['observacions', 'Observacions'];
  const digitalAssessorNotesFields = ['Observacions Assesors Digitals'];
  const showReceivedStatusColumn = state.educationStage === 'PRIMARIA';
  const showAssessorActionColumn = state.educationStage === 'PRIMARIA';
  const showDigitalAssessorNotesColumn = state.educationStage === 'PRIMARIA';
  state.managementRowsByKey = new Map(rows.map((row) => [getRowKey(row), row]));

  if (managementSectionTitleEl) {
    managementSectionTitleEl.textContent = "Centres pendents d'actuació del Servei Territorial";
  }
  if (managementSectionSubtitleEl) {
    managementSectionSubtitleEl.textContent = 'Centres amb "e-Valisa necessaria=SI" i "e-Valisa rebuda diferent de SI" més Centres amb "Estat e-Valisa=invàlida"';
  }

  const filtered = rows
    .filter((row) => normalizeBoolean(row[neededField]) === true)
    .filter((row) => classifyReceivedStatus(getRowValue(row, receivedFields)) !== 'SI')
    .sort((a, b) => {
      const codiA = getRowValue(a, codiFields).toString();
      const codiB = getRowValue(b, codiFields).toString();
      const nomA = getRowValue(a, nomFields).toString();
      const nomB = getRowValue(b, nomFields).toString();
      return codiA.localeCompare(codiB, 'ca', { numeric: true }) || nomA.localeCompare(nomB);
    });

  const primaryInvalidStatusRows = state.educationStage === 'PRIMARIA'
    ? rows.filter((row) => normalizeCategoryText(getRowValue(row, receivedStatusFields)) === 'INVALIDA')
    : [];
  const combinedRowsMap = new Map([...filtered, ...primaryInvalidStatusRows].map((row) => [getRowKey(row), row]));
  const combinedRows = [...combinedRowsMap.values()].sort((a, b) => {
    const codiA = getRowValue(a, codiFields).toString();
    const codiB = getRowValue(b, codiFields).toString();
    const nomA = getRowValue(a, nomFields).toString();
    const nomB = getRowValue(b, nomFields).toString();
    return codiA.localeCompare(codiB, 'ca', { numeric: true }) || nomA.localeCompare(nomB);
  });

  secondaryActionCountEl.innerHTML = `
    <span class="management-count-number block text-center text-5xl font-extrabold leading-none">${combinedRows.length}</span>
    <span class="management-count-label mt-1 block text-center text-base">centres pendents d'actuació</span>
  `;
  state.managementRows = combinedRows;

  if (!combinedRows.length) {
    secondaryActionTableEl.innerHTML = `
      <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p class="mb-2 text-6xl leading-none">😊</p>
        <p class="text-lg font-semibold text-emerald-800">Felicitats, no has de fer cap actuació</p>
      </div>
    `;
  } else {
    const body = combinedRows.map((row, index) => `
      ${(() => {
        const rowKey = getRowKey(row);
        return `
      <tr class="${index % 2 === 0 ? 'management-row-even' : 'management-row-odd'}">
        <td>${escapeHtml(getRowValue(row, codiFields))}</td>
        <td class="font-medium text-slate-800">${escapeHtml(getRowValue(row, nomFields))}</td>
        <td>${escapeHtml(row[ssttField] || '')}</td>
        <td class="text-center">${escapeHtml(getRowValue(row, requestedFields))}</td>
        <td class="text-center">${escapeHtml(getRowValue(row, receivedFields))}</td>
        ${showReceivedStatusColumn ? `<td class="text-center">${escapeHtml(getRowValue(row, receivedStatusFields))}</td>` : ''}
        ${showAssessorActionColumn ? `<td class="text-center">${escapeHtml(getRowValue(row, assessorActionFields))}</td>` : ''}
        <td>${escapeHtml(getRowValue(row, reasonFields))}</td>
        <td>${escapeHtml(getRowValue(row, notesFields))}</td>
        ${showDigitalAssessorNotesColumn ? `<td>${escapeHtml(getRowValue(row, digitalAssessorNotesFields))}</td>` : ''}
        <td>
          <button type="button" class="info-btn" data-info-key="${escapeHtml(rowKey)}" title="Més informació">i</button>
        </td>
      </tr>
    `;
      })()}
    `).join('');

    secondaryActionTableEl.innerHTML = `
    <table class="management-table text-left text-sm${state.educationStage === 'PRIMARIA' ? ' primary-management-table' : ''}">
      <thead>
        <tr>
          <th>Codi</th>
          <th>Nom</th>
          <th>SSTT</th>
          <th class="text-center">e-Valisa sol·licitada</th>
          <th class="text-center">e-Valisa rebuda</th>
          ${showReceivedStatusColumn ? '<th class="text-center">Estat e-Valisa</th>' : ''}
          ${showAssessorActionColumn ? '<th class="text-center">Acció assessors</th>' : ''}
          <th>Motiu discrepància</th>
          <th>Observacions</th>
          ${showDigitalAssessorNotesColumn ? '<th>Observacions Assesors Digitals</th>' : ''}
          <th>Info</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
  }

  if (state.educationStage !== 'PRIMARIA') {
    primaryJointActionTableSectionEl?.classList.add('hidden');
    if (primaryJointActionTableEl) primaryJointActionTableEl.innerHTML = '';
    primaryAdvisorTableSectionEl?.classList.add('hidden');
    if (primaryAdvisorTableEl) primaryAdvisorTableEl.innerHTML = '';
    return;
  }

  primaryJointActionTableSectionEl?.classList.add('hidden');
  if (primaryJointActionTableEl) primaryJointActionTableEl.innerHTML = '';

  primaryAdvisorTableSectionEl?.classList.remove('hidden');
  const firstTableKeys = new Set(combinedRows.map((row) => getRowKey(row)));
  const advisorCandidates = rows
    .filter((row) => normalizeBoolean(getRowValue(row, assessorActionFields)) !== false)
    .filter((row) => !firstTableKeys.has(getRowKey(row)))
    .sort((a, b) => {
      const codiA = getRowValue(a, codiFields).toString();
      const codiB = getRowValue(b, codiFields).toString();
      const nomA = getRowValue(a, nomFields).toString();
      const nomB = getRowValue(b, nomFields).toString();
      return codiA.localeCompare(codiB, 'ca', { numeric: true }) || nomA.localeCompare(nomB);
    });

  if (!advisorCandidates.length) {
    if (primaryAdvisorTableEl) {
      primaryAdvisorTableEl.innerHTML = `
        <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-800">
          <p class="mb-2 text-5xl leading-none">😌</p>
          <p class="text-lg font-semibold">Sembla que no hi ha errors</p>
        </div>
      `;
    }
    return;
  }

  const advisorBody = advisorCandidates.map((row, index) => {
    const rowKey = getRowKey(row);
    return `
      <tr class="${index % 2 === 0 ? 'management-row-even' : 'management-row-odd'}">
        <td>${escapeHtml(getRowValue(row, codiFields))}</td>
        <td class="font-medium text-slate-800">${escapeHtml(getRowValue(row, nomFields))}</td>
        <td>${escapeHtml(row[ssttField] || '')}</td>
        <td class="text-center">${escapeHtml(getRowValue(row, requestedFields))}</td>
        <td class="text-center">${escapeHtml(getRowValue(row, receivedFields))}</td>
        <td class="text-center">${escapeHtml(getRowValue(row, receivedStatusFields))}</td>
        <td class="text-center">${escapeHtml(getRowValue(row, assessorActionFields))}</td>
        <td>${escapeHtml(getRowValue(row, reasonFields))}</td>
        <td>${escapeHtml(getRowValue(row, notesFields))}</td>
        <td>${escapeHtml(getRowValue(row, digitalAssessorNotesFields))}</td>
        <td>
          <button type="button" class="info-btn" data-info-key="${escapeHtml(rowKey)}" title="Més informació">i</button>
        </td>
      </tr>
    `;
  }).join('');

  if (primaryAdvisorTableEl) {
    primaryAdvisorTableEl.innerHTML = `
      <table class="management-table text-left text-sm primary-management-table">
        <thead>
          <tr>
            <th>Codi</th>
            <th>Nom</th>
            <th>SSTT</th>
            <th class="text-center">e-Valisa sol·licitada</th>
            <th class="text-center">e-Valisa rebuda</th>
            <th class="text-center">Estat e-Valisa</th>
            <th class="text-center">Acció assessors</th>
            <th>Motiu discrepància</th>
            <th>Observacions</th>
            <th>Observacions Assesors Digitals</th>
            <th>Info</th>
          </tr>
        </thead>
        <tbody>${advisorBody}</tbody>
      </table>
    `;
  }
}

function renderFieldGroup(row, fields, title) {
  const entries = fields
    .map(([label, key]) => ({ label, value: row[normalizeHeader(key)] || '' }))
    .filter((item) => item.value !== '');

  if (!entries.length) return '';

  const rowsHtml = entries
    .map((item) => `
      <div class="modal-row grid grid-cols-[220px_1fr] gap-3 py-2">
        <p class="modal-key text-sm font-semibold">${escapeHtml(item.label)}</p>
        <p class="modal-value text-sm">${escapeHtml(item.value)}</p>
      </div>
    `)
    .join('');

  return `
    <section class="modal-section rounded-xl p-4">
      <h4 class="modal-section-title mb-2 text-base font-semibold">${escapeHtml(title)}</h4>
      ${rowsHtml}
    </section>
  `;
}

function openCentreInfoModal(row) {
  if (!centreInfoModalEl || !centreInfoTitleEl || !centreInfoContentEl) return;

  const nom = row[normalizeHeader('Nom')] || 'Centre';
  const codi = row[normalizeHeader('Codi')] || '';
  centreInfoTitleEl.textContent = codi ? `${nom} (${codi})` : nom;

  const principal = renderFieldGroup(row, [
    ['Codi', 'Codi'],
    ['Nom', 'Nom'],
    ['SSTT', 'SSTT'],
    ['Tipus de centre', 'TipusCentre'],
    ['Estat', 'Estat'],
  ], 'Dades principals');

  const evalisa = renderFieldGroup(row, [
    ['e-Valisa necessària', 'e-Valisa necessaria?'],
    ['e-Valisa neccesària', 'e-Valisa neccesària'],
    ['e-Valisa sol·licitada', 'e-Valisa sol·licitada'],
    ['e-Valisa rebuda', 'e-Valisa rebuda'],
    ['Estat e-Valisa', 'Estat e-Valisa'],
  ], 'Estat e-Valisa');

  const operativa = renderFieldGroup(row, [
    ['Excedent', 'Excedent'],
    ['Incidental pendent', 'Incidental pendent'],
    ['Equips a recollir', 'Equips a recollir a la visita (excedents mès averiats)'],
    ['Motiu discrepància', 'MOTIU discrepancia'],
    ['Observacions', 'observacions'],
  ], 'Operativa');

  const usedKeys = new Set([
    'Codi',
    'Nom',
    'SSTT',
    'TipusCentre',
    'Estat',
    'e-Valisa necessaria?',
    'e-Valisa neccesària',
    'e-Valisa sol·licitada',
    'e-Valisa rebuda',
    'Estat e-Valisa',
    'Excedent',
    'Incidental pendent',
    'Equips a recollir a la visita (excedents mès averiats)',
    'MOTIU discrepancia',
    'observacions',
  ].map((key) => normalizeHeader(key)));

  const allEntries = Object.entries(row)
    .filter(([key]) => !usedKeys.has(normalizeHeader(key)))
    .filter(([, value]) => value !== '')
    .map(([key, value]) => `
      <tr class="modal-row">
        <td class="modal-key px-3 py-2 text-sm font-medium">${escapeHtml(key)}</td>
        <td class="modal-value px-3 py-2 text-sm">${escapeHtml(value)}</td>
      </tr>
    `)
    .join('');

  centreInfoContentEl.innerHTML = `
    <div class="space-y-4">
      ${principal}
      ${evalisa}
      ${operativa}
      <section class="modal-section rounded-xl p-4">
        <h4 class="modal-section-title mb-2 text-base font-semibold">Més informació del centre</h4>
        <div class="overflow-x-auto">
          <table class="min-w-full text-left">
            <tbody>${allEntries}</tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  centreInfoModalEl.classList.remove('hidden');
  centreInfoModalEl.classList.add('flex');
}

function closeCentreInfoModal() {
  if (!centreInfoModalEl) return;
  centreInfoModalEl.classList.add('hidden');
  centreInfoModalEl.classList.remove('flex');
}

function openAboutModal() {
  if (!aboutModalEl) return;
  aboutModalEl.classList.remove('hidden');
  aboutModalEl.classList.add('flex');
}

function closeAboutModal() {
  if (!aboutModalEl) return;
  aboutModalEl.classList.add('hidden');
  aboutModalEl.classList.remove('flex');
}

function renderAll(rows) {
  renderSummary(rows);
  renderSecondaryActionView(rows);
  renderReceivedVsTotalChart(rows);
  renderNeededReceivedDonutChart(rows);
  renderNeededVsReceivedBySsttChart(rows);
  renderNeededReceivedTable(rows);
  renderYesNoTable(rows);
}

function showDashboard() {
  dashboardEl.classList.remove('hidden');
  emptyStateEl.classList.add('hidden');
}

if (fileInput) {
  fileInput.addEventListener('change', async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;

    const { rows } = await readCsvWithEncodingFallback(file);
    if (!rows.length) {
      fileStatusEl.textContent = `Fitxer sense dades vàlides: ${file.name}`;
      return;
    }

    const detectedStage = detectFileStageFromNames(rows);
    if (detectedStage && detectedStage !== state.educationStage) {
      if (state.educationStage === 'PRIMARIA') {
        openStageMismatchModal("Aquest fitxer no és correcte, ja que és de Secundària.");
      } else {
        openStageMismatchModal("Aquest fitxer no és correcte, ja que és de Primària.");
      }
      fileInput.value = '';
      return;
    }

    state.rowsByStage[state.educationStage] = rows;
    state.fileNameByStage[state.educationStage] = file.name;
    state.selectedSsttByStage[state.educationStage] = '';
    renderActiveStageData();
  });
}

globalSsttFilterEl?.addEventListener('change', (event) => {
  state.selectedSsttByStage[state.educationStage] = event.target.value;
  renderActiveStageData();
});

viewManagementBtn?.addEventListener('click', () => setActiveView('MANAGEMENT'));
viewChartsBtn?.addEventListener('click', () => setActiveView('GRAPHS'));

secondaryActionTableEl?.addEventListener('click', (event) => {
  const target = event.target.closest('[data-info-key]');
  if (!target) return;
  const rowKey = target.dataset.infoKey;
  const row = state.managementRowsByKey.get(rowKey);
  if (!row) return;
  openCentreInfoModal(row);
});

primaryAdvisorTableEl?.addEventListener('click', (event) => {
  const target = event.target.closest('[data-info-key]');
  if (!target) return;
  const rowKey = target.dataset.infoKey;
  const row = state.managementRowsByKey.get(rowKey);
  if (!row) return;
  openCentreInfoModal(row);
});

primaryJointActionTableEl?.addEventListener('click', (event) => {
  const target = event.target.closest('[data-info-key]');
  if (!target) return;
  const rowKey = target.dataset.infoKey;
  const row = state.managementRowsByKey.get(rowKey);
  if (!row) return;
  openCentreInfoModal(row);
});

closeCentreInfoBtn?.addEventListener('click', closeCentreInfoModal);
centreInfoModalEl?.addEventListener('click', (event) => {
  if (event.target === centreInfoModalEl) closeCentreInfoModal();
});
appInfoBtn?.addEventListener('click', openAboutModal);
closeAboutModalBtn?.addEventListener('click', closeAboutModal);
aboutModalEl?.addEventListener('click', (event) => {
  if (event.target === aboutModalEl) closeAboutModal();
});
closeStageMismatchBtn?.addEventListener('click', closeStageMismatchModal);
stageMismatchModalEl?.addEventListener('click', (event) => {
  if (event.target === stageMismatchModalEl) closeStageMismatchModal();
});

secondaryModuleBtn?.addEventListener('click', () => {
  setEducationStage('SECUNDARIA');
});

primaryModuleBtn?.addEventListener('click', () => {
  setEducationStage('PRIMARIA');
});

setEducationStage('SECUNDARIA');
