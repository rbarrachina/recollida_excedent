const ASSET_VERSION = new URL(import.meta.url).searchParams.get('v') || window.APP_ASSET_VERSION || Date.now();
const [
  { createScManagementController },
  { createManagementMapController },
  {
    createFitxaService,
    normalizeCentreCode,
    normalizeFitxaWebUrl,
    SOCRATA_SOURCE_URL,
  },
  { normalizeUtmCoordinatePair, utmToLatLon },
] = await Promise.all([
  import(`./sc-management.js?v=${ASSET_VERSION}`),
  import(`./management-map.js?v=${ASSET_VERSION}`),
  import(`./utils/fitxa.js?v=${ASSET_VERSION}`),
  import(`./utils/geo.js?v=${ASSET_VERSION}`),
]);

const state = {
  educationStage: 'PRIMARIA',
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
  errorDetectionSubView: 'PENDING_0_4',
  managementRowsByKey: new Map(),
  pendingActionRowsByStage: {
    SECUNDARIA: [],
    PRIMARIA: [],
  },
  sentEvalisaCheckByStage: {
    SECUNDARIA: { fileName: '', names: [] },
    PRIMARIA: { fileName: '', names: [] },
  },
  ruralRenderRequestId: 0,
  charts: {
    receivedVsTotal: null,
    neededReceivedDonut: null,
    neededVsReceivedBySstt: null,
    primaryCallStatusDonut: null,
  },
};

const fileInput = document.getElementById('fileInput');
const fileStatusEl = document.getElementById('fileStatus');
const emptyStateEl = document.getElementById('emptyState');
const dashboardEl = document.getElementById('dashboard');
const secondaryModuleBtn = document.getElementById('secondaryModuleBtn');
const primaryModuleBtn = document.getElementById('primaryModuleBtn');
const appInfoBtn = document.getElementById('appInfoBtn');
const stageInlineLabelEl = document.getElementById('stageInlineLabel');
const globalSsttFilterEl = document.getElementById('globalSsttFilter');
const selectedSsttDisplayEl = document.getElementById('selectedSsttDisplay');
const viewManagementBtn = document.getElementById('viewManagementBtn');
const viewChartsBtn = document.getElementById('viewChartsBtn');
const viewScManagementBtn = document.getElementById('viewScManagementBtn');
const viewErrorDetectionBtn = document.getElementById('viewErrorDetectionBtn');
const errorDetectionPendingBtn = document.getElementById('errorDetectionPendingBtn');
const errorDetectionPendingNoEvalisaBtn = document.getElementById('errorDetectionPendingNoEvalisaBtn');
const errorDetectionAdvisorBtn = document.getElementById('errorDetectionAdvisorBtn');
const errorDetectionRuralBtn = document.getElementById('errorDetectionRuralBtn');
const errorDetectionSentCheckBtn = document.getElementById('errorDetectionSentCheckBtn');
const sentEvalisaInput = document.getElementById('sentEvalisaInput');
const fileTriggerEl = document.querySelector('label[for="fileInput"]');
const summaryCardsEl = document.getElementById('summaryCards');
const chartsGridSectionEl = document.getElementById('chartsGridSection');
const primaryCallChartCardEl = document.getElementById('primaryCallChartCard');
const bySsttSectionEl = document.getElementById('bySsttSection');
const neededReceivedSectionEl = document.getElementById('neededReceivedSection');
const yesNoSectionEl = document.getElementById('yesNoSection');
const scManagementSectionEl = document.getElementById('scManagementSection');
const errorDetectionSectionEl = document.getElementById('errorDetectionSection');
const errorDetectionSubtitleEl = document.getElementById('errorDetectionSubtitle');
const errorDetectionCountEl = document.getElementById('errorDetectionCount');
const errorDetectionTableEl = document.getElementById('errorDetectionTable');
const scMapEl = document.getElementById('scMap');
const scCentreCountEl = document.getElementById('scCentreCount');
const scExcedentsTotalEl = document.getElementById('scExcedentsTotal');
const scRetiredTotalEl = document.getElementById('scRetiredTotal');
const scToRetireTotalEl = document.getElementById('scToRetireTotal');
const scCentreNameEl = document.getElementById('scCentreName');
const scCentreMetaEl = document.getElementById('scCentreMeta');
const secondaryActionSectionEl = document.getElementById('secondaryActionSection');
const managementSectionTitleEl = document.getElementById('managementSectionTitle');
const managementSectionSubtitleEl = document.getElementById('managementSectionSubtitle');
const secondaryActionCountEl = document.getElementById('secondaryActionCount');
const secondaryActionTableEl = document.getElementById('secondaryActionTable');
const primaryAdvisorTableSectionEl = document.getElementById('primaryAdvisorTableSection');
const primaryAdvisorTableEl = document.getElementById('primaryAdvisorTable');
const centreInfoModalEl = document.getElementById('centreInfoModal');
const centreInfoTitleEl = document.getElementById('centreInfoTitle');
const centreInfoContentEl = document.getElementById('centreInfoContent');
const closeCentreInfoBtn = document.getElementById('closeCentreInfoBtn');
const centreSheetModalEl = document.getElementById('centreSheetModal');
const centreSheetTitleEl = document.getElementById('centreSheetTitle');
const centreSheetContentEl = document.getElementById('centreSheetContent');
const closeCentreSheetBtn = document.getElementById('closeCentreSheetBtn');
const centreMapModalEl = document.getElementById('centreMapModal');
const closeCentreMapBtn = document.getElementById('closeCentreMapBtn');
const centreMapFrameEl = document.getElementById('centreMapFrame');
const openCentreMapLinkEl = document.getElementById('openCentreMapLink');
const centreMapCoordsLabelEl = document.getElementById('centreMapCoordsLabel');
const managementMapModalEl = document.getElementById('managementMapModal');
const managementMapEl = document.getElementById('managementMap');
const managementMapSummaryEl = document.getElementById('managementMapSummary');
const closeManagementMapBtn = document.getElementById('closeManagementMapBtn');
const aboutModalEl = document.getElementById('aboutModal');
const closeAboutModalBtn = document.getElementById('closeAboutModalBtn');
const stageMismatchModalEl = document.getElementById('stageMismatchModal');
const closeStageMismatchBtn = document.getElementById('closeStageMismatchBtn');
const stageMismatchTextEl = document.getElementById('stageMismatchText');
const yesNoTableEl = document.getElementById('yesNoTable');
const neededReceivedTableEl = document.getElementById('neededReceivedTable');
const { fetchFitxaByCode, fetchCentreCandidatesByTown } = createFitxaService();
const scManagementController = createScManagementController({
  scManagementSectionEl,
  scMapEl,
  scCentreCountEl,
  scExcedentsTotalEl,
  scRetiredTotalEl,
  scToRetireTotalEl,
  scCentreNameEl,
  scCentreMetaEl,
  normalizeHeader,
  normalizeBoolean,
  fetchFitxaByCode,
});
const managementMapController = createManagementMapController({
  managementMapModalEl,
  managementMapEl,
  managementMapSummaryEl,
  closeManagementMapBtn,
  fetchFitxaByCode,
  getRowValue,
  normalizeHeader,
  normalizeBoolean,
  escapeHtml,
});

