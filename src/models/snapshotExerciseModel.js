const db = require('../config/database');

class SnapshotExerciseModel {
  /**
   * Transform database row (snake_case) to API response (camelCase)
   */
  static transformRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      snapshotWorkoutDayId: row.snapshot_workout_day_id,
      originalExerciseId: row.original_exercise_id,
      exerciseName: row.exercise_name,
      muscleGroupId: row.muscle_group_id,
      totalReps: row.total_reps,
      weight: parseFloat(row.weight),
      totalSets: row.total_sets,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }

  /**
   * Bulk create snapshot exercises
   * @param {Array} exercises - Array of { snapshotWorkoutDayId, originalExerciseId, exerciseName, muscleGroupId, totalReps, weight, totalSets, notes }
   * @param {Object} client - Optional database client (for transactions)
   */
  static async bulkCreate(exercises, client = null) {
    if (!exercises || exercises.length === 0) return [];

    const queryFn = client ? client.query.bind(client) : db.query.bind(db);
    const values = [];
    const placeholders = [];

    exercises.forEach((ex, index) => {
      const offset = index * 8;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`
      );
      values.push(
        ex.snapshotWorkoutDayId,
        ex.originalExerciseId,
        ex.exerciseName,
        ex.muscleGroupId,
        ex.totalReps ?? 0,
        ex.weight ?? 0,
        ex.totalSets ?? 0,
        ex.notes ?? null
      );
    });

    const query = `
      INSERT INTO snapshot_exercises (snapshot_workout_day_id, original_exercise_id, exercise_name, muscle_group_id, total_reps, weight, total_sets, notes)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;
    const result = await queryFn(query, values);
    return result.rows.map((row) => this.transformRow(row));
  }
}

module.exports = SnapshotExerciseModel;
