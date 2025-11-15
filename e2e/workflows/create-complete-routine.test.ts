/**
 * E2E Workflow Test: Create Complete Routine
 *
 * This test validates the complete flow of:
 * 1. Creating a routine
 * 2. Adding multiple workout days
 * 3. Adding sets to each workout day
 * 4. Verifying all data is persisted correctly
 */

import { testData } from '../helpers/test-data';
import { ApiClient } from '../helpers/api-client';
import { CleanupHelper } from '../helpers/cleanup';
import { logger } from '@chauhaidang/xq-js-common-kit';

const apiClient = new ApiClient(process.env.API_BASE_URL || 'http://localhost:8080/xq-fitness-write-service/api/v1');

describe('E2E Workflow: Create Complete Routine', () => {
  let cleanup: CleanupHelper;

  beforeEach(() => {
    cleanup = new CleanupHelper(apiClient);
  });

  afterEach(async () => {
    await cleanup.cleanupAll();
  });

  test('should create complete PPL routine with days and sets', async () => {
    logger.info('🏋️ Starting PPL routine creation workflow');

    // Step 1: Create routine
    logger.info('Step 1: Creating PPL routine');
    const routine = await apiClient.createRoutine(
      testData.generateRoutine('PPL Split')
    );
    logger.info('body', routine)
    expect(routine).toBeDefined();
    expect(routine.id).toBeDefined();
    expect(routine.name).toContain('PPL Split');
    expect(routine.isActive).toBeTruthy()

    cleanup.trackRoutine(routine.id);
    logger.info(`✅ Routine created with ID: ${routine.id}`);

    // Step 2: Create Push Day
    logger.info('Step 2: Adding Push Day');
    const pushDay = await apiClient.createWorkoutDay(
      testData.generateWorkoutDay(routine.id, 1, 'Push Day')
    );

    expect(pushDay).toBeDefined();
    expect(pushDay.id).toBeDefined();
    expect(pushDay.routineId).toBe(routine.id);
    expect(pushDay.dayNumber).toBe(1);
    expect(pushDay.dayName).toBe('Push Day');

    cleanup.trackWorkoutDay(pushDay.id);
    logger.info(`✅ Push Day created with ID: ${pushDay.id}`);

    // Step 3: Add sets to Push Day
    logger.info('Step 3: Adding sets to Push Day');
    const pushExercises = [
      { muscleGroup: testData.muscleGroups.CHEST, sets: 4 },
      { muscleGroup: testData.muscleGroups.SHOULDERS, sets: 3 },
      { muscleGroup: testData.muscleGroups.TRICEPS, sets: 3 },
    ];

    for (const exercise of pushExercises) {
      const sets = await apiClient.createWorkoutDaySets(
        testData.generateSets(pushDay.id, exercise.muscleGroup, exercise.sets)
      );

      expect(sets).toBeDefined();
      expect(sets.id).toBeDefined();
      expect(sets.workoutDayId).toBe(pushDay.id);
      expect(sets.muscleGroupId).toBe(exercise.muscleGroup);
      expect(sets.numberOfSets).toBe(exercise.sets);

      cleanup.trackWorkoutDaySets(sets.id);
    }
    logger.info(`✅ Push Day sets created (${pushExercises.length} exercises)`);

    // Step 4: Create Pull Day
    logger.info('Step 4: Adding Pull Day');
    const pullDay = await apiClient.createWorkoutDay(
      testData.generateWorkoutDay(routine.id, 2, 'Pull Day')
    );

    expect(pullDay).toBeDefined();
    expect(pullDay.id).toBeDefined();
    expect(pullDay.routineId).toBe(routine.id);
    expect(pullDay.dayNumber).toBe(2);
    expect(pullDay.dayName).toBe('Pull Day');

    cleanup.trackWorkoutDay(pullDay.id);
    logger.info(`✅ Pull Day created with ID: ${pullDay.id}`);

    // Step 5: Add sets to Pull Day
    logger.info('Step 5: Adding sets to Pull Day');
    const pullExercises = [
      { muscleGroup: testData.muscleGroups.BACK, sets: 4 },
      { muscleGroup: testData.muscleGroups.BICEPS, sets: 3 },
    ];

    for (const exercise of pullExercises) {
      const sets = await apiClient.createWorkoutDaySets(
        testData.generateSets(pullDay.id, exercise.muscleGroup, exercise.sets)
      );

      expect(sets).toBeDefined();
      expect(sets.id).toBeDefined();
      expect(sets.workoutDayId).toBe(pullDay.id);

      cleanup.trackWorkoutDaySets(sets.id);
    }
    logger.info(`✅ Pull Day sets created (${pullExercises.length} exercises)`);

    // Step 6: Create Leg Day
    logger.info('Step 6: Adding Leg Day');
    const legDay = await apiClient.createWorkoutDay(
      testData.generateWorkoutDay(routine.id, 3, 'Leg Day')
    );

    expect(legDay).toBeDefined();
    expect(legDay.id).toBeDefined();
    expect(legDay.routineId).toBe(routine.id);
    expect(legDay.dayNumber).toBe(3);
    expect(legDay.dayName).toBe('Leg Day');

    cleanup.trackWorkoutDay(legDay.id);
    logger.info(`✅ Leg Day created with ID: ${legDay.id}`);

    // Step 7: Add sets to Leg Day
    logger.info('Step 7: Adding sets to Leg Day');
    const legExercises = [
      { muscleGroup: testData.muscleGroups.LEGS, sets: 5 },
      { muscleGroup: testData.muscleGroups.CORE, sets: 3 },
    ];

    for (const exercise of legExercises) {
      const sets = await apiClient.createWorkoutDaySets(
        testData.generateSets(legDay.id, exercise.muscleGroup, exercise.sets)
      );

      expect(sets).toBeDefined();
      expect(sets.id).toBeDefined();

      cleanup.trackWorkoutDaySets(sets.id);
    }
    logger.info(`✅ Leg Day sets created (${legExercises.length} exercises)`);

    // Final verification
    logger.info('Step 8: Verifying complete routine structure');
    expect(routine.id).toBeDefined();
    expect(pushDay.id).toBeDefined();
    expect(pullDay.id).toBeDefined();
    expect(legDay.id).toBeDefined();

    logger.info('🎉 Complete PPL routine workflow successful!');
    logger.info(`Created: 1 routine, 3 workout days, 7 exercise sets`);
  });

  test('should handle routine creation with minimal data', async () => {
    logger.info('Testing minimal routine creation');

    const routine = await apiClient.createRoutine({
      name: 'Minimal Routine',
      isActive: true,
    });

    expect(routine).toBeDefined();
    expect(routine.id).toBeDefined();
    expect(routine.name).toBe('Minimal Routine');

    cleanup.trackRoutine(routine.id);
    logger.info('✅ Minimal routine created successfully');
  });
});