const receivedVsTotalCtx = document.getElementById('receivedVsTotalChart').getContext('2d');
const neededReceivedDonutCtx = document.getElementById('neededReceivedDonutChart').getContext('2d');
const primaryCallStatusCtx = document.getElementById('primaryCallStatusChart')?.getContext('2d');
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
const RURAL_SCHOOL_SOURCE_URL = 'https://xtec.gencat.cat/ca/curriculum/escolarural/sobre-les-escoles-rurals/websescoles/';
const RURAL_TERRITORY_SSTT = {
  'Alt Pirineu i Aran': ['APA'],
  'Barcelona comarques': ['BLL', 'BNS'],
  'Catalunya central': ['CCE'],
  'Girona': ['GIR'],
  'Lleida': ['LLE'],
  'Maresme-Vallès Oriental': ['MVO'],
  'Penedès': ['PEN'],
  'Tarragona': ['TAR'],
  "Terres de l'Ebre": ['TEB'],
  'Vallès Occidental': ['VOC'],
};
const RURAL_SCHOOL_REFERENCES = [
  { name: 'ESC Estudi Alejandro Casona', town: 'Les', territory: 'Alt Pirineu i Aran' },
  { name: 'ESC Jaume I', town: 'Llívia', territory: 'Alt Pirineu i Aran' },
  { name: 'ESC Ridolaina', town: 'Montellà i Martinet', territory: 'Alt Pirineu i Aran' },
  { name: 'ESC Rosa Campà', town: 'Montferrer i Castellbó', territory: 'Alt Pirineu i Aran' },
  { name: 'ESC Sant Ròc', town: 'Bossòst', territory: 'Alt Pirineu i Aran' },
  { name: 'ESC El Roure', town: 'Pontons', territory: 'Barcelona comarques' },
  { name: 'ESC La Cabana', town: 'Les Cabanyes', territory: 'Barcelona comarques' },
  { name: 'ESC Ràfols', town: 'Torrelavit', territory: 'Barcelona comarques' },
  { name: "ESC L'Agullola", town: 'Rupit i Pruit', territory: 'Catalunya central' },
  { name: 'ESC Comtes de Lacambra', town: 'Les Masies de Voltregà', territory: 'Catalunya central' },
  { name: 'ESC La Monjoia', town: 'Sant Bartomeu del Grau', territory: 'Catalunya central' },
  { name: 'ESC Lillet A. Güell', town: 'La Pobla de Lillet', territory: 'Catalunya central' },
  { name: 'ESC Lluçanès', town: 'Prats de Lluçanès', territory: 'Catalunya central' },
  { name: 'ESC Muntanyola', town: 'Muntanyola', territory: 'Catalunya central' },
  { name: 'ESC Princesa Làscaris', town: 'Casserres', territory: 'Catalunya central' },
  { name: 'ESC Sant Marc', town: 'Gironella', territory: 'Catalunya central' },
  { name: 'ESC Sant Llorenç', town: 'Guardiola de Berguedà', territory: 'Catalunya central' },
  { name: 'ESC Sant Salvador', town: 'Cercs', territory: 'Catalunya central' },
  { name: "ESC Sesmón d'Oló", town: "Santa Maria d'Oló", territory: 'Catalunya central' },
  { name: 'ESC Terra Nostra', town: 'Olost', territory: 'Catalunya central' },
  { name: 'ESC de la Valldan', town: 'Berga', territory: 'Catalunya central' },
  { name: 'ESC Valldeneu', town: 'Sant Martí de Centelles', territory: 'Catalunya central' },
  { name: 'ESC de Vilanova de Sau', town: 'Vilanova de Sau', territory: 'Catalunya central' },
  { name: 'ESC Vall de Lord', town: 'Sant Llorenç de Morunys', territory: 'Catalunya central' },
  { name: 'ESC Alguema', town: "Santa Llogaia d'Alguema", territory: 'Girona' },
  { name: 'ESC de Cabanes', town: 'Cabanes', territory: 'Girona' },
  { name: 'ESC Carles de Fortuny', town: 'Esponellà', territory: 'Girona' },
  { name: "ESC del Far d'Empordà", town: "El Far d'Empordà", territory: 'Girona' },
  { name: 'ESC Finestres', town: 'Mieres', territory: 'Girona' },
  { name: 'ESC Fluvianets', town: "L'Armentera", territory: 'Girona' },
  { name: 'ESC Joan Maragall', town: 'Santa Pau', territory: 'Girona' },
  { name: 'ESC La Vall', town: 'Osor', territory: 'Girona' },
  { name: 'ESC de Lliurona', town: 'Beuda', territory: 'Girona' },
  { name: 'ESC Lluís Castells', town: 'Riudaura', territory: 'Girona' },
  { name: 'ESC Maria Pagès i Trayter', town: 'Ordis', territory: 'Girona' },
  { name: 'ESC Montserrat Vayreda i Trullol', town: 'Lladó', territory: 'Girona' },
  { name: "ESC l'Olivar Vell", town: 'Begur', territory: 'Girona' },
  { name: 'ESC Pau', town: 'Pau', territory: 'Girona' },
  { name: 'ESC Sant Andreu de Borrassà', town: 'Borrassà', territory: 'Girona' },
  { name: 'ESC de Sant Esteve de Guialbes', town: 'Vilademuls', territory: 'Girona' },
  { name: 'ESC Sant Jaume', town: 'Portbou', territory: 'Girona' },
  { name: 'ESC Sant Jordi', town: 'Sant Jordi Desvalls', territory: 'Girona' },
  { name: 'ESC Teresa de Pallejà', town: 'Fortià', territory: 'Girona' },
  { name: "ESC Torre d'en Reig", town: 'Vilabertran', territory: 'Girona' },
  { name: 'ESC Vallgarriga', town: 'Sant Miquel de Fluvià', territory: 'Girona' },
  { name: 'ESC Vilademany', town: 'Aiguaviva', territory: 'Girona' },
  { name: 'ESC Marinada', town: 'Vilanova de Bellpuig', territory: 'Lleida' },
  { name: "ESC Minyons d'Urgell", town: 'Fondarella', territory: 'Lleida' },
  { name: 'ESC Francesc Macià', town: 'Òrrius', territory: 'Maresme-Vallès Oriental' },
  { name: "ESC d'Hortasavinyà", town: 'Tordera', territory: 'Maresme-Vallès Oriental' },
  { name: 'ESC Montmany', town: 'Figaró-Montmany', territory: 'Maresme-Vallès Oriental' },
  { name: 'ESC Santa Agnès de Malanyanes', town: 'La Roca del Vallès', territory: 'Maresme-Vallès Oriental' },
  { name: 'ESC Josep Nin', town: 'Salomó', territory: 'Tarragona' },
  { name: 'ESC La Plana', town: 'Vila-seca', territory: 'Tarragona' },
  { name: 'ESC de La Riba', town: 'La Riba', territory: 'Tarragona' },
  { name: 'ESC Les Moreres', town: 'Aiguamúrcia', territory: 'Tarragona' },
  { name: 'ESC de Maspujols', town: 'Maspujols', territory: 'Tarragona' },
  { name: 'ESC Santa Marina', town: 'Pratdip', territory: 'Tarragona' },
  { name: 'ESC Sant Miquel', town: 'Aiguamúrcia', territory: 'Tarragona' },
  { name: 'ESC Teresa Godes i Domènech', town: 'El Montmell', territory: 'Tarragona' },
  { name: 'ESC Valdelors', town: "Vandellòs i l'Hospitalet de l'Infant", territory: 'Tarragona' },
  { name: 'ESC Marcel·lí Domingo', town: 'Tivissa', territory: "Terres de l'Ebre" },
  { name: 'ESC Montsagre', town: 'Horta de Sant Joan', territory: "Terres de l'Ebre" },
  { name: 'ESC de Xerta', town: 'Xerta', territory: "Terres de l'Ebre" },
  { name: 'ESC Rellinars', town: 'Rellinars', territory: 'Vallès Occidental' },
];

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

