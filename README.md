# recollida_excedent

Aplicació web estàtica amb Tailwind + Chart.js per resumir CSV de discrepàncies d'excedents.

## Què mostra

- Targetes de resum amb indicadors principals.
- Gràfics de seguiment d'e-Valisa i de trucades.
- Taules de gestió per a Secundària i Primària.
- Fitxa del centre carregada des de dades obertes de la Generalitat.

## Com executar

1. Des de la carpeta del projecte, aixeca un servidor local:
   - `python3 -m http.server 8000`
   - Alternativa: `python -m http.server 8000`
2. Obre `http://localhost:8000`
3. Carrega el teu propi CSV amb el selector de fitxer.

## Estructura

- `index.html`: estructura de la pàgina
- `src/app.js`: lògica de càrrega, parseig i renderització
- `src/styles.css`: estils de la interfície

## Notes

- El repositori ja no inclou cap CSV de mostra.
- La fitxa del centre consulta dades obertes de la Generalitat via `https://analisi.transparenciacatalunya.cat/resource/kvmv-ahh4.json`.
- La primera vegada que s'obre un centre, la informació es descarrega en viu des d'aquesta font.
- Durant la mateixa sessió de pàgina, si es torna a obrir el mateix centre, l'aplicació reutilitza una memòria cau del navegador i no repeteix la consulta.
- El curs actual també es guarda en memòria per no recalcular-lo a cada petició de fitxa.
- Si el codi del centre arriba amb 7 dígits i comença per `8`, l'aplicació hi afegeix automàticament un `0` inicial per normalitzar-lo a 8 dígits.

## Autor

Rafa Barrachina

## Llicència

CC BY-SA 4.0. Consulta el fitxer `LICENSE`.
