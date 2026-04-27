export const SOCRATA_RESOURCE_URL = 'https://analisi.transparenciacatalunya.cat/resource/kvmv-ahh4.json';
export const SOCRATA_SOURCE_URL = 'https://analisi.transparenciacatalunya.cat/d/kvmv-ahh4';

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

export function normalizeFitxaWebUrl(value) {
  const raw = String(value || '').trim();
  if (!raw || raw === '0' || raw === '-') return '';
  return raw;
}

export function normalizeCentreCode(value) {
  const raw = String(value || '').trim();
  if (/^8\d{6}$/.test(raw)) return `0${raw}`;
  return raw;
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

function fitxaEscapeSoql(value) {
  return String(value || '').replaceAll("'", "''");
}

function fitxaToInt(value) {
  const parsed = Number(getTextValue(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeFitxaLookupText(value) {
  return getTextValue(value)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactFitxaLookupText(value) {
  return normalizeFitxaLookupText(value).replace(/\s+/g, '');
}

function fitxaLevenshteinDistance(a, b) {
  const left = compactFitxaLookupText(a);
  const right = compactFitxaLookupText(b);
  if (!left || !right) return Math.max(left.length, right.length);
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost,
      );
    }
    for (let j = 0; j <= right.length; j += 1) previous[j] = current[j];
  }

  return previous[right.length];
}

function fitxaLookupTextsAreSimilar(a, b) {
  const left = compactFitxaLookupText(a);
  const right = compactFitxaLookupText(b);
  if (!left || !right) return false;
  if (left.includes(right) || right.includes(left)) return true;
  const maxLength = Math.max(left.length, right.length);
  const distance = fitxaLevenshteinDistance(left, right);
  return maxLength <= 8 ? distance <= 1 : distance <= 2;
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

export function createFitxaService() {
  let fitxaCurrentCoursePromise = null;
  let fitxaCentreCandidatesPromise = null;
  const fitxaCacheByCode = new Map();
  const fitxaCandidatesByTown = new Map();

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

  async function fetchCurrentCentreCandidates() {
    if (fitxaCentreCandidatesPromise) return fitxaCentreCandidatesPromise;
    fitxaCentreCandidatesPromise = (async () => {
      const currentCourse = await getCurrentFitxaCourse();
      const fields = [
        'codi_centre',
        'denominaci_completa',
        'nom_municipi',
        'nom_localitat',
        'einf1c',
        'einf2c',
        'epri',
      ].join(', ');
      const query = `SELECT ${fields} WHERE curs = '${fitxaEscapeSoql(currentCourse)}' LIMIT 50000`;
      const response = await fetch(`${SOCRATA_RESOURCE_URL}?$query=${encodeURIComponent(query)}`);
      const raw = await response.text();
      let rows = null;
      try {
        rows = JSON.parse(raw);
      } catch {
        throw new Error("Resposta no vàlida de l'API.");
      }
      if (!response.ok) {
        throw new Error(Array.isArray(rows) ? "Error consultant l'API de dades obertes." : (rows?.message || "Error consultant l'API de dades obertes."));
      }
      return Array.isArray(rows) ? rows : [];
    })();
    return fitxaCentreCandidatesPromise;
  }

  function mapFitxaCandidateRow(row) {
    return {
      code: normalizeCentreCode(getTextValue(row.codi_centre)),
      name: getTextValue(row.denominaci_completa),
      town: getTextValue(row.nom_municipi),
      locality: getTextValue(row.nom_localitat),
      hasPrimary: getTextValue(row.epri) === '1',
      hasInfantil: getTextValue(row.einf1c) === '1' || getTextValue(row.einf2c) === '1',
      sourceUrl: SOCRATA_SOURCE_URL,
      raw: row,
    };
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
    const geoX = getTextValue(row.coordenades_geo_x);
    const geoY = getTextValue(row.coordenades_geo_y);
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
      coordinates: { x, y, geoX, geoY },
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

  async function fetchCentreCandidatesByTown(town) {
    const normalizedTown = getTextValue(town);
    if (!normalizedTown) return [];
    const townKey = normalizeFitxaLookupText(normalizedTown);
    const cacheKey = townKey.toLowerCase();
    if (fitxaCandidatesByTown.has(cacheKey)) return fitxaCandidatesByTown.get(cacheKey);
    const rows = await fetchCurrentCentreCandidates();
    let candidates = rows
      .map(mapFitxaCandidateRow)
      .filter((item) => item.code && item.name)
      .filter((item) => normalizeFitxaLookupText(item.town) === townKey || normalizeFitxaLookupText(item.locality) === townKey);
    if (!candidates.length && townKey.length >= 4) {
      candidates = rows
        .map(mapFitxaCandidateRow)
        .filter((item) => item.code && item.name)
        .filter((item) => {
          const candidateTown = normalizeFitxaLookupText(item.town);
          const candidateLocality = normalizeFitxaLookupText(item.locality);
          return candidateTown.includes(townKey)
            || townKey.includes(candidateTown)
            || candidateLocality.includes(townKey)
            || townKey.includes(candidateLocality);
        });
    }
    if (!candidates.length && townKey.length >= 4) {
      candidates = rows
        .map(mapFitxaCandidateRow)
        .filter((item) => item.code && item.name)
        .filter((item) => fitxaLookupTextsAreSimilar(item.town, normalizedTown) || fitxaLookupTextsAreSimilar(item.locality, normalizedTown));
    }
    fitxaCandidatesByTown.set(cacheKey, candidates);
    return candidates;
  }

  return {
    fetchFitxaByCode,
    fetchCentreCandidatesByTown,
  };
}