function normalizeSchoolNameForMatch(value) {
  return normalizeCategoryText(value)
    .replace(/\b(ESC|ESCOLA|CEIP|COL LEGI|COLLEGI)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSchoolNameKeys(value) {
  const base = normalizeSchoolNameForMatch(value);
  const withoutLeadingArticle = base.replace(/^(DE LA|DE L|DEL|DE|D|LA|L|EL|ELS|LES)\s+/, '').trim();
  return new Set([base, withoutLeadingArticle].filter(Boolean));
}

function normalizeCodeForMatch(value) {
  const digits = String(value || '').replace(/\D+/g, '');
  return digits.replace(/^0+/, '') || digits;
}

function getSchoolNameTokens(value) {
  return normalizeSchoolNameForMatch(value)
    .split(' ')
    .filter((token) => token.length >= 3 && !['DEL', 'DE', 'LA', 'EL', 'LES', 'ELS', 'SANT', 'SANTA'].includes(token));
}

function schoolNamesAreSimilar(...names) {
  const tokenSets = names
    .filter(Boolean)
    .map((name) => new Set(getSchoolNameTokens(name)));
  if (tokenSets.length < 2 || tokenSets.some((tokens) => !tokens.size)) return false;
  const [first, ...rest] = tokenSets;
  return rest.every((tokens) => [...first].some((token) => tokens.has(token)));
}

function getRuralReferenceSstt(reference) {
  return RURAL_TERRITORY_SSTT[reference.territory] || [];
}

function ruralReferenceMatchesSstt(reference, sstt) {
  const referenceSstt = getRuralReferenceSstt(reference);
  if (!referenceSstt.length || !sstt) return false;
  return referenceSstt.includes(String(sstt).trim());
}

function filterRuralReferencesByXtecSstt(selectedSstt) {
  if (!selectedSstt || selectedSstt === 'ALL') return RURAL_SCHOOL_REFERENCES;
  return RURAL_SCHOOL_REFERENCES.filter((reference) => getRuralReferenceSstt(reference).includes(selectedSstt));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeFitxaPhoneNumber(value) {
  const raw = String(value || '').trim();
  if (!raw || raw === '-' || raw === '0') return '';
  const compact = raw.replace(/\s+/g, '');
  const sanitized = compact.replace(/[^\d+]/g, '');
  if (!sanitized) return '';
  const plusCount = (sanitized.match(/\+/g) || []).length;
  if (plusCount > 1) return '';
  if (plusCount === 1 && !sanitized.startsWith('+')) return '';
  const digitsOnly = sanitized.replaceAll('+', '');
  if (digitsOnly.length < 6) return '';
  return sanitized;
}

function getTextValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}


function closeCentreMapModal() {
  if (!centreMapModalEl || !centreMapFrameEl) return;
  centreMapModalEl.classList.add('hidden');
  centreMapModalEl.classList.remove('flex');
  centreMapFrameEl.src = '';
}

function openCentreMapModal(xValue, yValue) {
  if (!centreMapModalEl || !centreMapFrameEl || !openCentreMapLinkEl || !centreMapCoordsLabelEl) return;
  const { x, y } = normalizeUtmCoordinatePair(xValue, yValue);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  const converted = utmToLatLon(31, x, y, true);
  const { lat, lon } = converted;
  const bbox = `${lon - 0.01}%2C${lat - 0.01}%2C${lon + 0.01}%2C${lat + 0.01}`;
  const marker = `${lat}%2C${lon}`;
  centreMapFrameEl.src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
  openCentreMapLinkEl.href = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;
  centreMapCoordsLabelEl.textContent = `X: ${xValue} | Y: ${yValue} | Lat: ${lat.toFixed(6)} | Lon: ${lon.toFixed(6)}`;
  centreMapModalEl.classList.remove('hidden');
  centreMapModalEl.classList.add('flex');
}

function buildFitxaCellValue(label, value) {
  const safeValue = value || '';
  const isEmailField = /correu/i.test(label) && /@/.test(safeValue);
  const isPhoneField = /telef|tel[eè]fon/i.test(label);
  const isWebField = /url|web/i.test(label);
  const phoneNumber = isPhoneField ? normalizeFitxaPhoneNumber(safeValue) : '';
  const webUrl = isWebField ? normalizeFitxaWebUrl(safeValue) : '';
  const escaped = escapeHtml(safeValue);

  if (isEmailField) {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(safeValue)}`;
    return `<div class="fitxa-inline-actions"><span>${escaped}</span><button class="fitxa-gmail-btn fitxa-btn-secondary" data-gmail-url="${escapeHtml(gmailUrl)}" type="button">Gmail</button><button class="fitxa-copy-btn fitxa-btn-primary" data-copy="${escaped}" type="button">Copiar</button></div>`;
  }
  if (phoneNumber) {
    const safePhone = escapeHtml(phoneNumber);
    return `<div class="fitxa-inline-actions"><span>${escaped}</span><button class="fitxa-call-btn fitxa-btn-secondary" data-call-number="${safePhone}" type="button">Trucar</button><button class="fitxa-phone-copy-btn fitxa-btn-primary" data-copy-phone="${safePhone}" type="button">Copiar</button></div>`;
  }
  if (webUrl) {
    const normalizedUrl = /^https?:\/\//i.test(webUrl) ? webUrl : `http://${webUrl}`;
    return `<div class="fitxa-inline-actions"><span>${escaped}</span><button class="fitxa-web-btn fitxa-btn-secondary" data-open-url="${escapeHtml(normalizedUrl)}" type="button">Web</button></div>`;
  }

  return escaped;
}

function buildFitxaTableRows(data) {
  const fields = { ...(data.fields || {}) };
  const rows = [];
  const pullFieldByLabel = (labels) => {
    for (const label of labels) {
      if (!(label in fields)) continue;
      const value = fields[label];
      delete fields[label];
      return Array.isArray(value) ? value.map((item) => String(item ?? '')).join(' | ') : String(value ?? '');
    }
    return '';
  };

  const emailValue = pullFieldByLabel([
    'Correu electrònic del centre',
    'Correu electrònic departamental',
    'Correu electronic del centre',
  ]);
  const phoneValue = pullFieldByLabel([
    'Telèfon del centre',
    'Telefon del centre',
  ]);
  const webValue = pullFieldByLabel([
    'URL pàgina web centre',
    'URL pagina web centre',
    'Web',
    'URL',
  ]);
  const addressValue = pullFieldByLabel([
    'Adreça',
    'Adreca',
  ]);
  const townValue = pullFieldByLabel([
    'Població',
    'Poblacio',
    'Localitat',
    'Nom municipi',
  ]);
  const natureValue = pullFieldByLabel([
    'Naturalesa',
  ]);
  const anyValue = pullFieldByLabel([
    'Any',
  ]);
  const cursValue = pullFieldByLabel([
    'Curs',
  ]);

  rows.push(`<tr><th>Codi centre</th><td>${escapeHtml((data.centre && data.centre.code) || data.requestedCode || '')}</td></tr>`);
  rows.push(`<tr><th>Nom centre</th><td>${escapeHtml((data.centre && data.centre.name) || '')}</td></tr>`);
  rows.push(`<tr><th>Correu electrònic del centre</th><td>${buildFitxaCellValue('Correu electrònic del centre', emailValue || '-')}</td></tr>`);
  rows.push(`<tr><th>Telèfon del centre</th><td>${buildFitxaCellValue('Telèfon del centre', phoneValue || '-')}</td></tr>`);
  rows.push(`<tr><th>URL pàgina web centre</th><td>${buildFitxaCellValue('URL pàgina web centre', webValue || '-')}</td></tr>`);
  rows.push(`<tr><th>Adreça</th><td>${buildFitxaCellValue('Adreça', addressValue || '-')}</td></tr>`);
  rows.push(`<tr><th>Població</th><td>${buildFitxaCellValue('Població', townValue || '-')}</td></tr>`);

  if (data.coordinates && data.coordinates.x && data.coordinates.y) {
    const coordText = fields.Coordenades || `${data.coordinates.x} X | ${data.coordinates.y} Y`;
    rows.push(
      `<tr><th>Coordenades</th><td><div class="fitxa-inline-actions"><span>${escapeHtml(coordText)}</span><button class="fitxa-map-btn fitxa-btn-secondary" type="button" data-map-x="${escapeHtml(data.coordinates.x)}" data-map-y="${escapeHtml(data.coordinates.y)}">Veure mapa</button></div></td></tr>`,
    );
  }
  if (natureValue) {
    rows.push(`<tr><th>Naturalesa</th><td>${buildFitxaCellValue('Naturalesa', natureValue)}</td></tr>`);
  }

  let insertedAnyAndCurs = false;
  Object.entries(fields).forEach(([label, value]) => {
    if (label === 'Coordenades') return;
    const displayValue = Array.isArray(value) ? value.join(' | ') : String(value ?? '');
    rows.push(`<tr><th>${escapeHtml(label)}</th><td>${buildFitxaCellValue(label, displayValue)}</td></tr>`);
    if (label === 'Coordenada Geo Y') {
      if (anyValue) rows.push(`<tr><th>Any</th><td>${buildFitxaCellValue('Any', anyValue)}</td></tr>`);
      if (cursValue) rows.push(`<tr><th>Curs</th><td>${buildFitxaCellValue('Curs', cursValue)}</td></tr>`);
      insertedAnyAndCurs = true;
    }
  });

  if (!insertedAnyAndCurs) {
    if (anyValue) rows.push(`<tr><th>Any</th><td>${buildFitxaCellValue('Any', anyValue)}</td></tr>`);
    if (cursValue) rows.push(`<tr><th>Curs</th><td>${buildFitxaCellValue('Curs', cursValue)}</td></tr>`);
  }

  return rows.join('');
}

function renderCentreSheetLoading(code, rowName) {
  if (!centreSheetContentEl) return;
  centreSheetContentEl.innerHTML = `
    <p class="fitxa-sheet-status">Carregant la fitxa del centre...</p>
    <div class="fitxa-sheet-table-wrap">
      <table class="fitxa-sheet-table">
        <tbody>
          <tr><th>Codi centre</th><td>${escapeHtml(code || '-')}</td></tr>
          <tr><th>Nom centre</th><td>${escapeHtml(rowName || '-')}</td></tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderCentreSheetData(data) {
  if (!centreSheetContentEl) return;
  const isError = data.status !== 'ok';
  centreSheetContentEl.innerHTML = `
    ${isError ? `<p class="fitxa-sheet-status error">${escapeHtml(data.message || "No s'ha pogut carregar la fitxa del centre.")}</p>` : ''}
    <p class="fitxa-sheet-meta">Font: <a href="${escapeHtml(data.sourceUrl || SOCRATA_SOURCE_URL)}" target="_blank" rel="noopener noreferrer">${escapeHtml(data.sourceUrl || SOCRATA_SOURCE_URL)}</a></p>
    <div class="fitxa-sheet-table-wrap">
      <table class="fitxa-sheet-table">
        <tbody>${buildFitxaTableRows(data)}</tbody>
      </table>
    </div>
  `;
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
      const normalizedKey = normalizeHeader(header);
      let value = (cols[index] || '').trim();
      if (normalizedKey === normalizeHeader('Codi')) {
        value = normalizeCentreCode(value);
      }
      row[normalizedKey] = value;
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
    const mojibakeCount = (text.match(/Ã.|Â.|â.|ð.|ï»¿/g) || []).length;
    const score = rows.length * 1000 - (replacementCount * 100) - (mojibakeCount * 500);

    if (score > bestScore) {
      bestText = text;
      bestRows = rows;
      bestEncoding = encoding;
      bestScore = score;
    }
  }

  return { text: bestText, rows: bestRows, encoding: bestEncoding };
}

function parseFirstColumnCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  if (!lines.length) return [];

  const countDelimiter = (line, delimiter) => splitCsvLine(line, delimiter).length;
  const delimiter = countDelimiter(lines[0], ';') >= countDelimiter(lines[0], ',') ? ';' : ',';
  const values = lines
    .map((line) => (splitCsvLine(line, delimiter)[0] || '').trim())
    .filter(Boolean);

  const [first, ...rest] = values;
  if (first && /^(nom|centre|nom centre|nom del centre|escola)$/i.test(normalizeHeader(first))) {
    return rest;
  }
  return values;
}

async function readFirstColumnCsvWithEncodingFallback(file) {
  const buffer = await file.arrayBuffer();
  const encodings = ['utf-8', 'windows-1252', 'iso-8859-1'];
  let bestNames = [];
  let bestEncoding = encodings[0];
  let bestScore = -1;

  for (const encoding of encodings) {
    const text = new TextDecoder(encoding).decode(buffer);
    const names = parseFirstColumnCsv(text);
    const replacementCount = (text.match(/\uFFFD/g) || []).length;
    const mojibakeCount = (text.match(/Ã.|Â.|â.|ð.|ï»¿/g) || []).length;
    const score = names.length * 1000 - (replacementCount * 100) - (mojibakeCount * 500);
    if (score > bestScore) {
      bestNames = names;
      bestEncoding = encoding;
      bestScore = score;
    }
  }

  return { names: bestNames, encoding: bestEncoding };
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
  const showManagement = state.activeView === 'MANAGEMENT' || state.activeView === 'SC_MANAGEMENT' || state.activeView === 'ERROR_DETECTION';
  const showCharts = state.activeView === 'GRAPHS';
  const showScManagement = state.activeView === 'SC_MANAGEMENT';
  const showErrorDetection = state.activeView === 'ERROR_DETECTION';
  const showScButton = true;
  const showErrorButton = true;

  secondaryActionSectionEl?.classList.toggle('hidden', !showManagement || showScManagement || showErrorDetection);
  scManagementSectionEl?.classList.toggle('hidden', !showScManagement);
  errorDetectionSectionEl?.classList.toggle('hidden', !showErrorDetection);
  summaryCardsEl?.classList.toggle('hidden', !showCharts);
  chartsGridSectionEl?.classList.toggle('hidden', !showCharts);
  bySsttSectionEl?.classList.toggle('hidden', !showCharts);
  neededReceivedSectionEl?.classList.toggle('hidden', !showCharts);
  yesNoSectionEl?.classList.toggle('hidden', !showCharts);

  viewManagementBtn?.classList.toggle('active', state.activeView === 'MANAGEMENT');
  viewChartsBtn?.classList.toggle('active', showCharts);
  viewScManagementBtn?.classList.toggle('hidden', !showScButton);
  viewScManagementBtn?.classList.toggle('active', showScManagement);
  viewErrorDetectionBtn?.classList.toggle('hidden', !showErrorButton);
  viewErrorDetectionBtn?.classList.toggle('active', showErrorDetection);
  errorDetectionPendingBtn?.classList.toggle('active', state.errorDetectionSubView === 'PENDING_0_4');
  errorDetectionPendingNoEvalisaBtn?.classList.toggle('active', state.errorDetectionSubView === 'PENDING_5_NO_EVALISA');
  errorDetectionAdvisorBtn?.classList.toggle('active', state.errorDetectionSubView === 'ADVISOR_YES');
  errorDetectionRuralBtn?.classList.toggle('active', state.errorDetectionSubView === 'RURAL_ZER');
  errorDetectionSentCheckBtn?.classList.toggle('active', state.errorDetectionSubView === 'SENT_EVALISA_CHECK');

  if (showScManagement) {
    renderScManagementView();
  }
  if (showErrorDetection) {
    renderErrorDetectionView();
  }
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
    fileStatusEl.textContent = '';
    return;
  }

  renderAll(filteredRows);
  showDashboard();
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
  updateChartsLayoutForStage();
  state.activeView = 'MANAGEMENT';
  if (stageInlineLabelEl) {
    stageInlineLabelEl.textContent = getActiveStageConfig().stageLabel;
  }

  if (fileInput) fileInput.disabled = false;
  fileTriggerEl?.classList.remove('disabled');

  renderActiveStageData();
  applyActiveView();
}

function updateChartsLayoutForStage() {
  primaryCallChartCardEl?.classList.remove('hidden');
  chartsGridSectionEl?.classList.remove('lg:grid-cols-2');
  chartsGridSectionEl?.classList.add('lg:grid-cols-3');
}

function renderScManagementView() {
  const stageConfig = getActiveStageConfig();
  const rows = state.rowsByStage[state.educationStage] || [];
  const filteredRows = getFilteredRowsByGlobalSstt(rows);
  scManagementController.render(filteredRows, {
    stage: state.educationStage,
    neededField: stageConfig.summary.neededField,
    receivedField: stageConfig.summary.receivedField,
  });
}

function parseNumericField(row, candidateFields) {
  if (!row) return 0;
  const normalizedFields = candidateFields.map((field) => normalizeHeader(field));

  for (const field of normalizedFields) {
    const rawValue = row[field];
    if (rawValue === null || rawValue === undefined || rawValue === '') continue;
    const normalized = String(rawValue).replace(',', '.').trim();
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
    const extractedNumber = normalized.match(/-?\d+(?:\.\d+)?/);
    if (extractedNumber) {
      const extractedParsed = Number(extractedNumber[0]);
      if (Number.isFinite(extractedParsed)) return extractedParsed;
    }
  }

  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeHeader(key);
    const matchesCandidate = normalizedFields.some((field) => normalizedKey === field || normalizedKey.includes(field));
    if (!matchesCandidate) continue;
    const normalized = String(value ?? '').replace(',', '.').trim();
    if (!normalized) continue;
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
    const extractedNumber = normalized.match(/-?\d+(?:\.\d+)?/);
    if (extractedNumber) {
      const extractedParsed = Number(extractedNumber[0]);
      if (Number.isFinite(extractedParsed)) return extractedParsed;
    }
  }

  return 0;
}

function parseRetiredLaptopsTotal(row) {
  return parseNumericField(row, [
    'PortatilsRetiratsTotal',
    'portatilsretiratstotal',
    'Portàtils retirats total',
    'Portatils retirats total',
    'Equips retirats',
    'equips retirats',
  ]);
}

function isZerCentreName(value) {
  return /\bZER\b/i.test(String(value || ''));
}

function isRuralSchoolText(value) {
  const normalized = normalizeCategoryText(value);
  return /\b(ESCOLA RURAL|RURAL|ZER)\b/.test(normalized);
}

function isRuralSchoolErrorDetectionItem(item) {
  return [
    item.name,
    item.reason,
    item.notes,
    item.digitalAssessorNotes,
  ].some(isRuralSchoolText);
}

function isRedEsExcedentReason(value) {
  const normalized = String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized === 'disposen de lexcedent pero tot es red.es';
}

function getErrorDetectionRows(rows) {
  const stageConfig = getActiveStageConfig();
  const neededField = normalizeHeader(stageConfig.summary.neededField);
  const ssttField = normalizeHeader('SSTT');
  const requestedFields = ['e-Valisa sol·licitada', 'e-Valisa sol licitada', 'e-Valisa solicitada'];
  const receivedFields = [stageConfig.summary.receivedField];
  const receivedStatusFields = [stageConfig.summary.receivedStatusField || ''];
  const assessorActionFields = ['Acció assessors', 'Accio assessors'];
  const reasonFields = ['MOTIU discrepancia', 'Motiu discrepància', 'Motiu discrepancia'];
  const notesFields = ['observacions', 'Observacions'];
  const digitalAssessorNotesFields = ['Observacions Assesors Digitals'];

  return rows
    .map((row) => {
      const excedents = parseNumericField(row, ['Excedent', 'Excedents']);
      const retired = parseRetiredLaptopsTotal(row);
      const remaining = excedents - retired;
      const evalisaNeededBool = normalizeBoolean(row[neededField]);
      const assessorActionBool = normalizeBoolean(getRowValue(row, assessorActionFields));

      return {
        code: getRowValue(row, ['Codi']).toString().trim(),
        name: getRowValue(row, ['Nom']).toString().trim(),
        sstt: String(row[ssttField] || '').trim(),
        evalisaNeeded: getRowValue(row, [stageConfig.summary.neededField]),
        evalisaRequested: getRowValue(row, requestedFields),
        evalisaReceived: getRowValue(row, receivedFields),
        evalisaStatus: getRowValue(row, receivedStatusFields),
        assessorAction: getRowValue(row, assessorActionFields),
        reason: getRowValue(row, reasonFields),
        notes: getRowValue(row, notesFields),
        digitalAssessorNotes: getRowValue(row, digitalAssessorNotesFields),
        evalisaNeededBool,
        assessorActionBool,
        excedents,
        retired,
        remaining,
      };
    })
    .filter((item) => item.code && item.name)
    .sort((a, b) => {
      return a.sstt.localeCompare(b.sstt, 'ca')
        || a.code.localeCompare(b.code, 'ca', { numeric: true })
        || a.name.localeCompare(b.name, 'ca');
    });
}

function selectOpenDataRuralCandidate(reference, candidates) {
  const resultCount = candidates.length;
  if (!candidates.length) {
    return {
      candidate: null,
      status: 'població no trobada a Dades Obertes',
      resultCount,
      alert: `No s'ha trobat cap centre a Dades Obertes per la població ${reference.town}.`,
    };
  }

  if (candidates.length === 1) {
    return {
      candidate: candidates[0],
      status: 'Dades Obertes per població única',
      resultCount,
      alert: '',
    };
  }

  const referenceKeys = buildSchoolNameKeys(reference.name);
  let matches = candidates.filter((candidate) => {
    const candidateKeys = buildSchoolNameKeys(candidate.name);
    return [...referenceKeys].some((key) => candidateKeys.has(key));
  });
  let status = 'Dades Obertes per població i nom';

  if (!matches.length) {
    matches = candidates.filter((candidate) => {
      const candidateKeys = buildSchoolNameKeys(candidate.name);
      return [...referenceKeys].some((referenceKey) => {
        if (referenceKey.length < 5) return false;
        return [...candidateKeys].some((candidateKey) => (
          candidateKey.length >= 5
          && (candidateKey.includes(referenceKey) || referenceKey.includes(candidateKey))
        ));
      });
    });
    status = matches.length ? 'Dades Obertes per població i nom aproximat' : 'Dades Obertes per població';
  }

  if (matches.length === 1) {
    return {
      candidate: matches[0],
      status,
      resultCount,
      alert: `La cerca per població a fitxa-centres-educatius retorna ${resultCount} resultats; s'ha triat ${matches[0].code} pel nom del centre.`,
    };
  }

  const primaryCandidates = candidates.filter((candidate) => candidate.hasPrimary || candidate.hasInfantil);
  if (primaryCandidates.length === 1) {
    return {
      candidate: primaryCandidates[0],
      status: 'Dades Obertes per població i etapa',
      resultCount,
      alert: `La cerca per població a fitxa-centres-educatius retorna ${resultCount} resultats; s'ha triat ${primaryCandidates[0].code} perquè és l'únic d'infantil/primària.`,
    };
  }

  if (primaryCandidates.length > 1) {
    return {
      candidate: null,
      status: 'múltiples resultats a fitxa-centres',
      resultCount,
      alert: `La cerca per població a fitxa-centres-educatius retorna ${resultCount} resultats i ${primaryCandidates.length} són d'infantil/primària: ${primaryCandidates.map((match) => `${match.code} ${match.name}`).join(' | ')}`,
    };
  }

  return {
    candidate: null,
    status: 'múltiples resultats a fitxa-centres',
    resultCount,
    alert: `La cerca per població a fitxa-centres-educatius retorna ${resultCount} resultats i no està clar quin codi correspon a ${reference.name}: ${candidates.map((match) => `${match.code} ${match.name}`).join(' | ')}`,
  };
}

