const db = require('../config/database');
const WeeklySnapshotModel = require('../models/weeklySnapshotModel');
const SnapshotWorkoutDayModel = require('../models/snapshotWorkoutDayModel');
const SnapshotWorkoutDaySetModel = require('../models/snapshotWorkoutDaySetModel');
const WorkoutDayModel = require('../models/workoutDayModel');
const WorkoutDaySetModel = require('../models/workoutDaySetModel');
const RoutineModel = require('../models/routineModel');

class SnapshotService {
  /**
   * Calculate Monday of current week (ISO 8601 week start)
   * Uses UTC to avoid timezone issues
   * @returns {string} Date string in YYYY-MM-DD format (UTC)
   */
  static calculateWeekStartDate() {
    // Use UTC to avoid timezone issues
    const now = new Date();
    const utcNow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds()
    ));
    
    // Get day of week in UTC (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = utcNow.getUTCDay();
    // Convert to ISO 8601: Monday = 1, Sunday = 7
    const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    // Calculate days to subtract to get to Monday
    const daysToSubtract = isoDayOfWeek - 1;
    
    // Calculate Monday in UTC
    const monday = new Date(utcNow);
    monday.setUTCDate(utcNow.getUTCDate() - daysToSubtract);
    monday.setUTCHours(0, 0, 0, 0);
    
    // Format as YYYY-MM-DD using UTC methods
    const year = monday.getUTCFullYear();
    const month = String(monday.getUTCMonth() + 1).padStart(2, '0');
    const day = String(monday.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  /**
   * Create a weekly snapshot for a routine
   * - Calculates week start date (Monday of current week)
   * - Fetches current workout days and sets
   * - Deletes existing snapshot if exists for same week
   * - Creates snapshot records
   * - Resets all sets to zero
   * All operations are performed in a transaction
   */
  static async createSnapshot(routineId) {
    // Verify routine exists
    const routineExists = await RoutineModel.exists(routineId);
    if (!routineExists) {
      throw new Error('Routine not found');
    }

    // Calculate week start date
    const weekStartDate = this.calculateWeekStartDate();

    // Get database client for transaction
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Fetch current workout days and sets
      const workoutDays = await WorkoutDayModel.findByRoutineId(routineId, client);
      const workoutDaySets = await WorkoutDaySetModel.findByRoutineId(routineId, client);

      // Delete existing snapshot if exists (cascade will delete related records)
      await WeeklySnapshotModel.deleteByRoutineAndWeek(routineId, weekStartDate, client);

      // Create snapshot
      const snapshot = await WeeklySnapshotModel.create(
        { routineId, weekStartDate },
        client
      );

      // Create snapshot workout days
      const snapshotDaysData = workoutDays.map((day) => ({
        snapshotId: snapshot.id,
        originalWorkoutDayId: day.id,
        dayNumber: day.dayNumber,
        dayName: day.dayName,
        notes: day.notes,
      }));

      const snapshotDays = await SnapshotWorkoutDayModel.bulkCreate(snapshotDaysData, client);

      // Create mapping of original workout day ID to snapshot workout day ID
      // Match by originalWorkoutDayId to be safe (not relying on array index order)
      const dayIdMap = new Map();
      snapshotDays.forEach((snapshotDay) => {
        dayIdMap.set(snapshotDay.originalWorkoutDayId, snapshotDay.id);
      });

      // Create snapshot workout day sets
      // Filter out sets with 0 sets (database constraint requires number_of_sets > 0)
      const snapshotSetsData = workoutDaySets
        .filter((set) => set.numberOfSets > 0)
        .map((set) => ({
          snapshotWorkoutDayId: dayIdMap.get(set.workoutDayId),
          originalWorkoutDaySetId: set.id,
          muscleGroupId: set.muscleGroupId,
          numberOfSets: set.numberOfSets,
          notes: set.notes,
        }));

      // Only create snapshot sets if there are any with numberOfSets > 0
      if (snapshotSetsData.length > 0) {
        await SnapshotWorkoutDaySetModel.bulkCreate(snapshotSetsData, client);
      }

      // Reset all sets to zero for the routine
      // await WorkoutDaySetModel.resetSetsByRoutineId(routineId, client);

      // Commit transaction
      await client.query('COMMIT');

      console.log(`✅ Snapshot created for routine ${routineId}, week ${weekStartDate}`);

      return snapshot;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating snapshot:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = SnapshotService;
