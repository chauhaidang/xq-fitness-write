const SnapshotService = require('../../../src/services/snapshotService');
const db = require('../../../src/config/database');
const WeeklySnapshotModel = require('../../../src/models/weeklySnapshotModel');
const SnapshotWorkoutDayModel = require('../../../src/models/snapshotWorkoutDayModel');
const SnapshotWorkoutDaySetModel = require('../../../src/models/snapshotWorkoutDaySetModel');
const SnapshotExerciseModel = require('../../../src/models/snapshotExerciseModel');
const WorkoutDayModel = require('../../../src/models/workoutDayModel');
const WorkoutDaySetModel = require('../../../src/models/workoutDaySetModel');
const ExerciseModel = require('../../../src/models/exerciseModel');
const RoutineModel = require('../../../src/models/routineModel');

// Mock all dependencies
jest.mock('../../../src/config/database');
jest.mock('../../../src/models/weeklySnapshotModel');
jest.mock('../../../src/models/snapshotWorkoutDayModel');
jest.mock('../../../src/models/snapshotWorkoutDaySetModel');
jest.mock('../../../src/models/snapshotExerciseModel');
jest.mock('../../../src/models/workoutDayModel');
jest.mock('../../../src/models/workoutDaySetModel');
jest.mock('../../../src/models/exerciseModel');
jest.mock('../../../src/models/routineModel');

