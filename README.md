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
| **SOS con caja de herramientas**: 11 estrategias para el momento de la tentación (juego de memoria visual, 3 minutos de ejercicio, "adelanta la película", desactivar el pensamiento, retrasar 10 minutos, boca y manos ocupadas, llamar o escribir a tu apoyo, cambiar de sitio, 5-4-3-2-1, tu carta, nicotina de acción rápida). En Progreso se ve cuáles te funcionan mejor. | Juego visual de 3 min: −14 puntos de antojo (Skorka-Brown et al., 2015). Ejercicio breve: menos ganas hasta 50 min (Taylor et al., 2007; Haasova et al., 2013). Defusión cognitiva de ACT (iCanQuit). |
| **Botón "He fumado" bien visible**. Al registrar una recaída **todo se recalcula desde cero** (racha, cambios del cuerpo, ahorro, cigarrillos evitados) y la app muestra lo que se ha perdido, la mejor racha y el plan para la próxima vez. | Aversión a la pérdida. La regla de "ni una calada" evita que un cigarrillo se convierta en dos. Un cigarrillo al día ya supone ~la mitad del exceso de riesgo cardíaco (Hackshaw, BMJ 2018). |
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
4. Activa los **avisos con la app cerrada** (ver abajo).

## Avisos con la app cerrada (push)

Una web cerrada no puede ejecutar nada por sí misma. Por eso los avisos los envía **tu propio repositorio**: un workflow de GitHub Actions ([`recordatorios.yml`](.github/workflows/recordatorios.yml)) se ejecuta cada 15 minutos y manda notificaciones push al móvil:

- 🫁 **cada nuevo cambio en tu cuerpo**, en el momento en que se alcanza;
- 💬 **el mensaje del día**, a la hora que elijas, con los días sin fumar y el dinero ahorrado (y el recordatorio de la medicación si la usas);
- ⚠️ **un perjuicio del tabaco**, a las 18:00, con la frecuencia elegida (siempre con lo que ganas al dejarlo).

Configuración (una sola vez), desde la app en ⚙️ Ajustes → *Avisos con la app cerrada*:

1. **Activar**: el móvil pide permiso para notificaciones y genera sus propias claves.
2. **Copiar configuración**: copia un JSON con la suscripción del móvil y los datos necesarios para redactar los mensajes.
3. En GitHub: **Settings → Secrets and variables → Actions → New repository secret**, con nombre `PUSH_CONFIG` y como valor lo copiado.
4. Prueba: **Actions → Recordatorios → Run workflow**. Debe llegarte "🔔 Los avisos funcionan".

Notas:

- **iPhone**: requiere iOS 16.4 o posterior y abrir la app desde la pantalla de inicio antes del paso 1.
- **Cuándo repetir los pasos 2 y 3**: si cambias datos que usan los mensajes (por ejemplo, la fecha tras un desliz, tus motivos o la hora del mensaje). La app te lo recuerda con un aviso en la pantalla de inicio.
- **Puntualidad**: GitHub puede retrasar las ejecuciones programadas unos minutos. Los envíos no se pierden, se mandan en la siguiente ejecución.
- **Estado**: se guarda en la rama `avisos-estado` y solo contiene horas de envío, sin datos personales. Los datos personales están únicamente en el secreto `PUSH_CONFIG`, que GitHub cifra y nadie más puede ver.
- **Workflow desactivado**: GitHub desactiva los workflows programados de repos públicos tras 60 días sin actividad. Los envíos diarios guardan estado y cuentan como actividad. Si aun así se desactivara, GitHub te avisa por correo y se reactiva en Actions → Recordatorios → *Enable workflow*.
- **Calendario**: sigue disponible como alternativa sin configuración (⚙️ Ajustes → *Añadir hitos al calendario*).

## Desarrollo

La app es JavaScript sin dependencias ni paso de compilación. Solo el envío de avisos usa `web-push` (en GitHub Actions).

```bash
npm start   # servidor local en http://localhost:8080
npm install # solo para las pruebas del envío de avisos
npm test    # pruebas (node --test)
```

Estructura:

- `index.html`: contenedor y navegación
- `css/styles.css`: estilos (modo claro y oscuro)
- `js/content.js`: hitos, perjuicios, mensajes, desencadenantes y fuentes
- `js/logic.js`: cálculos puros (probados en `tests/`)
- `js/app.js`: interfaz y pantallas
- `js/store.js`: guardado local, exportar e importar copias
- `js/notify.js`: notificaciones
- `js/push.js`: alta de avisos push (claves VAPID y suscripción)
- `js/reminders.js`: qué avisos enviar en cada ejecución (probado)
- `scripts/send-reminders.mjs`: envío desde GitHub Actions
- `sw.js`: service worker (uso sin conexión y muestra de los avisos push)
