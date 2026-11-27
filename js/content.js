// Contenido de la app. Cada dato lleva su fuente (ver SOURCES al final).
// Tiempos en minutos desde el último cigarrillo.

const H = 60;
const D = 24 * H;

// ---------------------------------------------------------------------------
// Hitos del cuerpo: son las "insignias" principales de la app.
// ---------------------------------------------------------------------------
export const BODY_MILESTONES = [
  {
    id: 'm20', at: 20, icon: '❤️', area: 'Corazón',
    title: 'Pulso y tensión, a la baja',
    body: 'Tu pulso y tu tensión arterial empiezan a bajar hacia valores normales.',
    src: ['who', 'nhs'],
  },
  {
    id: 'h8', at: 8 * H, icon: '🩸', area: 'Sangre',
    title: 'La mitad de monóxido de carbono',
    body: 'El monóxido de carbono en tu sangre se ha reducido aproximadamente a la mitad y el oxígeno empieza a recuperarse.',
    src: ['nhs'],
  },
  {
    id: 'h12', at: 12 * H, icon: '🫁', area: 'Sangre',
    title: 'Monóxido de carbono normal',
    body: 'El nivel de monóxido de carbono en sangre vuelve a la normalidad: tus glóbulos rojos vuelven a cargar oxígeno en lugar de gas tóxico.',
    src: ['who'],
  },
  {
    id: 'd1', at: D, icon: '🧪', area: 'Química',
    title: 'Primer día sin nicotina',
    body: 'La nicotina tiene una vida media de unas 2 horas: tras 24 horas, la que queda en tu sangre es mínima. Lo que sientes ahora es tu cerebro reajustándose, no una necesidad real.',
    src: ['benowitz'],
  },
  {
    id: 'd2', at: 2 * D, icon: '👃', area: 'Sentidos',
    title: 'Vuelven el gusto y el olfato',
    body: 'Se ha eliminado el monóxido de carbono, los pulmones empiezan a expulsar mucosidad y restos del humo, y el gusto y el olfato empiezan a mejorar.',
    src: ['nhs'],
  },
  {
    id: 'd3', at: 3 * D, icon: '🌬️', area: 'Respiración',
    title: 'Respiras mejor',
    body: 'Los bronquios se relajan, respirar cuesta menos y aumenta tu energía. Hacia el día 3 suele estar el pico de la abstinencia: si hoy es duro, es señal de que tu cuerpo se está curando.',
    src: ['nhs'],
  },
  {
    id: 'w1', at: 7 * D, icon: '🧠', area: 'Cerebro',
    title: 'Una semana: lo más duro, atrás',
    body: 'Para la mayoría, la primera semana es la más intensa. A partir de aquí los síntomas de abstinencia tienden a bajar de intensidad y los deseos se espacian.',
    src: ['nhs', 'hughes'],
  },
  {
    id: 'w2', at: 14 * D, icon: '🚶', area: 'Circulación',
    title: 'Mejora la circulación',
    body: 'Entre las 2 y las 12 semanas mejora la circulación y aumenta la función pulmonar: caminar, subir escaleras o hacer deporte empieza a costar menos.',
    src: ['who'],
  },
  {
    id: 'd28', at: 28 * D, icon: '🏅', area: 'Probabilidad de éxito',
    title: '28 días: 5 veces más probable',
    body: 'Si llegas a 28 días sin fumar tienes unas 5 veces más probabilidades de dejarlo para siempre. La mayoría de síntomas físicos de abstinencia ya suelen haber desaparecido.',
    src: ['nhs'],
  },
  {
    id: 'm3', at: 90 * D, icon: '💨', area: 'Pulmones',
    title: 'Pulmones hasta un 10 % mejor',
    body: 'Entre los 3 y los 9 meses la tos, los pitos y la falta de aire mejoran a medida que la función pulmonar aumenta hasta un 10 %.',
    src: ['nhs'],
  },
  {
    id: 'm6', at: 182 * D, icon: '🧹', area: 'Pulmones',
    title: 'Los cilios vuelven a limpiar',
    body: 'Los cilios (los "pelillos" que limpian los pulmones) recuperan su función: limpian mejor la mucosidad y bajan las infecciones respiratorias.',
    src: ['who', 'acs'],
  },
  {
    id: 'y1', at: 365 * D, icon: '💓', area: 'Corazón',
    title: 'Riesgo cardíaco a la mitad',
    body: 'El exceso de riesgo de enfermedad coronaria (infarto) es ya aproximadamente la mitad que el de una persona que sigue fumando.',
    src: ['who', 'acs'],
  },
  {
    id: 'y5', at: 5 * 365 * D, icon: '🛡️', area: 'Cerebro y cáncer',
    title: 'Ictus y varios cánceres, a la baja',
    body: 'El riesgo de ictus puede igualarse al de un no fumador (entre 5 y 15 años según la persona) y el riesgo de cáncer de boca, garganta, esófago y vejiga se reduce aproximadamente a la mitad (en 5–10 años).',
    src: ['who', 'acs'],
  },
  {
    id: 'y10', at: 10 * 365 * D, icon: '🎗️', area: 'Pulmones',
    title: 'Cáncer de pulmón a la mitad',
    body: 'El riesgo de morir por cáncer de pulmón es aproximadamente la mitad que el de alguien que sigue fumando, y baja también el de laringe y páncreas.',
    src: ['who', 'acs'],
  },
  {
    id: 'y15', at: 15 * 365 * D, icon: '🌳', area: 'Corazón',
    title: 'Corazón de no fumador',
    body: 'El riesgo de enfermedad coronaria es similar al de alguien que nunca ha fumado.',
    src: ['who'],
  },
];

