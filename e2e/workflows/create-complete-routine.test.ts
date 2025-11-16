/**
 * E2E Workflow Test: Create Complete Routine
 *
 * This test validates the complete end-to-end flow across both services:
 *
 * Write Service (Create operations):
 * 1. Creating a routine
 * 2. Adding multiple workout days
 * 3. Adding sets to each workout day
 *
 * Read Service (Validation):
 * 4. Reading back the complete routine structure
 * 5. Validating all nested workout days and sets
 * 6. Verifying data consistency between write and read services
 */

import { testData } from '../helpers/test-data';
import { ApiClient } from '../helpers/api-client';
import { CleanupHelper } from '../helpers/cleanup';
import { logger } from '@chauhaidang/xq-js-common-kit';
import { Configuration, RoutinesApi as ReadRoutinesApi } from 'xq-fitness-read-client';

const apiClient = new ApiClient(process.env.API_BASE_URL || 'http://localhost:8080/xq-fitness-write-service/api/v1');

// Configure read service API client
const readServiceConfig = new Configuration({
  basePath: process.env.READ_API_BASE_URL || 'http://localhost:8080/api/v1'
});
const readRoutinesApi = new ReadRoutinesApi(readServiceConfig);

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

    // Step 8: Validate via Read Service
    logger.info('Step 8: Validating created data via Read Service');

    const routineFromReadService = await readRoutinesApi.getRoutineById({ routineId: routine.id });

    // Validate routine details
    expect(routineFromReadService).toBeDefined();
    expect(routineFromReadService.id).toBe(routine.id);
    expect(routineFromReadService.name).toContain('PPL Split');
    expect(routineFromReadService.isActive).toBe(true);
    logger.info(`✅ Routine validated via Read Service (ID: ${routineFromReadService.id})`);

    // Validate workout days structure
    expect(routineFromReadService.workoutDays).toBeDefined();
    expect(routineFromReadService.workoutDays).toHaveLength(3);
    logger.info(`✅ Found ${routineFromReadService.workoutDays?.length} workout days`);

    // Validate Push Day
    const readPushDay = routineFromReadService.workoutDays?.find(d => d.dayNumber === 1);
    expect(readPushDay).toBeDefined();
    expect(readPushDay?.id).toBe(pushDay.id);
    expect(readPushDay?.dayName).toBe('Push Day');
    expect(readPushDay?.sets).toHaveLength(3); // Chest, Shoulders, Triceps
    logger.info(`✅ Push Day validated: ${readPushDay?.sets?.length} exercise sets`);

    // Validate Pull Day
    const readPullDay = routineFromReadService.workoutDays?.find(d => d.dayNumber === 2);
    expect(readPullDay).toBeDefined();
    expect(readPullDay?.id).toBe(pullDay.id);
    expect(readPullDay?.dayName).toBe('Pull Day');
    expect(readPullDay?.sets).toHaveLength(2); // Back, Biceps
    logger.info(`✅ Pull Day validated: ${readPullDay?.sets?.length} exercise sets`);

    // Validate Leg Day
    const readLegDay = routineFromReadService.workoutDays?.find(d => d.dayNumber === 3);
    expect(readLegDay).toBeDefined();
    expect(readLegDay?.id).toBe(legDay.id);
    expect(readLegDay?.dayName).toBe('Leg Day');
    expect(readLegDay?.sets).toHaveLength(2); // Legs, Core
    logger.info(`✅ Leg Day validated: ${readLegDay?.sets?.length} exercise sets`);

    // Validate specific sets details on Push Day
    const chestSets = readPushDay?.sets?.find(s => s.muscleGroup?.id === testData.muscleGroups.CHEST);
    expect(chestSets).toBeDefined();
    expect(chestSets?.numberOfSets).toBe(4);
    expect(chestSets?.muscleGroup?.name).toBe('Chest');
    logger.info(`✅ Validated chest exercise: ${chestSets?.numberOfSets} sets`);

    // Final verification
    logger.info('Step 9: Final verification complete');
    expect(routine.id).toBeDefined();
    expect(pushDay.id).toBeDefined();
    expect(pullDay.id).toBeDefined();
    expect(legDay.id).toBeDefined();

    logger.info('🎉 Complete PPL routine workflow successful!');
    logger.info(`✅ Write Service: Created 1 routine, 3 workout days, 7 exercise sets`);
    logger.info(`✅ Read Service: Validated complete routine structure with all nested data`);
  });

  test('should handle routine creation with minimal data', async () => {
    logger.info('Testing minimal routine creation');

    // Step 1: Create minimal routine via Write Service
    const routine = await apiClient.createRoutine({
      name: 'Minimal Routine',
      isActive: true,
    });

    expect(routine).toBeDefined();
    expect(routine.id).toBeDefined();
    expect(routine.name).toBe('Minimal Routine');
    cleanup.trackRoutine(routine.id);
    logger.info('✅ Minimal routine created successfully');

    // Step 2: Validate via Read Service
    logger.info('Validating minimal routine via Read Service');
    const routineFromReadService = await readRoutinesApi.getRoutineById({ routineId: routine.id });

    expect(routineFromReadService).toBeDefined();
    expect(routineFromReadService.id).toBe(routine.id);
    expect(routineFromReadService.name).toBe('Minimal Routine');
    expect(routineFromReadService.isActive).toBe(true);
    expect(routineFromReadService.workoutDays).toEqual([]); // No workout days yet

    logger.info('✅ Minimal routine validated via Read Service');
    logger.info('✅ Write Service: Created routine | Read Service: Validated');
  });
});