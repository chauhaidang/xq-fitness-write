const RoutineModel = require('../models/routineModel');

class RoutineController {
  static async createRoutine(req, res) {
    try {
      const routine = await RoutineModel.create(req.validatedBody);
      res.status(201).json(routine);
    } catch (error) {
      console.error('Error creating routine:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async updateRoutine(req, res) {
    try {
      const { routineId } = req.params;
      const exists = await RoutineModel.exists(routineId);

      if (!exists) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Routine not found',
          timestamp: new Date().toISOString(),
        });
      }

      const routine = await RoutineModel.update(routineId, req.validatedBody);
      res.status(200).json(routine);
    } catch (error) {
      console.error('Error updating routine:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async deleteRoutine(req, res) {
    try {
      const { routineId } = req.params;
      const deleted = await RoutineModel.delete(routineId);

      if (!deleted) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Routine not found',
          timestamp: new Date().toISOString(),
        });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting routine:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = RoutineController;
