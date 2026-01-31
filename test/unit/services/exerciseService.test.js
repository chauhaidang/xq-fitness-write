/**
 * Unit tests: ExerciseService
 *
 * Covers create, getById, update, delete with mocked ExerciseModel and WorkoutDayModel.
 * Scenarios: happy path (workout day exists / exercise found) and error path (not found).
 *
 * create: checks WorkoutDayModel.exists then ExerciseModel.create; throws "Workout day not found" if day missing.
 * getById: ExerciseModel.findById; throws "Exercise not found" if null.
 * update: ExerciseModel.exists then ExerciseModel.update; throws "Exercise not found" if missing.
 * delete: ExerciseModel.exists then ExerciseModel.delete; throws "Exercise not found" if missing.
 */

const ExerciseService = require('../../../src/services/exerciseService');
const ExerciseModel = require('../../../src/models/exerciseModel');
const WorkoutDayModel = require('../../../src/models/workoutDayModel');

jest.mock('../../../src/models/exerciseModel');
jest.mock('../../../src/models/workoutDayModel');

describe('ExerciseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call WorkoutDayModel.exists and ExerciseModel.create and return created exercise when workout day exists', async () => {
      const input = {
        workoutDayId: 1,
        muscleGroupId: 3,
        exerciseName: 'Bench Press',
        totalReps: 30,
        weight: 135,
        totalSets: 3,
        notes: 'Focus on form',
      };
      const created = {
        id: 1,
        workoutDayId: 1,
        muscleGroupId: 3,
        exerciseName: 'Bench Press',
        totalReps: 30,
        weight: 135,
        totalSets: 3,
        notes: 'Focus on form',
        createdAt: '2025-01-27T10:00:00Z',
        updatedAt: '2025-01-27T10:00:00Z',
      };

      WorkoutDayModel.exists.mockResolvedValue(true);
      ExerciseModel.create.mockResolvedValue(created);

      const result = await ExerciseService.create(input);

      expect(WorkoutDayModel.exists).toHaveBeenCalledWith(1);
      expect(ExerciseModel.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(created);
    });

    it('should throw "Workout day not found" and not call ExerciseModel.create when workout day does not exist', async () => {
      WorkoutDayModel.exists.mockResolvedValue(false);

      await expect(
        ExerciseService.create({
          workoutDayId: 999,
          muscleGroupId: 1,
          exerciseName: 'Squat',
          totalReps: 10,
          weight: 185,
          totalSets: 3,
        })
      ).rejects.toThrow('Workout day not found');

      expect(ExerciseModel.create).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should call ExerciseModel.findById and return exercise when found', async () => {
      const exercise = {
        id: 1,
        workoutDayId: 1,
        muscleGroupId: 3,
        exerciseName: 'Bench Press',
        totalReps: 30,
        weight: 135,
        totalSets: 3,
        notes: null,
        createdAt: '2025-01-27T10:00:00Z',
        updatedAt: '2025-01-27T10:00:00Z',
      };

      ExerciseModel.findById.mockResolvedValue(exercise);

      const result = await ExerciseService.getById(1);

      expect(ExerciseModel.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(exercise);
    });

    it('should throw "Exercise not found" when ExerciseModel.findById returns null', async () => {
      ExerciseModel.findById.mockResolvedValue(null);

      await expect(ExerciseService.getById(999)).rejects.toThrow('Exercise not found');
    });
  });

  describe('update', () => {
    it('should call ExerciseModel.exists and ExerciseModel.update and return updated exercise when found', async () => {
      const updateData = { totalReps: 35, weight: 140 };
      const updated = {
        id: 1,
        workoutDayId: 1,
        muscleGroupId: 3,
        exerciseName: 'Bench Press',
        totalReps: 35,
        weight: 140,
        totalSets: 3,
        notes: null,
        createdAt: '2025-01-27T10:00:00Z',
        updatedAt: '2025-01-27T10:15:00Z',
      };

      ExerciseModel.exists.mockResolvedValue(true);
      ExerciseModel.update.mockResolvedValue(updated);

      const result = await ExerciseService.update(1, updateData);

      expect(ExerciseModel.exists).toHaveBeenCalledWith(1);
      expect(ExerciseModel.update).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual(updated);
    });

    it('should throw "Exercise not found" and not call ExerciseModel.update when exercise does not exist', async () => {
      ExerciseModel.exists.mockResolvedValue(false);

      await expect(ExerciseService.update(999, { totalReps: 35 })).rejects.toThrow('Exercise not found');
      expect(ExerciseModel.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should call ExerciseModel.exists and ExerciseModel.delete when exercise found', async () => {
      ExerciseModel.exists.mockResolvedValue(true);
      ExerciseModel.delete.mockResolvedValue(true);

      await ExerciseService.delete(1);

      expect(ExerciseModel.exists).toHaveBeenCalledWith(1);
      expect(ExerciseModel.delete).toHaveBeenCalledWith(1);
    });

    it('should throw "Exercise not found" and not call ExerciseModel.delete when exercise does not exist', async () => {
      ExerciseModel.exists.mockResolvedValue(false);

      await expect(ExerciseService.delete(999)).rejects.toThrow('Exercise not found');
      expect(ExerciseModel.delete).not.toHaveBeenCalled();
    });
  });
});
