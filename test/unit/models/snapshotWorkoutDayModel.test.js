const SnapshotWorkoutDayModel = require('../../../src/models/snapshotWorkoutDayModel');
const db = require('../../../src/config/database');

// Mock the database module
jest.mock('../../../src/config/database');

describe('SnapshotWorkoutDayModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('Happy path', () => {
      it('should create a snapshot workout day', async () => {
        const createdAt = new Date();
        const mockDbRow = {
          id: 1,
          snapshot_id: 5,
          original_workout_day_id: 10,
          day_number: 1,
          day_name: 'Push Day',
          notes: 'Test notes',
          created_at: createdAt,
        };

        db.query.mockResolvedValue({ rows: [mockDbRow] });

        const data = {
          snapshotId: 5,
          originalWorkoutDayId: 10,
          dayNumber: 1,
          dayName: 'Push Day',
          notes: 'Test notes',
        };

        const result = await SnapshotWorkoutDayModel.create(data);

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO snapshot_workout_days'),
          [5, 10, 1, 'Push Day', 'Test notes']
        );
        expect(result).toEqual({
          id: 1,
          snapshotId: 5,
          originalWorkoutDayId: 10,
          dayNumber: 1,
          dayName: 'Push Day',
          notes: 'Test notes',
          createdAt: createdAt,
        });
      });

      it('should handle null notes', async () => {
        const mockDbRow = {
          id: 1,
          snapshot_id: 5,
          original_workout_day_id: 10,
          day_number: 1,
          day_name: 'Push Day',
          notes: null,
          created_at: new Date(),
        };

        db.query.mockResolvedValue({ rows: [mockDbRow] });

        const data = {
          snapshotId: 5,
          originalWorkoutDayId: 10,
          dayNumber: 1,
          dayName: 'Push Day',
          notes: null,
        };

        await SnapshotWorkoutDayModel.create(data);

        expect(db.query).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([null]));
      });

      it('should work with transaction client', async () => {
        const mockClient = {
          query: jest.fn().mockResolvedValue({
            rows: [{ id: 1, snapshot_id: 5, original_workout_day_id: 10, day_number: 1, day_name: 'Push Day', notes: null, created_at: new Date() }],
          }),
        };

        await SnapshotWorkoutDayModel.create(
          { snapshotId: 5, originalWorkoutDayId: 10, dayNumber: 1, dayName: 'Push Day' },
          mockClient
        );

        expect(mockClient.query).toHaveBeenCalled();
        expect(db.query).not.toHaveBeenCalled();
      });
    });

    describe('Error scenarios', () => {
      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database error');
        db.query.mockRejectedValue(dbError);

        const data = {
          snapshotId: 5,
          originalWorkoutDayId: 10,
          dayNumber: 1,
          dayName: 'Push Day',
        };

        await expect(SnapshotWorkoutDayModel.create(data)).rejects.toThrow('Database error');
      });
    });
  });

  describe('bulkCreate', () => {
    describe('Happy path', () => {
      it('should bulk create snapshot workout days', async () => {
        const createdAt = new Date();
        const mockDbRows = [
          {
            id: 1,
            snapshot_id: 5,
            original_workout_day_id: 10,
            day_number: 1,
            day_name: 'Push Day',
            notes: null,
            created_at: createdAt,
          },
          {
            id: 2,
            snapshot_id: 5,
            original_workout_day_id: 11,
            day_number: 2,
            day_name: 'Pull Day',
            notes: 'Notes',
            created_at: createdAt,
          },
        ];

        db.query.mockResolvedValue({ rows: mockDbRows });

        const days = [
          {
            snapshotId: 5,
            originalWorkoutDayId: 10,
            dayNumber: 1,
            dayName: 'Push Day',
            notes: null,
          },
          {
            snapshotId: 5,
            originalWorkoutDayId: 11,
            dayNumber: 2,
            dayName: 'Pull Day',
            notes: 'Notes',
          },
        ];

        const result = await SnapshotWorkoutDayModel.bulkCreate(days);

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe(1);
        expect(result[1].id).toBe(2);
      });

      it('should return empty array when no days provided', async () => {
        const result = await SnapshotWorkoutDayModel.bulkCreate([]);

        expect(db.query).not.toHaveBeenCalled();
        expect(result).toEqual([]);
      });

      it('should handle null input', async () => {
        const result = await SnapshotWorkoutDayModel.bulkCreate(null);

        expect(db.query).not.toHaveBeenCalled();
        expect(result).toEqual([]);
      });

      it('should work with transaction client', async () => {
        const mockClient = {
          query: jest.fn().mockResolvedValue({
            rows: [{ id: 1, snapshot_id: 5, original_workout_day_id: 10, day_number: 1, day_name: 'Push Day', notes: null, created_at: new Date() }],
          }),
        };

        await SnapshotWorkoutDayModel.bulkCreate(
          [{ snapshotId: 5, originalWorkoutDayId: 10, dayNumber: 1, dayName: 'Push Day' }],
          mockClient
        );

        expect(mockClient.query).toHaveBeenCalled();
        expect(db.query).not.toHaveBeenCalled();
      });
    });

    describe('Error scenarios', () => {
      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database error');
        db.query.mockRejectedValue(dbError);

        const days = [
          {
            snapshotId: 5,
            originalWorkoutDayId: 10,
            dayNumber: 1,
            dayName: 'Push Day',
          },
        ];

        await expect(SnapshotWorkoutDayModel.bulkCreate(days)).rejects.toThrow('Database error');
      });
    });
  });

  describe('transformRow', () => {
    it('should transform database row to API response format', () => {
      const dbRow = {
        id: 1,
        snapshot_id: 5,
        original_workout_day_id: 10,
        day_number: 1,
        day_name: 'Push Day',
        notes: 'Test notes',
        created_at: new Date(),
      };

      const result = SnapshotWorkoutDayModel.transformRow(dbRow);

      expect(result).toEqual({
        id: 1,
        snapshotId: 5,
        originalWorkoutDayId: 10,
        dayNumber: 1,
        dayName: 'Push Day',
        notes: 'Test notes',
        createdAt: dbRow.created_at,
      });
    });

    it('should return null for null input', () => {
      const result = SnapshotWorkoutDayModel.transformRow(null);
      expect(result).toBeNull();
    });
  });
});
