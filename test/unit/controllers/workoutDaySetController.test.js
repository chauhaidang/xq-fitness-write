const WorkoutDaySetController = require('../../../src/controllers/workoutDaySetController');
const WorkoutDaySetModel = require('../../../src/models/workoutDaySetModel');
const WorkoutDayModel = require('../../../src/models/workoutDayModel');

// Mock the models
jest.mock('../../../src/models/workoutDaySetModel');
jest.mock('../../../src/models/workoutDayModel');

describe('WorkoutDaySetController', () => {
  let req, res;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console.error to suppress expected error logs in tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    req = {
      validatedBody: {},
      params: {},
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('createWorkoutDaySet', () => {
    describe('Upsert behavior - Update existing set', () => {
      it('should update existing workout day set when one already exists', async () => {
        const existingSet = {
          id: 1,
          workoutDayId: 5,
          muscleGroupId: 3,
          numberOfSets: 4,
          notes: 'Original notes',
        };

        const updatedSet = {
          id: 1,
          workoutDayId: 5,
          muscleGroupId: 3,
          numberOfSets: 6,
          notes: 'Updated notes',
        };

        req.validatedBody = {
          workoutDayId: 5,
          muscleGroupId: 3,
          numberOfSets: 6,
          notes: 'Updated notes',
        };

        WorkoutDayModel.exists.mockResolvedValue(true);
        WorkoutDaySetModel.findByWorkoutDayAndMuscleGroup.mockResolvedValue(existingSet);
        WorkoutDaySetModel.update.mockResolvedValue(updatedSet);

        await WorkoutDaySetController.createWorkoutDaySet(req, res);

        expect(WorkoutDayModel.exists).toHaveBeenCalledWith(5);
        expect(WorkoutDaySetModel.findByWorkoutDayAndMuscleGroup).toHaveBeenCalledWith(5, 3);
        expect(WorkoutDaySetModel.update).toHaveBeenCalledWith(1, req.validatedBody);
        expect(WorkoutDaySetModel.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(updatedSet);
      });

      it('should update existing set with partial data', async () => {
        const existingSet = {
          id: 2,
          workoutDayId: 10,
          muscleGroupId: 7,
          numberOfSets: 3,
          notes: 'Original',
        };

        const updatedSet = {
          id: 2,
          workoutDayId: 10,
          muscleGroupId: 7,
          numberOfSets: 5,
          notes: 'Original', // Notes not updated
        };

        req.validatedBody = {
          workoutDayId: 10,
          muscleGroupId: 7,
          numberOfSets: 5,
        };

        WorkoutDayModel.exists.mockResolvedValue(true);
        WorkoutDaySetModel.findByWorkoutDayAndMuscleGroup.mockResolvedValue(existingSet);
        WorkoutDaySetModel.update.mockResolvedValue(updatedSet);

        await WorkoutDaySetController.createWorkoutDaySet(req, res);

        expect(WorkoutDaySetModel.update).toHaveBeenCalledWith(2, req.validatedBody);
        expect(res.status).toHaveBeenCalledWith(200);
      });
    });

    describe('Create new set', () => {
      it('should create new workout day set when none exists', async () => {
        const newSet = {
          id: 3,
          workoutDayId: 8,
          muscleGroupId: 2,
          numberOfSets: 4,
          notes: 'New set',
        };

        req.validatedBody = {
          workoutDayId: 8,
          muscleGroupId: 2,
          numberOfSets: 4,
          notes: 'New set',
        };

        WorkoutDayModel.exists.mockResolvedValue(true);
        WorkoutDaySetModel.findByWorkoutDayAndMuscleGroup.mockResolvedValue(null);
        WorkoutDaySetModel.create.mockResolvedValue(newSet);

        await WorkoutDaySetController.createWorkoutDaySet(req, res);

        expect(WorkoutDaySetModel.findByWorkoutDayAndMuscleGroup).toHaveBeenCalledWith(8, 2);
        expect(WorkoutDaySetModel.create).toHaveBeenCalledWith(req.validatedBody);
        expect(WorkoutDaySetModel.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(newSet);
      });
    });

    describe('Error handling', () => {
      it('should return 404 when workout day does not exist', async () => {
        req.validatedBody = {
          workoutDayId: 999,
          muscleGroupId: 1,
          numberOfSets: 3,
        };

        WorkoutDayModel.exists.mockResolvedValue(false);

        await WorkoutDaySetController.createWorkoutDaySet(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          code: 'NOT_FOUND',
          message: 'Workout day not found',
          timestamp: expect.any(String),
        });
        expect(WorkoutDaySetModel.create).not.toHaveBeenCalled();
      });

      it('should handle unique constraint violation (fallback)', async () => {
        const error = new Error('Duplicate key');
        error.code = '23505';

        req.validatedBody = {
          workoutDayId: 5,
          muscleGroupId: 3,
          numberOfSets: 4,
        };

        WorkoutDayModel.exists.mockResolvedValue(true);
        WorkoutDaySetModel.findByWorkoutDayAndMuscleGroup.mockResolvedValue(null);
        WorkoutDaySetModel.create.mockRejectedValue(error);

        await WorkoutDaySetController.createWorkoutDaySet(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          code: 'DUPLICATE_ERROR',
          message: 'This muscle group already has a set configuration for this workout day',
          timestamp: expect.any(String),
        });
      });

      it('should handle foreign key violation', async () => {
        const error = new Error('Foreign key violation');
        error.code = '23503';

        req.validatedBody = {
          workoutDayId: 5,
          muscleGroupId: 999,
          numberOfSets: 4,
        };

        WorkoutDayModel.exists.mockResolvedValue(true);
        WorkoutDaySetModel.findByWorkoutDayAndMuscleGroup.mockResolvedValue(null);
        WorkoutDaySetModel.create.mockRejectedValue(error);

        await WorkoutDaySetController.createWorkoutDaySet(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          code: 'NOT_FOUND',
          message: 'Muscle group not found',
          timestamp: expect.any(String),
        });
      });

      it('should handle generic errors', async () => {
        const error = new Error('Database connection failed');

        req.validatedBody = {
          workoutDayId: 5,
          muscleGroupId: 3,
          numberOfSets: 4,
        };

        WorkoutDayModel.exists.mockResolvedValue(true);
        WorkoutDaySetModel.findByWorkoutDayAndMuscleGroup.mockResolvedValue(null);
        WorkoutDaySetModel.create.mockRejectedValue(error);

        await WorkoutDaySetController.createWorkoutDaySet(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          code: 'INTERNAL_ERROR',
          message: 'Database connection failed',
          timestamp: expect.any(String),
        });
      });
    });
  });
});

