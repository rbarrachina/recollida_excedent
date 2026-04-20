function buildNumericCandidates(value) {
  const raw = String(value ?? '').trim().replace(/\s+/g, '');
  if (!raw) return [];

  const candidates = new Set();
  const addCandidate = (candidate) => {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed)) candidates.add(parsed);
  };

  addCandidate(raw);

  const commaCount = (raw.match(/,/g) || []).length;
  const dotCount = (raw.match(/\./g) || []).length;

  if (commaCount && dotCount) {
    if (raw.lastIndexOf(',') > raw.lastIndexOf('.')) {
      addCandidate(raw.replace(/\./g, '').replace(',', '.'));
    } else {
      addCandidate(raw.replace(/,/g, ''));
    }
  } else if (commaCount === 1 && dotCount === 0) {
    addCandidate(raw.replace(',', '.'));
  } else if (commaCount > 1 && dotCount === 0) {
    const firstComma = raw.indexOf(',');
    const lastComma = raw.lastIndexOf(',');
    addCandidate(`${raw.slice(0, firstComma)}.${raw.slice(firstComma + 1).replace(/,/g, '')}`);
    addCandidate(`${raw.slice(0, lastComma).replace(/,/g, '')}.${raw.slice(lastComma + 1)}`);
    addCandidate(raw.replace(/,/g, ''));
  } else if (dotCount > 1 && commaCount === 0) {
    const firstDot = raw.indexOf('.');
    const lastDot = raw.lastIndexOf('.');
    addCandidate(`${raw.slice(0, firstDot)}.${raw.slice(firstDot + 1).replace(/\./g, '')}`);
    addCandidate(`${raw.slice(0, lastDot).replace(/\./g, '')}.${raw.slice(lastDot + 1)}`);
    addCandidate(raw.replace(/\./g, ''));
  }

  return [...candidates];
}

function pickCandidate(value, validator) {
  const candidates = buildNumericCandidates(value);
  return candidates.find((candidate) => validator(candidate)) ?? Number.NaN;
}

function isReasonableCataloniaLat(lat) {
  return lat >= 40 && lat <= 43.2;
}

function isReasonableCataloniaLon(lon) {
  return lon >= -0.5 && lon <= 4;
}

function parseGeoCoordinate(value, axis) {
  return pickCandidate(value, (candidate) => (
    axis === 'lat' ? isReasonableCataloniaLat(candidate) : isReasonableCataloniaLon(candidate)
  ));
}

function parseUtmCoordinate(value, axis) {
  return pickCandidate(value, (candidate) => (
    axis === 'x'
      ? candidate >= 100000 && candidate <= 999999
      : candidate >= 1000000 && candidate <= 50000000
  ));
}

export function utmToLatLon(zone, easting, northing, isNorthernHemisphere) {
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

export function normalizeUtmCoordinatePair(xValue, yValue) {
  let x = parseUtmCoordinate(xValue, 'x');
  let y = parseUtmCoordinate(yValue, 'y');
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { x, y };

  // Alguns registres venen amb una xifra decimal desplaçada a les UTM.
  while (y > 10000000 && y / 10 >= 4000000 && y / 10 <= 5000000) {
    y /= 10;
  }

  while (x > 1000000 && x / 10 >= 100000 && x / 10 <= 999999) {
    x /= 10;
  }

  return { x, y };
}

export function getFitxaLatLon(fitxaData) {
  const geoX = parseGeoCoordinate(fitxaData?.coordinates?.geoX, 'lat');
  const geoY = parseGeoCoordinate(fitxaData?.coordinates?.geoY, 'lon');
  if (Number.isFinite(geoX) && Number.isFinite(geoY)) {
    return { lat: geoX, lon: geoY };
  }

  const { x, y } = normalizeUtmCoordinatePair(fitxaData?.coordinates?.x, fitxaData?.coordinates?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

  const converted = utmToLatLon(31, x, y, true);
  if (!Number.isFinite(converted.lat) || !Number.isFinite(converted.lon)) return null;
  if (!isReasonableCataloniaLat(converted.lat) || !isReasonableCataloniaLon(converted.lon)) return null;
  return converted;
}
