const SnapshotWorkoutDaySetModel = require('../../../src/models/snapshotWorkoutDaySetModel');
const db = require('../../../src/config/database');

// Mock the database module
jest.mock('../../../src/config/database');

describe('SnapshotWorkoutDaySetModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('Happy path', () => {
      it('should create a snapshot workout day set', async () => {
        const createdAt = new Date();
        const mockDbRow = {
          id: 1,
          snapshot_workout_day_id: 5,
          original_workout_day_set_id: 10,
          muscle_group_id: 1,
          number_of_sets: 4,
          notes: 'Test notes',
          created_at: createdAt,
        };

        db.query.mockResolvedValue({ rows: [mockDbRow] });

        const data = {
          snapshotWorkoutDayId: 5,
          originalWorkoutDaySetId: 10,
          muscleGroupId: 1,
          numberOfSets: 4,
          notes: 'Test notes',
        };

        const result = await SnapshotWorkoutDaySetModel.create(data);

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO snapshot_workout_day_sets'), [
          5,
          10,
          1,
          4,
          'Test notes',
        ]);
        expect(result).toEqual({
          id: 1,
          snapshotWorkoutDayId: 5,
          originalWorkoutDaySetId: 10,
          muscleGroupId: 1,
          numberOfSets: 4,
          notes: 'Test notes',
          createdAt: createdAt,
        });
      });

      it('should handle null notes', async () => {
        const mockDbRow = {
          id: 1,
          snapshot_workout_day_id: 5,
          original_workout_day_set_id: 10,
          muscle_group_id: 1,
          number_of_sets: 4,
          notes: null,
          created_at: new Date(),
        };

        db.query.mockResolvedValue({ rows: [mockDbRow] });

        const data = {
          snapshotWorkoutDayId: 5,
          originalWorkoutDaySetId: 10,
          muscleGroupId: 1,
          numberOfSets: 4,
          notes: null,
        };

        await SnapshotWorkoutDaySetModel.create(data);

        expect(db.query).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([null]));
      });

      it('should work with transaction client', async () => {
        const mockClient = {
          query: jest.fn().mockResolvedValue({
            rows: [
              {
                id: 1,
                snapshot_workout_day_id: 5,
                original_workout_day_set_id: 10,
                muscle_group_id: 1,
                number_of_sets: 4,
                notes: null,
                created_at: new Date(),
              },
            ],
          }),
        };

        await SnapshotWorkoutDaySetModel.create(
          { snapshotWorkoutDayId: 5, originalWorkoutDaySetId: 10, muscleGroupId: 1, numberOfSets: 4 },
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
          snapshotWorkoutDayId: 5,
          originalWorkoutDaySetId: 10,
          muscleGroupId: 1,
          numberOfSets: 4,
        };

        await expect(SnapshotWorkoutDaySetModel.create(data)).rejects.toThrow('Database error');
      });
    });
  });

  describe('bulkCreate', () => {
    describe('Happy path', () => {
      it('should bulk create snapshot workout day sets', async () => {
        const createdAt = new Date();
        const mockDbRows = [
          {
            id: 1,
            snapshot_workout_day_id: 5,
            original_workout_day_set_id: 10,
            muscle_group_id: 1,
            number_of_sets: 4,
            notes: null,
            created_at: createdAt,
          },
          {
            id: 2,
            snapshot_workout_day_id: 5,
            original_workout_day_set_id: 11,
            muscle_group_id: 2,
            number_of_sets: 3,
            notes: 'Notes',
            created_at: createdAt,
          },
        ];

        db.query.mockResolvedValue({ rows: mockDbRows });

        const sets = [
          {
            snapshotWorkoutDayId: 5,
            originalWorkoutDaySetId: 10,
            muscleGroupId: 1,
            numberOfSets: 4,
            notes: null,
          },
          {
            snapshotWorkoutDayId: 5,
            originalWorkoutDaySetId: 11,
            muscleGroupId: 2,
            numberOfSets: 3,
            notes: 'Notes',
          },
        ];

        const result = await SnapshotWorkoutDaySetModel.bulkCreate(sets);

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe(1);
        expect(result[1].id).toBe(2);
      });

      it('should return empty array when no sets provided', async () => {
        const result = await SnapshotWorkoutDaySetModel.bulkCreate([]);

        expect(db.query).not.toHaveBeenCalled();
        expect(result).toEqual([]);
      });

      it('should handle null input', async () => {
        const result = await SnapshotWorkoutDaySetModel.bulkCreate(null);

        expect(db.query).not.toHaveBeenCalled();
        expect(result).toEqual([]);
      });

      it('should work with transaction client', async () => {
        const mockClient = {
          query: jest.fn().mockResolvedValue({
            rows: [
              {
                id: 1,
                snapshot_workout_day_id: 5,
                original_workout_day_set_id: 10,
                muscle_group_id: 1,
                number_of_sets: 4,
                notes: null,
                created_at: new Date(),
              },
            ],
          }),
        };

        await SnapshotWorkoutDaySetModel.bulkCreate(
          [{ snapshotWorkoutDayId: 5, originalWorkoutDaySetId: 10, muscleGroupId: 1, numberOfSets: 4 }],
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

        const sets = [
          {
            snapshotWorkoutDayId: 5,
            originalWorkoutDaySetId: 10,
            muscleGroupId: 1,
            numberOfSets: 4,
          },
        ];

        await expect(SnapshotWorkoutDaySetModel.bulkCreate(sets)).rejects.toThrow('Database error');
      });
    });
  });

  describe('transformRow', () => {
    it('should transform database row to API response format', () => {
      const dbRow = {
        id: 1,
        snapshot_workout_day_id: 5,
        original_workout_day_set_id: 10,
        muscle_group_id: 1,
        number_of_sets: 4,
        notes: 'Test notes',
        created_at: new Date(),
      };

      const result = SnapshotWorkoutDaySetModel.transformRow(dbRow);

      expect(result).toEqual({
        id: 1,
        snapshotWorkoutDayId: 5,
        originalWorkoutDaySetId: 10,
        muscleGroupId: 1,
        numberOfSets: 4,
        notes: 'Test notes',
        createdAt: dbRow.created_at,
      });
    });

    it('should return null for null input', () => {
      const result = SnapshotWorkoutDaySetModel.transformRow(null);
      expect(result).toBeNull();
    });
  });
});
