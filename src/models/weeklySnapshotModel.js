const db = require('../config/database');

class WeeklySnapshotModel {
  /**
   * Transform database row (snake_case) to API response (camelCase)
   */
  static transformRow(row) {
    if (!row) return null;
    
    // Format week_start_date as YYYY-MM-DD string (date only, no time/timezone)
    // PostgreSQL DATE type stores just the date (no timezone), and pg converts it to Date at midnight local time
    // We need to extract using local date methods (not UTC) to get the exact date that was stored
    let weekStartDate = row.week_start_date;
    if (weekStartDate instanceof Date) {
      // PostgreSQL DATE is stored without timezone, and pg creates Date at midnight in server timezone
      // Use local date methods to extract the date part (not UTC) to match what was stored
      const year = weekStartDate.getFullYear();
      const month = String(weekStartDate.getMonth() + 1).padStart(2, '0');
      const day = String(weekStartDate.getDate()).padStart(2, '0');
      weekStartDate = `${year}-${month}-${day}`;
    } else if (typeof weekStartDate === 'string') {
      // If it's already a string, extract just the date part (YYYY-MM-DD)
      weekStartDate = weekStartDate.substring(0, 10);
    }
    
    return {
      id: row.id,
      routineId: row.routine_id,
      weekStartDate: weekStartDate,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Create a new weekly snapshot
   */
  static async create(data, client = null) {
    const queryFn = client ? client.query.bind(client) : db.query;
    const query = `
      INSERT INTO weekly_snapshots (routine_id, week_start_date)
      VALUES ($1, $2)
      RETURNING *
    `;
    const values = [data.routineId, data.weekStartDate];
    const result = await queryFn(query, values);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Find snapshot by routine ID and week start date
   */
  static async findByRoutineAndWeek(routineId, weekStartDate, client = null) {
    const queryFn = client ? client.query.bind(client) : db.query;
    const query = `
      SELECT * FROM weekly_snapshots
      WHERE routine_id = $1 AND week_start_date = $2
      LIMIT 1
    `;
    const result = await queryFn(query, [routineId, weekStartDate]);
    return result.rows.length > 0 ? this.transformRow(result.rows[0]) : null;
  }

  /**
   * Delete snapshot by routine ID and week start date
   * This will cascade delete related snapshot_workout_days and snapshot_workout_day_sets
   */
  static async deleteByRoutineAndWeek(routineId, weekStartDate, client = null) {
    const queryFn = client ? client.query.bind(client) : db.query;
    const query = `
      DELETE FROM weekly_snapshots
      WHERE routine_id = $1 AND week_start_date = $2
      RETURNING id
    `;
    const result = await queryFn(query, [routineId, weekStartDate]);
    return result.rows.length > 0 ? result.rows[0].id : null;
  }
}

module.exports = WeeklySnapshotModel;
