const db = require('../config/database');

class ExerciseModel {
  /**
   * Transform database row (snake_case) to API response (camelCase)
   */
  static transformRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      workoutDayId: row.workout_day_id,
      muscleGroupId: row.muscle_group_id,
      exerciseName: row.exercise_name,
      totalReps: row.total_reps,
      weight: parseFloat(row.weight),
      totalSets: row.total_sets,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async create(data) {
    const query = `
      INSERT INTO exercises (workout_day_id, muscle_group_id, exercise_name, total_reps, weight, total_sets, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      data.workoutDayId,
      data.muscleGroupId,
      data.exerciseName,
      data.totalReps ?? 0,
      data.weight ?? 0,
      data.totalSets ?? 0,
      data.notes || null,
    ];
    const result = await db.query(query, values);
    return this.transformRow(result.rows[0]);
  }

  static async findById(id) {
    const query = 'SELECT * FROM exercises WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows.length > 0 ? this.transformRow(result.rows[0]) : null;
  }

  /**
   * Find all exercises for the given workout day IDs (for snapshot creation).
   * @param {number[]} workoutDayIds - Array of workout day IDs
   * @param {Object} [client] - Optional database client (for transactions)
   * @returns {Promise<Array>} Array of exercise objects (camelCase)
   */
  static async findByWorkoutDayIds(workoutDayIds, client = null) {
    if (!workoutDayIds || workoutDayIds.length === 0) return [];
    const query = 'SELECT * FROM exercises WHERE workout_day_id = ANY($1::int[]) ORDER BY id';
    const result = client
      ? await client.query(query, [workoutDayIds])
      : await db.query(query, [workoutDayIds]);
    return result.rows.map((row) => this.transformRow(row));
  }

  static async update(id, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (data.exerciseName !== undefined) {
      updates.push(`exercise_name = $${paramCount++}`);
      values.push(data.exerciseName);
    }
    if (data.totalReps !== undefined) {
      updates.push(`total_reps = $${paramCount++}`);
      values.push(data.totalReps);
    }
    if (data.weight !== undefined) {
      updates.push(`weight = $${paramCount++}`);
      values.push(data.weight);
    }
    if (data.totalSets !== undefined) {
      updates.push(`total_sets = $${paramCount++}`);
      values.push(data.totalSets);
    }
    if (data.notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(data.notes);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const updateQuery = `
      UPDATE exercises
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);
    if (!result.rows || result.rows.length === 0) {
      throw new Error('Exercise not found');
    }
    return this.transformRow(result.rows[0]);
  }

  static async delete(id) {
    const query = 'DELETE FROM exercises WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async exists(id) {
    const query = 'SELECT EXISTS(SELECT 1 FROM exercises WHERE id = $1)';
    const result = await db.query(query, [id]);
    return result?.rows?.[0]?.exists || false;
  }
}

module.exports = ExerciseModel;