describe('SnapshotService', () => {
  let mockClient;
  let consoleErrorSpy;
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console methods to suppress expected logs in tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Mock database client
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    db.getClient.mockResolvedValue(mockClient);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('calculateWeekStartDate', () => {
    let originalDate;

    beforeEach(() => {
      // Store original Date constructor
      originalDate = global.Date;
    });

    afterEach(() => {
      // Restore original Date constructor
      global.Date = originalDate;
    });

    it('should return Monday of current week in YYYY-MM-DD format', () => {
      // Mock a specific date (Wednesday, 2024-12-04)
      const mockDate = new Date('2024-12-04T12:00:00Z');
      const MockDate = jest.fn((...args) => {
        if (args.length === 0) {
          return mockDate;
        }
        return new originalDate(...args);
      });
      MockDate.UTC = originalDate.UTC;
      MockDate.now = originalDate.now;
      MockDate.parse = originalDate.parse;
      global.Date = MockDate;

      const result = SnapshotService.calculateWeekStartDate();

      // Should return Monday (2024-12-02)
      expect(result).toBe('2024-12-02');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle Sunday correctly (should return previous Monday)', () => {
      // Mock Sunday, 2024-12-08
      const mockDate = new Date('2024-12-08T12:00:00Z');
      const MockDate = jest.fn((...args) => {
        if (args.length === 0) {
          return mockDate;
        }
        return new originalDate(...args);
      });
      MockDate.UTC = originalDate.UTC;
      MockDate.now = originalDate.now;
      MockDate.parse = originalDate.parse;
      global.Date = MockDate;

      const result = SnapshotService.calculateWeekStartDate();

      // Should return Monday (2024-12-02)
      expect(result).toBe('2024-12-02');
    });

    it('should handle Monday correctly (should return same day)', () => {
      // Mock Monday, 2024-12-02
      const mockDate = new Date('2024-12-02T12:00:00Z');
      const MockDate = jest.fn((...args) => {
        if (args.length === 0) {
          return mockDate;
        }
        return new originalDate(...args);
      });
      MockDate.UTC = originalDate.UTC;
      MockDate.now = originalDate.now;
      MockDate.parse = originalDate.parse;
      global.Date = MockDate;

      const result = SnapshotService.calculateWeekStartDate();

      // Should return same Monday
      expect(result).toBe('2024-12-02');
    });

    it('should set time to midnight', () => {
      const mockDate = new Date('2024-12-04T15:30:45Z');
      const MockDate = jest.fn((...args) => {
        if (args.length === 0) {
          return mockDate;
        }
        return new originalDate(...args);
      });
      MockDate.UTC = originalDate.UTC;
      MockDate.now = originalDate.now;
      MockDate.parse = originalDate.parse;
      global.Date = MockDate;

      const result = SnapshotService.calculateWeekStartDate();

      expect(result).toBe('2024-12-02');
    });
  });

  describe('createSnapshot', () => {
    describe('Happy path', () => {
      it('should create snapshot successfully with workout days and sets', async () => {
        const routineId = 10;
        const weekStartDate = '2024-12-02';

        // Mock week calculation
        jest.spyOn(SnapshotService, 'calculateWeekStartDate').mockReturnValue(weekStartDate);

        const mockWorkoutDays = [
          { id: 1, routineId: 10, dayNumber: 1, dayName: 'Push Day', notes: 'Test' },
          { id: 2, routineId: 10, dayNumber: 2, dayName: 'Pull Day', notes: null },
        ];

        const mockWorkoutDaySets = [
          { id: 1, workoutDayId: 1, muscleGroupId: 1, numberOfSets: 4, notes: 'Chest' },
          { id: 2, workoutDayId: 1, muscleGroupId: 2, numberOfSets: 3, notes: 'Shoulders' },
          { id: 3, workoutDayId: 2, muscleGroupId: 4, numberOfSets: 5, notes: 'Back' },
        ];

        const mockSnapshot = {
          id: 1,
          routineId: 10,
          weekStartDate: weekStartDate,
          createdAt: new Date(),
        };

        const mockSnapshotDays = [
          { id: 10, snapshotId: 1, originalWorkoutDayId: 1, dayNumber: 1, dayName: 'Push Day' },
          { id: 11, snapshotId: 1, originalWorkoutDayId: 2, dayNumber: 2, dayName: 'Pull Day' },
        ];

        RoutineModel.exists.mockResolvedValue(true);
        WorkoutDayModel.findByRoutineId.mockResolvedValue(mockWorkoutDays);
        WorkoutDaySetModel.findByRoutineId.mockResolvedValue(mockWorkoutDaySets);
        ExerciseModel.findByWorkoutDayIds.mockResolvedValue([]);
        WeeklySnapshotModel.deleteByRoutineAndWeek.mockResolvedValue(null);
        WeeklySnapshotModel.create.mockResolvedValue(mockSnapshot);
        SnapshotWorkoutDayModel.bulkCreate.mockResolvedValue(mockSnapshotDays);
        SnapshotWorkoutDaySetModel.bulkCreate.mockResolvedValue([]);
        // Note: resetSetsByRoutineId is commented out in the service, so we don't expect it to be called

        const result = await SnapshotService.createSnapshot(routineId);

        // Verify transaction flow
        expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
        expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        expect(mockClient.release).toHaveBeenCalled();

        // Verify routine check
        expect(RoutineModel.exists).toHaveBeenCalledWith(routineId);

        // Verify data fetching
        expect(WorkoutDayModel.findByRoutineId).toHaveBeenCalledWith(routineId, mockClient);
        expect(WorkoutDaySetModel.findByRoutineId).toHaveBeenCalledWith(routineId, mockClient);

        // Verify snapshot creation
        expect(WeeklySnapshotModel.deleteByRoutineAndWeek).toHaveBeenCalledWith(routineId, weekStartDate, mockClient);
        expect(WeeklySnapshotModel.create).toHaveBeenCalledWith({ routineId, weekStartDate }, mockClient);

        // Verify snapshot days creation
        expect(SnapshotWorkoutDayModel.bulkCreate).toHaveBeenCalledWith(
          [
            {
              snapshotId: 1,
              originalWorkoutDayId: 1,
              dayNumber: 1,
              dayName: 'Push Day',
              notes: 'Test',
            },
            {
              snapshotId: 1,
              originalWorkoutDayId: 2,
              dayNumber: 2,
              dayName: 'Pull Day',
              notes: null,
            },
          ],
          mockClient
        );

        // Verify snapshot sets creation (with correct mapping)
        expect(SnapshotWorkoutDaySetModel.bulkCreate).toHaveBeenCalledWith(
          [
            {
              snapshotWorkoutDayId: 10, // mapped from workoutDayId 1
              originalWorkoutDaySetId: 1,
              muscleGroupId: 1,
              numberOfSets: 4,
              notes: 'Chest',
            },
            {
              snapshotWorkoutDayId: 10, // mapped from workoutDayId 1
              originalWorkoutDaySetId: 2,
              muscleGroupId: 2,
              numberOfSets: 3,
              notes: 'Shoulders',
            },
            {
              snapshotWorkoutDayId: 11, // mapped from workoutDayId 2
              originalWorkoutDaySetId: 3,
              muscleGroupId: 4,
              numberOfSets: 5,
              notes: 'Back',
            },
          ],
          mockClient
        );

        // Note: resetSetsByRoutineId is commented out in the service, so we don't verify it

        expect(result).toEqual(mockSnapshot);
      });

      it('should create snapshot when no workout days exist', async () => {
        const routineId = 10;
        const weekStartDate = '2024-12-02';

        jest.spyOn(SnapshotService, 'calculateWeekStartDate').mockReturnValue(weekStartDate);

        const mockSnapshot = {
          id: 1,
          routineId: 10,
          weekStartDate: weekStartDate,
          createdAt: new Date(),
        };

        RoutineModel.exists.mockResolvedValue(true);
        WorkoutDayModel.findByRoutineId.mockResolvedValue([]);
        WorkoutDaySetModel.findByRoutineId.mockResolvedValue([]);
        ExerciseModel.findByWorkoutDayIds.mockResolvedValue([]);
        WeeklySnapshotModel.deleteByRoutineAndWeek.mockResolvedValue(null);
        WeeklySnapshotModel.create.mockResolvedValue(mockSnapshot);
        SnapshotWorkoutDayModel.bulkCreate.mockResolvedValue([]);
        // Note: bulkCreate for sets is only called if there are sets with numberOfSets > 0
        // Since we have no sets, it should not be called

        const result = await SnapshotService.createSnapshot(routineId);

        expect(SnapshotWorkoutDayModel.bulkCreate).toHaveBeenCalledWith([], mockClient);
        // When there are no sets with numberOfSets > 0, bulkCreate should not be called
        expect(SnapshotWorkoutDaySetModel.bulkCreate).not.toHaveBeenCalled();
        expect(result).toEqual(mockSnapshot);
      });

      it('should replace existing snapshot for same week', async () => {
        const routineId = 10;
        const weekStartDate = '2024-12-02';

        jest.spyOn(SnapshotService, 'calculateWeekStartDate').mockReturnValue(weekStartDate);

        const mockSnapshot = {
          id: 2,
          routineId: 10,
          weekStartDate: weekStartDate,
          createdAt: new Date(),
        };

        RoutineModel.exists.mockResolvedValue(true);
        WorkoutDayModel.findByRoutineId.mockResolvedValue([]);
        WorkoutDaySetModel.findByRoutineId.mockResolvedValue([]);
        ExerciseModel.findByWorkoutDayIds.mockResolvedValue([]);
        WeeklySnapshotModel.deleteByRoutineAndWeek.mockResolvedValue(1); // Returns deleted ID
        WeeklySnapshotModel.create.mockResolvedValue(mockSnapshot);
        SnapshotWorkoutDayModel.bulkCreate.mockResolvedValue([]);
        // Note: bulkCreate for sets is only called if there are sets with numberOfSets > 0

        const result = await SnapshotService.createSnapshot(routineId);

        expect(WeeklySnapshotModel.deleteByRoutineAndWeek).toHaveBeenCalledWith(routineId, weekStartDate, mockClient);
        expect(result).toEqual(mockSnapshot);
      });
    });

    describe('Error handling', () => {
      it('should throw error when routine does not exist', async () => {
        const routineId = 999;

        RoutineModel.exists.mockResolvedValue(false);

        await expect(SnapshotService.createSnapshot(routineId)).rejects.toThrow('Routine not found');

        expect(RoutineModel.exists).toHaveBeenCalledWith(routineId);
        expect(mockClient.query).not.toHaveBeenCalled();
      });

      it('should rollback transaction on error', async () => {
        const routineId = 10;
        const weekStartDate = '2024-12-02';

        jest.spyOn(SnapshotService, 'calculateWeekStartDate').mockReturnValue(weekStartDate);

        const error = new Error('Database error');

        RoutineModel.exists.mockResolvedValue(true);
        WorkoutDayModel.findByRoutineId.mockResolvedValue([]);
        WorkoutDaySetModel.findByRoutineId.mockResolvedValue([]);
        ExerciseModel.findByWorkoutDayIds.mockResolvedValue([]);
        WeeklySnapshotModel.deleteByRoutineAndWeek.mockResolvedValue(null);
        WeeklySnapshotModel.create.mockRejectedValue(error);

        await expect(SnapshotService.createSnapshot(routineId)).rejects.toThrow('Database error');

        expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        expect(mockClient.release).toHaveBeenCalled();
      });

      it('should release client even on error', async () => {
        const routineId = 10;
        const weekStartDate = '2024-12-02';

        jest.spyOn(SnapshotService, 'calculateWeekStartDate').mockReturnValue(weekStartDate);

        const error = new Error('Database error');

        RoutineModel.exists.mockResolvedValue(true);
        WorkoutDayModel.findByRoutineId.mockRejectedValue(error);

        await expect(SnapshotService.createSnapshot(routineId)).rejects.toThrow('Database error');

        expect(mockClient.release).toHaveBeenCalled();
      });

      // Note: resetSetsByRoutineId is commented out in the service, so this test is no longer applicable
      // Keeping the test structure but testing a different error scenario
      it('should handle error during snapshot sets creation', async () => {
        const routineId = 10;
        const weekStartDate = '2024-12-02';

        jest.spyOn(SnapshotService, 'calculateWeekStartDate').mockReturnValue(weekStartDate);

        const error = new Error('Bulk create failed');

        const mockWorkoutDays = [{ id: 1, routineId: 10, dayNumber: 1, dayName: 'Push Day', notes: null }];
        const mockWorkoutDaySets = [{ id: 1, workoutDayId: 1, muscleGroupId: 1, numberOfSets: 4, notes: null }];
        const mockSnapshotDays = [
          { id: 10, snapshotId: 1, originalWorkoutDayId: 1, dayNumber: 1, dayName: 'Push Day' },
        ];

        RoutineModel.exists.mockResolvedValue(true);
        WorkoutDayModel.findByRoutineId.mockResolvedValue(mockWorkoutDays);
        WorkoutDaySetModel.findByRoutineId.mockResolvedValue(mockWorkoutDaySets);
        ExerciseModel.findByWorkoutDayIds.mockResolvedValue([]);
        WeeklySnapshotModel.deleteByRoutineAndWeek.mockResolvedValue(null);
        WeeklySnapshotModel.create.mockResolvedValue({ id: 1, routineId: 10, weekStartDate });
        SnapshotWorkoutDayModel.bulkCreate.mockResolvedValue(mockSnapshotDays);
        SnapshotWorkoutDaySetModel.bulkCreate.mockRejectedValue(error);

        await expect(SnapshotService.createSnapshot(routineId)).rejects.toThrow('Bulk create failed');

        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      });
    });

    describe('Edge cases', () => {
      it('should handle workout days with no sets', async () => {
        const routineId = 10;
        const weekStartDate = '2024-12-02';

        jest.spyOn(SnapshotService, 'calculateWeekStartDate').mockReturnValue(weekStartDate);

        const mockWorkoutDays = [{ id: 1, routineId: 10, dayNumber: 1, dayName: 'Push Day', notes: null }];

        const mockSnapshot = {
          id: 1,
          routineId: 10,
          weekStartDate: weekStartDate,
          createdAt: new Date(),
        };

        const mockSnapshotDays = [
          { id: 10, snapshotId: 1, originalWorkoutDayId: 1, dayNumber: 1, dayName: 'Push Day' },
        ];

        RoutineModel.exists.mockResolvedValue(true);
        WorkoutDayModel.findByRoutineId.mockResolvedValue(mockWorkoutDays);
        WorkoutDaySetModel.findByRoutineId.mockResolvedValue([]); // No sets
        ExerciseModel.findByWorkoutDayIds.mockResolvedValue([]);
        WeeklySnapshotModel.deleteByRoutineAndWeek.mockResolvedValue(null);
        WeeklySnapshotModel.create.mockResolvedValue(mockSnapshot);
        SnapshotWorkoutDayModel.bulkCreate.mockResolvedValue(mockSnapshotDays);
        // Note: bulkCreate for sets is only called if there are sets with numberOfSets > 0
        // Since we have no sets, it should not be called

        const result = await SnapshotService.createSnapshot(routineId);

        // When there are no sets with numberOfSets > 0, bulkCreate should not be called
        expect(SnapshotWorkoutDaySetModel.bulkCreate).not.toHaveBeenCalled();
        expect(result).toEqual(mockSnapshot);
      });

      it('should create snapshot_exercises when routine has exercises', async () => {
        const routineId = 10;
        const weekStartDate = '2024-12-02';

        jest.spyOn(SnapshotService, 'calculateWeekStartDate').mockReturnValue(weekStartDate);

        const mockWorkoutDays = [{ id: 1, routineId: 10, dayNumber: 1, dayName: 'Push Day', notes: null }];
        const mockWorkoutDaySets = [{ id: 1, workoutDayId: 1, muscleGroupId: 1, numberOfSets: 4, notes: null }];
        const mockSnapshot = {
          id: 1,
          routineId: 10,
          weekStartDate: weekStartDate,
          createdAt: new Date(),
        };
        const mockSnapshotDays = [
          { id: 10, snapshotId: 1, originalWorkoutDayId: 1, dayNumber: 1, dayName: 'Push Day' },
        ];
        const mockExercises = [
          {
            id: 100,
            workoutDayId: 1,
            muscleGroupId: 1,
            exerciseName: 'Bench Press',
            totalReps: 30,
            weight: 135,
            totalSets: 3,
            notes: null,
          },
          {
            id: 101,
            workoutDayId: 1,
            muscleGroupId: 2,
            exerciseName: 'Overhead Press',
            totalReps: 24,
            weight: 95,
            totalSets: 3,
            notes: null,
          },
        ];

        RoutineModel.exists.mockResolvedValue(true);
        WorkoutDayModel.findByRoutineId.mockResolvedValue(mockWorkoutDays);
        WorkoutDaySetModel.findByRoutineId.mockResolvedValue(mockWorkoutDaySets);
        ExerciseModel.findByWorkoutDayIds.mockResolvedValue(mockExercises);
        WeeklySnapshotModel.deleteByRoutineAndWeek.mockResolvedValue(null);
        WeeklySnapshotModel.create.mockResolvedValue(mockSnapshot);
        SnapshotWorkoutDayModel.bulkCreate.mockResolvedValue(mockSnapshotDays);
        SnapshotWorkoutDaySetModel.bulkCreate.mockResolvedValue([]);
        SnapshotExerciseModel.bulkCreate.mockResolvedValue([]);

        const result = await SnapshotService.createSnapshot(routineId);

        expect(ExerciseModel.findByWorkoutDayIds).toHaveBeenCalledWith([1], mockClient);
        expect(SnapshotExerciseModel.bulkCreate).toHaveBeenCalledWith(
          [
            {
              snapshotWorkoutDayId: 10,
              originalExerciseId: 100,
              exerciseName: 'Bench Press',
              muscleGroupId: 1,
              totalReps: 30,
              weight: 135,
              totalSets: 3,
              notes: null,
            },
            {
              snapshotWorkoutDayId: 10,
              originalExerciseId: 101,
              exerciseName: 'Overhead Press',
              muscleGroupId: 2,
              totalReps: 24,
              weight: 95,
              totalSets: 3,
              notes: null,
            },
          ],
          mockClient
        );
        expect(result).toEqual(mockSnapshot);
      });

      it('should handle multiple sets per workout day correctly', async () => {
        const routineId = 10;
        const weekStartDate = '2024-12-02';

        jest.spyOn(SnapshotService, 'calculateWeekStartDate').mockReturnValue(weekStartDate);

        const mockWorkoutDays = [{ id: 1, routineId: 10, dayNumber: 1, dayName: 'Push Day', notes: null }];

        const mockWorkoutDaySets = [
          { id: 1, workoutDayId: 1, muscleGroupId: 1, numberOfSets: 4, notes: null },
          { id: 2, workoutDayId: 1, muscleGroupId: 2, numberOfSets: 3, notes: null },
          { id: 3, workoutDayId: 1, muscleGroupId: 3, numberOfSets: 2, notes: null },
        ];

        const mockSnapshot = {
          id: 1,
          routineId: 10,
          weekStartDate: weekStartDate,
          createdAt: new Date(),
        };

        const mockSnapshotDays = [
          { id: 10, snapshotId: 1, originalWorkoutDayId: 1, dayNumber: 1, dayName: 'Push Day' },
        ];

        RoutineModel.exists.mockResolvedValue(true);
        WorkoutDayModel.findByRoutineId.mockResolvedValue(mockWorkoutDays);
        WorkoutDaySetModel.findByRoutineId.mockResolvedValue(mockWorkoutDaySets);
        ExerciseModel.findByWorkoutDayIds.mockResolvedValue([]);
        WeeklySnapshotModel.deleteByRoutineAndWeek.mockResolvedValue(null);
        WeeklySnapshotModel.create.mockResolvedValue(mockSnapshot);
        SnapshotWorkoutDayModel.bulkCreate.mockResolvedValue(mockSnapshotDays);
        SnapshotWorkoutDaySetModel.bulkCreate.mockResolvedValue([]);
        // Note: resetSetsByRoutineId is commented out in the service

        await SnapshotService.createSnapshot(routineId);

        // Verify all sets are mapped to the same snapshot workout day
        expect(SnapshotWorkoutDaySetModel.bulkCreate).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ snapshotWorkoutDayId: 10 }),
            expect.objectContaining({ snapshotWorkoutDayId: 10 }),
            expect.objectContaining({ snapshotWorkoutDayId: 10 }),
          ]),
          mockClient
        );
      });
    });
  });
});
