import type { AssetName } from '../lib/media'
import type { InterestId } from '../lib/interest'

export const NAV = [
  { id: 'especialidades', label: 'Especialidades' },
  { id: 'la-clinica', label: 'La Clínica' },
  { id: 'filosofia', label: 'Filosofía' },
  { id: 'contacto', label: 'Contacto' },
] as const

export type Specialty = {
  id: Exclude<InterestId, '' | 'orientacion'>
  index: string
  title: string
  english: string
  layerLabel: string
  layerNote: string
  intro: string
  body: string
  focus: string[]
  images: { name: AssetName; alt: string; ratio: string }[]
}

/**
 * Copy is intentionally indicative: AURELIA is fictional. No specific procedures, outcomes or
 * clinical claims are attributed to the concept.
 */
export const SPECIALTIES: Specialty[] = [
  {
    id: 'dermatologia',
    index: '01',
    title: 'Dermatología',
    english: 'The Science of Skin',
    layerLabel: 'Capa interior',
    layerNote: 'El núcleo: la salud de la piel como punto de partida.',
    intro: 'La piel como órgano antes que como superficie.',
    body:
      'En este concepto, la dermatología es el punto de partida de todo: comprender cómo es y cómo cambia cada piel antes de plantear cualquier decisión. Una mirada médica, pausada y basada en la evidencia, que prioriza la salud cutánea por encima de la estética inmediata.',
    focus: ['Valoración de la salud cutánea', 'Seguimiento de la piel a lo largo del tiempo', 'Orientación sobre cuidado y prevención'],
    images: [
      { name: 'dermatology-editorial', alt: 'Retrato editorial de una modelo ficticia con textura de piel natural y luz lateral cálida', ratio: '4 / 5' },
      { name: 'skin-macro', alt: 'Macrofotografía de piel humana natural con poros y textura reales bajo luz direccional', ratio: '1 / 1' },
    ],
  },
  {
    id: 'medicina-estetica',
    index: '02',
    title: 'Medicina estética',
    english: 'Measured Refinement',
    layerLabel: 'Capa intermedia',
    layerNote: 'La armonía: decisiones medidas, siempre a escala humana.',
    intro: 'Sutileza, criterio y proporción.',
    body:
      'Una medicina estética entendida desde la mesura: escuchar primero, valorar con honestidad si una intervención tiene sentido y, cuando lo tiene, plantearla con criterio médico. La naturalidad no como estilo, sino como límite.',
    focus: ['Consulta y valoración individual', 'Planteamientos graduales y conservadores', 'Información clara sobre alternativas y límites'],
    images: [
      { name: 'treatment-consultation', alt: 'Consulta ficticia entre una profesional médica y una paciente en un despacho luminoso de piedra clara', ratio: '4 / 5' },
      { name: 'skincare-still-life', alt: 'Bodegón editorial de recipientes de vidrio sin marca sobre peanas de travertino con luz cálida', ratio: '4 / 5' },
    ],
  },
  {
    id: 'cirugia-plastica',
    index: '03',
    title: 'Cirugía plástica',
    english: 'Precision & Care',
    layerLabel: 'Capa exterior',
    layerNote: 'La estructura: precisión quirúrgica dentro de un marco riguroso.',
    intro: 'Rigor quirúrgico, en un entorno sereno.',
    body:
      'Cuando la cirugía forma parte de la conversación, el concepto AURELIA la sitúa en un marco de máxima seriedad: valoración detallada, expectativas realistas, tiempos de reflexión y un acompañamiento cercano antes y después de cualquier decisión.',
    focus: ['Valoración preoperatoria detallada', 'Expectativas realistas desde el inicio', 'Acompañamiento durante la recuperación'],
    images: [{ name: 'surgery-suite', alt: 'Sala de preparación clínica ficticia, limpia y ordenada, con acero inoxidable y tonos neutros cálidos', ratio: '16 / 9' }],
  },
]

export const STEPS = [
  {
    n: '01',
    title: 'Consulta inicial',
    text: 'Un primer encuentro sin prisas para escuchar motivaciones, dudas y expectativas, y conocer la historia de cada persona.',
  },
  {
    n: '02',
    title: 'Evaluación individual',
    text: 'Una valoración médica personalizada que considera la salud, la anatomía y el contexto de cada paciente antes de proponer nada.',
  },
  {
    n: '03',
    title: 'Plan de tratamiento',
    text: 'Si procede, un planteamiento explicado con claridad: alternativas, límites, tiempos y lo que razonablemente puede esperarse.',
  },
  {
    n: '04',
    title: 'Seguimiento',
    text: 'Un acompañamiento continuado para revisar la evolución y ajustar el camino con la misma atención del primer día.',
  },
]

export const INTEREST_OPTIONS: { value: InterestId; label: string }[] = [
  { value: 'dermatologia', label: 'Dermatología' },
  { value: 'medicina-estetica', label: 'Medicina estética' },
  { value: 'cirugia-plastica', label: 'Cirugía plástica' },
  { value: 'orientacion', label: 'Aún no lo sé — necesito orientación' },
]