// ---------------------------------------------------------------------------
// Perjuicios del tabaco (desincentivos). Cada uno va acompañado de un mensaje
// de eficacia ("y al dejarlo…"): los mensajes de miedo funcionan mejor cuando
// dicen qué puedes hacer para evitar el daño (Tannenbaum et al., 2015).
// ---------------------------------------------------------------------------
export const HARMS = [
  {
    id: 'chem', title: '7.000 sustancias químicas',
    fact: 'El humo del tabaco contiene más de 7.000 sustancias químicas; unas 70 causan cáncer.',
    gain: 'Cada hora sin fumar es una hora en la que no entran en tu cuerpo.',
    src: ['cdc'],
  },
  {
    id: 'half', title: 'La mitad',
    fact: 'Hasta la mitad de las personas que siguen fumando acaban muriendo por una enfermedad causada por el tabaco.',
    gain: 'Dejarlo a cualquier edad reduce ese riesgo; cuanto antes, más.',
    src: ['who'],
  },
  {
    id: 'spain', title: '50.000 al año en España',
    fact: 'En España mueren cerca de 50.000 personas al año por el tabaco: es la primera causa de muerte evitable.',
    gain: 'Tú ya has decidido no formar parte de esa cifra.',
    src: ['msan'],
  },
  {
    id: 'min20', title: '20 minutos por cigarrillo',
    fact: 'Cada cigarrillo resta de media unos 20 minutos de esperanza de vida (17 en hombres, 22 en mujeres), sobre todo años sanos de la mediana edad.',
    gain: 'Cada cigarrillo que no fumas son 20 minutos que recuperas. Mira tu contador de "vida recuperada".',
    src: ['ucl'],
  },
  {
    id: 'one', title: 'Uno al día no es "casi nada"',
    fact: 'Fumar un solo cigarrillo al día conlleva cerca de la mitad del exceso de riesgo de infarto que fumar 20. Reducir no protege al corazón como dejarlo.',
    gain: 'Por eso la regla es "ni una calada": cero es lo que de verdad protege.',
    src: ['hackshaw'],
  },
  {
    id: 'co', title: 'Monóxido de carbono',
    fact: 'El monóxido de carbono del humo se une a la hemoglobina unas 200 veces más fuerte que el oxígeno: tu sangre transporta menos oxígeno a corazón, cerebro y músculos.',
    gain: 'En 12–48 horas sin fumar desaparece de tu sangre.',
    src: ['cdc'],
  },
  {
    id: 'heart', title: 'Infarto e ictus',
    fact: 'Fumar multiplica entre 2 y 4 veces el riesgo de enfermedad coronaria y de ictus.',
    gain: 'Al año sin fumar, el exceso de riesgo coronario ya se ha reducido a la mitad.',
    src: ['cdc'],
  },
  {
    id: 'lung', title: 'Cáncer de pulmón',
    fact: 'Alrededor de 8 o 9 de cada 10 muertes por cáncer de pulmón se deben al tabaco.',
    gain: 'A los 10 años sin fumar, el riesgo de morir por cáncer de pulmón es la mitad.',
    src: ['cdc'],
  },
  {
    id: 'anywhere', title: 'Cáncer casi en cualquier parte',
    fact: 'El tabaco puede causar cáncer en casi cualquier parte del cuerpo: boca, garganta, esófago, estómago, páncreas, hígado, riñón, vejiga, colon, cuello uterino y sangre (leucemia).',
    gain: 'El riesgo de muchos de ellos empieza a bajar desde el primer año sin fumar.',
    src: ['sg2014'],
  },
  {
    id: 'copd', title: 'EPOC',
    fact: 'Unas 8 de cada 10 muertes por EPOC (bronquitis crónica y enfisema) se deben al tabaco. Es una enfermedad que hace que cada respiración cueste.',
    gain: 'Dejarlo frena el deterioro pulmonar: es lo más eficaz que existe contra la EPOC.',
    src: ['cdc'],
  },
  {
    id: 'diab', title: 'Diabetes',
    fact: 'Las personas que fuman tienen entre un 30 % y un 40 % más de riesgo de desarrollar diabetes tipo 2.',
    gain: 'Al dejarlo mejora la respuesta a la insulina y es más fácil controlar el azúcar.',
    src: ['cdc'],
  },
  {
    id: 'sex', title: 'Sexualidad y fertilidad',
    fact: 'El tabaco daña los vasos sanguíneos: aumenta la disfunción eréctil y reduce la fertilidad en hombres y mujeres.',
    gain: 'Al mejorar la circulación en las primeras semanas, también mejora la respuesta sexual.',
    src: ['sg2014'],
  },
  {
    id: 'skin', title: 'Piel',
    fact: 'Fumar reduce el riego sanguíneo de la piel y daña el colágeno: aparecen antes las arrugas y la piel se ve apagada.',
    gain: 'Con más oxígeno y mejor circulación, la piel recupera color en pocas semanas.',
    src: ['sg2014'],
  },
  {
    id: 'mouth', title: 'Boca y dientes',
    fact: 'Fumar mancha los dientes, causa mal aliento y duplica el riesgo de enfermedad de las encías, una de las principales causas de pérdida de dientes.',
    gain: 'En 48 horas ya mejoran el gusto y el olfato.',
    src: ['cdc'],
  },
  {
    id: 'eyes', title: 'Vista',
    fact: 'Fumar aumenta el riesgo de cataratas y de degeneración macular, una causa importante de ceguera.',
    gain: 'Dejar de fumar reduce ese riesgo con el tiempo.',
    src: ['sg2014'],
  },
  {
    id: 'bones', title: 'Huesos y heridas',
    fact: 'Fumar debilita los huesos (más osteoporosis y fracturas) y hace que las heridas y las operaciones cicatricen peor.',
    gain: 'Ya en las primeras semanas mejora la oxigenación de los tejidos.',
    src: ['sg2014'],
  },
  {
    id: 'others', title: 'Los que están a tu lado',
    fact: 'El humo ajeno mata a unos 1,3 millones de personas no fumadoras al año. En niños causa asma, otitis, infecciones y muerte súbita del lactante.',
    gain: 'Al dejarlo proteges también a quienes viven contigo.',
    src: ['who'],
  },
  {
    id: 'trap', title: 'La trampa de la calma',
    fact: 'La "calma" que da un cigarrillo es sobre todo el alivio del mono que provocó el cigarrillo anterior. La nicotina crea la tensión que luego dice aliviar.',
    gain: 'Dejarlo se asocia con menos ansiedad, menos estrés y mejor estado de ánimo a los pocos meses.',
    src: ['taylor'],
  },
  {
    id: 'light', title: 'Ni "light" ni de liar',
    fact: 'Los cigarrillos "suaves" y el tabaco de liar no son más seguros: se tiende a inhalar más hondo y los daños son similares.',
    gain: 'Lo único que elimina el riesgo es dejarlo del todo, como estás haciendo.',
    src: ['sg2014'],
  },
  {
    id: 'money', title: 'Lo que te cuesta',
    // Se personaliza con el gasto anual del usuario.
    fact: 'Al ritmo al que fumabas, el tabaco te costaría {gastoAnual} al año y {gasto10} en diez años.',
    gain: 'Ese dinero ahora es tuyo: ponle un destino en tu recompensa.',
    src: [],
  },
];

