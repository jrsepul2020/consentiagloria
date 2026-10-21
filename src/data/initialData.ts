import { Patient, Consent, ConsentTemplate, ClinicSettings } from '../types';

export const initialClinicSettings: ClinicSettings = {
  id: 1,
  clinicName: 'CONSENTIA VITALITY',
  professionalName: 'Dra. Gloria Cabezas',
  professionalTitle: 'Directora Médica & Especialista en Estética',
  medicalLicense: 'Col. Nº 282809112 - Madrid',
  email: 'dra.gloria@consentia.med',
  phone: '+34 612 345 678',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const initialTemplates: ConsentTemplate[] = [
  {
    id: 'tmpl-101',
    name: 'Tratamiento Estético Facial Completo',
    category: 'Tratamiento estético facial',
    content:
      'Yo, [Nombre del Paciente], declaro haber sido debidamente informado/a por la Dra. Gloria Cabezas sobre el procedimiento de tratamiento estético facial (rellenos de ácido hialurónico, hilos tensores y revitalización cutánea). Comprendo que los resultados dependen de la respuesta tisular individual. He sido informado de los cuidados posteriores necesarios y acepto voluntariamente la realización del tratamiento.',
    version: 1,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl-102',
    name: 'Cirugía Menor Ambulatoria',
    category: 'Cirugía ambulatoria',
    content:
      'Autorizo la realización de procedimiento de cirugía menor ambulatoria bajo anestesia local en instalaciones esterilizadas homologadas. Se me han explicado los objetivos, riesgos habituales (molestias locales, cicatrización) y alternativas de tratamiento.',
    version: 1,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl-103',
    name: 'Toxina Botulínica Tipo A (Dermoestética)',
    category: 'Tratamiento estético facial',
    content:
      'Consiento la aplicación dermoestética de toxina botulínica purificada en el tercio superior facial para la atenuación de líneas de expresión dinámicas. He recibido instrucciones completas sobre mantener posición erguida durante las 4 horas posteriores a la aplicación.',
    version: 1,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl-104',
    name: 'Peeling Químico & Revitalización',
    category: 'Tratamiento estético facial',
    content:
      'Acepto la aplicación de ácidos médicos para renovación epidérmica y exfoliación cutánea. Entiendo el compromiso de utilizar fotoprotección solar estricta SPF50+ durante todo el proceso de recuperación.',
    version: 1,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const initialPatients: Patient[] = [
  {
    id: 'pat-101',
    fullName: 'Marta Rodríguez',
    dni: '48291039B',
    phone: '+34 654 987 321',
    email: 'marta.rodriguez@email.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pat-102',
    fullName: 'Carlos Mendoza',
    dni: '51928374K',
    phone: '+34 611 223 344',
    email: 'carlos.mendoza@email.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pat-103',
    fullName: 'Laura Benítez Santos',
    dni: '09812376M',
    phone: '+34 622 889 900',
    email: 'laura.benitez@email.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pat-104',
    fullName: 'Javier Navarro',
    dni: '71829304P',
    phone: '+34 677 334 556',
    email: 'j.navarro@email.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pat-105',
    fullName: 'Elena Gómez Morales',
    dni: '32198765X',
    phone: '+34 699 112 233',
    email: 'elena.gomez@email.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const initialConsents: Consent[] = [
  {
    id: 'doc-101',
    patientId: 'pat-101',
    templateId: 'tmpl-101',
    patientNameSnapshot: 'Marta Rodríguez',
    patientDniSnapshot: '48291039B',
    title: 'Tratamiento Estético Facial Completo',
    category: 'Tratamiento estético facial',
    templateVersion: 1,
    contentSnapshot:
      'Yo, Marta Rodríguez, declaro haber sido debidamente informada por la Dra. Gloria Cabezas sobre el procedimiento de tratamiento estético facial. Comprendo que los resultados dependen de la respuesta tisular individual. He sido informada de los cuidados posteriores necesarios y acepto voluntariamente la realización del tratamiento.',
    status: 'FIRMADO',
    signatureData:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M10 50 Q 50 10 90 50 T 170 50" fill="none" stroke="%23bd003c" stroke-width="3"/></svg>',
    signedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'doc-102',
    patientId: 'pat-102',
    templateId: 'tmpl-102',
    patientNameSnapshot: 'Carlos Mendoza',
    patientDniSnapshot: '51928374K',
    title: 'Cirugía Menor Ambulatoria',
    category: 'Cirugía ambulatoria',
    templateVersion: 1,
    contentSnapshot:
      'Autorizo la realización de procedimiento de cirugía menor ambulatoria bajo anestesia local en instalaciones esterilizadas homologadas. Se me han explicado los objetivos, riesgos habituales y alternativas de tratamiento.',
    status: 'PENDIENTE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'doc-103',
    patientId: 'pat-103',
    templateId: 'tmpl-103',
    patientNameSnapshot: 'Laura Benítez Santos',
    patientDniSnapshot: '09812376M',
    title: 'Toxina Botulínica Tipo A (Dermoestética)',
    category: 'Tratamiento estético facial',
    templateVersion: 1,
    contentSnapshot:
      'Consiento la aplicación dermoestética de toxina botulínica purificada en el tercio superior facial para la atenuación de líneas de expresión dinámicas. He recibido instrucciones completas sobre mantener posición erguida durante las 4 horas posteriores a la aplicación.',
    status: 'PENDIENTE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
