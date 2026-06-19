const fs = require('fs');

const pt = JSON.parse(fs.readFileSync('src/i18n/locales/pt.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf8'));
const es = JSON.parse(fs.readFileSync('src/i18n/locales/es.json', 'utf8'));

const supportNetworkPT = {
  title: 'Rede de Apoio',
  addContact: 'Adicionar Contato',
  emptyState: 'Nenhum contato adicionado.',
  emptyStateDesc: 'Cadastre pessoas da sua rede de apoio e profissionais da saúde de referência.',
  name: 'Nome',
  namePlaceholder: 'Nome completo',
  bondType: 'Vínculo',
  bondPersonal: 'Pessoal',
  bondProfessional: 'Profissional',
  relationLabel: 'Parentesco',
  professionLabel: 'Profissão',
  phone: 'Telefone',
  phonePlaceholder: '(00) 00000-0000',
  email: 'E-mail',
  emailPlaceholder: 'contato@email.com',
  save: 'Salvar Contato',
  cancel: 'Cancelar',
  alerts: {
    success: 'Contato salvo com sucesso!',
    error: 'Erro ao salvar contato.',
    fillRequired: 'Por favor, preencha o nome e o vínculo.'
  },
  relations: {
    parent: 'Pai / Mãe',
    child: 'Filho(a)',
    spouse: 'Cônjuge',
    sibling: 'Irmão / Irmã',
    friend: 'Amigo(a)',
    other: 'Outro'
  },
  professions: {
    doctor: 'Médico(a) Geral',
    cardiologist: 'Cardiologista',
    nurse: 'Enfermeiro(a)',
    pharmacist: 'Farmacêutico(a)',
    physiotherapist: 'Fisioterapeuta',
    nutritionist: 'Nutricionista',
    psychologist: 'Psicólogo(a)',
    dentist: 'Dentista',
    other: 'Outra Especialidade'
  }
};

const supportNetworkEN = {
  title: 'Support Network',
  addContact: 'Add Contact',
  emptyState: 'No contacts added.',
  emptyStateDesc: 'Register people from your support network and reference health professionals.',
  name: 'Name',
  namePlaceholder: 'Full name',
  bondType: 'Bond',
  bondPersonal: 'Personal',
  bondProfessional: 'Professional',
  relationLabel: 'Relationship',
  professionLabel: 'Profession',
  phone: 'Phone',
  phonePlaceholder: '(000) 000-0000',
  email: 'Email',
  emailPlaceholder: 'contact@email.com',
  save: 'Save Contact',
  cancel: 'Cancel',
  alerts: {
    success: 'Contact saved successfully!',
    error: 'Error saving contact.',
    fillRequired: 'Please fill in the name and bond.'
  },
  relations: {
    parent: 'Parent',
    child: 'Child',
    spouse: 'Spouse',
    sibling: 'Sibling',
    friend: 'Friend',
    other: 'Other'
  },
  professions: {
    doctor: 'General Practitioner',
    cardiologist: 'Cardiologist',
    nurse: 'Nurse',
    pharmacist: 'Pharmacist',
    physiotherapist: 'Physiotherapist',
    nutritionist: 'Nutritionist',
    psychologist: 'Psychologist',
    dentist: 'Dentist',
    other: 'Other Specialty'
  }
};

const supportNetworkES = {
  title: 'Red de Apoyo',
  addContact: 'Agregar Contacto',
  emptyState: 'No hay contactos añadidos.',
  emptyStateDesc: 'Registre personas de su red de apoyo y profesionales de la salud de referencia.',
  name: 'Nombre',
  namePlaceholder: 'Nombre completo',
  bondType: 'Vínculo',
  bondPersonal: 'Personal',
  bondProfessional: 'Profesional',
  relationLabel: 'Parentesco',
  professionLabel: 'Profesión',
  phone: 'Teléfono',
  phonePlaceholder: '(00) 00000-0000',
  email: 'Correo electrónico',
  emailPlaceholder: 'contacto@email.com',
  save: 'Guardar Contacto',
  cancel: 'Cancelar',
  alerts: {
    success: '¡Contacto guardado con éxito!',
    error: 'Error al guardar contacto.',
    fillRequired: 'Por favor, rellene el nombre y el vínculo.'
  },
  relations: {
    parent: 'Padre / Madre',
    child: 'Hijo(a)',
    spouse: 'Cónyuge',
    sibling: 'Hermano / Hermana',
    friend: 'Amigo(a)',
    other: 'Otro'
  },
  professions: {
    doctor: 'Médico(a) General',
    cardiologist: 'Cardiólogo(a)',
    nurse: 'Enfermero(a)',
    pharmacist: 'Farmacéutico(a)',
    physiotherapist: 'Fisioterapeuta',
    nutritionist: 'Nutricionista',
    psychologist: 'Psicólogo(a)',
    dentist: 'Dentista',
    other: 'Otra Especialidad'
  }
};

pt.supportNetwork = supportNetworkPT;
en.supportNetwork = supportNetworkEN;
es.supportNetwork = supportNetworkES;

fs.writeFileSync('src/i18n/locales/pt.json', JSON.stringify(pt, null, 2));
fs.writeFileSync('src/i18n/locales/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('src/i18n/locales/es.json', JSON.stringify(es, null, 2));

console.log('Translations updated!');
