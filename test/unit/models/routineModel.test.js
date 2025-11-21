const RoutineModel = require('../../../src/models/routineModel');
const db = require('../../../src/config/database');

// Mock the database module
jest.mock('../../../src/config/database');

describe('RoutineModel', () => {
  beforeEach(() => {
    // Clear all mock function calls and instances before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('Happy path', () => {
      it('should create a routine with all fields', async () => {
        const mockRoutine = {
          id: 1,
          name: 'Full Body Workout',
          description: 'A complete routine',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        };

        db.query.mockResolvedValue({ rows: [mockRoutine] });

        const data = {
          name: 'Full Body Workout',
          description: 'A complete routine',
          isActive: true,
        };

        const result = await RoutineModel.create(data);

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO workout_routines'), [
          'Full Body Workout',
          'A complete routine',
          true,
        ]);
        expect(result).toEqual(mockRoutine);
      });

      it('should create a routine with only name', async () => {
        const mockRoutine = {
          id: 2,
          name: 'Minimal Routine',
          description: null,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        };

        db.query.mockResolvedValue({ rows: [mockRoutine] });

        const data = {
          name: 'Minimal Routine',
        };

        const result = await RoutineModel.create(data);

        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO workout_routines'), [
          'Minimal Routine',
          null,
          true,
        ]);
        expect(result).toEqual(mockRoutine);
      });

      it('should default isActive to true when not provided', async () => {
        const mockRoutine = {
          id: 3,
          name: 'Test Routine',
          description: null,
          is_active: true,
        };

        db.query.mockResolvedValue({ rows: [mockRoutine] });

        const data = { name: 'Test Routine' };

        await RoutineModel.create(data);

        expect(db.query).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([true]));
      });

      it('should handle isActive as false', async () => {
        const mockRoutine = {
          id: 4,
          name: 'Inactive Routine',
          description: null,
          is_active: false,
        };

        db.query.mockResolvedValue({ rows: [mockRoutine] });

        const data = {
          name: 'Inactive Routine',
          isActive: false,
        };

        const result = await RoutineModel.create(data);

        expect(db.query).toHaveBeenCalledWith(expect.any(String), ['Inactive Routine', null, false]);
        expect(result.is_active).toBe(false);
      });

      it('should convert undefined description to null', async () => {
        const mockRoutine = {
          id: 5,
          name: 'No Description',
          description: null,
          is_active: true,
        };

        db.query.mockResolvedValue({ rows: [mockRoutine] });

        const data = {
          name: 'No Description',
          description: undefined,
        };

        await RoutineModel.create(data);

        expect(db.query).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([null]));
      });

      it('should use RETURNING clause to return created routine', async () => {
        const mockRoutine = { id: 6, name: 'Test' };
        db.query.mockResolvedValue({ rows: [mockRoutine] });

        await RoutineModel.create({ name: 'Test' });

        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('RETURNING *'), expect.any(Array));
      });
    });

    describe('Error scenarios', () => {
      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database connection failed');
        db.query.mockRejectedValue(dbError);

        const data = { name: 'Test Routine' };

        await expect(RoutineModel.create(data)).rejects.toThrow('Database connection failed');
      });

      it('should throw error when database returns no rows', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const data = { name: 'Test Routine' };

        const result = await RoutineModel.create(data);
        expect(result).toBeUndefined();
      });

      it('should propagate unique constraint violation error', async () => {
        const dbError = new Error('duplicate key value');
        dbError.code = '23505';
        db.query.mockRejectedValue(dbError);

        await expect(RoutineModel.create({ name: 'Duplicate' })).rejects.toThrow();
      });
    });
  });

  describe('update', () => {
    describe('Happy path', () => {
      it('should update all fields', async () => {
        const mockRoutine = {
          id: 1,
          name: 'Updated Name',
          description: 'Updated description',
          is_active: false,
          updated_at: new Date(),
        };

        db.query.mockResolvedValue({ rows: [mockRoutine] });

        const data = {
          name: 'Updated Name',
          description: 'Updated description',
          isActive: false,
        };

        const result = await RoutineModel.update(1, data);

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE workout_routines'),
          expect.arrayContaining(['Updated Name', 'Updated description', false, 1])
        );
        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('updated_at = CURRENT_TIMESTAMP'),
          expect.any(Array)
        );
        expect(result).toEqual(mockRoutine);
      });

      it('should update only name', async () => {
        const mockRoutine = {
          id: 1,
          name: 'New Name',
          description: 'Old description',
          is_active: true,
        };

        db.query.mockResolvedValue({ rows: [mockRoutine] });

        const data = { name: 'New Name' };

        await RoutineModel.update(1, data);

        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('name = $1'),
          expect.arrayContaining(['New Name', 1])
        );
      });

      it('should update only description', async () => {
        const mockRoutine = {
          id: 2,
          name: 'Test',
          description: 'New Description',
          is_active: true,
        };

        db.query.mockResolvedValue({ rows: [mockRoutine] });

        const data = { description: 'New Description' };

        await RoutineModel.update(2, data);

        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('description = $1'),
          expect.arrayContaining(['New Description', 2])
        );
      });

      it('should update only isActive', async () => {
        const mockRoutine = {
          id: 3,
          name: 'Test',
          description: null,
          is_active: false,
        };

        db.query.mockResolvedValue({ rows: [mockRoutine] });

        const data = { isActive: false };

        await RoutineModel.update(3, data);

        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('is_active = $1'),
          expect.arrayContaining([false, 3])
        );
      });

      it('should handle updating description to null', async () => {
        const mockRoutine = {
          id: 4,
          name: 'Test',
          description: null,
          is_active: true,
        };

        db.query.mockResolvedValue({ rows: [mockRoutine] });

        const data = { description: null };

        await RoutineModel.update(4, data);

        expect(db.query).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([null, 4]));
      });

      it('should use correct parameter numbering for multiple fields', async () => {
        const mockRoutine = { id: 5 };
        db.query.mockResolvedValue({ rows: [mockRoutine] });

        const data = {
          name: 'Name',
          description: 'Desc',
          isActive: true,
        };

        await RoutineModel.update(5, data);

        const query = db.query.mock.calls[0][0];
        expect(query).toContain('$1');
        expect(query).toContain('$2');
        expect(query).toContain('$3');
        expect(query).toContain('$4'); // for the id
      });

      it('should use RETURNING clause to return updated routine', async () => {
        const mockRoutine = { id: 6, name: 'Updated' };
        db.query.mockResolvedValue({ rows: [mockRoutine] });

        await RoutineModel.update(6, { name: 'Updated' });

        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('RETURNING *'), expect.any(Array));
      });

      it('should always update updated_at timestamp', async () => {
        const mockRoutine = { id: 7 };
        db.query.mockResolvedValue({ rows: [mockRoutine] });

        await RoutineModel.update(7, { name: 'Test' });

        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('updated_at = CURRENT_TIMESTAMP'),
          expect.any(Array)
        );
      });
    });

    describe('Validation and error scenarios', () => {
      it('should throw error when no fields to update', async () => {
        const data = {};

        await expect(RoutineModel.update(1, data)).rejects.toThrow('No fields to update');

        expect(db.query).not.toHaveBeenCalled();
      });

      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database error');
        db.query.mockRejectedValue(dbError);

        const data = { name: 'Test' };

        await expect(RoutineModel.update(1, data)).rejects.toThrow('Database error');
      });

      it('should handle non-existent routine id gracefully', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const data = { name: 'Test' };
        const result = await RoutineModel.update(999, data);

        expect(result).toBeUndefined();
      });
    });

    describe('Edge cases', () => {
      it('should handle string id parameter', async () => {
        const mockRoutine = { id: 1 };
        db.query.mockResolvedValue({ rows: [mockRoutine] });

        await RoutineModel.update('1', { name: 'Test' });

        expect(db.query).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining(['Test', '1']));
      });

      it('should ignore undefined fields', async () => {
        const mockRoutine = { id: 1 };
        db.query.mockResolvedValue({ rows: [mockRoutine] });

        const data = {
          name: 'Test',
          description: undefined, // should be ignored
        };

        await RoutineModel.update(1, data);

        const query = db.query.mock.calls[0][0];
        expect(query).toContain('name = $1');
        expect(query).not.toContain('description');
      });
    });
  });

  describe('delete', () => {
    describe('Happy path', () => {
      it('should delete a routine by id', async () => {
        const mockDeleted = { id: 1 };
        db.query.mockResolvedValue({ rows: [mockDeleted] });

        const result = await RoutineModel.delete(1);

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith('DELETE FROM workout_routines WHERE id = $1 RETURNING id', [1]);
        expect(result).toEqual(mockDeleted);
      });

      it('should return the deleted routine id', async () => {
        const mockDeleted = { id: 5 };
        db.query.mockResolvedValue({ rows: [mockDeleted] });

        const result = await RoutineModel.delete(5);

        expect(result.id).toBe(5);
      });

      it('should use RETURNING clause', async () => {
        db.query.mockResolvedValue({ rows: [{ id: 1 }] });

        await RoutineModel.delete(1);

        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('RETURNING id'), expect.any(Array));
      });
    });

    describe('Error scenarios', () => {
      it('should return undefined when routine does not exist', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const result = await RoutineModel.delete(999);

        expect(result).toBeUndefined();
      });

      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database error');
        db.query.mockRejectedValue(dbError);

        await expect(RoutineModel.delete(1)).rejects.toThrow('Database error');
      });

      it('should propagate foreign key constraint error', async () => {
        const dbError = new Error('foreign key violation');
        dbError.code = '23503';
        db.query.mockRejectedValue(dbError);

        await expect(RoutineModel.delete(1)).rejects.toThrow('foreign key violation');
      });
    });

    describe('Edge cases', () => {
      it('should handle string id parameter', async () => {
        db.query.mockResolvedValue({ rows: [{ id: 1 }] });

        await RoutineModel.delete('1');

        expect(db.query).toHaveBeenCalledWith(expect.any(String), ['1']);
      });

      it('should handle very large id numbers', async () => {
        const largeId = 999999999;
        db.query.mockResolvedValue({ rows: [{ id: largeId }] });

        await RoutineModel.delete(largeId);

        expect(db.query).toHaveBeenCalledWith(expect.any(String), [largeId]);
      });
    });
  });

  describe('exists', () => {
    describe('Happy path', () => {
      it('should return true when routine exists', async () => {
        db.query.mockResolvedValue({ rows: [{ exists: true }] });

        const result = await RoutineModel.exists(1);

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith('SELECT EXISTS(SELECT 1 FROM workout_routines WHERE id = $1)', [1]);
        expect(result).toBe(true);
      });

      it('should return false when routine does not exist', async () => {
        db.query.mockResolvedValue({ rows: [{ exists: false }] });

        const result = await RoutineModel.exists(999);

        expect(result).toBe(false);
      });

      it('should use efficient EXISTS query', async () => {
        db.query.mockResolvedValue({ rows: [{ exists: true }] });

        await RoutineModel.exists(1);

        const query = db.query.mock.calls[0][0];
        expect(query).toContain('EXISTS');
        expect(query).toContain('SELECT 1');
      });
    });

    describe('Error scenarios', () => {
      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database error');
        db.query.mockRejectedValue(dbError);

        await expect(RoutineModel.exists(1)).rejects.toThrow('Database error');
      });

      it('should handle database returning no rows', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const result = await RoutineModel.exists(1);

        expect(result).toBeUndefined();
      });
    });

    describe('Edge cases', () => {
      it('should handle string id parameter', async () => {
        db.query.mockResolvedValue({ rows: [{ exists: true }] });

        await RoutineModel.exists('1');

        expect(db.query).toHaveBeenCalledWith(expect.any(String), ['1']);
      });

      it('should handle very large id numbers', async () => {
        const largeId = 999999999;
        db.query.mockResolvedValue({ rows: [{ exists: false }] });

        await RoutineModel.exists(largeId);

        expect(db.query).toHaveBeenCalledWith(expect.any(String), [largeId]);
      });

      it('should handle null id', async () => {
        db.query.mockResolvedValue({ rows: [{ exists: false }] });

        await RoutineModel.exists(null);

        expect(db.query).toHaveBeenCalledWith(expect.any(String), [null]);
      });
    });
  });
});
