/**
 * Test data generators for E2E workflow tests
 * Generates unique test data to avoid conflicts
 */

export interface RoutineData {
  name: string;
  description: string;
  isActive: boolean;
}

export interface WorkoutDayData {
  routineId: number;
  dayNumber: number;
  dayName: string;
}

export interface WorkoutDaySetData {
  workoutDayId: number;
  muscleGroupId: number;
  numberOfSets: number;
}

export const testData = {
  /**
   * Generate unique routine data
   */
  generateRoutine: (name?: string): RoutineData => ({
    name: name || `E2E-Routine-${Date.now()}`,
    description: 'Generated for E2E workflow testing',
    isActive: true,
  }),

  /**
   * Generate workout day data
   */
  generateWorkoutDay: (routineId: number, dayNumber: number, dayName?: string): WorkoutDayData => ({
    routineId,
    dayNumber,
    dayName: dayName || `Day-${dayNumber}`,
  }),

  /**
   * Generate workout day sets data
   */
  generateSets: (workoutDayId: number, muscleGroupId: number = 1, numberOfSets: number = 4): WorkoutDaySetData => ({
    workoutDayId,
    muscleGroupId,
    numberOfSets,
  }),

  /**
   * Common muscle group IDs
   */
  muscleGroups: {
    CHEST: 1,
    SHOULDERS: 2,
    TRICEPS: 3,
    BACK: 4,
    BICEPS: 5,
    LEGS: 6,
    CORE: 7,
  },
};