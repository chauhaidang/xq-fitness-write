const db = require('../config/database');

class WorkoutDaySetModel {
  /**
   * Transform database row (snake_case) to API response (camelCase)
   */
  static transformRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      workoutDayId: row.workout_day_id,
      muscleGroupId: row.muscle_group_id,
      numberOfSets: row.number_of_sets,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async create(data) {
    const query = `
      INSERT INTO workout_day_sets (workout_day_id, muscle_group_id, number_of_sets, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [data.workoutDayId, data.muscleGroupId, data.numberOfSets, data.notes || null];
    const result = await db.query(query, values);
    return this.transformRow(result.rows[0]);
  }

  static async findByWorkoutDayAndMuscleGroup(workoutDayId, muscleGroupId) {
    const query = `
      SELECT * FROM workout_day_sets
      WHERE workout_day_id = $1 AND muscle_group_id = $2
      LIMIT 1
    `;
    const result = await db.query(query, [workoutDayId, muscleGroupId]);
    return result.rows.length > 0 ? this.transformRow(result.rows[0]) : null;
  }

  static async update(id, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (data.numberOfSets !== undefined) {
      updates.push(`number_of_sets = $${paramCount++}`);
      values.push(data.numberOfSets);
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
      UPDATE workout_day_sets
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    if (!result.rows || result.rows.length === 0) {
      throw new Error('Workout day set not found');
    }
    return this.transformRow(result.rows[0]);
  }

  static async delete(id) {
    const query = 'DELETE FROM workout_day_sets WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async exists(id) {
    const query = 'SELECT EXISTS(SELECT 1 FROM workout_day_sets WHERE id = $1)';
    const result = await db.query(query, [id]);
    return result?.rows?.[0]?.exists || false;
  }

  /**
   * Find all workout day sets for a routine (via workout days)
   */
  static async findByRoutineId(routineId, client = null) {
    const queryFn = client ? client.query.bind(client) : db.query;
    const query = `
      SELECT wds.* FROM workout_day_sets wds
      JOIN workout_days wd ON wds.workout_day_id = wd.id
      WHERE wd.routine_id = $1
      ORDER BY wd.day_number, wds.muscle_group_id
    `;
    const result = await queryFn(query, [routineId]);
    return result.rows.map((row) => this.transformRow(row));
  }

  /**
   * Reset all sets to zero for a routine
   */
  static async resetSetsByRoutineId(routineId, client = null) {
    const queryFn = client ? client.query.bind(client) : db.query;
    const query = `
      UPDATE workout_day_sets
      SET number_of_sets = 0, updated_at = CURRENT_TIMESTAMP
      WHERE workout_day_id IN (
        SELECT id FROM workout_days WHERE routine_id = $1
      )
    `;
    const result = await queryFn(query, [routineId]);
    return result.rowCount;
  }
}

module.exports = WorkoutDaySetModel;
