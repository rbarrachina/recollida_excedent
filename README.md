# recollida_excedent

Aplicacio web estatica amb Tailwind + Chart.js per resumir el CSV de discrepancies.

## Que mostra

- Targetes de resum (total centres, e-Valisa rebuda, etc.)
- Grafic `e-Valisa rebuda vs total centres`
- Grafic `e-Valisa rebuda per SSTT`
- Taula SI/NO dels camps principals

## Com executar

1. Des de la carpeta del projecte, aixeca un servidor local:
   - `python3 -m http.server 8000`
2. Obre `http://localhost:8000`
3. Pots carregar:
   - la mostra inclosa (`Carrega mostra`), o
   - el teu propi CSV amb l'input de fitxer.

Fitxer de mostra inclos a `data/discrepancies.csv`.

## Autor

Rafa Barrachina

## Llicència

CC BY-SA 4.0. Consulta el fitxer `LICENSE`.
