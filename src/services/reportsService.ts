import { getDatabase, generateId } from './database';

export function getMedicationAdherence() {
  const db = getDatabase();
  const allDoses = db.getAllSync<{ status: string }>('SELECT status FROM doses');
  
  if (allDoses.length === 0) {
    return { taken: 85, missed: 15, total: 100 }; // Fake data for empty states
  }
  
  const taken = allDoses.filter(d => d.status === 'taken').length;
  const missed = allDoses.filter(d => ['missed', 'skipped'].includes(d.status)).length;
  
  return {
    taken: taken || 1, // Avoid 0 for charts
    missed: missed || 0,
    total: allDoses.length || 1,
  };
}

export function getMockDietAdherence() {
  // Returns days of the week and meal completion
  return {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    completed: [4, 5, 5, 4, 3, 2, 4],
    missed: [1, 0, 0, 1, 2, 3, 1], // Free meals / cheats
  };
}

export function getMockHydration() {
  return {
    labels: ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'],
    data: [2.0, 2.5, 3.0, 2.2, 1.8, 2.0, 2.8],
    goal: 2.5
  };
}

export function getMockBodyMetrics() {
  return {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    weight: [85.2, 84.1, 83.5, 82.0, 80.5, 79.8],
    fat: [22.5, 21.8, 20.5, 19.2, 18.0, 16.5],
  };
}

export function getMockVitals() {
  return {
    bpSys: [130, 128, 125, 122, 120, 118],
    bpDia: [85, 82, 80, 80, 78, 75],
    glucose: [98, 95, 92, 90, 88, 85],
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6']
  };
}

export function getMockSymptoms() {
  return [
    { date: '15/06', symptom: 'Dor de cabeça leve', severity: 3, notes: 'Possível colateral da Losartana' },
    { date: '10/06', symptom: 'Náusea matinal', severity: 5, notes: 'Após tomar suplemento em jejum' },
    { date: '05/06', symptom: 'Insônia', severity: 7, notes: 'Dificuldade para dormir' },
  ];
}

export function getMockPerformance() {
  return {
    labels: ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'],
    sleep: [7.5, 6.0, 8.0, 7.2, 5.5, 9.0, 8.5],
    trainingLoad: [8, 9, 0, 7, 8, 10, 0], // 0-10
  };
}
