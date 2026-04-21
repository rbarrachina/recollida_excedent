import { getFitxaLatLon } from './utils/geo.js';

const TERRITORIAL_SERVICES_URL = 'data/serveis-territorials-simplificat.geojson';
const SSTT_TO_TERRITORIAL_SERVICE_CODE = {
  APA: '1160',
  BLL: '0308',
  BNS: '0208',
  CCE: '1060',
  CEB: '0108',
  GIR: '0117',
  LLE: '0125',
  MVO: '0508',
  PEN: '1260',
  TAR: '0143',
  TEB: '0243',
  VOC: '0408',
};

const SC_MAP_CENTRE = {
  name: 'Institut Sant Elm',
  code: '17003306',
  city: 'Sant Feliu de Guíxols',
  retiredEquipment: null,
  lat: 41.773835,
  lon: 3.028987,
};

export function createScManagementController({
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
}) {
  let scLeafletMap = null;
  let scLeafletLayer = null;
  let scTerritorialServicesLayer = null;
  let territorialServicesPromise = null;
  let renderRequestId = 0;
  let lastRows = [];
  let lastConfig = {};
  let lastRenderOptions = {};
  const filterEls = {
    receivedYes: document.getElementById('scFilterReceivedYes'),
    neededYes: document.getElementById('scFilterNeededYes'),
    neededNo: document.getElementById('scFilterNeededNo'),
  };

  function getTone(centre) {
    if (!centre.evalisaNeeded) return 'needed-no';
    if (centre.evalisaReceived) return 'received-yes';
    if (centre.evalisaNeeded) return 'needed-yes';
    return 'needed-no';
  }

  async function loadTerritorialServices() {
    if (!territorialServicesPromise) {
      territorialServicesPromise = fetch(TERRITORIAL_SERVICES_URL)
        .then((response) => {
          if (!response.ok) throw new Error('No s\'ha pogut carregar el GeoJSON dels SSTT');
          return response.json();
        })
        .then((geojson) => (Array.isArray(geojson.features) ? geojson.features : []))
        .catch(() => []);
    }
    return territorialServicesPromise;
  }

  function getVisibleTerritorialServiceCodes(rows) {
    const ssttField = normalizeHeader('SSTT');
    const rowSstt = [...new Set(rows
      .map((row) => String(row[ssttField] || '').trim())
      .filter(Boolean))];
    const visibleSstt = rowSstt.length === 1
      ? rowSstt
      : Object.keys(SSTT_TO_TERRITORIAL_SERVICE_CODE);

    return new Set(visibleSstt
      .map((sstt) => SSTT_TO_TERRITORIAL_SERVICE_CODE[sstt])
      .filter(Boolean));
  }

  async function renderTerritorialServices(rows, requestId) {
    if (!scLeafletMap) return null;
    if (scTerritorialServicesLayer) {
      scTerritorialServicesLayer.remove();
      scTerritorialServicesLayer = null;
    }

    const visibleCodes = getVisibleTerritorialServiceCodes(rows);
    if (!visibleCodes.size) return null;

    const features = (await loadTerritorialServices())
      .filter((feature) => visibleCodes.has(String(feature?.properties?.codi || '')));

    if (requestId !== renderRequestId) return null;
    if (!features.length) return null;

    scTerritorialServicesLayer = L.geoJSON(features, {
      interactive: false,
      style: {
        color: '#a8141a',
        weight: 1.5,
        opacity: 0.95,
        fillColor: '#d8232a',
        fillOpacity: 0.32,
      },
    }).addTo(scLeafletMap);
    scTerritorialServicesLayer.bringToBack();
    return scTerritorialServicesLayer;
  }

  function isToneVisible(tone) {
    if (tone === 'received-yes') return filterEls.receivedYes?.checked !== false;
    if (tone === 'needed-yes') return filterEls.neededYes?.checked !== false;
    return filterEls.neededNo?.checked !== false;
  }

  function bindFilterEvents() {
    Object.values(filterEls).forEach((filterEl) => {
      if (!filterEl || filterEl.dataset.bound === 'true') return;
      filterEl.addEventListener('change', () => {
        render(lastRows, lastConfig, { preserveView: true });
      });
      filterEl.dataset.bound = 'true';
    });
  }

  function parseScRetiredEquipment(row) {
    if (!row) return null;
    const candidateFields = [
      'Equips retirats',
      'equips retirats',
      'Equips a recollir',
      'Equips a recollir a la visita (excedents mès averiats)',
      'Equips a recollir a la visita (excedents més avariats)',
    ].map((field) => normalizeHeader(field));

    for (const field of candidateFields) {
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
      if (!normalizedKey.includes('equips') || !normalizedKey.includes('retirats')) continue;
      const normalizedValue = String(value ?? '').replace(',', '.').trim();
      if (!normalizedValue) continue;
      const parsed = Number(normalizedValue);
      if (Number.isFinite(parsed)) return parsed;
      const extractedNumber = normalizedValue.match(/-?\d+(?:\.\d+)?/);
      if (extractedNumber) {
        const extractedParsed = Number(extractedNumber[0]);
        if (Number.isFinite(extractedParsed)) return extractedParsed;
      }
    }

    return null;
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

  function getCentresForMap(rows, config = {}) {
    const codeField = normalizeHeader('Codi');
    const nameField = normalizeHeader('Nom');
    const neededField = normalizeHeader(config.neededField || 'e-Valisa necessaria?');
    const receivedField = normalizeHeader(config.receivedField || 'e-Valisa rebuda');
    const municipalityFields = [
      normalizeHeader('Municipi'),
      normalizeHeader('Nom municipi'),
    ];

    return rows
      .map((row) => {
        const code = String(row[codeField] || '').trim();
        const retiredEquipment = parseScRetiredEquipment(row);
        if (!/^\d{8}$/.test(code) || retiredEquipment === null) return null;

        const rowName = String(row[nameField] || '').trim();
        const city = municipalityFields
          .map((field) => String(row[field] || '').trim())
          .find(Boolean);

        return {
          code,
          name: rowName || `Centre ${code}`,
          city: city || '',
          retiredEquipment,
          excedents: parseNumericField(row, ['Excedent', 'Excedents']),
          laptopsRetiredTotal: parseNumericField(row, ['equips retirats', 'Equips retirats', 'portatilsretiratstotal', 'PortatilsRetiratsTotal']),
          toRetire: parseNumericField(row, ['Excedent', 'Excedents']) - parseNumericField(row, ['equips retirats', 'Equips retirats', 'portatilsretiratstotal', 'PortatilsRetiratsTotal']),
          evalisaNeeded: normalizeBoolean(row[neededField]) === true,
          evalisaReceived: normalizeBoolean(row[receivedField]) === true,
        };
      })
      .filter(Boolean);
  }

  async function enrichCentresWithCoordinates(centres) {
    const enriched = await Promise.all(centres.map(async (centre) => {
      try {
        const fitxa = await fetchFitxaByCode(centre.code);
        const latLon = getFitxaLatLon(fitxa);
        if (!latLon) return null;
        return {
          ...centre,
          lat: latLon.lat,
          lon: latLon.lon,
        };
      } catch {
        return null;
      }
    }));

    return enriched.filter(Boolean);
  }

  async function render(rows = [], config = {}, options = {}) {
    if (!scManagementSectionEl || !scMapEl) return;
    bindFilterEvents();
    lastRows = rows;
    lastConfig = config;
    const requestId = ++renderRequestId;
    const centres = getCentresForMap(rows, config);
    const totalRetired = centres.reduce((sum, centre) => sum + Number(centre.laptopsRetiredTotal || 0), 0);
    const totalExcedents = centres.reduce((sum, centre) => sum + Number(centre.excedents || 0), 0);
    const totalToRetire = totalExcedents - totalRetired;

    if (scCentreCountEl) scCentreCountEl.textContent = centres.length ? String(centres.length) : '-';
    if (scExcedentsTotalEl) scExcedentsTotalEl.textContent = centres.length ? String(totalExcedents) : '-';
    scRetiredTotalEl.textContent = centres.length ? String(totalRetired) : '-';
    if (scToRetireTotalEl) scToRetireTotalEl.textContent = centres.length ? String(totalToRetire) : '-';
    scCentreNameEl.textContent = 'Resum del mapa';
    scCentreMetaEl.textContent = centres.length ? `${centres.length} centres amb dades d'equips retirats` : 'No hi ha dades per representar.';

    if (typeof L === 'undefined') {
      scMapEl.innerHTML = `<div class="flex h-full items-center justify-center p-6 text-center text-slate-500">No s'ha pogut carregar el mapa.</div>`;
      return;
    }

    if (!scLeafletMap) {
      scLeafletMap = L.map(scMapEl, {
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
        maxZoom: 18,
      }).addTo(scLeafletMap);

      scLeafletMap.fitBounds([
        [42.95, 0.15],
        [40.45, 3.5],
      ]);

      scLeafletLayer = L.layerGroup().addTo(scLeafletMap);
    }

    if (!scLeafletLayer) {
      scLeafletLayer = L.layerGroup().addTo(scLeafletMap);
    }

    scLeafletLayer.clearLayers();
    const visibleTerritorialLayer = await renderTerritorialServices(rows, requestId);
    if (requestId !== renderRequestId) return;

    const centresWithCoordinates = await enrichCentresWithCoordinates(centres);
    if (requestId !== renderRequestId) return;
    const missingCoordinates = centres.length - centresWithCoordinates.length;
    const totalReceivedYes = centresWithCoordinates.filter((centre) => getTone(centre) === 'received-yes').length;
    const totalNeededYes = centresWithCoordinates.filter((centre) => getTone(centre) === 'needed-yes').length;
    const totalNeededNo = centresWithCoordinates.filter((centre) => getTone(centre) === 'needed-no').length;
    const visibleCentres = centresWithCoordinates.filter((centre) => isToneVisible(getTone(centre)));
    const visibleRetired = visibleCentres.reduce((sum, centre) => sum + Number(centre.laptopsRetiredTotal || 0), 0);
    const visibleExcedents = visibleCentres.reduce((sum, centre) => sum + Number(centre.excedents || 0), 0);
    const visibleToRetire = visibleExcedents - visibleRetired;
    const summaryHtml = [
      `Centres totals: ${centres.length}`,
      `Verd: ${totalReceivedYes}`,
      `Groc: ${totalNeededYes}`,
      `Vermell: ${totalNeededNo}`,
      missingCoordinates ? `Sense coordenades: ${missingCoordinates}` : '',
    ].filter(Boolean).join('<br>');

    const bounds = [];
    visibleCentres.forEach((centre) => {
      bounds.push([centre.lat, centre.lon]);
      const tone = getTone(centre);
      const marker = L.circleMarker([centre.lat, centre.lon], {
        radius: 8,
        color: tone === 'received-yes' ? '#15803d' : (tone === 'needed-yes' ? '#ca8a04' : '#b91c1c'),
        weight: 2,
        fillColor: tone === 'received-yes' ? '#22c55e' : (tone === 'needed-yes' ? '#facc15' : '#ef4444'),
        fillOpacity: 0.9,
      });
      marker.bindTooltip(
        `<span class="sc-map-badge ${tone}">${centre.toRetire}</span>`,
        {
          permanent: true,
          direction: 'top',
          offset: [0, -8],
          className: 'sc-map-tooltip',
        },
      );
      marker.bindPopup(
        `<strong>${centre.name}</strong><br>${centre.city}<br>Codi: ${centre.code}<br>Equips excedents: ${centre.excedents}<br>Equips retirats: ${centre.laptopsRetiredTotal}<br>Equips a retirar: ${centre.excedents - centre.laptopsRetiredTotal}<br>e-Valisa necessària: ${centre.evalisaNeeded ? 'SI' : 'NO'}<br>e-Valisa rebuda: ${centre.evalisaReceived ? 'SI' : 'NO'}`,
      );
      marker.addTo(scLeafletLayer);
    });

    if (visibleCentres.length) {
      if (scCentreCountEl) scCentreCountEl.textContent = String(visibleCentres.length);
      if (scExcedentsTotalEl) scExcedentsTotalEl.textContent = String(visibleExcedents);
      scRetiredTotalEl.textContent = String(visibleRetired);
      if (scToRetireTotalEl) scToRetireTotalEl.textContent = String(visibleToRetire);
      scCentreMetaEl.innerHTML = summaryHtml;
      if (!options.preserveView) {
        const fitBounds = visibleTerritorialLayer ? visibleTerritorialLayer.getBounds() : bounds;
        scLeafletMap.fitBounds(fitBounds, {
          paddingTopLeft: [16, 44],
          paddingBottomRight: [16, 12],
        });
      }
    } else {
      if (scCentreCountEl) scCentreCountEl.textContent = '0';
      if (scExcedentsTotalEl) scExcedentsTotalEl.textContent = '0';
      scRetiredTotalEl.textContent = '0';
      if (scToRetireTotalEl) scToRetireTotalEl.textContent = '0';
      scCentreMetaEl.innerHTML = centresWithCoordinates.length
        ? summaryHtml
        : (missingCoordinates ? `Sense coordenades: ${missingCoordinates}` : 'No s\'han pogut obtenir coordenades.');
      if (!options.preserveView) {
        if (visibleTerritorialLayer) {
          scLeafletMap.fitBounds(visibleTerritorialLayer.getBounds(), {
            paddingTopLeft: [16, 44],
            paddingBottomRight: [16, 12],
          });
        } else {
          scLeafletMap.fitBounds([
            [42.95, 0.15],
            [40.45, 3.5],
          ]);
        }
      }
    }

    window.setTimeout(() => {
      scLeafletMap?.invalidateSize();
    }, 0);
  }

  return { render };
}