// ---------------------------------------------------------------------------
// Desencadenantes y sugerencias de planes "si… entonces…" (intenciones de
// implementación; Gollwitzer y Sheeran, 2006).
// ---------------------------------------------------------------------------
export const TRIGGERS = [
  { id: 'cafe', label: 'Con el café', icon: '☕', tips: ['cambiaré a té o tomaré el café en otro sitio', 'tomaré el café de pie y me lavaré los dientes al terminar', 'tendré chicle o fruta a mano'] },
  { id: 'comida', label: 'Después de comer', icon: '🍽️', tips: ['me levantaré enseguida de la mesa y saldré a caminar 5 minutos', 'me lavaré los dientes nada más terminar', 'tomaré una infusión o una fruta'] },
  { id: 'alcohol', label: 'Con alcohol', icon: '🍷', tips: ['las primeras semanas evitaré beber o pediré algo sin alcohol', 'me quedaré dentro con los no fumadores', 'me iré antes si veo que me cuesta'] },
  { id: 'estres', label: 'Con estrés o nervios', icon: '😣', tips: ['haré 1 minuto de respiración lenta (inspiro 4, espiro 6)', 'abriré el SOS de la app y surfearé el deseo', 'saldré a dar un paseo corto'] },
  { id: 'aburrimiento', label: 'Por aburrimiento', icon: '🥱', tips: ['tendré algo para las manos (bolígrafo, pelota antiestrés)', 'mandaré un mensaje a alguien', 'haré una tarea corta de 5 minutos'] },
  { id: 'despertar', label: 'Al despertar', icon: '🌅', tips: ['me ducharé nada más levantarme', 'beberé un vaso de agua y desayunaré en otro sitio', 'cambiaré el orden de mi rutina'] },
  { id: 'coche', label: 'Conduciendo', icon: '🚗', tips: ['quitaré mecheros y ceniceros del coche', 'pondré un pódcast o música que me guste', 'llevaré chicles sin azúcar en el coche'] },
  { id: 'descanso', label: 'En los descansos del trabajo', icon: '💼', tips: ['saldré a caminar en vez de ir a la zona de fumadores', 'haré el descanso con un compañero no fumador', 'aprovecharé para tomar algo de beber'] },
  { id: 'fumadores', label: 'Con otras personas que fuman', icon: '👥', tips: ['les diré que lo estoy dejando y pediré que no me ofrezcan', 'me apartaré mientras fuman', 'diré "no, gracias, ya no fumo" sin dar más explicaciones'] },
  { id: 'enfado', label: 'Tras un enfado o discusión', icon: '😤', tips: ['me alejaré unos minutos y respiraré lento', 'escribiré lo que siento en una nota', 'recordaré que fumar no arregla la discusión'] },
  { id: 'pantalla', label: 'Con el móvil o el ordenador', icon: '📱', tips: ['me levantaré a estirar y beber agua', 'tendré algo que masticar cerca', 'haré una pausa de respiración'] },
  { id: 'celebrar', label: 'Para celebrar o premiarme', icon: '🎉', tips: ['me premiaré con algo de mi recompensa', 'celebraré contándoselo a alguien', 'miraré cuánto he ahorrado ya'] },
  { id: 'tristeza', label: 'Con tristeza o soledad', icon: '😔', tips: ['llamaré a mi persona de apoyo', 'saldré a la calle aunque sea 10 minutos', 'escribiré tres cosas por las que lo estoy dejando'] },
];

