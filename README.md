# recollida_excedent

Aplicació web estàtica amb Tailwind + Chart.js per resumir CSV de discrepàncies d'excedents.

## Què mostra

- Targetes de resum amb indicadors principals.
- Gràfics de seguiment d'e-Valisa i de trucades.
- Taules de gestió per a Secundària i Primària.
- Mapes de Gestió ST i Gestió SC amb centres geolocalitzats i capa del Servei Territorial.
- Fitxa del centre carregada des de dades obertes de la Generalitat.

## Com executar

1. Des de la carpeta del projecte, aixeca un servidor local:
   - `python3 -m http.server 8000`
   - Alternativa: `python -m http.server 8000`
2. Obre `http://localhost:8000`
3. Carrega el teu propi CSV amb el selector de fitxer.

## Estructura

- `index.html`: estructura de la pàgina
- `data/serveis-territorials-simplificat.geojson`: geometries simplificades dels 12 Serveis Territorials
- `src/app.js`: lògica de càrrega, parseig i renderització
- `src/management-map.js`: mapa emergent de Gestió ST
- `src/sc-management.js`: vista i mapa de Gestió SC
- `src/styles.css`: estils de la interfície

## Mapes de Serveis Territorials

L'aplicació fa servir `Leaflet` i `OpenStreetMap` per mostrar els centres sobre el mapa. A més dels marcadors dels centres, els mapes incorporen una capa de Serveis Territorials pintada en vermell semitransparent i sense etiquetes.

- A `Gestió ST`, el botó `Mapa` obre un popup amb els centres pendents d'actuació. Si hi ha un ST concret seleccionat al filtre global, només es pinta aquell ST. Si el llistat no té cap centre, el popup s'obre igualment i mostra només el polígon del ST seleccionat.
- A `Gestió SC`, el mapa mostra els centres filtrats i també pinta la capa territorial corresponent. Si les dades filtrades corresponen a un únic ST, només es pinta aquell ST; si no, es pinten tots els ST.

La correspondència entre els codis abreujats del CSV (`APA`, `BLL`, `BNS`, `CCE`, `CEB`, `GIR`, `LLE`, `MVO`, `PEN`, `TAR`, `TEB`, `VOC`) i els codis oficials del GeoJSON es defineix dins dels controladors de mapa.

## Dades dels Serveis Territorials

El fitxer local `data/serveis-territorials-simplificat.geojson` és una versió simplificada de les geometries dels Serveis Territorials del Departament d'Educació. Conserva només els 12 registres territorials amb geometria i elimina els registres sense geometria com `No Consta` i `Altres/Diversos`, perquè l'aplicació només necessita pintar els àmbits territorials reals al mapa.

Les dades originals provenen del dataset de Dades Obertes de Catalunya:

https://analisi.transparenciacatalunya.cat/Educaci-/Delimitaci-dels-Serveis-Territorials-del-Departame/2xn2-t3s5

La taula d'origen utilitzada per obtenir el GeoJSON complet és `ne55-4fc5`. Si cal regenerar el fitxer simplificat, s'ha de partir del GeoJSON complet oficial, mantenir els 12 Serveis Territorials amb geometria i descartar els registres sense geometria.

## Notes

- La fitxa del centre consulta dades obertes de la Generalitat via `https://analisi.transparenciacatalunya.cat/resource/kvmv-ahh4.json`.
- La primera vegada que s'obre un centre, la informació es descarrega en viu des d'aquesta font.
- Durant la mateixa sessió de pàgina, si es torna a obrir el mateix centre, l'aplicació reutilitza una memòria cau del navegador i no repeteix la consulta.
- El curs actual també es guarda en memòria per no recalcular-lo a cada petició de fitxa.
- Si el codi del centre arriba amb 7 dígits i comença per `8`, l'aplicació hi afegeix automàticament un `0` inicial per normalitzar-lo a 8 dígits.

## Llicències de tercers

- `Tailwind CSS` es distribueix sota llicència `MIT`.
- `Chart.js` es distribueix sota llicència `MIT`.
- `chartjs-plugin-datalabels` es distribueix sota llicència `MIT`.
- `Leaflet` es distribueix sota llicència `BSD 2-Clause`.
- Les dades i tiles de mapa d'`OpenStreetMap` requereixen atribució visible. L'aplicació mostra l'atribució al mapa i aquestes dades estan subjectes a la llicència `ODbL`. Més informació a `https://www.openstreetmap.org/copyright`.
- La icona `CC BY-SA` carregada des de Wikimedia Commons es fa servir com a recurs gràfic informatiu. Consulta la fitxa del recurs per als detalls d'ús i marca: `https://commons.wikimedia.org/wiki/File:CC_BY-SA_icon.svg`.

## Autor

Rafa Barrachina

## Llicència

CC BY-SA 4.0. Consulta el fitxer `LICENSE`.
