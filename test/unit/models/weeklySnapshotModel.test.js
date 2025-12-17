const WeeklySnapshotModel = require('../../../src/models/weeklySnapshotModel');
const db = require('../../../src/config/database');

// Mock the database module
jest.mock('../../../src/config/database');

describe('WeeklySnapshotModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('Happy path', () => {
      it('should create a weekly snapshot', async () => {
        const createdAt = new Date();
        const mockDbRow = {
          id: 1,
          routine_id: 10,
          week_start_date: '2024-12-02',
          created_at: createdAt,
          updated_at: createdAt,
        };

        db.query.mockResolvedValue({ rows: [mockDbRow] });

        const data = {
          routineId: 10,
          weekStartDate: '2024-12-02',
        };

        const result = await WeeklySnapshotModel.create(data);

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO weekly_snapshots'),
          [10, '2024-12-02']
        );
        expect(result).toEqual({
          id: 1,
          routineId: 10,
          weekStartDate: '2024-12-02',
          createdAt: createdAt,
          updatedAt: createdAt,
        });
      });

      it('should use RETURNING clause to return created snapshot', async () => {
        const mockSnapshot = { id: 1, routine_id: 10, week_start_date: '2024-12-02' };
        db.query.mockResolvedValue({ rows: [mockSnapshot] });

        await WeeklySnapshotModel.create({ routineId: 10, weekStartDate: '2024-12-02' });

        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('RETURNING *'), expect.any(Array));
      });

      it('should work with transaction client', async () => {
        const mockClient = {
          query: jest.fn().mockResolvedValue({ rows: [{ id: 1, routine_id: 10, week_start_date: '2024-12-02' }] }),
        };

        await WeeklySnapshotModel.create({ routineId: 10, weekStartDate: '2024-12-02' }, mockClient);

        expect(mockClient.query).toHaveBeenCalled();
        expect(db.query).not.toHaveBeenCalled();
      });
    });

    describe('Error scenarios', () => {
      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database connection failed');
        db.query.mockRejectedValue(dbError);

        const data = { routineId: 10, weekStartDate: '2024-12-02' };

        await expect(WeeklySnapshotModel.create(data)).rejects.toThrow('Database connection failed');
      });

      it('should return null when database returns no rows', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const data = { routineId: 10, weekStartDate: '2024-12-02' };

        const result = await WeeklySnapshotModel.create(data);
        expect(result).toBeNull();
      });

      it('should propagate unique constraint violation error', async () => {
        const dbError = new Error('duplicate key value');
        dbError.code = '23505';
        db.query.mockRejectedValue(dbError);

        await expect(WeeklySnapshotModel.create({ routineId: 10, weekStartDate: '2024-12-02' })).rejects.toThrow();
      });
    });
  });

  describe('findByRoutineAndWeek', () => {
    describe('Happy path', () => {
      it('should find snapshot by routine and week', async () => {
        const createdAt = new Date();
        const mockDbRow = {
          id: 1,
          routine_id: 10,
          week_start_date: '2024-12-02',
          created_at: createdAt,
          updated_at: createdAt,
        };

        db.query.mockResolvedValue({ rows: [mockDbRow] });

        const result = await WeeklySnapshotModel.findByRoutineAndWeek(10, '2024-12-02');

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM weekly_snapshots'),
          [10, '2024-12-02']
        );
        expect(result).toEqual({
          id: 1,
          routineId: 10,
          weekStartDate: '2024-12-02',
          createdAt: createdAt,
          updatedAt: createdAt,
        });
      });

      it('should return null when snapshot does not exist', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const result = await WeeklySnapshotModel.findByRoutineAndWeek(10, '2024-12-02');

        expect(result).toBeNull();
      });

      it('should work with transaction client', async () => {
        const mockClient = {
          query: jest.fn().mockResolvedValue({ rows: [] }),
        };

        const result = await WeeklySnapshotModel.findByRoutineAndWeek(10, '2024-12-02', mockClient);

        expect(mockClient.query).toHaveBeenCalled();
        expect(db.query).not.toHaveBeenCalled();
        expect(result).toBeNull();
      });
    });

    describe('Error scenarios', () => {
      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database error');
        db.query.mockRejectedValue(dbError);

        await expect(WeeklySnapshotModel.findByRoutineAndWeek(10, '2024-12-02')).rejects.toThrow('Database error');
      });
    });
  });

  describe('deleteByRoutineAndWeek', () => {
    describe('Happy path', () => {
      it('should delete snapshot by routine and week', async () => {
        db.query.mockResolvedValue({ rows: [{ id: 1 }] });

        const result = await WeeklySnapshotModel.deleteByRoutineAndWeek(10, '2024-12-02');

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('DELETE FROM weekly_snapshots'),
          [10, '2024-12-02']
        );
        expect(result).toBe(1);
      });

      it('should return null when snapshot does not exist', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const result = await WeeklySnapshotModel.deleteByRoutineAndWeek(10, '2024-12-02');

        expect(result).toBeNull();
      });

      it('should use RETURNING clause', async () => {
        db.query.mockResolvedValue({ rows: [{ id: 1 }] });

        await WeeklySnapshotModel.deleteByRoutineAndWeek(10, '2024-12-02');

        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('RETURNING id'), expect.any(Array));
      });

      it('should work with transaction client', async () => {
        const mockClient = {
          query: jest.fn().mockResolvedValue({ rows: [{ id: 1 }] }),
        };

        const result = await WeeklySnapshotModel.deleteByRoutineAndWeek(10, '2024-12-02', mockClient);

        expect(mockClient.query).toHaveBeenCalled();
        expect(db.query).not.toHaveBeenCalled();
        expect(result).toBe(1);
      });
    });

    describe('Error scenarios', () => {
      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database error');
        db.query.mockRejectedValue(dbError);

        await expect(WeeklySnapshotModel.deleteByRoutineAndWeek(10, '2024-12-02')).rejects.toThrow('Database error');
      });
    });
  });

  describe('transformRow', () => {
    it('should transform database row to API response format', () => {
      const dbRow = {
        id: 1,
        routine_id: 10,
        week_start_date: '2024-12-02',
        created_at: new Date('2024-12-02'),
        updated_at: new Date('2024-12-02'),
      };

      const result = WeeklySnapshotModel.transformRow(dbRow);

      expect(result).toEqual({
        id: 1,
        routineId: 10,
        weekStartDate: '2024-12-02',
        createdAt: dbRow.created_at,
        updatedAt: dbRow.updated_at,
      });
    });

    it('should return null for null input', () => {
      const result = WeeklySnapshotModel.transformRow(null);
      expect(result).toBeNull();
    });
  });
});
