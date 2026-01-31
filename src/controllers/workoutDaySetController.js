const WorkoutDaySetModel = require('../models/workoutDaySetModel');
const WorkoutDayModel = require('../models/workoutDayModel');

class WorkoutDaySetController {
  static async createWorkoutDaySet(req, res) {
    try {
      const dayExists = await WorkoutDayModel.exists(req.validatedBody.workoutDayId);

      if (!dayExists) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Workout day not found',
          timestamp: new Date().toISOString(),
        });
      }

      // Check if a workout day set already exists for this workout day and muscle group
      const existingSet = await WorkoutDaySetModel.findByWorkoutDayAndMuscleGroup(
        req.validatedBody.workoutDayId,
        req.validatedBody.muscleGroupId
      );

      if (existingSet) {
        // If it exists, update it instead of creating a new one (upsert behavior)
        const updatedSet = await WorkoutDaySetModel.update(existingSet.id, req.validatedBody);
        return res.status(200).json(updatedSet);
      }

      // Create new workout day set if it doesn't exist
      const workoutDaySet = await WorkoutDaySetModel.create(req.validatedBody);
      res.status(201).json(workoutDaySet);
    } catch (error) {
      console.error('Error creating workout day set:', error);
      if (error.code === '23505') {
        // Unique constraint violation (shouldn't happen now, but keep for safety)
        return res.status(400).json({
          code: 'DUPLICATE_ERROR',
          message: 'This muscle group already has a set configuration for this workout day',
          timestamp: new Date().toISOString(),
        });
      }
      if (error.code === '23503') {
        // Foreign key violation
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Muscle group not found',
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

  static async updateWorkoutDaySet(req, res) {
    try {
      const { setId } = req.params;
      const { workoutDayId, muscleGroupId } = req.query;

      let actualSetId = setId;

      // If query parameters are provided, use them to find the setId
      if (workoutDayId || muscleGroupId) {
        // Both query parameters must be provided together
        if (!workoutDayId || !muscleGroupId) {
          return res.status(400).json({
            code: 'VALIDATION_ERROR',
            message: 'Both workoutDayId and muscleGroupId query parameters must be provided together',
            timestamp: new Date().toISOString(),
          });
        }

        const workoutDaySet = await WorkoutDaySetModel.findByWorkoutDayAndMuscleGroup(
          parseInt(workoutDayId),
          parseInt(muscleGroupId)
        );

        if (!workoutDaySet) {
          return res.status(404).json({
            code: 'NOT_FOUND',
            message: 'Workout day set not found for the given workout day and muscle group',
            timestamp: new Date().toISOString(),
          });
        }

        actualSetId = workoutDaySet.id;
      } else {
        // Use setId from path parameter (backward compatible)
        const exists = await WorkoutDaySetModel.exists(setId);

        if (!exists) {
          return res.status(404).json({
            code: 'NOT_FOUND',
            message: 'Workout day set not found',
            timestamp: new Date().toISOString(),
          });
        }
      }

      const workoutDaySet = await WorkoutDaySetModel.update(actualSetId, req.validatedBody);
      res.status(200).json(workoutDaySet);
    } catch (error) {
      console.error('Error updating workout day set:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async deleteWorkoutDaySet(req, res) {
    try {
      const { setId } = req.params;
      const deleted = await WorkoutDaySetModel.delete(setId);

      if (!deleted) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Workout day set not found',
          timestamp: new Date().toISOString(),
        });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting workout day set:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = WorkoutDaySetController;
