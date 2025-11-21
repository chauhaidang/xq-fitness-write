const WorkoutDayModel = require('../models/workoutDayModel');
const RoutineModel = require('../models/routineModel');

class WorkoutDayController {
  static async createWorkoutDay(req, res) {
    try {
      const routineExists = await RoutineModel.exists(req.validatedBody.routineId);

      if (!routineExists) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Routine not found',
          timestamp: new Date().toISOString(),
        });
      }

      const workoutDay = await WorkoutDayModel.create(req.validatedBody);
      res.status(201).json(workoutDay);
    } catch (error) {
      console.error('Error creating workout day:', error);
      if (error.code === '23505') {
        // Unique constraint violation
        return res.status(400).json({
          code: 'DUPLICATE_ERROR',
          message: 'A workout day with this day number already exists for this routine',
          timestamp: new Date().toISOString(),
        });
      }
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async updateWorkoutDay(req, res) {
    try {
      const { dayId } = req.params;
      const exists = await WorkoutDayModel.exists(dayId);

      if (!exists) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Workout day not found',
          timestamp: new Date().toISOString(),
        });
      }

      const workoutDay = await WorkoutDayModel.update(dayId, req.validatedBody);
      res.status(200).json(workoutDay);
    } catch (error) {
      console.error('Error updating workout day:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async deleteWorkoutDay(req, res) {
    try {
      const { dayId } = req.params;
      const deleted = await WorkoutDayModel.delete(dayId);

      if (!deleted) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Workout day not found',
          timestamp: new Date().toISOString(),
        });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting workout day:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = WorkoutDayController;
