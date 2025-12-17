const SnapshotService = require('../services/snapshotService');
const RoutineModel = require('../models/routineModel');
const Joi = require('joi');

class SnapshotController {
  static async createSnapshot(req, res) {
    try {
      const { routineId } = req.params;

      // Validate routineId parameter
      const routineIdSchema = Joi.number().integer().positive().required();
      const { error, value } = routineIdSchema.validate(parseInt(routineId, 10));

      if (error) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Invalid routineId parameter',
          timestamp: new Date().toISOString(),
          details: error.details.map((d) => d.message),
        });
      }

      const validatedRoutineId = value;

      // Verify routine exists
      const routineExists = await RoutineModel.exists(validatedRoutineId);
      if (!routineExists) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Routine not found',
          timestamp: new Date().toISOString(),
        });
      }

      const snapshot = await SnapshotService.createSnapshot(validatedRoutineId);

      res.status(201).json(snapshot);
    } catch (error) {
      console.error('Error creating snapshot:', error);

      // Handle specific error cases
      if (error.message === 'Routine not found') {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: error.message,
          timestamp: new Date().toISOString(),
        });
      }

      // Handle database transaction errors
      if (error.code && error.code.startsWith('23')) {
        // PostgreSQL constraint violation
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Invalid snapshot data',
          timestamp: new Date().toISOString(),
        });
      }

      // Generic error
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to create snapshot',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = SnapshotController;
