const db = require('../config/database');

class WorkoutDayModel {
  /**
   * Transform database row (snake_case) to API response (camelCase)
   */
  static transformRow(row) {
      if (!row) return null;
      return {
          id: row.id,
          routineId: row.routine_id,
          dayNumber: row.day_number,
          dayName: row.day_name,
          notes: row.notes,
          createdAt: row.created_at,
          updatedAt: row.updated_at
      };
  }

  static async create(data) {
    const query = `
      INSERT INTO workout_days (routine_id, day_number, day_name, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [data.routineId, data.dayNumber, data.dayName, data.notes || null];
    const result = await db.query(query, values);
    return this.transformRow(result.rows[0]);
  }

  static async update(id, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (data.dayNumber !== undefined) {
      updates.push(`day_number = $${paramCount++}`);
      values.push(data.dayNumber);
    }
    if (data.dayName !== undefined) {
      updates.push(`day_name = $${paramCount++}`);
      values.push(data.dayName);
    }
    if (data.notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(data.notes);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const query = `
      UPDATE workout_days
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM workout_days WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async exists(id) {
    const query = 'SELECT EXISTS(SELECT 1 FROM workout_days WHERE id = $1)';
    const result = await db.query(query, [id]);
    return result.rows[0].exists;
  }
}

module.exports = WorkoutDayModel;
