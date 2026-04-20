import { getFitxaLatLon } from './utils/geo.js';

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
  let renderId = 0;

  function close() {
    if (!managementMapModalEl) return;
    managementMapModalEl.classList.add('hidden');
    managementMapModalEl.classList.remove('flex');
  }

  async function open(pendingRows = []) {
    if (!managementMapModalEl || !managementMapEl || !managementMapSummaryEl) return;
    const callDoneFields = ['Trucada realitzada'];
    if (!pendingRows.length) return;

    managementMapModalEl.classList.remove('hidden');
    managementMapModalEl.classList.add('flex');
    managementMapSummaryEl.textContent = `Carregant ${pendingRows.length} centres pendents d'actuació...`;

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
    managementMapSummaryEl.textContent = `${locatedRows.length} centres ubicats · ${pendingCount} amb trucada pendent · ${doneCount} amb trucada feta${missingCoordinates ? ` · ${missingCoordinates} sense coordenades` : ''}`;

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
      if (locatedRows.length) {
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
