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

export function createManagementMapController({
  managementMapModalEl,
  managementMapEl,
  managementMapSummaryEl,
  closeManagementMapBtn,
  fetchFitxaByCode,
  getRowValue,
  normalizeHeader,
  normalizeBoolean,
  escapeHtml,
}) {
  let leafletMap = null;
  let leafletLayer = null;
  let territorialServicesLayer = null;
  let territorialServicesPromise = null;
  let renderId = 0;

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

  function getVisibleTerritorialServiceCodes(selectedSstt) {
    const selected = String(selectedSstt || '').trim();
    if (selected && selected !== 'ALL') {
      const territorialCode = SSTT_TO_TERRITORIAL_SERVICE_CODE[selected];
      return territorialCode ? new Set([territorialCode]) : new Set();
    }
    return new Set(Object.values(SSTT_TO_TERRITORIAL_SERVICE_CODE));
  }

  async function renderTerritorialServices(selectedSstt, currentRenderId) {
    if (!leafletMap) return null;
    if (territorialServicesLayer) {
      territorialServicesLayer.remove();
      territorialServicesLayer = null;
    }

    const visibleCodes = getVisibleTerritorialServiceCodes(selectedSstt);
    if (!visibleCodes.size) return null;

    const features = (await loadTerritorialServices())
      .filter((feature) => visibleCodes.has(String(feature?.properties?.codi || '')));

    if (currentRenderId !== renderId) return null;
    if (!features.length) return null;

    territorialServicesLayer = L.geoJSON(features, {
      interactive: false,
      style: {
        color: '#a8141a',
        weight: 1.5,
        opacity: 0.95,
        fillColor: '#d8232a',
        fillOpacity: 0.32,
      },
    }).addTo(leafletMap);
    territorialServicesLayer.bringToBack();
    return territorialServicesLayer;
  }

  function close() {
    if (!managementMapModalEl) return;
    managementMapModalEl.classList.add('hidden');
    managementMapModalEl.classList.remove('flex');
  }

  async function open(pendingRows = [], selectedSstt = 'ALL') {
    if (!managementMapModalEl || !managementMapEl || !managementMapSummaryEl) return;
    const callDoneFields = ['Trucada realitzada'];

    managementMapModalEl.classList.remove('hidden');
    managementMapModalEl.classList.add('flex');
    managementMapSummaryEl.textContent = pendingRows.length
      ? `Carregant ${pendingRows.length} centres pendents d'actuació...`
      : 'Carregant el mapa del Servei Territorial...';

    if (typeof L === 'undefined') {
      managementMapEl.innerHTML = `<div class="flex h-full items-center justify-center p-6 text-center text-slate-500">No s'ha pogut carregar el mapa.</div>`;
      return;
    }

    if (!leafletMap) {
      leafletMap = L.map(managementMapEl, {
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
        maxZoom: 18,
      }).addTo(leafletMap);

      leafletLayer = L.layerGroup().addTo(leafletMap);
    }

    leafletLayer?.clearLayers();
    const currentRenderId = ++renderId;
    const visibleTerritorialLayer = await renderTerritorialServices(selectedSstt, currentRenderId);

    if (currentRenderId !== renderId) return;

    const locatedRows = (await Promise.all(pendingRows.map(async (row) => {
      const code = getRowValue(row, ['Codi']).toString().trim();
      if (!code) return null;
      try {
        const fitxaData = await fetchFitxaByCode(code);
        const latLon = getFitxaLatLon(fitxaData);
        if (!latLon) return null;
        return {
          code,
          name: getRowValue(row, ['Nom']).toString().trim(),
          sstt: (row[normalizeHeader('SSTT')] || '').trim(),
          callDone: normalizeBoolean(getRowValue(row, callDoneFields)) === true,
          lat: latLon.lat,
          lon: latLon.lon,
        };
      } catch {
        return null;
      }
    }))).filter(Boolean);

    if (currentRenderId !== renderId) return;

    const missingCoordinates = pendingRows.length - locatedRows.length;
    const doneCount = locatedRows.filter((item) => item.callDone).length;
    const pendingCount = locatedRows.length - doneCount;
    managementMapSummaryEl.textContent = pendingRows.length
      ? `${locatedRows.length} centres ubicats · ${pendingCount} amb trucada pendent · ${doneCount} amb trucada feta${missingCoordinates ? ` · ${missingCoordinates} sense coordenades` : ''}`
      : '0 centres pendents d\'actuació · només es mostra el Servei Territorial';

    const bounds = [];
    locatedRows.forEach((item) => {
      bounds.push([item.lat, item.lon]);
      const icon = L.divIcon({
        className: '',
        html: `<span class="phone-marker ${item.callDone ? 'done' : 'pending'}">☎</span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const marker = L.marker([item.lat, item.lon], { icon });
      marker.bindPopup(
        `<strong>${escapeHtml(item.name || item.code)}</strong><br>Codi: ${escapeHtml(item.code)}<br>SSTT: ${escapeHtml(item.sstt)}<br>Trucada realitzada: ${item.callDone ? 'SI' : 'NO'}`,
      );
      marker.addTo(leafletLayer);
    });

    window.setTimeout(() => {
      leafletMap?.invalidateSize();
      if (visibleTerritorialLayer) {
        leafletMap?.fitBounds(visibleTerritorialLayer.getBounds(), { padding: [24, 24] });
      } else if (locatedRows.length) {
        leafletMap?.fitBounds(bounds, { padding: [24, 24] });
      } else {
        leafletMap?.fitBounds([
          [42.95, 0.15],
          [40.45, 3.5],
        ]);
      }
    }, 0);
  }

  function bindStaticEvents() {
    closeManagementMapBtn?.addEventListener('click', close);
    managementMapModalEl?.addEventListener('click', (event) => {
      if (event.target === managementMapModalEl) close();
    });
  }

  return { open, close, bindStaticEvents };
}