export const MOTIVES = [
  'Mi salud', 'Respirar mejor', 'Mi familia', 'Ver crecer a mis hijos/as', 'Ahorrar dinero',
  'Hacer deporte', 'Ser libre de una dependencia', 'Oler y saborear mejor',
  'Dar ejemplo', 'Mi aspecto (piel, dientes)', 'Un embarazo', 'Vivir más años',
];

export const MOODS = [
  { id: 'tranquilo', label: 'Tranquilo/a', icon: '🙂' },
  { id: 'estresado', label: 'Estresado/a', icon: '😣' },
  { id: 'aburrido', label: 'Aburrido/a', icon: '🥱' },
  { id: 'triste', label: 'Triste', icon: '😔' },
  { id: 'enfadado', label: 'Enfadado/a', icon: '😤' },
  { id: 'contento', label: 'Contento/a', icon: '😄' },
];

export const MEDICATIONS = [
  { id: 'none', label: 'Ninguna por ahora' },
  { id: 'nrt', label: 'Parches, chicles o comprimidos de nicotina' },
  { id: 'nrt-combo', label: 'Parche + chicle/comprimido (combinada)' },
  { id: 'citisina', label: 'Citisina' },
  { id: 'vareniclina', label: 'Vareniclina' },
  { id: 'otra', label: 'Otra (indicada por mi médico)' },
];

// Lista de preparación (método STAR y guías clínicas).
export const PREP_CHECKLIST = [
  { id: 'fecha', label: 'He fijado mi fecha para dejarlo (mejor en las próximas 2 semanas)' },
  { id: 'contar', label: 'Se lo he contado a alguien de confianza y le he pedido apoyo' },
  { id: 'medico', label: 'He consultado con mi médico o farmacéutico sobre medicación' },
  { id: 'planes', label: 'Tengo un plan "si… entonces…" para mis desencadenantes' },
  { id: 'registro', label: 'He registrado varios cigarrillos para conocer mis momentos' },
  { id: 'retirar', label: 'El día D quitaré tabaco, mecheros y ceniceros de casa, coche y trabajo' },
  { id: 'recompensa', label: 'He elegido en qué gastaré el dinero ahorrado' },
];

