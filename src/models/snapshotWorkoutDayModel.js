const db = require('../config/database');

class SnapshotWorkoutDayModel {
  /**
   * Transform database row (snake_case) to API response (camelCase)
   */
  static transformRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      snapshotId: row.snapshot_id,
      originalWorkoutDayId: row.original_workout_day_id,
      dayNumber: row.day_number,
      dayName: row.day_name,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }

  /**
   * Create a single snapshot workout day
   */
  static async create(data, client = null) {
    const queryFn = client ? client.query.bind(client) : db.query;
    const query = `
      INSERT INTO snapshot_workout_days (snapshot_id, original_workout_day_id, day_number, day_name, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      data.snapshotId,
      data.originalWorkoutDayId,
      data.dayNumber,
      data.dayName,
      data.notes || null,
    ];
    const result = await queryFn(query, values);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Bulk create snapshot workout days
   * @param {Array} days - Array of workout day data objects
   * @param {Object} client - Optional database client (for transactions)
   */
  static async bulkCreate(days, client = null) {
    if (!days || days.length === 0) return [];

    const queryFn = client ? client.query.bind(client) : db.query;
    const values = [];
    const placeholders = [];

    days.forEach((day, index) => {
      const offset = index * 5;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`
      );
      values.push(
        day.snapshotId,
        day.originalWorkoutDayId,
        day.dayNumber,
        day.dayName,
        day.notes || null
      );
    });

    const query = `
      INSERT INTO snapshot_workout_days (snapshot_id, original_workout_day_id, day_number, day_name, notes)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;

    const result = await queryFn(query, values);
    return result.rows.map((row) => this.transformRow(row));
  }
}

module.exports = SnapshotWorkoutDayModel;
