const db = require('../config/database');

class RoutineModel {
  /**
   * Transform database row (snake_case) to API response (camelCase)
   */
  static transformRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async create(data) {
    const query = `
      INSERT INTO workout_routines (name, description, is_active)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [data.name, data.description || null, data.isActive !== false];
    const result = await db.query(query, values);
    return this.transformRow(result.rows[0]);
  }

  static async update(id, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(data.isActive);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const query = `
      UPDATE workout_routines
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return this.transformRow(result.rows[0]);
  }

  static async delete(id) {
    const query = 'DELETE FROM workout_routines WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async exists(id) {
    const query = 'SELECT EXISTS(SELECT 1 FROM workout_routines WHERE id = $1)';
    const result = await db.query(query, [id]);
    return result.rows[0].exists;
  }
}

module.exports = RoutineModel;