function findCsvRuralMatchByCode(candidate, csvByCode) {
  if (!candidate) return null;
  return csvByCode.get(normalizeCentreCode(candidate.code))
    || csvByCode.get(normalizeCodeForMatch(candidate.code))
    || null;
}

function getEvalisaBucket(value) {
  const normalized = normalizeBoolean(value);
  if (normalized === false) return 'NO';
  if (normalized === true) return 'SI';
  return 'ALTRES';
}

function buildOriginalRowsByCentreName(rows) {
  const ssttField = normalizeHeader('SSTT');
  const stageConfig = getActiveStageConfig();
  const receivedFields = [stageConfig.summary.receivedField];
  const receivedStatusFields = [stageConfig.summary.receivedStatusField || ''];
  const neededFields = [stageConfig.summary.neededField];
  const byName = new Map();

  rows.forEach((row) => {
    const name = getRowValue(row, ['Nom']).toString().trim();
    if (!name) return;
    const key = normalizeSchoolNameForMatch(name);
    if (!key) return;
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push({
      code: getRowValue(row, ['Codi']).toString().trim(),
      name,
      sstt: String(row[ssttField] || '').trim(),
      evalisaNeeded: getRowValue(row, neededFields),
      evalisaReceived: getRowValue(row, receivedFields),
      evalisaStatus: getRowValue(row, receivedStatusFields),
    });
  });

  return byName;
}

