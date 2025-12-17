const db = require('../config/database');

class SnapshotWorkoutDaySetModel {
  /**
   * Transform database row (snake_case) to API response (camelCase)
   */
  static transformRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      snapshotWorkoutDayId: row.snapshot_workout_day_id,
      originalWorkoutDaySetId: row.original_workout_day_set_id,
      muscleGroupId: row.muscle_group_id,
      numberOfSets: row.number_of_sets,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }

  /**
   * Create a single snapshot workout day set
   */
  static async create(data, client = null) {
    const queryFn = client ? client.query.bind(client) : db.query;
    const query = `
      INSERT INTO snapshot_workout_day_sets (snapshot_workout_day_id, original_workout_day_set_id, muscle_group_id, number_of_sets, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      data.snapshotWorkoutDayId,
      data.originalWorkoutDaySetId,
      data.muscleGroupId,
      data.numberOfSets,
      data.notes || null,
    ];
    const result = await queryFn(query, values);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Bulk create snapshot workout day sets
   * @param {Array} sets - Array of set data objects
   * @param {Object} client - Optional database client (for transactions)
   */
  static async bulkCreate(sets, client = null) {
    if (!sets || sets.length === 0) return [];

    const queryFn = client ? client.query.bind(client) : db.query;
    const values = [];
    const placeholders = [];

    sets.forEach((set, index) => {
      const offset = index * 5;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`
      );
      values.push(
        set.snapshotWorkoutDayId,
        set.originalWorkoutDaySetId,
        set.muscleGroupId,
        set.numberOfSets,
        set.notes || null
      );
    });

    const query = `
      INSERT INTO snapshot_workout_day_sets (snapshot_workout_day_id, original_workout_day_set_id, muscle_group_id, number_of_sets, notes)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;

    const result = await queryFn(query, values);
    return result.rows.map((row) => this.transformRow(row));
  }
}

module.exports = SnapshotWorkoutDaySetModel;
