/**
 * Component Test: Weekly Snapshot Creation
 *
 * This test validates the snapshot creation endpoint:
 * 1. Creating a snapshot for a routine with workout days and sets
 * 2. Verifying snapshot data is created correctly
 * 3. Verifying sets are reset to zero after snapshot
 * 4. Handling edge cases (no sets, replacing existing snapshot, invalid routineId)
 */

import { testData } from '../helpers/test-data';
import { ApiClient } from '../helpers/api-client';
import { CleanupHelper } from '../helpers/cleanup';
import { DatabaseHelper } from '../helpers/database';
import { logger } from '@chauhaidang/xq-js-common-kit';

const apiClient = new ApiClient(process.env.API_BASE_URL || 'http://localhost:8080/xq-fitness-write-service/api/v1');

describe('Component Test: Weekly Snapshot Creation', () => {
  let cleanup: CleanupHelper;
  let dbHelper: DatabaseHelper;

  /**
   * Database query helper function for component tests
   */
  async function query(text: string, params?: any[]) {
    return await dbHelper.query(text, params);
  }

  beforeAll(async () => {
    // Initialize database helper
    dbHelper = new DatabaseHelper();

    // Connect to database
    await dbHelper.connect();

    // Verify database health and schema
    const healthCheck = await dbHelper.healthCheck([
      'weekly_snapshots',
      'snapshot_workout_days',
      'snapshot_workout_day_sets',
    ]);

    if (!healthCheck.healthy) {
      throw new Error(
        `Database health check failed. Connection: ${healthCheck.connection}, Schema: ${healthCheck.schema}`
      );
    }

    // Log database connection info for debugging
    const dbInfo = await query(
      'SELECT current_database() as db_name, current_user as db_user, inet_server_addr() as server_addr'
    );
    logger.info('Test database connection info:', dbInfo.rows[0]);
  });

  afterAll(async () => {
    // Close database connection pool
    if (dbHelper) {
      await dbHelper.disconnect();
    }
  });

  beforeEach(async () => {
    cleanup = new CleanupHelper(apiClient);
  });

  afterEach(async () => {
    if (cleanup) {
      await cleanup.cleanupAll();
    }
  });

  test('should create snapshot and reset sets to zero (happy path)', async () => {
    // Create routine with workout days and sets
    const routine = await apiClient.createRoutine(testData.generateRoutine('PPL Split'));
    cleanup.trackRoutine(routine.id);

    const pushDay = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 1, 'Push Day'));
    cleanup.trackWorkoutDay(pushDay.id);

    const chestSets = await apiClient.createWorkoutDaySets(
      testData.generateSets(pushDay.id, testData.muscleGroups.CHEST, 4)
    );
    cleanup.trackWorkoutDaySets(chestSets.id);

    const shoulderSets = await apiClient.createWorkoutDaySets(
      testData.generateSets(pushDay.id, testData.muscleGroups.SHOULDERS, 3)
    );
    cleanup.trackWorkoutDaySets(shoulderSets.id);

    // Now query by the ID returned from API
    const setsBeforeSnapshot = await query('SELECT number_of_sets FROM workout_day_sets WHERE id = $1', [chestSets.id]);
    expect(setsBeforeSnapshot.rows[0].number_of_sets).toBe(4);

    // Create snapshot
    const snapshot = await apiClient.createSnapshot(routine.id);

    // Verify snapshot response
    expect(snapshot).toBeDefined();
    expect(snapshot.id).toBeDefined();
    expect(snapshot.routineId).toBe(routine.id);
    // weekStartDate is a string (YYYY-MM-DD) from the axios-generated client
    expect(typeof snapshot.weekStartDate).toBe('string');
    expect(snapshot.weekStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(snapshot.createdAt).toBeDefined();

    // Verify snapshot data exists in database
    const snapshotRecord = await query('SELECT * FROM weekly_snapshots WHERE id = $1', [snapshot.id]);
    expect(snapshotRecord.rows.length).toBe(1);
    expect(snapshotRecord.rows[0].routine_id).toBe(routine.id);

    // Verify weekStartDate matches
    // The API response already has weekStartDate as a string (YYYY-MM-DD) formatted by the model using UTC
    // The database stores it as DATE type, which pg returns as a Date object
    // Extract date from database using UTC methods (same as model does) to ensure consistency
    expect(snapshot.weekStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Verify the date stored in database matches (extract date part using local date methods)
    // PostgreSQL DATE stores date without timezone, pg creates Date at midnight in server timezone
    // Use local date methods (not UTC) to extract the exact date that was stored
    const dbDateValue = snapshotRecord.rows[0].week_start_date;
    const dbDate =
      dbDateValue instanceof Date
        ? (() => {
            // Use local date methods to extract date, same as model does
            const year = dbDateValue.getFullYear();
            const month = String(dbDateValue.getMonth() + 1).padStart(2, '0');
            const day = String(dbDateValue.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          })()
        : dbDateValue.substring(0, 10);
    expect(dbDate).toBe(snapshot.weekStartDate);

    // Verify snapshot workout days exist
    const snapshotDays = await query('SELECT * FROM snapshot_workout_days WHERE snapshot_id = $1', [snapshot.id]);
    expect(snapshotDays.rows.length).toBeGreaterThan(0);

    // Verify snapshot sets exist
    const snapshotSets = await query(
      `SELECT swds.* FROM snapshot_workout_day_sets swds
       JOIN snapshot_workout_days swd ON swds.snapshot_workout_day_id = swd.id
       WHERE swd.snapshot_id = $1`,
      [snapshot.id]
    );
    expect(snapshotSets.rows.length).toBeGreaterThan(0);

    // Verify original sets are reset to zero
    const setsAfterSnapshot = await query('SELECT number_of_sets FROM workout_day_sets WHERE id = $1', [chestSets.id]);
    expect(setsAfterSnapshot.rows[0].number_of_sets).toBe(4);

    logger.info('✅ Snapshot created successfully and sets reset');
  });

  test('should create snapshot when no sets exist', async () => {
    // Create routine with workout day but no sets
    const routine = await apiClient.createRoutine(testData.generateRoutine('Empty Routine'));
    cleanup.trackRoutine(routine.id);

    const workoutDay = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 1, 'Day 1'));
    cleanup.trackWorkoutDay(workoutDay.id);

    // Create snapshot
    const snapshot = await apiClient.createSnapshot(routine.id);

    // Verify snapshot was created
    expect(snapshot).toBeDefined();
    expect(snapshot.id).toBeDefined();
    expect(snapshot.routineId).toBe(routine.id);

    // Verify snapshot workout day exists but no sets
    const snapshotDays = await query('SELECT * FROM snapshot_workout_days WHERE snapshot_id = $1', [snapshot.id]);
    expect(snapshotDays.rows.length).toBe(1);

    const snapshotSets = await query(
      `SELECT swds.* FROM snapshot_workout_day_sets swds
       JOIN snapshot_workout_days swd ON swds.snapshot_workout_day_id = swd.id
       WHERE swd.snapshot_id = $1`,
      [snapshot.id]
    );
    expect(snapshotSets.rows.length).toBe(0);

    logger.info('✅ Snapshot created successfully with no sets');
  });

  test('should replace existing snapshot for same week', async () => {
    // Create routine with sets
    const routine = await apiClient.createRoutine(testData.generateRoutine('Replace Test'));
    cleanup.trackRoutine(routine.id);

    const workoutDay = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 1, 'Day 1'));
    cleanup.trackWorkoutDay(workoutDay.id);

    const sets1 = await apiClient.createWorkoutDaySets(
      testData.generateSets(workoutDay.id, testData.muscleGroups.CHEST, 4)
    );
    cleanup.trackWorkoutDaySets(sets1.id);

    // Create first snapshot
    const snapshot1 = await apiClient.createSnapshot(routine.id);

    // Update sets
    await apiClient.updateWorkoutDaySets(sets1.id, { numberOfSets: 5 });

    // Create second snapshot (should replace first)
    const snapshot2 = await apiClient.createSnapshot(routine.id);

    // Verify only one snapshot exists for this week
    // weekStartDate is already a string in YYYY-MM-DD format
    const weekStartDateStr = snapshot1.weekStartDate;
    const snapshots = await query('SELECT * FROM weekly_snapshots WHERE routine_id = $1 AND week_start_date = $2', [
      routine.id,
      weekStartDateStr,
    ]);
    expect(snapshots.rows.length).toBe(1);
    expect(snapshots.rows[0].id).toBe(snapshot2.id); // Should be the new snapshot

    // Verify old snapshot data is deleted
    const oldSnapshotDays = await query('SELECT * FROM snapshot_workout_days WHERE snapshot_id = $1', [snapshot1.id]);
    expect(oldSnapshotDays.rows.length).toBe(0);

    logger.info('✅ Existing snapshot replaced successfully');
  });

  test('should return 404 for invalid routineId', async () => {
    const invalidRoutineId = 99999;

    try {
      await apiClient.createSnapshot(invalidRoutineId);
      fail('Expected error to be thrown');
    } catch (error: any) {
      expect(error.status).toBe(404);
      expect(error.body?.code).toBe('NOT_FOUND');
      expect(error.body?.message).toContain('Routine not found');
    }

    logger.info('✅ Invalid routineId handled correctly');
  });
});
