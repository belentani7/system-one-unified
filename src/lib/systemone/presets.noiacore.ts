/**
 * Presets NOIACORE / Belentani — la versión personalizada con tu contexto real.
 *
 * A diferencia de los presets genéricos (triage/moderación/enrutado), estos usan
 * los datos reales de tus frentes: repositorios, enrutado de agentes, acogida de
 * Manos Abiertas, Lingua Aberta y unificación del material JUDAS.
 *
 * Se integran en el barrel (index.ts) como `PRESETS = [...base, ...NOIACORE_PRESETS]`
 * sin tocar el resto del código.
 */
import type { Preset } from "./presets";

export const NOIACORE_PRESETS: Preset[] = [
  {
    id: "repo-triage",
    title: "Triaje de repositorio (417 repos)",
    summary:
      "Decide si un repo se fusiona con el núcleo o se archiva, y si arrastra secretos, a partir de sus señales reales.",
    icon: "git-branch",
    tags: ["repos", "noiacore", "triage"],
    request: {
      state:
        "Repo: 'belentani-ops' — licencia MIT, 128 estrellas, sin CI, incluye '.env' versionado y 'package-lock.json'. README mínimo. Últimos commits: refactors internos. Encaja con la línea de herramientas internas del núcleo pero duplica parcialmente 'aion-daemon'.",
      model: "local-latest",
      confidence_threshold: 0.6,
      questions: {
        fusionar: {
          type: "noul",
          instructions:
            "¿Debe este repositorio fusionarse con el núcleo (NOIACORE) en lugar de archivarse?",
        },
        riesgo_secretos: {
          type: "noul",
          instructions:
            "¿Contiene secretos o credenciales versionadas que representen un riesgo?",
        },
        prioridad: {
          type: "score",
          instructions: "Prioridad de integración dentro del inventario",
          criteria: [
            "Baja — no urgente",
            "Media — planificable",
            "Alta — bloquea otros trabajos",
          ],
        },
      },
    },
  },
  {
    id: "noiacore-agent-routing",
    title: "Enrutado de agente (NOIACORE OS)",
    summary:
      "Elige a qué agente del ecosistema va una tarea y estima su complejidad, sin generación de texto.",
    icon: "route",
    tags: ["agentes", "routing", "noiacore"],
    request: {
      state:
        "Tarea: 'corregir el bug de exportación de reportes en el backend del portal y desplegarlo el viernes'. Afecta a código, datos y requiere una ventana de despliegue.",
      model: "local-latest",
      confidence_threshold: 0.6,
      questions: {
        agente: {
          type: "choice",
          instructions: "¿Qué agente debe ejecutar la tarea?",
          criteria: {
            code: "Implementación de código, bugs, despliegue técnico",
            design: "Interfaz, marca, contenido visual",
            legal: "Contratos, reclamaciones, cumplimiento",
            research: "Búsqueda, análisis, recopilación",
          },
        },
        complejidad: {
          type: "score",
          instructions: "Complejidad estimada de la tarea",
          criteria: [
            "Baja — un archivo",
            "Media — varios módulos",
            "Alta — sistema completo / riesgo",
          ],
        },
      },
    },
  },
  {
    id: "manos-abiertas-acogida",
    title: "Manos Abiertas — acogida y derivación",
    summary:
      "Clasifica una petición de acogida y decide el recurso; con umbral alto y derivación humana explícita.",
    icon: "heart-handshake",
    tags: ["manos-abiertas", "social", "alto-riesgo"],
    request: {
      state:
        "Mensaje recibido: 'Olá, cheguei ontem de Lisboa e não tenho onde ficar no fim de semana. Trabalho em part-time mas ainda não recebi. Podem ajudar-me?'",
      model: "laya-multilingual",
      confidence_threshold: 0.85,
      questions: {
        recurso: {
          type: "choice",
          instructions: "¿Qué recurso corresponde a esta petición?",
          criteria: {
            alojamiento: "Alojamiento temporal de emergencia",
            formacion: "Formación o empleabilidad",
            empleo: "Apoyo para acceso a empleo",
            derivacion_humana: "Derivar a una persona del equipo",
          },
        },
        traslado: {
          type: "noul",
          instructions:
            "¿La persona indica que necesita alojamiento este mismo fin de semana?",
        },
        idioma: {
          type: "choice",
          instructions: "Idioma principal del mensaje",
          criteria: { es: "Español", pt: "Portugués", en: "Inglés", otro: "Otro" },
        },
      },
    },
  },
  {
    id: "lingua-aberta",
    title: "Lingua Aberta — clasificación multilingüe",
    summary:
      "Detecta idioma y necesidad en mensajes mezclados (pt/es/en) para derivarlos sin inventar.",
    icon: "languages",
    tags: ["lingua-aberta", "multilingüe", "laya"],
    request: {
      state:
        "Texto: 'Preciso de ajuda com o formulário, I already tried 3 times, pero no me deja guardar. Es urgente.'",
      model: "laya-multilingual",
      confidence_threshold: 0.7,
      questions: {
        necesidad: {
          type: "choice",
          instructions: "¿Qué necesita la persona?",
          criteria: {
            soporte_tecnico: "Un formulario o sistema no funciona",
            informacion: "Necesita información o guía",
            derivacion_humana: "Debe atenderla una persona",
          },
        },
        urgente: { type: "noul", instructions: "¿El mensaje declara urgencia?" },
        idioma_mixto: {
          type: "noul",
          instructions: "¿El mensaje mezcla más de un idioma?",
        },
      },
    },
  },
  {
    id: "judas-unificacion",
    title: "JUDAS — unificación de versiones",
    summary:
      "Compara dos versiones del material (antigua vs nueva) y decide cuál prevalece y cuánto alinearlas.",
    icon: "layers",
    tags: ["judas", "unificación", "lore"],
    request: {
      state:
        "Material AUDIO: 'judas demo pura' (nueva, con voces a eliminar y violín a añadir) frente a 'judas demo original' (antigua, mezcla más limpia pero letra distinta). Se pide una versión unificada sin perder continuidad.",
      model: "local-latest",
      confidence_threshold: 0.6,
      questions: {
        version: {
          type: "choice",
          instructions: "¿Qué versión debe prevalecer como base?",
          criteria: {
            antigua: "La demo original",
            nueva: "La demo pura (nueva)",
            unificada: "Fusionar tomando lo mejor de ambas",
          },
        },
        alineacion: {
          type: "score",
          instructions: "Cuánto se parecen las versiones",
          criteria: [
            "Nada — son obras distintas",
            "Parcial — comparten estructura",
            "Mucho — solo detalles",
          ],
        },
        requiere_humano: {
          type: "noul",
          instructions:
            "¿La decisión final debe confirmarla Pedro antes de fijar nada?",
        },
      },
    },
  },
];
