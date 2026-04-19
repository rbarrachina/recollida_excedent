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
const fileTriggerEl = document.querySelector('label[for="fileInput"]');
const summaryCardsEl = document.getElementById('summaryCards');
const chartsGridSectionEl = document.getElementById('chartsGridSection');
const primaryCallChartCardEl = document.getElementById('primaryCallChartCard');
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
const centreSheetModalEl = document.getElementById('centreSheetModal');
const centreSheetTitleEl = document.getElementById('centreSheetTitle');
const centreSheetContentEl = document.getElementById('centreSheetContent');
const closeCentreSheetBtn = document.getElementById('closeCentreSheetBtn');
const centreMapModalEl = document.getElementById('centreMapModal');
const closeCentreMapBtn = document.getElementById('closeCentreMapBtn');
const centreMapFrameEl = document.getElementById('centreMapFrame');
const openCentreMapLinkEl = document.getElementById('openCentreMapLink');
const centreMapCoordsLabelEl = document.getElementById('centreMapCoordsLabel');
const aboutModalEl = document.getElementById('aboutModal');
const closeAboutModalBtn = document.getElementById('closeAboutModalBtn');
const stageMismatchModalEl = document.getElementById('stageMismatchModal');
const closeStageMismatchBtn = document.getElementById('closeStageMismatchBtn');
const stageMismatchTextEl = document.getElementById('stageMismatchText');
const yesNoTableEl = document.getElementById('yesNoTable');
const neededReceivedTableEl = document.getElementById('neededReceivedTable');
const SOCRATA_RESOURCE_URL = 'https://analisi.transparenciacatalunya.cat/resource/kvmv-ahh4.json';
const SOCRATA_SOURCE_URL = 'https://analisi.transparenciacatalunya.cat/d/kvmv-ahh4';
const FITXA_KEY_LABELS = {
  any: 'Any',
  curs: 'Curs',
  codi_centre: 'Codi centre',
  denominaci_completa: 'Nom centre',
  codi_naturalesa: 'Codi naturalesa',
  nom_naturalesa: 'Naturalesa',
  codi_titularitat: 'Codi titularitat',
  nom_titularitat: 'Titularitat',
  adre_a: 'Adreça',
  codi_postal: 'Codi postal',
  tel_fon: 'Telèfon del centre',
  codi_delegaci: 'Codi delegació',
  nom_delegaci: 'Àrea Territorial',
  codi_comarca: 'Codi comarca',
  nom_comarca: 'Comarca',
  codi_municipi: 'Codi municipi',
  codi_municipi_6: 'Codi municipi (6)',
  nom_municipi: 'Població',
  codi_districte_municipal: 'Codi districte municipal',
  nom_dm: 'Nom districte municipal',
  codi_localitat: 'Codi localitat',
  nom_localitat: 'Localitat',
  coordenades_utm_x: 'Coordenada UTM X',
  coordenades_utm_y: 'Coordenada UTM Y',
  coordenades_geo_x: 'Coordenada Geo X',
  coordenades_geo_y: 'Coordenada Geo Y',
  e_mail_centre: 'Correu electrònic del centre',
  url: 'URL pàgina web centre',
  imatge: 'Imatge',
  geo_1: 'Geo 1',
};
const FITXA_PRIORITY_KEYS = [
  'any', 'curs', 'codi_naturalesa', 'nom_naturalesa', 'codi_titularitat', 'nom_titularitat', 'adre_a',
  'codi_postal', 'tel_fon', 'codi_delegaci', 'nom_delegaci', 'codi_comarca', 'nom_comarca', 'codi_municipi',
  'codi_municipi_6', 'nom_municipi', 'codi_districte_municipal', 'nom_dm', 'codi_localitat', 'nom_localitat',
  'coordenades_utm_x', 'coordenades_utm_y', 'coordenades_geo_x', 'coordenades_geo_y', 'e_mail_centre', 'url',
  'imatge', 'einf1c', 'einf2c', 'epri', 'eso', 'batx', 'aa01', 'cfpm', 'ppas', 'aa03', 'cfps', 'ee', 'ife',
  'pfi', 'pa01', 'cfam', 'pa02', 'cfas', 'esdi', 'escm', 'escs', 'adr', 'crbc', 'idi', 'dane', 'danp', 'dans',
  'muse', 'musp', 'muss', 'tegm', 'tegs', 'estr', 'adults', 'geo_1',
];
let fitxaCurrentCoursePromise = null;
const fitxaCacheByCode = new Map();

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

