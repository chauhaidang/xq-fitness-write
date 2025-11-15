const { v4: uuidv4 } = require('uuid');

export interface MuscleGroup {
  id: number;
  name: string;
}

export interface WorkoutDay {
  dayNumber: number;
  name: string;
  muscleGroups: MuscleGroup[];
}

export interface RoutineData {
  name: string;
  description: string;
}

export interface TestData {
  userId: string;
  routine: RoutineData;
  workoutDays: WorkoutDay[];
  muscleGroups: MuscleGroup[];
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: 1, name: 'Chest' },
  { id: 2, name: 'Back' },
  { id: 3, name: 'Shoulders' },
  { id: 4, name: 'Biceps' },
  { id: 5, name: 'Triceps' },
  { id: 6, name: 'Forearms' },
  { id: 7, name: 'Quads' },
  { id: 8, name: 'Hamstrings' },
  { id: 9, name: 'Calves' },
  { id: 10, name: 'Abs' },
];

export function generateTestData(): TestData {
  const timestamp = Date.now();
  const userId = `user-${uuidv4()}`;

  return {
    userId,
    routine: {
      name: `Routine-${timestamp}`,
      description: `Test routine created at ${timestamp}`,
    },
    workoutDays: [
      { dayNumber: 1, name: 'Push Day', muscleGroups: [MUSCLE_GROUPS[0], MUSCLE_GROUPS[2], MUSCLE_GROUPS[4]] },
      { dayNumber: 2, name: 'Pull Day', muscleGroups: [MUSCLE_GROUPS[1], MUSCLE_GROUPS[3], MUSCLE_GROUPS[5]] },
      { dayNumber: 3, name: 'Leg Day', muscleGroups: [MUSCLE_GROUPS[6], MUSCLE_GROUPS[7], MUSCLE_GROUPS[8]] },
    ],
    muscleGroups: MUSCLE_GROUPS,
  };
}

export function getMuscleGroupId(name: string, data: TestData): number {
  const group = data.muscleGroups.find(g => g.name.toLowerCase() === name.toLowerCase());
  return group?.id || 1;
}

export function getAllMuscleGroupIds(data: TestData): number[] {
  return data.muscleGroups.map(g => g.id);
}

export function getRandomMuscleGroup(data: TestData): MuscleGroup {
  const randomIndex = Math.floor(Math.random() * data.muscleGroups.length);
  return data.muscleGroups[randomIndex];
}

export function getWorkoutDay(dayNumber: number, data: TestData): WorkoutDay | undefined {
  return data.workoutDays.find(d => d.dayNumber === dayNumber);
}