// ---------------------------------------------------------------------------
// Mensajes diarios, adaptados a la fase (como los programas de SMS con
// evidencia, p. ej. txt2stop y SmokefreeTXT) e incluyendo técnicas de ACT
// (iCanQuit). Marcadores: {nombre} {motivo} {disparador} {plan} {apoyo}
// ---------------------------------------------------------------------------
export const PREP_MESSAGES = [
  'Prepararte bien multiplica tus opciones. Hoy registra cada cigarrillo que fumes: cuándo, dónde y cómo te sentías. Conocer tus momentos es el primer paso.',
  'Piensa en {motivo}. Escríbelo con tus palabras en "Plan → Mis motivos": lo verás cada vez que tengas ganas.',
  'Habla con tu médico o farmacéutico: combinar medicación con apoyo como esta app es lo que más aumenta las probabilidades de éxito.',
  'Elige a una persona de apoyo y cuéntale tu fecha. Decirlo en voz alta refuerza el compromiso.',
  'Revisa tus planes "si… entonces…". Cuanto más concretos ("si me tomo el café, entonces saldré a caminar"), mejor funcionan.',
  'Practica hoy el SOS una vez aunque no tengas ganas fuertes: así sabrás usarlo cuando las tengas.',
  'Mañana es tu día D: hoy deshazte de todo el tabaco, mecheros y ceniceros. Que fumar requiera esfuerzo.',
];

export const DAILY_MESSAGES = [
  // Día 0: el día D
  'Hoy empieza todo, {nombre}. Regla de oro: ni una calada. Si llegan las ganas, abre el SOS: el deseo sube como una ola y baja en unos minutos.',
  // Día 1
  'Primer día completo. Las ganas no son órdenes: puedes notarlas, ponerles nombre ("estoy teniendo ganas de fumar") y dejarlas pasar sin obedecerlas.',
  // Día 2
  'Hoy tu cuerpo ya ha eliminado el monóxido de carbono. Si notas irritabilidad o te cuesta concentrarte, es abstinencia: es temporal y es señal de curación.',
  // Día 3
  'El día 3 suele ser el pico. Aguanta hoy y lo peor habrá pasado. Recuerda tu plan para el momento «{disparador}»: {plan}.',
  // Día 4
  'Prueba esto con el próximo deseo: obsérvalo con curiosidad. ¿Dónde lo notas? ¿Garganta, pecho, manos? Describirlo le quita fuerza.',
  // Día 5
  'No tienes que esperar a no tener ganas para no fumar. Puedes tener ganas y aun así elegir {motivo}. Eso es libertad.',
  // Día 6
  'Si hoy comes más, es normal: la nicotina quita el apetito. Ten a mano fruta, agua o chicle sin azúcar y muévete un poco cada día.',
  // Día 7
  '¡Una semana! Para la mayoría, lo más duro ya ha pasado. Cuéntaselo a {apoyo} y date un capricho con lo que has ahorrado.',
  // Día 8
  'A partir de ahora los deseos suelen ser menos frecuentes, pero a veces llegan por sorpresa. No significa que estés fallando: es el hábito, no una necesidad.',
  // Día 9
  'Pensamiento trampa: "solo uno no pasa nada". Un cigarrillo reactiva la dependencia. Ni una calada.',
  // Día 10
  'Identifica qué valor hay detrás de dejarlo. No es solo "no fumar": es {motivo}. Cada vez que dices no a un cigarrillo, dices sí a eso.',
  // Día 11
  'Si te cuesta dormir, evita la cafeína por la tarde: el tabaco aceleraba su eliminación, así que ahora la misma cantidad de café te afecta más.',
  // Día 12
  'Mira tu sección "Cuerpo": cada insignia es un cambio real que ya ha ocurrido dentro de ti.',
  // Día 13
  'Los deseos duran poco: normalmente pasan en unos minutos. Hoy, cuando llegue uno, pon el temporizador del SOS y compruébalo.',
  // Día 14
  'Dos semanas. Tu circulación está mejorando: si haces algo de ejercicio, notarás que te cuesta menos que antes.',
  // Día 15
  'Estrés: fumar no lo quitaba, solo aliviaba el mono. Ahora estás aprendiendo a calmarte de verdad. Respira: inspira en 4, espira en 6.',
  // Día 16
  'Cuidado con las ocasiones especiales (cenas, fiestas, alcohol). Decide hoy cómo vas a decir que no: "no, gracias, ya no fumo".',
  // Día 17
  'Repasa tu registro: ¿qué momentos te siguen costando? Ajusta tu plan "si… entonces…" para ellos.',
  // Día 18
  'Ya no eres alguien "que intenta dejarlo": eres una persona que no fuma. Dilo así cuando te ofrezcan.',
  // Día 19
  'Si un pensamiento te dice "no puedes", prueba a responderle: "gracias, mente". No hace falta discutir con él ni obedecerlo.',
  // Día 20
  'Tu dinero ahorrado sigue creciendo. ¿Cuánto te falta para tu recompensa?',
  // Día 21
  'Tres semanas. Muchas personas notan ya más energía, mejor piel y mejor olfato. ¿Qué has notado tú?',
  // Día 22
  'Las ganas que llegan ahora suelen ser recuerdos asociados a lugares o personas. Cuantas más veces las atravieses sin fumar, más se debilitan.',
  // Día 23
  'Si alguien de tu entorno fuma, no tienes que convencerle. Solo protege tu decisión: apártate y sigue con lo tuyo.',
  // Día 24
  'Haz una lista de tres cosas que hoy haces mejor que cuando fumabas. Guárdala para los días difíciles.',
  // Día 25
  'Recuerda: si alguna vez tienes un desliz, no tires la toalla. Analiza qué pasó, ajusta el plan y vuelve a cero ya.',
  // Día 26
  'Estás a 2 días del hito más importante del primer mes. Sigue así.',
  // Día 27
  'Mañana son 28 días. Las personas que llegan ahí tienen unas 5 veces más probabilidades de dejarlo para siempre.',
  // Día 28
  '¡28 días! Has multiplicado tus probabilidades de éxito. Celébralo con {apoyo} y con tu recompensa.',
  // Día 29
  'Si usas medicación, no la dejes antes de tiempo: completar el tratamiento que te indicaron reduce las recaídas.',
  // Día 30
  'Un mes. Lo que has conseguido no es suerte: es práctica. Sigue usando el SOS cuando lo necesites, sin vergüenza.',
];