function findOriginalRowsByUploadedName(uploadedName, rowsByName) {
  const key = normalizeSchoolNameForMatch(uploadedName);
  if (!key) return [];
  const exact = rowsByName.get(key);
  if (exact?.length) return exact;

  const matches = [];
  rowsByName.forEach((rows, rowKey) => {
    if (key.length >= 5 && rowKey.length >= 5 && (rowKey.includes(key) || key.includes(rowKey))) {
      matches.push(...rows);
    }
  });
  return matches;
}

function getSentEvalisaCheckRows(originalRows, uploadedNames) {
  const rowsByName = buildOriginalRowsByCentreName(originalRows);
  return uploadedNames.map((uploadedName) => {
    const matches = findOriginalRowsByUploadedName(uploadedName, rowsByName);
    if (matches.length === 1) {
      const match = matches[0];
      const receivedBool = normalizeBoolean(match.evalisaReceived);
      return {
        uploadedName,
        ...match,
        receivedBool,
        status: receivedBool === true ? 'rebuda al CSV original' : 'no consta com rebuda',
        error: '',
      };
    }
    if (!matches.length) {
      return {
        uploadedName,
        code: '',
        name: '',
        sstt: '',
        evalisaNeeded: '',
        evalisaReceived: '',
        evalisaStatus: '',
        receivedBool: null,
        status: 'no trobat',
        error: "No s'ha trobat cap centre al CSV original amb aquest nom.",
      };
    }
    return {
      uploadedName,
      code: '',
      name: matches.map((match) => `${match.code} ${match.name}`).join(' | '),
      sstt: [...new Set(matches.map((match) => match.sstt).filter(Boolean))].join(' | '),
      evalisaNeeded: '',
      evalisaReceived: '',
      evalisaStatus: '',
      receivedBool: null,
      status: 'dubte',
      error: `Hi ha més d'una coincidència possible: ${matches.map((match) => `${match.code} ${match.name}`).join(' | ')}`,
    };
  });
}

function getOriginalReceivedRowsMissingFromUploaded(originalRows, uploadedNames) {
  const uploadedKeys = new Set(uploadedNames.map((name) => normalizeSchoolNameForMatch(name)).filter(Boolean));
  const stageConfig = getActiveStageConfig();
  const ssttField = normalizeHeader('SSTT');
  const receivedFields = [stageConfig.summary.receivedField];
  const receivedStatusFields = [stageConfig.summary.receivedStatusField || ''];
  const neededFields = [stageConfig.summary.neededField];

  return originalRows
    .map((row) => {
      const name = getRowValue(row, ['Nom']).toString().trim();
      return {
        uploadedName: '',
        code: getRowValue(row, ['Codi']).toString().trim(),
        name,
        sstt: String(row[ssttField] || '').trim(),
        evalisaNeeded: getRowValue(row, neededFields),
        evalisaReceived: getRowValue(row, receivedFields),
        evalisaStatus: getRowValue(row, receivedStatusFields),
        nameKey: normalizeSchoolNameForMatch(name),
        status: 'rebuda al CSV original però absent al fitxer carregat',
        error: '',
      };
    })
    .filter((item) => item.nameKey && normalizeBoolean(item.evalisaReceived) === true)
    .filter((item) => !uploadedKeys.has(item.nameKey))
    .sort((a, b) => a.sstt.localeCompare(b.sstt, 'ca') || a.name.localeCompare(b.name, 'ca'));
}

function renderSentEvalisaCheckView(rows, ssttLabel) {
  const uploaded = state.sentEvalisaCheckByStage[state.educationStage] || { fileName: '', names: [] };
  if (errorDetectionSubtitleEl) {
    errorDetectionSubtitleEl.textContent = `Compara centres declarats amb e-Valisa enviada contra el CSV original de ${ssttLabel}.`;
  }
  if (errorDetectionCountEl) {
    errorDetectionCountEl.textContent = uploaded.names.length
      ? `${uploaded.names.length} centres al fitxer de comprovació`
      : 'Cap fitxer de comprovació carregat';
  }

  const controls = `
    <div class="sent-check-controls">
      <button id="sentEvalisaUploadBtn" class="file-trigger" type="button">Carrega CSV de rebudes</button>
      <span>${uploaded.fileName ? `Fitxer: ${escapeHtml(uploaded.fileName)}` : 'Cap fitxer carregat'}</span>
    </div>
  `;

  if (!uploaded.names.length) {
    errorDetectionTableEl.innerHTML = `
      ${controls}
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-700">
        <p class="text-lg font-semibold">Carrega el CSV amb els centres que han enviat e-Valisa.</p>
        <p class="mt-1 text-sm">Només es farà servir la primera columna del fitxer.</p>
      </div>
    `;
    document.getElementById('sentEvalisaUploadBtn')?.addEventListener('click', () => sentEvalisaInput?.click());
    return;
  }

  const checkRows = getSentEvalisaCheckRows(rows, uploaded.names);
  const receivedRows = checkRows.filter((item) => item.receivedBool === true);
  const notReceivedRows = checkRows.filter((item) => item.receivedBool !== true && !item.error);
  const errorRows = checkRows.filter((item) => item.error);
  const missingFromUploadedRows = getOriginalReceivedRowsMissingFromUploaded(rows, uploaded.names);

  const renderRows = (items) => items.map((item, index) => `
    <tr class="${index % 2 === 0 ? 'management-row-even' : 'management-row-odd'} ${item.error ? 'rural-row-alert' : ''}">
      <td>${escapeHtml(item.uploadedName)}</td>
      <td>${escapeHtml(item.code || '-')}</td>
      <td class="font-medium text-slate-800">${escapeHtml(item.name || '-')}</td>
      <td>${escapeHtml(item.sstt || '-')}</td>
      <td class="text-center">${escapeHtml(item.evalisaNeeded || '-')}</td>
      <td class="text-center">${escapeHtml(item.evalisaReceived || '-')}</td>
      <td class="text-center">${escapeHtml(item.evalisaStatus || '-')}</td>
      <td>${escapeHtml(item.status || '-')}</td>
      <td>${escapeHtml(item.error || '')}</td>
    </tr>
  `).join('');

  const renderTable = (title, items, emptyText) => `
    <section class="rural-result-section">
      <h3 class="rural-result-title">${escapeHtml(title)} <span>${items.length}</span></h3>
      ${items.length ? `
        <table class="management-table rural-detection-table text-left text-xs">
          <thead>
            <tr>
              <th>Nom al CSV carregat</th>
              <th>Codi</th>
              <th>Nom al CSV original</th>
              <th>SSTT</th>
              <th class="text-center">e-Valisa necessària</th>
              <th class="text-center">e-Valisa rebuda</th>
              <th class="text-center">Estat e-Valisa</th>
              <th>Resultat</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>${renderRows(items)}</tbody>
        </table>
      ` : `<div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">${escapeHtml(emptyText)}</div>`}
    </section>
  `;

  errorDetectionTableEl.innerHTML = `
    ${controls}
    <div class="rural-summary mb-3">
      <span>${receivedRows.length} e-Valisa rebuda = SI</span>
      <span>${notReceivedRows.length} no consten com rebudes</span>
      <span>${missingFromUploadedRows.length} rebudes absents al fitxer carregat</span>
      <span>${errorRows.length} errors o dubtes</span>
    </div>
    ${renderTable('e-Valisa rebuda = SI al CSV original', receivedRows, 'Cap centre comprovat consta amb e-Valisa rebuda = SI.')}
    ${renderTable('No consta e-Valisa rebuda al CSV original', notReceivedRows, 'No hi ha discrepàncies: tots consten com rebuts o tenen error de coincidència.')}
    ${renderTable('e-Valisa rebuda = SI però no és al fitxer carregat', missingFromUploadedRows, 'No hi ha centres amb e-Valisa rebuda = SI absents al fitxer carregat.')}
    ${renderTable('Errors o dubtes', errorRows, 'No hi ha errors ni dubtes de coincidència.')}
  `;
  document.getElementById('sentEvalisaUploadBtn')?.addEventListener('click', () => sentEvalisaInput?.click());
}

async function getRuralDetectionRows(rows, selectedSstt) {
  const stageConfig = getActiveStageConfig();
  const ssttField = normalizeHeader('SSTT');
  const ruralReferences = filterRuralReferencesByXtecSstt(selectedSstt);
  const csvItems = rows
    .map((row) => {
      const name = getRowValue(row, ['Nom']).toString().trim();
      return {
        code: getRowValue(row, ['Codi']).toString().trim(),
        name,
        sstt: String(row[ssttField] || '').trim(),
        evalisaNeeded: getRowValue(row, [stageConfig.summary.neededField]),
        row,
        keys: buildSchoolNameKeys(name),
        isZer: isZerCentreName(name),
      };
    })
    .filter((item) => item.name);
  const csvByCode = new Map();
  csvItems.forEach((item) => {
    csvByCode.set(normalizeCentreCode(item.code), item);
    csvByCode.set(normalizeCodeForMatch(item.code), item);
  });

  const ruralRows = await Promise.all(ruralReferences.map(async (reference) => {
    const referenceSstt = getRuralReferenceSstt(reference);
    try {
      const openDataCandidates = await fetchCentreCandidatesByTown(reference.town);
      const { candidate, status, alert, resultCount } = selectOpenDataRuralCandidate(reference, openDataCandidates);
      const csvMatch = findCsvRuralMatchByCode(candidate, csvByCode);
      const stMatches = csvMatch ? ruralReferenceMatchesSstt(reference, csvMatch.sstt) : true;
      const alerts = [];
      if (alert) alerts.push(alert);
      if (candidate && !csvMatch) alerts.push(`El codi ${candidate.code} existeix a Dades Obertes però no surt al fitxer d'entrada.`);
      if (csvMatch && !stMatches) alerts.push(`El ST del CSV (${csvMatch.sstt || '-'}) no coincideix amb el ST XTEC (${referenceSstt.join(', ') || '-'})`);
      return {
        sourceName: reference.name,
        sourceTown: reference.town,
        sourceTerritory: reference.territory,
        sourceSstt: referenceSstt.join(', '),
        code: candidate?.code || '',
        name: csvMatch?.name || '',
        openDataName: candidate?.name || '',
        openDataTown: candidate?.town || candidate?.locality || '',
        openDataResultCount: resultCount,
        sstt: csvMatch?.sstt || '',
        evalisaNeeded: csvMatch?.evalisaNeeded || '',
        inCsv: Boolean(csvMatch),
        status: csvMatch ? status : `${status}; no al CSV`,
        alert: alerts.length ? `No està clar quina escola és: ${alerts.join('; ')}` : '',
      };
    } catch (error) {
      return {
        sourceName: reference.name,
        sourceTown: reference.town,
        sourceTerritory: reference.territory,
        sourceSstt: referenceSstt.join(', '),
        code: '',
        name: '',
        openDataName: '',
        openDataTown: '',
        openDataResultCount: 0,
        sstt: '',
        evalisaNeeded: '',
        inCsv: false,
        status: 'error Dades Obertes',
        alert: `No s'ha pogut consultar Dades Obertes: ${error.message}`,
      };
    }
  }));

  return ruralRows.sort((a, b) => {
    return a.sourceTerritory.localeCompare(b.sourceTerritory, 'ca')
      || a.sourceName.localeCompare(b.sourceName, 'ca')
      || a.name.localeCompare(b.name, 'ca');
  });
}

