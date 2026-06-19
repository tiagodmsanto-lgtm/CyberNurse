const fs = require('fs');

const pt = JSON.parse(fs.readFileSync('src/i18n/locales/pt.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf8'));
const es = JSON.parse(fs.readFileSync('src/i18n/locales/es.json', 'utf8'));

const reportsPT = {
  title: 'Central de Relatórios',
  exportPdf: 'Exportar PDF',
  adherence: {
    title: 'Adesão ao Protocolo',
    desc: 'Medicação, dieta e metas de hidratação',
    medication: 'Adesão à Medicação',
    diet: 'Adesão à Dieta',
    hydration: 'Hidratação Diária',
    taken: 'Tomadas',
    missed: 'Esquecidas',
    meals: 'Refeições',
    freeMeals: 'Ref. Livres'
  },
  anthropometry: {
    title: 'Evolução Corporal',
    desc: 'Histórico de peso, % de gordura e medidas',
    weight: 'Evolução do Peso (kg)',
    fat: 'Gordura Corporal (%)'
  },
  vitals: {
    title: 'Sinais Vitais e Sintomas',
    desc: 'Painel clínico e diário de sintomas',
    bp: 'Pressão Arterial',
    sys: 'Sistólica',
    dia: 'Diastólica',
    glucose: 'Glicemia',
    symptoms: 'Diário de Sintomas',
    severity: 'Gravidade'
  },
  performance: {
    title: 'Performance e Energia',
    desc: 'Carga de treino, recuperação e balanço calórico',
    sleep: 'Horas de Sono',
    trainingLoad: 'Carga de Treino'
  }
};

const reportsEN = {
  title: 'Reports Center',
  exportPdf: 'Export PDF',
  adherence: {
    title: 'Protocol Adherence',
    desc: 'Medication, diet and hydration goals',
    medication: 'Medication Adherence',
    diet: 'Diet Adherence',
    hydration: 'Daily Hydration',
    taken: 'Taken',
    missed: 'Missed',
    meals: 'Meals',
    freeMeals: 'Cheat Meals'
  },
  anthropometry: {
    title: 'Body Evolution',
    desc: 'Weight history, fat % and measurements',
    weight: 'Weight Evolution (kg)',
    fat: 'Body Fat (%)'
  },
  vitals: {
    title: 'Vitals and Symptoms',
    desc: 'Clinical panel and symptom diary',
    bp: 'Blood Pressure',
    sys: 'Systolic',
    dia: 'Diastolic',
    glucose: 'Blood Glucose',
    symptoms: 'Symptom Diary',
    severity: 'Severity'
  },
  performance: {
    title: 'Performance & Energy',
    desc: 'Training load, recovery and energy balance',
    sleep: 'Hours of Sleep',
    trainingLoad: 'Training Load'
  }
};

const reportsES = {
  title: 'Centro de Informes',
  exportPdf: 'Exportar PDF',
  adherence: {
    title: 'Adherencia al Protocolo',
    desc: 'Medicación, dieta e hidratación',
    medication: 'Adherencia a la Medicación',
    diet: 'Adherencia a la Dieta',
    hydration: 'Hidratación Diaria',
    taken: 'Tomadas',
    missed: 'Olvidadas',
    meals: 'Comidas',
    freeMeals: 'Comidas Libres'
  },
  anthropometry: {
    title: 'Evolución Corporal',
    desc: 'Historial de peso, % grasa y medidas',
    weight: 'Evolución de Peso (kg)',
    fat: 'Grasa Corporal (%)'
  },
  vitals: {
    title: 'Signos Vitales y Síntomas',
    desc: 'Panel clínico y diario de síntomas',
    bp: 'Presión Arterial',
    sys: 'Sistólica',
    dia: 'Diastólica',
    glucose: 'Glucemia',
    symptoms: 'Diario de Síntomas',
    severity: 'Gravedad'
  },
  performance: {
    title: 'Rendimiento y Energía',
    desc: 'Carga de entrenamiento y recuperación',
    sleep: 'Horas de Sueño',
    trainingLoad: 'Carga de Entrenamiento'
  }
};

pt.reports = reportsPT;
en.reports = reportsEN;
es.reports = reportsES;

fs.writeFileSync('src/i18n/locales/pt.json', JSON.stringify(pt, null, 2));
fs.writeFileSync('src/i18n/locales/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('src/i18n/locales/es.json', JSON.stringify(es, null, 2));

console.log('Translations for reports updated!');