// A partir del día 31 se rotan estos mensajes de mantenimiento.
export const MAINTENANCE_MESSAGES = [
  'Las recaídas suelen llegar cuando bajamos la guardia: una fiesta, un mal día. Ten listo tu "no, gracias, ya no fumo".',
  'Repasa tu sección "Cuerpo": tu siguiente hito ya está en camino.',
  'El estrés seguirá apareciendo. Ya tienes herramientas: respiración lenta, paseo, hablar con alguien. Fumar no era una de ellas.',
  'Un antojo de vez en cuando es normal incluso meses después. Obsérvalo, déjalo pasar, sigue con tu día.',
  'Piensa en {motivo}. Hoy estás más cerca de eso que el día que empezaste.',
  'Si alguien que conoces quiere dejarlo, cuéntale cómo lo estás haciendo. Ayudar a otros refuerza tu propio cambio.',
  'Has recuperado tiempo de vida y dinero. Revisa tu progreso y date un premio de verdad.',
  'Recuerda la regla de oro, también hoy: ni una calada.',
];

// ---------------------------------------------------------------------------
// Guion para "surfear el deseo" (urge surfing; ACT y prevención de recaídas
// basada en mindfulness). Se muestra en el SOS mientras corre el temporizador.
// ---------------------------------------------------------------------------
export const URGE_SURF_SCRIPT = [
  'Siéntate o quédate de pie con los pies en el suelo. No tienes que hacer nada con el deseo.',
  'Nota dónde lo sientes en el cuerpo: ¿boca, garganta, pecho, manos, estómago?',
  'Ponle nombre: "estoy teniendo ganas de fumar". Es una sensación, no una orden.',
  'Imagina que el deseo es una ola. Está subiendo… no luches contra ella, súbete encima.',
  'Respira despacio. Inspira en 4… espira en 6. Deja que la ola llegue a su punto más alto.',
  '¿Ha cambiado la intensidad? Las olas siempre bajan, aunque no hagas nada.',
  'Sigue observando con curiosidad. Cada vez que surfeas un deseo sin fumar, el siguiente será más débil.',
  'Estás haciendo justo lo que funciona. Unos segundos más.',
];

// ---------------------------------------------------------------------------
// Caja de herramientas del SOS: estrategias para el momento de la tentación.
// ---------------------------------------------------------------------------
export const SOS_TOOLS = [
  { id: 'game', icon: '🧩', title: 'Juego de memoria', sub: '3 minutos de un juego visual reducen la fuerza del antojo', src: ['tetris'] },
  { id: 'move', icon: '🏃', title: 'Muévete 3 minutos', sub: 'El ejercicio breve baja las ganas hasta 50 min', src: ['exercise', 'haasova'] },
  { id: 'future', icon: '🎬', title: 'Adelanta la película', sub: 'Mira lo que perderías si fumas ahora', src: [] },
  { id: 'defuse', icon: '💭', title: 'Desactiva el pensamiento', sub: 'Técnica ACT: un pensamiento no es una orden', src: ['icanquit'] },
  { id: 'delay', icon: '⏳', title: 'Retrásalo 10 minutos', sub: 'Solo decide no fumar en los próximos 10 minutos', src: [] },
  { id: 'mouth', icon: '💧', title: 'Boca y manos ocupadas', sub: 'Agua fría, chicle, lavarte los dientes', src: [] },
  { id: 'call', icon: '📞', title: 'Habla con alguien', sub: 'Pedir apoyo en el momento funciona', src: [] },
  { id: 'place', icon: '🚪', title: 'Cambia de sitio', sub: 'Sal de la situación que lo ha disparado', src: [] },
  { id: 'ground', icon: '🖐️', title: '5-4-3-2-1', sub: 'Ancla tu atención a lo que te rodea', src: [] },
  { id: 'letter', icon: '💌', title: 'Tu carta', sub: 'Lo que tu yo decidido te diría ahora', src: [] },
  { id: 'nrt', icon: '💊', title: 'Nicotina de acción rápida', sub: 'Chicle, comprimido o espray, si los usas', src: ['cochrane_nrt'], onlyNrt: true },
];

