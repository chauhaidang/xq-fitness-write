const ExerciseModel = require('../models/exerciseModel');
const WorkoutDayModel = require('../models/workoutDayModel');

class ExerciseService {
  static async create(data) {
    const dayExists = await WorkoutDayModel.exists(data.workoutDayId);
    if (!dayExists) {
      throw new Error('Workout day not found');
    }
    return ExerciseModel.create(data);
  }

  static async getById(id) {
    const exercise = await ExerciseModel.findById(id);
    if (!exercise) {
      throw new Error('Exercise not found');
    }
    return exercise;
  }

  static async update(id, data) {
    const exists = await ExerciseModel.exists(id);
    if (!exists) {
      throw new Error('Exercise not found');
    }
    return ExerciseModel.update(id, data);
  }

  static async delete(id) {
    const exists = await ExerciseModel.exists(id);
    if (!exists) {
      throw new Error('Exercise not found');
    }
    await ExerciseModel.delete(id);
  }
}

module.exports = ExerciseService;
