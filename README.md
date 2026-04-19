# recollida_excedent

Aplicacio web estatica amb Tailwind + Chart.js per resumir CSV de discrepancies.

## Que mostra

- Targetes de resum (total centres, e-Valisa rebuda, etc.)
- Grafic `e-Valisa rebuda vs total centres`
- Grafic `e-Valisa rebuda per SSTT`
- Taula SI/NO dels camps principals

## Com executar

1. Des de la carpeta del projecte, aixeca un servidor local:
   - `python3 -m http.server 8000`
   - alternativa: `python -m http.server 8000`
2. Obre `http://localhost:8000`
3. Carrega el teu propi CSV amb l'input de fitxer.

## Estructura

- `index.html`: estructura de la pagina
- `src/app.js`: logica de carrega, parseig i renderitzat
- `src/styles.css`: estils de la interfície

## Notes

- El repositori ja no inclou cap CSV de mostra.
- La carpeta `data/` pot quedar buida si no es fa servir cap recurs addicional.

## Autor

Rafa Barrachina

## Llicència

CC BY-SA 4.0. Consulta el fitxer `LICENSE`.