export const EXERCISE_MOVES = [
  'Marcha en el sitio levantando bien las rodillas',
  'Sentadillas lentas (o siéntate y levántate de una silla)',
  'Sube y baja un escalón, o las escaleras',
  'Flexiones contra la pared',
  'Estira los brazos hacia el techo y respira hondo',
  'Camina rápido, aunque sea por el pasillo',
];

export const GROUNDING_STEPS = [
  { n: 5, text: 'Nombra 5 cosas que puedas ver a tu alrededor.' },
  { n: 4, text: 'Toca 4 cosas y nota su textura (la mesa, tu ropa, el móvil…).' },
  { n: 3, text: 'Escucha 3 sonidos distintos.' },
  { n: 2, text: 'Identifica 2 olores (o 2 olores que te gusten y que ahora notarás más sin tabaco).' },
  { n: 1, text: 'Nota 1 sabor en tu boca. Bebe un sorbo de agua.' },
];

export const MOUTH_TIPS = [
  'Bebe un vaso de agua fría a sorbos lentos',
  'Mastica chicle sin azúcar o un palito de regaliz',
  'Lávate los dientes: el sabor a menta choca con el del tabaco',
  'Come algo crujiente: zanahoria, manzana, frutos secos',
  'Coge algo con las manos: un bolígrafo, una pelota, el móvil para escribir',
];

export const PLACE_TIPS = [
  'Levántate y sal de la habitación o del lugar donde estás',
  'Si estás con gente que fuma, apártate o entra dentro',
  'Ve a un sitio donde no se pueda fumar (una tienda, el coche de otro, una biblioteca)',
  'Abre una ventana o sal a respirar aire fresco, lejos de la zona de fumadores',
];

// Lo que pasa en el cuerpo al volver a fumar (para el aviso tras una recaída).
export const RELAPSE_BODY = 'El monóxido de carbono vuelve a tu sangre y tu corazón se acelera. La nicotina reactiva los receptores de tu cerebro, por eso las ganas pueden ser más fuertes en las próximas horas: no le des un segundo cigarrillo.';

// ---------------------------------------------------------------------------
// "Aprende": explicaciones breves.
// ---------------------------------------------------------------------------
export const LEARN = [
  {
    title: 'Por qué cuesta: el ciclo de la nicotina',
    body: 'La nicotina llega al cerebro en segundos y libera dopamina. Al bajar su nivel aparece la abstinencia (nervios, irritabilidad, ganas). El siguiente cigarrillo la alivia, y eso parece "calma". Al dejarlo, el cerebro se reajusta en unas semanas y ese ciclo desaparece.',
  },
  {
    title: 'Síntomas de abstinencia: qué esperar',
    body: 'Irritabilidad, ansiedad, dificultad para concentrarse, insomnio, más apetito y ganas de fumar. Suelen alcanzar su pico en los primeros días y desaparecer en 2–4 semanas; el apetito puede durar más. Son temporales y señal de que tu cuerpo se está recuperando.',
  },
  {
    title: 'Los deseos son olas',
    body: 'Un deseo intenso suele pasar en unos minutos (normalmente menos de 15), lo hagas o no. Pelear contra él o intentar no pensar en él suele hacerlo más fuerte; observarlo y dejarlo pasar ("surfearlo") lo debilita. Es la técnica en la que se basa iCanQuit, la app con mejor evidencia en un gran ensayo clínico.',
  },
  {
    title: 'Un desliz no es una recaída',
    body: 'Fumar un cigarrillo después de dejarlo no te devuelve al principio, a menos que pienses "ya lo he estropeado" y sigas fumando. Ese pensamiento se llama "efecto de violación de la abstinencia". Si ocurre: no te castigues, analiza qué pasó, ajusta el plan y vuelve a cero en ese momento.',
  },
  {
    title: 'Medicación: la mayor ayuda',
    body: 'La terapia sustitutiva de nicotina (mejor combinando parche y chicle/comprimido), la citisina y la vareniclina aumentan claramente las probabilidades de dejarlo, y combinarlas con apoyo conductual es lo más eficaz. Algunos tratamientos están financiados por el Sistema Nacional de Salud con receta. Pregunta en tu centro de salud o en la farmacia.',
  },
  {
    title: '¿Y el peso?',
    body: 'Es frecuente ganar algo de peso (de media unos 4–5 kg el primer año), sobre todo al principio. Los beneficios de dejar de fumar superan con mucho ese riesgo. Ayuda: tener fruta y agua a mano, moverte a diario y no sustituir cigarrillos por dulces.',
  },
  {
    title: 'Cigarrillo electrónico',
    body: 'La revisión Cochrane encuentra que los cigarrillos electrónicos con nicotina ayudan a dejar de fumar más que la terapia sustitutiva, aunque se desconocen sus efectos a largo plazo y no son inocuos. En España no están autorizados como tratamiento. Si te lo planteas, háblalo con tu profesional sanitario y evita el consumo dual (vapear y fumar a la vez).',
  },
  {
    title: 'Pide ayuda profesional',
    body: 'Tu médico de atención primaria, enfermería o farmacia pueden ofrecerte seguimiento y tratamiento. El apoyo profesional, presencial o telefónico, aumenta las probabilidades de éxito. Esta app no sustituye el consejo médico.',
  },
];