function normalizeFitxaWebUrl(value) {
  const raw = String(value || '').trim();
  if (!raw || raw === '0' || raw === '-') return '';
  return raw;
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

function normalizeCentreCode(value) {
  const raw = String(value || '').trim();
  if (/^8\d{6}$/.test(raw)) return `0${raw}`;
  return raw;
}

function fitxaEscapeSoql(value) {
  return String(value || '').replaceAll("'", "''");
}

function fitxaToInt(value) {
  const parsed = Number(getTextValue(value));
  return Number.isFinite(parsed) ? parsed : 0;
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

function prettifyFitxaKey(key) {
  if (FITXA_KEY_LABELS[key]) return FITXA_KEY_LABELS[key];
  return key
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function pickBestFitxaRow(rows) {
  if (!rows.length) return null;
  return [...rows].sort((a, b) => {
    const yearDiff = fitxaToInt(b.any) - fitxaToInt(a.any);
    if (yearDiff !== 0) return yearDiff;
    const courseDiff = fitxaToInt(b.curs) - fitxaToInt(a.curs);
    if (courseDiff !== 0) return courseDiff;
    const aScore = Object.values(a).filter((value) => getTextValue(value)).length;
    const bScore = Object.values(b).filter((value) => getTextValue(value)).length;
    return bScore - aScore;
  })[0];
}

function rowToOrderedFitxaFields(row) {
  const fields = {};
  const ignored = new Set(['codi_centre', 'denominaci_completa']);
  const keys = Object.keys(row).filter((key) => !ignored.has(key));
  const priorityPresent = FITXA_PRIORITY_KEYS.filter((key) => keys.includes(key));
  const rest = keys.filter((key) => !priorityPresent.includes(key)).sort((a, b) => a.localeCompare(b, 'ca'));
  [...priorityPresent, ...rest].forEach((key) => {
    fields[prettifyFitxaKey(key)] = getTextValue(row[key]) || '-';
  });
  return fields;
}

async function getCurrentFitxaCourse() {
  if (fitxaCurrentCoursePromise) return fitxaCurrentCoursePromise;
  fitxaCurrentCoursePromise = (async () => {
    const query = 'SELECT max(curs) as current_curs WHERE curs is not null';
    const response = await fetch(`${SOCRATA_RESOURCE_URL}?$query=${encodeURIComponent(query)}`);
    const rows = await response.json();
    if (!response.ok || !Array.isArray(rows) || !rows.length || !getTextValue(rows[0]?.current_curs)) {
      throw new Error("No s'ha pogut determinar el curs actual.");
    }
    return getTextValue(rows[0].current_curs);
  })();
  return fitxaCurrentCoursePromise;
}

async function fetchFitxaSocrataRows(whereClause, limit = 5) {
  const currentCourse = await getCurrentFitxaCourse();
  const query = `SELECT * WHERE curs = '${fitxaEscapeSoql(currentCourse)}' AND (${whereClause}) ORDER BY any DESC, curs DESC LIMIT ${limit}`;
  const response = await fetch(`${SOCRATA_RESOURCE_URL}?$query=${encodeURIComponent(query)}`);
  const raw = await response.text();
  let rows = null;
  try {
    rows = JSON.parse(raw);
  } catch {
    if (raw.trim().startsWith('<!DOCTYPE') || raw.trim().startsWith('<html')) {
      throw new Error("L'API ha retornat HTML en lloc de JSON.");
    }
    throw new Error("Resposta no vàlida de l'API.");
  }
  if (!response.ok) {
    const message = Array.isArray(rows) ? "Error consultant l'API de dades obertes." : (rows?.message || "Error consultant l'API de dades obertes.");
    throw new Error(message);
  }
  return Array.isArray(rows) ? rows : [];
}

function rowToFitxaData(code, row) {
  if (!row) {
    return {
      status: 'not_found',
      requestedCode: code,
      sourceUrl: SOCRATA_SOURCE_URL,
      message: "No s'ha trobat cap centre amb aquest codi.",
      fields: {},
    };
  }

  const webValue = normalizeFitxaWebUrl(row.url);
  const x = getTextValue(row.coordenades_utm_x);
  const y = getTextValue(row.coordenades_utm_y);
  const fields = rowToOrderedFitxaFields(row);
  if (webValue) fields['URL pàgina web centre'] = webValue;
  if (x && y) fields.Coordenades = `${x} X | ${y} Y`;

  return {
    status: 'ok',
    requestedCode: code,
    sourceUrl: SOCRATA_SOURCE_URL,
    centre: {
      code: getTextValue(row.codi_centre || code).trim(),
      name: getTextValue(row.denominaci_completa).trim() || '-',
    },
    coordinates: { x, y },
    fields,
  };
}

async function fetchFitxaByCode(code) {
  const normalizedCode = normalizeCentreCode(code);
  if (!/^\d{8}$/.test(normalizedCode)) {
    return {
      status: 'not_found',
      requestedCode: normalizedCode,
      sourceUrl: SOCRATA_SOURCE_URL,
      message: 'El codi del centre no és vàlid.',
      fields: {},
    };
  }
  if (fitxaCacheByCode.has(normalizedCode)) return fitxaCacheByCode.get(normalizedCode);
  const rows = await fetchFitxaSocrataRows(`codi_centre = '${fitxaEscapeSoql(normalizedCode)}'`, 5);
  const data = rowToFitxaData(normalizedCode, pickBestFitxaRow(rows));
  fitxaCacheByCode.set(normalizedCode, data);
  return data;
}

function utmToLatLon(zone, easting, northing, isNorthernHemisphere) {
  const a = 6378137.0;
  const f = 1 / 298.257223563;
  const k0 = 0.9996;
  const eccSquared = f * (2 - f);
  const eccPrimeSquared = eccSquared / (1 - eccSquared);
  const e1 = (1 - Math.sqrt(1 - eccSquared)) / (1 + Math.sqrt(1 - eccSquared));
  const x = easting - 500000.0;
  let y = northing;
  if (!isNorthernHemisphere) y -= 10000000.0;
  const longOrigin = (zone - 1) * 6 - 180 + 3;
  const m = y / k0;
  const mu = m / (a * (1 - eccSquared / 4 - (3 * eccSquared * eccSquared) / 64 - (5 * eccSquared * eccSquared * eccSquared) / 256));
  const phi1Rad = mu
    + ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu)
    + ((21 * e1 * e1) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu)
    + ((151 * e1 ** 3) / 96) * Math.sin(6 * mu)
    + ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);
  const n1 = a / Math.sqrt(1 - eccSquared * Math.sin(phi1Rad) ** 2);
  const t1 = Math.tan(phi1Rad) ** 2;
  const c1 = eccPrimeSquared * Math.cos(phi1Rad) ** 2;
  const r1 = (a * (1 - eccSquared)) / Math.pow(1 - eccSquared * Math.sin(phi1Rad) ** 2, 1.5);
  const d = x / (n1 * k0);
  const latRad = phi1Rad - ((n1 * Math.tan(phi1Rad)) / r1) * (
    (d * d) / 2
    - ((5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * eccPrimeSquared) * d ** 4) / 24
    + ((61 + 90 * t1 + 298 * c1 + 45 * t1 * t1 - 252 * eccPrimeSquared - 3 * c1 * c1) * d ** 6) / 720
  );
  const lonRad = (
    d
    - ((1 + 2 * t1 + c1) * d ** 3) / 6
    + ((5 - 2 * c1 + 28 * t1 - 3 * c1 * c1 + 8 * eccPrimeSquared + 24 * t1 * t1) * d ** 5) / 120
  ) / Math.cos(phi1Rad);

  return {
    lat: (latRad * 180) / Math.PI,
    lon: longOrigin + (lonRad * 180) / Math.PI,
  };
}

function closeCentreMapModal() {
  if (!centreMapModalEl || !centreMapFrameEl) return;
  centreMapModalEl.classList.add('hidden');
  centreMapModalEl.classList.remove('flex');
  centreMapFrameEl.src = '';
}

function openCentreMapModal(xValue, yValue) {
  if (!centreMapModalEl || !centreMapFrameEl || !openCentreMapLinkEl || !centreMapCoordsLabelEl) return;
  const x = Number(xValue);
  const y = Number(yValue);
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
    return `<div class="fitxa-inline-actions"><span>${escaped}</span><button class="fitxa-copy-btn" data-copy="${escaped}" type="button">Copiar</button></div>`;
  }
  if (phoneNumber) {
    const safePhone = escapeHtml(phoneNumber);
    return `<div class="fitxa-inline-actions"><span>${escaped}</span><button class="fitxa-call-btn" data-call-number="${safePhone}" type="button">Trucar</button><button class="fitxa-phone-copy-btn" data-copy-phone="${safePhone}" type="button">Copiar</button></div>`;
  }
  if (webUrl) {
    const normalizedUrl = /^https?:\/\//i.test(webUrl) ? webUrl : `http://${webUrl}`;
    return `<div class="fitxa-inline-actions"><span>${escaped}</span><button class="fitxa-web-btn" data-open-url="${escapeHtml(normalizedUrl)}" type="button">Web</button></div>`;
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
      `<tr><th>Coordenades</th><td><div class="fitxa-inline-actions"><span>${escapeHtml(coordText)}</span><button class="fitxa-map-btn" type="button" data-map-x="${escapeHtml(data.coordinates.x)}" data-map-y="${escapeHtml(data.coordinates.y)}">Veure mapa</button></div></td></tr>`,
    );
  }

  Object.entries(fields).forEach(([label, value]) => {
    if (label === 'Coordenades') return;
    const displayValue = Array.isArray(value) ? value.join(' | ') : String(value ?? '');
    rows.push(`<tr><th>${escapeHtml(label)}</th><td>${buildFitxaCellValue(label, displayValue)}</td></tr>`);
  });

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
      labels: ['Trucada realitzada (SI)', 'Trucada realitzada (NO)'],
      datasets: [
        {
          data: [callYes, callNo],
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
    <table class="management-table text-left text-sm${state.educationStage === 'PRIMARIA' ? ' primary-management-table' : ''}">
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

primaryJointActionTableEl?.addEventListener('click', (event) => {
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