async function renderRuralDetectionView(rows, selectedSstt, ssttLabel) {
  const requestId = state.ruralRenderRequestId + 1;
  state.ruralRenderRequestId = requestId;
  const ruralReferences = filterRuralReferencesByXtecSstt(selectedSstt);
  if (errorDetectionSubtitleEl) {
    errorDetectionSubtitleEl.textContent = `Escoles rurals de ${ssttLabel}, resoltes amb Dades Obertes i comparades amb el fitxer d'entrada.`;
  }
  if (errorDetectionCountEl) {
    errorDetectionCountEl.textContent = 'Consultant Dades Obertes...';
  }
  errorDetectionTableEl.innerHTML = `
    <div class="rounded-xl border border-sky-200 bg-sky-50 p-6 text-center text-sky-900">
      <p class="text-lg font-semibold">Consultant codis de centre a Dades Obertes...</p>
    </div>
  `;

  const ruralRows = await getRuralDetectionRows(rows, selectedSstt);
  if (requestId !== state.ruralRenderRequestId || state.activeView !== 'ERROR_DETECTION' || state.errorDetectionSubView !== 'RURAL_ZER') return;
  const matchedRows = ruralRows.filter((item) => item.inCsv);
  const codeRows = ruralRows.filter((item) => item.code);
  const errorRows = ruralRows.filter((item) => !item.code || !item.inCsv);
  const okRows = ruralRows.filter((item) => item.inCsv);
  const evalisaNoRows = okRows.filter((item) => getEvalisaBucket(item.evalisaNeeded) === 'NO');
  const evalisaSiRows = okRows.filter((item) => getEvalisaBucket(item.evalisaNeeded) === 'SI');
  const evalisaOtherRows = okRows.filter((item) => getEvalisaBucket(item.evalisaNeeded) === 'ALTRES');

  if (errorDetectionCountEl) {
    errorDetectionCountEl.innerHTML = `
      <span class="management-count-panel">
        <span class="management-count-number text-5xl font-extrabold leading-none">${matchedRows.length}</span>
        <span class="management-count-label mt-1 block text-base">escoles rurals al CSV</span>
      </span>
    `;
  }

  const alertHtml = errorRows.length
    ? `
      <div class="rural-alert mb-4">
        <p class="font-semibold">Hi ha ${errorRows.length} escoles amb error o dubte.</p>
        <p>Revisa les files marcades a la columna “Error”. El codi es resol amb Dades Obertes a partir del nom i la població de XTEC, i després es compara amb el CSV.</p>
      </div>
    `
    : '';

  if (!ruralRows.length) {
    errorDetectionTableEl.innerHTML = `
      <div class="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-900">
        <p class="text-lg font-semibold">No hi ha dades per comparar.</p>
      </div>
    `;
    return;
  }

  const renderTable = (title, items, emptyText) => {
    const body = items.map((item, index) => `
    <tr class="${index % 2 === 0 ? 'management-row-even' : 'management-row-odd'} ${item.alert ? 'rural-row-alert' : ''}">
      <td>${escapeHtml(item.code || '-')}</td>
      <td class="font-medium text-slate-800">${escapeHtml(item.name || '-')}</td>
      <td>${escapeHtml(item.sstt || '-')}</td>
      <td class="text-center">${escapeHtml(item.evalisaNeeded || '-')}</td>
      <td>${escapeHtml(item.openDataName || '-')}</td>
      <td>${escapeHtml(item.openDataTown || '-')}</td>
      <td class="text-center">${escapeHtml(item.openDataResultCount ?? '-')}</td>
      <td>${escapeHtml(item.sourceName)}</td>
      <td>${escapeHtml(item.sourceTown || '-')}</td>
      <td>${escapeHtml(item.sourceTerritory)}</td>
      <td>${escapeHtml(item.sourceSstt || '-')}</td>
      <td class="text-center">${escapeHtml(item.status)}</td>
      <td>${escapeHtml(item.alert)}</td>
    </tr>
  `).join('');

    return `
      <section class="rural-result-section">
        <h3 class="rural-result-title">${escapeHtml(title)} <span>${items.length}</span></h3>
        ${items.length
          ? `
            <table class="management-table rural-detection-table text-left text-xs">
              <thead>
                <tr>
                  <th>Codi</th>
                  <th>Nom escola al CSV</th>
                  <th>SSTT</th>
                  <th class="text-center">e-Valisa necessària</th>
                  <th>Nom Dades Obertes</th>
                  <th>Població Dades Obertes</th>
                  <th class="text-center">Resultats fitxa</th>
                  <th>Nom rural XTEC</th>
                  <th>Població XTEC</th>
                  <th>Territori XTEC</th>
                  <th>ST XTEC</th>
                  <th class="text-center">Resultat</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>${body}</tbody>
            </table>
          `
          : `<div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">${escapeHtml(emptyText)}</div>`}
      </section>
    `;
  };

  errorDetectionTableEl.innerHTML = `
    ${alertHtml}
    <div class="rural-summary mb-3">
      <span>${okRows.length} coincidències clares</span>
      <span>${evalisaNoRows.length} e-Valisa necessària = NO</span>
      <span>${evalisaSiRows.length} e-Valisa necessària = SI</span>
      <span>${errorRows.length} amb error o dubte</span>
      <span>${codeRows.length} codis resolts a Dades Obertes</span>
      <span>${ruralReferences.length} escoles XTEC consultades</span>
      <span>Font: <a href="${RURAL_SCHOOL_SOURCE_URL}" target="_blank" rel="noopener noreferrer">XTEC - Webs d'escoles</a></span>
    </div>
    ${renderTable('e-Valisa necessària = SI', evalisaSiRows, 'No hi ha escoles rurals amb e-Valisa necessària = SI.')}
    ${renderTable('e-Valisa necessària = NO', evalisaNoRows, 'No hi ha escoles rurals amb e-Valisa necessària = NO.')}
    ${evalisaOtherRows.length ? renderTable('e-Valisa necessària sense valor clar', evalisaOtherRows, '') : ''}
    ${renderTable('Errors o dubtes', errorRows, 'No hi ha errors ni dubtes.')}
  `;
}

function renderErrorDetectionView() {
  if (!errorDetectionSectionEl || !errorDetectionTableEl) return;

  const rows = state.rowsByStage[state.educationStage] || [];
  const filteredRows = getFilteredRowsByGlobalSstt(rows);
  const allDetectedRows = getErrorDetectionRows(filteredRows);
  const selectedSstt = state.selectedSsttByStage[state.educationStage] || '';
  const ssttLabel = !selectedSstt ? 'cap ST seleccionat' : (selectedSstt === 'ALL' ? 'tots els ST' : `ST ${selectedSstt}`);
  const isPendingSubView = state.errorDetectionSubView === 'PENDING_0_4';
  const isPendingNoEvalisaSubView = state.errorDetectionSubView === 'PENDING_5_NO_EVALISA';
  const isRuralSubView = state.errorDetectionSubView === 'RURAL_ZER';
  const isSentEvalisaCheckSubView = state.errorDetectionSubView === 'SENT_EVALISA_CHECK';
  const showPrimaryCommentColumns = state.educationStage === 'PRIMARIA';

  if (isRuralSubView) {
    renderRuralDetectionView(rows, selectedSstt, ssttLabel);
    return;
  }
  if (isSentEvalisaCheckSubView) {
    renderSentEvalisaCheckView(filteredRows, ssttLabel);
    return;
  }

  let detectedRows = allDetectedRows.filter((item) => item.evalisaNeededBool === false && item.assessorActionBool === true);
  if (isPendingSubView) {
    detectedRows = allDetectedRows.filter((item) => item.evalisaNeededBool === true && item.remaining >= 0 && item.remaining <= 4);
  } else if (isPendingNoEvalisaSubView) {
    detectedRows = allDetectedRows.filter((item) => (
      item.evalisaNeededBool === false
      && item.remaining >= 5
      && !isRuralSchoolErrorDetectionItem(item)
      && !isRedEsExcedentReason(item.reason)
    ));
  }

  if (errorDetectionSubtitleEl) {
    let subtitle = `Centres de ${ssttLabel} amb e-Valisa necessària = NO i Acció assessors = SI.`;
    if (isPendingSubView) {
      subtitle = `Centres de ${ssttLabel} amb e-Valisa necessària = SI i entre 0 i 4 equips pendents de retirar.`;
    } else if (isPendingNoEvalisaSubView) {
      subtitle = `Centres de ${ssttLabel} amb e-Valisa necessària = NO i 5 o més equips pendents de retirar, excloent les ZER, les escoles rurals indicades a les observacions i els casos Red.es.`;
    }
    errorDetectionSubtitleEl.textContent = subtitle;
  }

  if (errorDetectionCountEl) {
    errorDetectionCountEl.textContent = detectedRows.length
      ? `${detectedRows.length} centres detectats`
      : '0 centres detectats';
  }

  if (!detectedRows.length) {
    errorDetectionTableEl.innerHTML = `
      <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-800">
        <p class="mb-2 text-5xl leading-none">✓</p>
        <p class="text-lg font-semibold">No s'han detectat centres amb aquest patró</p>
      </div>
    `;
    return;
  }

  const body = detectedRows.map((item, index) => `
    <tr class="${index % 2 === 0 ? 'management-row-even' : 'management-row-odd'}">
      <td>${escapeHtml(item.code)}</td>
      <td class="font-medium text-slate-800">${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.sstt)}</td>
      <td class="text-center">${escapeHtml(item.evalisaNeeded)}</td>
      <td class="text-center">${escapeHtml(item.assessorAction)}</td>
      <td class="text-center">${escapeHtml(item.evalisaRequested)}</td>
      <td class="text-center">${escapeHtml(item.evalisaReceived)}</td>
      <td class="text-center">${escapeHtml(item.evalisaStatus)}</td>
      <td class="text-center">${item.excedents}</td>
      <td class="text-center">${item.retired}</td>
      <td class="text-center font-semibold text-amber-700">${item.remaining}</td>
      <td>${escapeHtml(item.reason)}</td>
      <td>${escapeHtml(item.notes)}</td>
      ${showPrimaryCommentColumns ? `<td>${escapeHtml(item.digitalAssessorNotes)}</td>` : ''}
    </tr>
  `).join('');

  errorDetectionTableEl.innerHTML = `
    <table class="management-table error-detection-table text-left text-xs">
      <thead>
        <tr>
          <th>Codi</th>
          <th>Nom</th>
          <th>SSTT</th>
          <th class="text-center">e-Valisa necessària</th>
          <th class="text-center">Acció assessors</th>
          <th class="text-center">e-Valisa sol·licitada</th>
          <th class="text-center">e-Valisa rebuda</th>
          <th class="text-center">Estat e-Valisa</th>
          <th class="text-center">Excedents</th>
          <th class="text-center">Retirats</th>
          <th class="text-center">Pendents</th>
          <th>Motiu discrepància</th>
          <th>Observacions</th>
          ${showPrimaryCommentColumns ? '<th>Observacions Assesors Digitals</th>' : ''}
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
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
  const isPrimary = state.educationStage === 'PRIMARIA';
  const donutColors = isPrimary
    ? {
        no: '#d97706',
        noBorder: '#b45309',
        invalid: '#fdba74',
        invalidBorder: '#fb923c',
        yes: '#fef3c7',
        yesBorder: '#fde68a',
      }
    : {
        no: '#0284c7',
        noBorder: '#0369a1',
        invalid: '#7dd3fc',
        invalidBorder: '#38bdf8',
        yes: '#cbd5e1',
        yesBorder: '#94a3b8',
      };

  if (state.charts.neededReceivedDonut) {
    state.charts.neededReceivedDonut.destroy();
  }

  state.charts.neededReceivedDonut = new Chart(neededReceivedDonutCtx, {
    type: 'doughnut',
    data: {
      labels: ['e-Valisa rebuda (NO)', 'e-Valisa rebuda (INVÀLIDA)', 'e-Valisa rebuda (SI)'],
      datasets: [
        {
          data: [receivedNo, receivedInvalid, receivedYes],
          backgroundColor: [donutColors.no, donutColors.invalid, donutColors.yes],
          borderColor: [donutColors.noBorder, donutColors.invalidBorder, donutColors.yesBorder],
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

function computePrimaryCallStatus(rows) {
  const stageConfig = getActiveStageConfig();
  const neededField = normalizeHeader(stageConfig.summary.neededField);
  const receivedField = normalizeHeader(stageConfig.summary.receivedField);
  const receivedStatusField = normalizeHeader(stageConfig.summary.receivedStatusField || '');
  const callDoneField = normalizeHeader('Trucada realitzada');
  let callYes = 0;
  let callNo = 0;

  rows.forEach((row) => {
    const needed = normalizeBoolean(row[neededField]) === true;
    if (!needed) return;

    const explicitStatus = receivedStatusField ? normalizeCategoryText(row[receivedStatusField]) : '';
    let status = classifyReceivedStatus(row[receivedField]);

    if (status === 'SI' && explicitStatus.includes('INVALIDA')) {
      status = 'INVALIDA';
    }

    if (!['NO', 'INVALIDA'].includes(status)) return;

    if (normalizeBoolean(row[callDoneField]) === true) callYes += 1;
    else callNo += 1;
  });

  return { callYes, callNo };
}

function renderPrimaryCallStatusChart(rows) {
  if (!primaryCallStatusCtx) return;
  const palette = getPalette();
  const { callYes, callNo } = computePrimaryCallStatus(rows);

  if (state.charts.primaryCallStatusDonut) {
    state.charts.primaryCallStatusDonut.destroy();
  }

  state.charts.primaryCallStatusDonut = new Chart(primaryCallStatusCtx, {
    type: 'doughnut',
    data: {
      labels: ['Trucada realitzada (NO)', 'Trucada realitzada (SI)'],
      datasets: [
        {
          data: [callNo, callYes],
          backgroundColor: [palette.accent, palette.soft],
          borderColor: [palette.accentBorder, palette.softBorder],
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
  const callDoneFields = ['Trucada realitzada'];
  const receivedStatusFields = [stageConfig.summary.receivedStatusField || ''];
  const assessorActionFields = ['Acció assessors', 'Accio assessors'];
  const reasonFields = ['MOTIU discrepancia', 'Motiu discrepància', 'Motiu discrepancia'];
  const notesFields = ['observacions', 'Observacions'];
  const digitalAssessorNotesFields = ['Observacions Assesors Digitals'];
  const showReceivedStatusColumn = state.educationStage === 'PRIMARIA';
  const showAssessorActionColumn = state.educationStage === 'PRIMARIA';
  const showDigitalAssessorNotesColumn = state.educationStage === 'PRIMARIA';
  const showSecondaryCallDoneColumn = state.educationStage === 'SECUNDARIA';
  const showPrimaryCallDoneColumn = state.educationStage === 'PRIMARIA';
  const renderCallDoneBadge = (row) => (
    normalizeBoolean(getRowValue(row, callDoneFields)) === true
      ? '<span class="text-green-600 font-bold text-xl leading-none">✓</span>'
      : '<span class="text-rose-600 font-bold text-xl leading-none">✗</span>'
  );
  const renderInfoActions = (rowKey) => `
    <div class="info-actions">
      <button
        type="button"
        class="icon-btn centre-sheet-btn"
        data-centre-sheet-key="${escapeHtml(rowKey)}"
        title="Fitxa del centre"
        aria-label="Obre la fitxa del centre"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 21h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          <path d="M5 21V10l7-4 7 4v11" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
          <path d="M9 21v-5h6v5" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
          <path d="M9 12h.01M15 12h.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
        </svg>
      </button>
      <button
        type="button"
        class="info-btn icon-btn"
        data-info-key="${escapeHtml(rowKey)}"
        title="Més informació"
        aria-label="Obre la informació detallada"
      >i</button>
    </div>
  `;
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
  state.pendingActionRowsByStage[state.educationStage] = combinedRows;

  secondaryActionCountEl.innerHTML = `
    <span class="management-count-panel">
      <span class="management-count-top">
      <span class="management-count-number text-5xl font-extrabold leading-none">${combinedRows.length}</span>
      <button id="managementMapBtnInline" type="button" class="management-map-btn">Mapa</button>
      </span>
      <span class="management-count-label mt-1 block text-base">centres pendents d'actuació</span>
    </span>
  `;
  document.getElementById('managementMapBtnInline')?.addEventListener('click', () => {
    managementMapController.open(
      state.pendingActionRowsByStage[state.educationStage] || [],
      state.selectedSsttByStage[state.educationStage] || 'ALL',
    );
  });

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
        ${showSecondaryCallDoneColumn
          ? `<td class="text-center">${renderCallDoneBadge(row)}</td>`
          : ''}
        ${showReceivedStatusColumn ? `<td class="text-center">${escapeHtml(getRowValue(row, receivedStatusFields))}</td>` : ''}
        ${showAssessorActionColumn ? `<td class="text-center">${escapeHtml(getRowValue(row, assessorActionFields))}</td>` : ''}
        ${showPrimaryCallDoneColumn ? `<td class="text-center">${renderCallDoneBadge(row)}</td>` : ''}
        <td>${escapeHtml(getRowValue(row, reasonFields))}</td>
        <td>${escapeHtml(getRowValue(row, notesFields))}</td>
        ${showDigitalAssessorNotesColumn ? `<td>${escapeHtml(getRowValue(row, digitalAssessorNotesFields))}</td>` : ''}
        <td class="text-center">${renderInfoActions(rowKey)}</td>
      </tr>
    `;
      })()}
    `).join('');

    secondaryActionTableEl.innerHTML = `
    <table class="management-table text-left text-sm${state.educationStage === 'PRIMARIA' ? ' primary-management-table' : ' secondary-management-table'}">
      <thead>
        <tr>
          <th>Codi</th>
          <th>Nom</th>
          <th>SSTT</th>
          <th class="text-center">e-Valisa sol·licitada</th>
          <th class="text-center">e-Valisa rebuda</th>
          ${showSecondaryCallDoneColumn ? '<th class="text-center text-2xl leading-none" title="Trucada realitzada">📞</th>' : ''}
          ${showReceivedStatusColumn ? '<th class="text-center">Estat e-Valisa</th>' : ''}
          ${showAssessorActionColumn ? '<th class="text-center">Acció assessors</th>' : ''}
          ${showPrimaryCallDoneColumn ? '<th class="text-center text-2xl leading-none" title="Trucada realitzada">📞</th>' : ''}
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
    primaryAdvisorTableSectionEl?.classList.add('hidden');
    if (primaryAdvisorTableEl) primaryAdvisorTableEl.innerHTML = '';
    return;
  }

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
        <td class="text-center">${renderCallDoneBadge(row)}</td>
        <td>${escapeHtml(getRowValue(row, reasonFields))}</td>
        <td>${escapeHtml(getRowValue(row, notesFields))}</td>
        <td>${escapeHtml(getRowValue(row, digitalAssessorNotesFields))}</td>
        <td class="text-center">${renderInfoActions(rowKey)}</td>
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
            <th class="text-center text-2xl leading-none" title="Trucada realitzada">📞</th>
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

async function openCentreSheetModal(row) {
  if (!centreSheetModalEl || !centreSheetTitleEl || !centreSheetContentEl) return;

  const nom = getRowValue(row, ['Nom']) || 'Centre';
  const codi = getRowValue(row, ['Codi']) || '';
  centreSheetTitleEl.textContent = codi ? `Fitxa del centre: ${nom} (${codi})` : `Fitxa del centre: ${nom}`;
  renderCentreSheetLoading(codi, nom);
  centreSheetModalEl.classList.remove('hidden');
  centreSheetModalEl.classList.add('flex');

  try {
    const data = await fetchFitxaByCode(codi);
    renderCentreSheetData(data);
  } catch (error) {
    renderCentreSheetData({
      status: 'error',
      requestedCode: codi,
      sourceUrl: SOCRATA_SOURCE_URL,
      message: `Error de connexió: ${error.message}`,
      centre: { code: codi, name: nom },
      fields: {},
    });
  }
}

function closeCentreSheetModal() {
  if (!centreSheetModalEl) return;
  centreSheetModalEl.classList.add('hidden');
  centreSheetModalEl.classList.remove('flex');
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
  updateChartsLayoutForStage();
  renderSummary(rows);
  renderSecondaryActionView(rows);
  renderReceivedVsTotalChart(rows);
  renderNeededReceivedDonutChart(rows);
  renderPrimaryCallStatusChart(rows);
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
viewScManagementBtn?.addEventListener('click', () => setActiveView('SC_MANAGEMENT'));
viewErrorDetectionBtn?.addEventListener('click', () => setActiveView('ERROR_DETECTION'));
errorDetectionPendingBtn?.addEventListener('click', () => {
  state.errorDetectionSubView = 'PENDING_0_4';
  if (state.activeView === 'ERROR_DETECTION') applyActiveView();
});
errorDetectionPendingNoEvalisaBtn?.addEventListener('click', () => {
  state.errorDetectionSubView = 'PENDING_5_NO_EVALISA';
  if (state.activeView === 'ERROR_DETECTION') applyActiveView();
});
errorDetectionAdvisorBtn?.addEventListener('click', () => {
  state.errorDetectionSubView = 'ADVISOR_YES';
  if (state.activeView === 'ERROR_DETECTION') applyActiveView();
});
errorDetectionRuralBtn?.addEventListener('click', () => {
  state.errorDetectionSubView = 'RURAL_ZER';
  if (state.activeView === 'ERROR_DETECTION') applyActiveView();
});
errorDetectionSentCheckBtn?.addEventListener('click', () => {
  state.errorDetectionSubView = 'SENT_EVALISA_CHECK';
  if (state.activeView === 'ERROR_DETECTION') applyActiveView();
});
sentEvalisaInput?.addEventListener('change', async (event) => {
  const [file] = event.target.files || [];
  if (!file) return;
  const { names } = await readFirstColumnCsvWithEncodingFallback(file);
  state.sentEvalisaCheckByStage[state.educationStage] = { fileName: file.name, names };
  sentEvalisaInput.value = '';
  state.errorDetectionSubView = 'SENT_EVALISA_CHECK';
  if (state.activeView === 'ERROR_DETECTION') applyActiveView();
});

secondaryActionTableEl?.addEventListener('click', (event) => {
  const centreSheetTarget = event.target.closest('[data-centre-sheet-key]');
  if (centreSheetTarget) {
    const rowKey = centreSheetTarget.dataset.centreSheetKey;
    const row = state.managementRowsByKey.get(rowKey);
    if (!row) return;
    openCentreSheetModal(row);
    return;
  }
  const target = event.target.closest('[data-info-key]');
  if (!target) return;
  const rowKey = target.dataset.infoKey;
  const row = state.managementRowsByKey.get(rowKey);
  if (!row) return;
  openCentreInfoModal(row);
});

primaryAdvisorTableEl?.addEventListener('click', (event) => {
  const centreSheetTarget = event.target.closest('[data-centre-sheet-key]');
  if (centreSheetTarget) {
    const rowKey = centreSheetTarget.dataset.centreSheetKey;
    const row = state.managementRowsByKey.get(rowKey);
    if (!row) return;
    openCentreSheetModal(row);
    return;
  }
  const target = event.target.closest('[data-info-key]');
  if (!target) return;
  const rowKey = target.dataset.infoKey;
  const row = state.managementRowsByKey.get(rowKey);
  if (!row) return;
  openCentreInfoModal(row);
});

centreSheetContentEl?.addEventListener('click', async (event) => {
  const target = event.target.closest('button');
  if (!target) return;

  if (target.dataset.copy) {
    try {
      await navigator.clipboard.writeText(target.dataset.copy);
    } catch {
      // Ignore clipboard failure silently in modal.
    }
    return;
  }

  if (target.dataset.copyPhone) {
    try {
      await navigator.clipboard.writeText(target.dataset.copyPhone);
    } catch {
      // Ignore clipboard failure silently in modal.
    }
    return;
  }

  if (target.dataset.callNumber) {
    window.location.href = `tel:${target.dataset.callNumber}`;
    return;
  }

  if (target.dataset.openUrl) {
    window.open(target.dataset.openUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  if (target.dataset.gmailUrl) {
    window.open(target.dataset.gmailUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  if (target.dataset.mapX && target.dataset.mapY) {
    openCentreMapModal(target.dataset.mapX, target.dataset.mapY);
  }
});

closeCentreInfoBtn?.addEventListener('click', closeCentreInfoModal);
centreInfoModalEl?.addEventListener('click', (event) => {
  if (event.target === centreInfoModalEl) closeCentreInfoModal();
});
closeCentreSheetBtn?.addEventListener('click', closeCentreSheetModal);
centreSheetModalEl?.addEventListener('click', (event) => {
  if (event.target === centreSheetModalEl) closeCentreSheetModal();
});
closeCentreMapBtn?.addEventListener('click', closeCentreMapModal);
centreMapModalEl?.addEventListener('click', (event) => {
  if (event.target === centreMapModalEl) closeCentreMapModal();
});
managementMapController.bindStaticEvents();
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

setEducationStage('PRIMARIA');
