const WorkoutDayModel = require('../../../src/models/workoutDayModel');
const db = require('../../../src/config/database');

// Mock the database module
jest.mock('../../../src/config/database');

describe('WorkoutDayModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('Happy path', () => {
      it('should create a workout day with all fields', async () => {
        const mockWorkoutDay = {
          id: 1,
          routine_id: 5,
          day_number: 1,
          day_name: 'Push Day',
          notes: 'Focus on chest',
          created_at: new Date(),
          updated_at: new Date(),
        };

        db.query.mockResolvedValue({ rows: [mockWorkoutDay] });

        const data = {
          routineId: 5,
          dayNumber: 1,
          dayName: 'Push Day',
          notes: 'Focus on chest',
        };

        const result = await WorkoutDayModel.create(data);

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO workout_days'),
          [5, 1, 'Push Day', 'Focus on chest']
        );
        expect(result).toEqual(mockWorkoutDay);
      });

      it('should create a workout day with only required fields', async () => {
        const mockWorkoutDay = {
          id: 2,
          routine_id: 10,
          day_number: 3,
          day_name: 'Leg Day',
          notes: null,
        };

        db.query.mockResolvedValue({ rows: [mockWorkoutDay] });

        const data = {
          routineId: 10,
          dayNumber: 3,
          dayName: 'Leg Day',
        };

        const result = await WorkoutDayModel.create(data);

        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO workout_days'),
          [10, 3, 'Leg Day', null]
        );
        expect(result).toEqual(mockWorkoutDay);
      });

      it('should convert undefined notes to null', async () => {
        const mockWorkoutDay = {
          id: 3,
          routine_id: 1,
          day_number: 2,
          day_name: 'Pull Day',
          notes: null,
        };

        db.query.mockResolvedValue({ rows: [mockWorkoutDay] });

        const data = {
          routineId: 1,
          dayNumber: 2,
          dayName: 'Pull Day',
          notes: undefined,
        };

        await WorkoutDayModel.create(data);

        expect(db.query).toHaveBeenCalledWith(
          expect.any(String),
          expect.arrayContaining([null])
        );
      });

      it('should use RETURNING clause to return created workout day', async () => {
        const mockWorkoutDay = { id: 4 };
        db.query.mockResolvedValue({ rows: [mockWorkoutDay] });

        const data = {
          routineId: 1,
          dayNumber: 1,
          dayName: 'Test',
        };

        await WorkoutDayModel.create(data);

        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('RETURNING *'),
          expect.any(Array)
        );
      });

      it('should handle empty string notes', async () => {
        const mockWorkoutDay = {
          id: 5,
          routine_id: 1,
          day_number: 1,
          day_name: 'Test',
          notes: '',
        };

        db.query.mockResolvedValue({ rows: [mockWorkoutDay] });

        const data = {
          routineId: 1,
          dayNumber: 1,
          dayName: 'Test',
          notes: '',
        };

        await WorkoutDayModel.create(data);

        expect(db.query).toHaveBeenCalledWith(
          expect.any(String),
          [1, 1, 'Test', '']
        );
      });
    });

    describe('Error scenarios', () => {
      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database connection failed');
        db.query.mockRejectedValue(dbError);

        const data = {
          routineId: 1,
          dayNumber: 1,
          dayName: 'Test',
        };

        await expect(WorkoutDayModel.create(data)).rejects.toThrow(
          'Database connection failed'
        );
      });

      it('should propagate unique constraint violation error', async () => {
        const dbError = new Error('duplicate key');
        dbError.code = '23505';
        db.query.mockRejectedValue(dbError);

        const data = {
          routineId: 1,
          dayNumber: 1,
          dayName: 'Duplicate Day',
        };

        await expect(WorkoutDayModel.create(data)).rejects.toMatchObject({
          code: '23505',
        });
      });

      it('should propagate foreign key constraint error', async () => {
        const dbError = new Error('foreign key violation');
        dbError.code = '23503';
        db.query.mockRejectedValue(dbError);

        const data = {
          routineId: 999, // non-existent routine
          dayNumber: 1,
          dayName: 'Test',
        };

        await expect(WorkoutDayModel.create(data)).rejects.toMatchObject({
          code: '23503',
        });
      });

      it('should handle database returning no rows', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const data = {
          routineId: 1,
          dayNumber: 1,
          dayName: 'Test',
        };

        const result = await WorkoutDayModel.create(data);
        expect(result).toBeUndefined();
      });
    });
  });

  describe('update', () => {
    describe('Happy path', () => {
      it('should update all fields', async () => {
        const mockWorkoutDay = {
          id: 1,
          routine_id: 5,
          day_number: 2,
          day_name: 'Updated Day',
          notes: 'Updated notes',
          updated_at: new Date(),
        };

        db.query.mockResolvedValue({ rows: [mockWorkoutDay] });

        const data = {
          dayNumber: 2,
          dayName: 'Updated Day',
          notes: 'Updated notes',
        };

        const result = await WorkoutDayModel.update(1, data);

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE workout_days'),
          expect.arrayContaining([2, 'Updated Day', 'Updated notes', 1])
        );
        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('updated_at = CURRENT_TIMESTAMP'),
          expect.any(Array)
        );
        expect(result).toEqual(mockWorkoutDay);
      });

      it('should update only dayNumber', async () => {
        const mockWorkoutDay = {
          id: 1,
          day_number: 5,
        };

        db.query.mockResolvedValue({ rows: [mockWorkoutDay] });

        const data = { dayNumber: 5 };

        await WorkoutDayModel.update(1, data);

        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('day_number = $1'),
          expect.arrayContaining([5, 1])
        );
      });

      it('should update only dayName', async () => {
        const mockWorkoutDay = {
          id: 2,
          day_name: 'New Name',
        };

        db.query.mockResolvedValue({ rows: [mockWorkoutDay] });

        const data = { dayName: 'New Name' };

        await WorkoutDayModel.update(2, data);

        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('day_name = $1'),
          expect.arrayContaining(['New Name', 2])
        );
      });

      it('should update only notes', async () => {
        const mockWorkoutDay = {
          id: 3,
          notes: 'New notes',
        };

        db.query.mockResolvedValue({ rows: [mockWorkoutDay] });

        const data = { notes: 'New notes' };

        await WorkoutDayModel.update(3, data);

        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('notes = $1'),
          expect.arrayContaining(['New notes', 3])
        );
      });

      it('should handle updating notes to null', async () => {
        const mockWorkoutDay = {
          id: 4,
          notes: null,
        };

        db.query.mockResolvedValue({ rows: [mockWorkoutDay] });

        const data = { notes: null };

        await WorkoutDayModel.update(4, data);

        expect(db.query).toHaveBeenCalledWith(
          expect.any(String),
          expect.arrayContaining([null, 4])
        );
      });

      it('should use correct parameter numbering for multiple fields', async () => {
        const mockWorkoutDay = { id: 5 };
        db.query.mockResolvedValue({ rows: [mockWorkoutDay] });

        const data = {
          dayNumber: 3,
          dayName: 'Test',
          notes: 'Notes',
        };

        await WorkoutDayModel.update(5, data);

        const query = db.query.mock.calls[0][0];
        expect(query).toContain('$1');
        expect(query).toContain('$2');
        expect(query).toContain('$3');
        expect(query).toContain('$4'); // for the id
      });

      it('should use RETURNING clause', async () => {
        const mockWorkoutDay = { id: 6 };
        db.query.mockResolvedValue({ rows: [mockWorkoutDay] });

        await WorkoutDayModel.update(6, { dayName: 'Test' });

        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('RETURNING *'),
          expect.any(Array)
        );
      });

      it('should always update updated_at timestamp', async () => {
        const mockWorkoutDay = { id: 7 };
        db.query.mockResolvedValue({ rows: [mockWorkoutDay] });

        await WorkoutDayModel.update(7, { dayName: 'Test' });

        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('updated_at = CURRENT_TIMESTAMP'),
          expect.any(Array)
        );
      });
    });

    describe('Validation and error scenarios', () => {
      it('should throw error when no fields to update', async () => {
        const data = {};

        await expect(WorkoutDayModel.update(1, data)).rejects.toThrow(
          'No fields to update'
        );

        expect(db.query).not.toHaveBeenCalled();
      });

      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database error');
        db.query.mockRejectedValue(dbError);

        const data = { dayName: 'Test' };

        await expect(WorkoutDayModel.update(1, data)).rejects.toThrow(
          'Database error'
        );
      });

      it('should handle non-existent workout day id', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const data = { dayName: 'Test' };
        const result = await WorkoutDayModel.update(999, data);

        expect(result).toBeUndefined();
      });
    });

    describe('Edge cases', () => {
      it('should handle string id parameter', async () => {
        const mockWorkoutDay = { id: 1 };
        db.query.mockResolvedValue({ rows: [mockWorkoutDay] });

        await WorkoutDayModel.update('1', { dayName: 'Test' });

        expect(db.query).toHaveBeenCalledWith(
          expect.any(String),
          expect.arrayContaining(['Test', '1'])
        );
      });

      it('should ignore undefined fields', async () => {
        const mockWorkoutDay = { id: 1 };
        db.query.mockResolvedValue({ rows: [mockWorkoutDay] });

        const data = {
          dayName: 'Test',
          notes: undefined, // should be ignored
        };

        await WorkoutDayModel.update(1, data);

        const query = db.query.mock.calls[0][0];
        expect(query).toContain('day_name = $1');
        expect(query).not.toContain('notes');
      });

      it('should handle dayNumber of 1', async () => {
        const mockWorkoutDay = { id: 1, day_number: 1 };
        db.query.mockResolvedValue({ rows: [mockWorkoutDay] });

        await WorkoutDayModel.update(1, { dayNumber: 1 });

        expect(db.query).toHaveBeenCalledWith(
          expect.any(String),
          expect.arrayContaining([1, 1])
        );
      });
    });
  });

  describe('delete', () => {
    describe('Happy path', () => {
      it('should delete a workout day by id', async () => {
        const mockDeleted = { id: 1 };
        db.query.mockResolvedValue({ rows: [mockDeleted] });

        const result = await WorkoutDayModel.delete(1);

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(
          'DELETE FROM workout_days WHERE id = $1 RETURNING id',
          [1]
        );
        expect(result).toEqual(mockDeleted);
      });

      it('should return the deleted workout day id', async () => {
        const mockDeleted = { id: 5 };
        db.query.mockResolvedValue({ rows: [mockDeleted] });

        const result = await WorkoutDayModel.delete(5);

        expect(result.id).toBe(5);
      });

      it('should use RETURNING clause', async () => {
        db.query.mockResolvedValue({ rows: [{ id: 1 }] });

        await WorkoutDayModel.delete(1);

        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('RETURNING id'),
          expect.any(Array)
        );
      });
    });

    describe('Error scenarios', () => {
      it('should return undefined when workout day does not exist', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const result = await WorkoutDayModel.delete(999);

        expect(result).toBeUndefined();
      });

      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database error');
        db.query.mockRejectedValue(dbError);

        await expect(WorkoutDayModel.delete(1)).rejects.toThrow(
          'Database error'
        );
      });

      it('should propagate foreign key constraint error when workout day has dependent records', async () => {
        const dbError = new Error('foreign key violation');
        dbError.code = '23503';
        db.query.mockRejectedValue(dbError);

        await expect(WorkoutDayModel.delete(1)).rejects.toMatchObject({
          code: '23503',
        });
      });
    });

    describe('Edge cases', () => {
      it('should handle string id parameter', async () => {
        db.query.mockResolvedValue({ rows: [{ id: 1 }] });

        await WorkoutDayModel.delete('1');

        expect(db.query).toHaveBeenCalledWith(expect.any(String), ['1']);
      });

      it('should handle very large id numbers', async () => {
        const largeId = 999999999;
        db.query.mockResolvedValue({ rows: [{ id: largeId }] });

        await WorkoutDayModel.delete(largeId);

        expect(db.query).toHaveBeenCalledWith(expect.any(String), [largeId]);
      });
    });
  });

  describe('exists', () => {
    describe('Happy path', () => {
      it('should return true when workout day exists', async () => {
        db.query.mockResolvedValue({ rows: [{ exists: true }] });

        const result = await WorkoutDayModel.exists(1);

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(
          'SELECT EXISTS(SELECT 1 FROM workout_days WHERE id = $1)',
          [1]
        );
        expect(result).toBe(true);
      });

      it('should return false when workout day does not exist', async () => {
        db.query.mockResolvedValue({ rows: [{ exists: false }] });

        const result = await WorkoutDayModel.exists(999);

        expect(result).toBe(false);
      });

      it('should use efficient EXISTS query', async () => {
        db.query.mockResolvedValue({ rows: [{ exists: true }] });

        await WorkoutDayModel.exists(1);

        const query = db.query.mock.calls[0][0];
        expect(query).toContain('EXISTS');
        expect(query).toContain('SELECT 1');
      });
    });

    describe('Error scenarios', () => {
      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database error');
        db.query.mockRejectedValue(dbError);

        await expect(WorkoutDayModel.exists(1)).rejects.toThrow(
          'Database error'
        );
      });

      it('should handle database returning no rows', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const result = await WorkoutDayModel.exists(1);

        expect(result).toBeUndefined();
      });
    });

    describe('Edge cases', () => {
      it('should handle string id parameter', async () => {
        db.query.mockResolvedValue({ rows: [{ exists: true }] });

        await WorkoutDayModel.exists('1');

        expect(db.query).toHaveBeenCalledWith(expect.any(String), ['1']);
      });

      it('should handle very large id numbers', async () => {
        const largeId = 999999999;
        db.query.mockResolvedValue({ rows: [{ exists: false }] });

        await WorkoutDayModel.exists(largeId);

        expect(db.query).toHaveBeenCalledWith(expect.any(String), [largeId]);
      });

      it('should handle null id', async () => {
        db.query.mockResolvedValue({ rows: [{ exists: false }] });

        await WorkoutDayModel.exists(null);

        expect(db.query).toHaveBeenCalledWith(expect.any(String), [null]);
      });
    });
  });
});
