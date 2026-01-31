const ExerciseService = require('../services/exerciseService');

class ExerciseController {
  static async createExercise(req, res) {
    try {
      const exercise = await ExerciseService.create(req.validatedBody);
      res.status(201).json(exercise);
    } catch (error) {
      if (error.message === 'Workout day not found') {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Workout day not found',
          timestamp: new Date().toISOString(),
        });
      }
      if (error.code === '23503') {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Workout day or muscle group not found',
          timestamp: new Date().toISOString(),
        });
      }
      console.error('Error creating exercise:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async getExercise(req, res) {
    try {
      const { exerciseId } = req.params;
      const exercise = await ExerciseService.getById(parseInt(exerciseId, 10));
      res.status(200).json(exercise);
    } catch (error) {
      if (error.message === 'Exercise not found') {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Exercise not found',
          timestamp: new Date().toISOString(),
        });
      }
      console.error('Error getting exercise:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async updateExercise(req, res) {
    try {
      const { exerciseId } = req.params;
      const exercise = await ExerciseService.update(parseInt(exerciseId, 10), req.validatedBody);
      res.status(200).json(exercise);
    } catch (error) {
      if (error.message === 'Exercise not found') {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Exercise not found',
          timestamp: new Date().toISOString(),
        });
      }
      if (error.message === 'No fields to update') {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'At least one field must be provided for update',
          timestamp: new Date().toISOString(),
        });
      }
      console.error('Error updating exercise:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async deleteExercise(req, res) {
    try {
      const { exerciseId } = req.params;
      await ExerciseService.delete(parseInt(exerciseId, 10));
      res.status(204).send();
    } catch (error) {
      if (error.message === 'Exercise not found') {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Exercise not found',
          timestamp: new Date().toISOString(),
        });
      }
      console.error('Error deleting exercise:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = ExerciseController;
