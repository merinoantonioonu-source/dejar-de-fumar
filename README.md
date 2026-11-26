# 🚭 Sin humo: app para dejar de fumar

Aplicación web instalable en el móvil (PWA) para dejar de fumar. Usa técnicas con base científica y te muestra **cómo se va recuperando tu cuerpo** con cada hito sin tabaco.

- Funciona sin conexión.
- No necesita servidor ni cuenta.
- **Todos los datos se quedan en tu dispositivo.**

## Qué incluye y en qué se basa

| Función | Por qué (evidencia) |
|---|---|
| **Insignias = cambios en tu cuerpo**: 15 hitos, de los 20 minutos a los 15 años (pulso, monóxido de carbono, gusto y olfato, pulmones, riesgo cardíaco, cáncer…). Avisan al desbloquearse. | Hacer visibles los beneficios de la abstinencia es una técnica de cambio de conducta que usa Smoke Free. Datos de la OMS, el NHS y la American Cancer Society. |
| **Mensaje diario según tu fase**: preparación, día D, días 1–30 y mantenimiento. Se personaliza con tu nombre, tus motivos, tus desencadenantes y tus planes. | Los programas de SMS son la intervención digital con mejor evidencia (revisión Cochrane CD006611). |
| **SOS "surfear el deseo"** en 5 pasos: puntuar, respiración guiada 4-6 con temporizador de 3 minutos, tu plan, tus motivos y el resultado. | Técnicas de ACT, la base de iCanQuit: en un ensayo con 2.415 personas duplicó la abstinencia prolongada frente a la app QuitGuide del NCI (JAMA Intern Med, 2020). |
| **Planes "si… entonces…"** para cada desencadenante, con sugerencias. | Intenciones de implementación (Gollwitzer y Sheeran, 2006). |
| **Perjuicios del tabaco de vez en cuando** (configurable: a menudo, de vez en cuando o nunca). Cada uno va acompañado de lo que ganas al dejarlo. | Los mensajes de miedo son más eficaces cuando incluyen cómo evitar el daño (Tannenbaum et al., 2015). |
| **Contadores**: cigarrillos evitados, dinero ahorrado y vida recuperada (~20 min por cigarrillo). Además, una **recompensa real** pagada con lo ahorrado. | Jackson et al. (UCL), 2025. Las recompensas reales tienen más evidencia que las virtuales. |
| **Desliz ≠ recaída**: un flujo para analizar qué pasó y volver a cero sin culpa. Regla de "ni una calada". | Prevención de recaídas (efecto de violación de la abstinencia). Un cigarrillo al día ya supone ~la mitad del exceso de riesgo cardíaco (Hackshaw, BMJ 2018). |
| **Fase de preparación**: registro de cigarrillos con momento y emoción, lista STAR y cuenta atrás al día D. | Autorregistro y guías clínicas. |
| **Medicación**: recordatorio diario e información. | Combinar fármacos con apoyo conductual es lo más eficaz. |
| **Progreso**: deseos por día, eficacia del SOS (intensidad antes y después), momentos de riesgo e historial. | Autorregistro y feedback. |
| **Calendario (.ics)** con los hitos futuros y un recordatorio diario. | Es la única forma fiable de recibir avisos programados sin servidor. |

Todas las fuentes están dentro de la app, en **📚 Aprende → Fuentes científicas**, y en [`js/content.js`](js/content.js).

> Esta app es una herramienta de apoyo y no sustituye el consejo de un profesional sanitario.

## Usarla en el móvil

1. Publícala con GitHub Pages: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**.
2. Abre `https://<tu-usuario>.github.io/dejar-de-fumar/` en el móvil.
3. Instálala:
   - **Android (Chrome):** menú ⋮ → *Instalar aplicación*.
   - **iPhone (Safari):** Compartir → *Añadir a pantalla de inicio*.
4. En ⚙️ Ajustes:
   - activa los avisos de hitos;
   - toca **"Añadir hitos al calendario"** para recibir alarmas aunque no abras la app.

### Sobre las notificaciones

Sin servidor, el navegador avisa de los nuevos hitos al abrir la app. En Android con la app instalada también puede hacerlo en segundo plano, mediante sincronización periódica. En iPhone las notificaciones requieren iOS 16.4 o posterior y tener la app añadida a la pantalla de inicio. El archivo de calendario es la vía garantizada en cualquier móvil.

## Desarrollo

Es JavaScript sin dependencias ni paso de compilación.

```bash
npm start   # servidor local en http://localhost:8080
npm test    # pruebas de la lógica (node --test)
```

Estructura:

- `index.html`: contenedor y navegación
- `css/styles.css`: estilos (modo claro y oscuro)
- `js/content.js`: hitos, perjuicios, mensajes, desencadenantes y fuentes
- `js/logic.js`: cálculos puros (probados en `tests/`)
- `js/app.js`: interfaz y pantallas
- `js/store.js`: guardado local, exportar e importar copias
- `js/notify.js`: notificaciones
- `sw.js`: service worker (uso sin conexión y avisos en segundo plano)