// ---------------------------------------------------------------------------
// Fuentes
// ---------------------------------------------------------------------------
export const SOURCES = {
  who: { label: 'OMS – Beneficios para la salud de dejar de fumar', url: 'https://www.who.int/news-room/q-a-detail/health-benefits-of-smoking-cessation' },
  nhs: { label: 'NHS Better Health – Quit smoking', url: 'https://www.nhs.uk/better-health/quit-smoking/' },
  acs: { label: 'American Cancer Society – Benefits of quitting over time', url: 'https://www.cancer.org/cancer/risk-prevention/tobacco/benefits-of-quitting-smoking-over-time.html' },
  cdc: { label: 'CDC – Health effects of cigarette smoking', url: 'https://www.cdc.gov/tobacco/basic_information/health_effects' },
  sg2014: { label: 'US Surgeon General (2014) – The Health Consequences of Smoking: 50 Years of Progress', url: 'https://www.ncbi.nlm.nih.gov/books/NBK179276/' },
  msan: { label: 'Ministerio de Sanidad – Plan Nacional de Prevención y Control del Tabaquismo 2024-2027', url: 'https://www.sanidad.gob.es/gabinete/notasPrensa.do?id=6412' },
  ucl: { label: 'Jackson et al. (UCL), Addiction 2025 – ~20 minutos por cigarrillo', url: 'https://www.gov.uk/government/news/quit-for-a-week-and-save-a-day-say-health-experts' },
  hackshaw: { label: 'Hackshaw et al., BMJ 2018 – Un cigarrillo al día y riesgo cardiovascular', url: 'https://www.bmj.com/content/360/bmj.j5855' },
  taylor: { label: 'Taylor et al., BMJ 2014 – Dejar de fumar y salud mental', url: 'https://www.bmj.com/content/348/bmj.g1151' },
  benowitz: { label: 'Benowitz et al. – Farmacología de la nicotina (vida media ~2 h)', url: 'https://pubmed.ncbi.nlm.nih.gov/19184645/' },
  hughes: { label: 'Hughes (2007) – Curso temporal de la abstinencia de nicotina', url: 'https://pubmed.ncbi.nlm.nih.gov/17365764/' },
  cochrane_mobile: { label: 'Cochrane (2019) – SMS y apps para dejar de fumar', url: 'https://www.cochrane.org/evidence/CD006611_can-programmes-delivered-mobile-phones-help-people-stop-smoking' },
  icanquit: { label: 'Bricker et al., JAMA Intern Med 2020 – Ensayo iCanQuit (ACT)', url: 'https://pubmed.ncbi.nlm.nih.gov/32955554/' },
  smokefree: { label: 'Crane et al., F1000Research 2019 – Smoke Free (misiones diarias)', url: 'https://f1000research.com/articles/7-1524/v2' },
  tetris: { label: 'Skorka-Brown et al., Addictive Behaviors 2015 – Un juego visual de 3 min reduce los antojos', url: 'https://doi.org/10.1016/j.addbeh.2015.07.020' },
  exercise: { label: 'Taylor, Ussher y Faulkner, Addiction 2007 – El ejercicio breve reduce las ganas de fumar', url: 'https://pubmed.ncbi.nlm.nih.gov/17286639/' },
  haasova: { label: 'Haasova et al., Addiction 2013 – Actividad física y antojos (metaanálisis)', url: 'https://pubmed.ncbi.nlm.nih.gov/22861822/' },
  cochrane_nrt: { label: 'Cochrane – Terapia sustitutiva de nicotina', url: 'https://doi.org/10.1002/14651858.CD000146.pub5' },
  gollwitzer: { label: 'Gollwitzer y Sheeran, 2006 – Intenciones de implementación', url: 'https://doi.org/10.1016/S0065-2601(06)38002-1' },
  tannenbaum: { label: 'Tannenbaum et al., Psychol Bull 2015 – Eficacia de los mensajes de miedo', url: 'https://doi.org/10.1037/a0039729' },
};
