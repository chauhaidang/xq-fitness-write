const WorkoutDaySetModel = require('../../../src/models/workoutDaySetModel');
const db = require('../../../src/config/database');

// Mock the database module
jest.mock('../../../src/config/database');

describe('WorkoutDaySetModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('Happy path', () => {
      it('should create a workout day set with all fields', async () => {
        const mockWorkoutDaySet = {
          id: 1,
          workout_day_id: 5,
          muscle_group_id: 3,
          number_of_sets: 4,
          notes: 'Heavy weight',
          created_at: new Date(),
          updated_at: new Date(),
        };

        db.query.mockResolvedValue({ rows: [mockWorkoutDaySet] });

        const data = {
          workoutDayId: 5,
          muscleGroupId: 3,
          numberOfSets: 4,
          notes: 'Heavy weight',
        };

        const result = await WorkoutDaySetModel.create(data);

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO workout_day_sets'),
          [5, 3, 4, 'Heavy weight']
        );
        expect(result).toEqual(mockWorkoutDaySet);
      });

      it('should create a workout day set with only required fields', async () => {
        const mockWorkoutDaySet = {
          id: 2,
          workout_day_id: 10,
          muscle_group_id: 7,
          number_of_sets: 3,
          notes: null,
        };

        db.query.mockResolvedValue({ rows: [mockWorkoutDaySet] });

        const data = {
          workoutDayId: 10,
          muscleGroupId: 7,
          numberOfSets: 3,
        };

        const result = await WorkoutDaySetModel.create(data);

        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO workout_day_sets'),
          [10, 7, 3, null]
        );
        expect(result).toEqual(mockWorkoutDaySet);
      });

      it('should convert undefined notes to null', async () => {
        const mockWorkoutDaySet = {
          id: 3,
          workout_day_id: 1,
          muscle_group_id: 2,
          number_of_sets: 5,
          notes: null,
        };

        db.query.mockResolvedValue({ rows: [mockWorkoutDaySet] });

        const data = {
          workoutDayId: 1,
          muscleGroupId: 2,
          numberOfSets: 5,
          notes: undefined,
        };

        await WorkoutDaySetModel.create(data);

        expect(db.query).toHaveBeenCalledWith(
          expect.any(String),
          expect.arrayContaining([null])
        );
      });

      it('should use RETURNING clause to return created workout day set', async () => {
        const mockWorkoutDaySet = { id: 4 };
        db.query.mockResolvedValue({ rows: [mockWorkoutDaySet] });

        const data = {
          workoutDayId: 1,
          muscleGroupId: 2,
          numberOfSets: 3,
        };

        await WorkoutDaySetModel.create(data);

        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('RETURNING *'),
          expect.any(Array)
        );
      });

      it('should handle empty string notes', async () => {
        const mockWorkoutDaySet = {
          id: 5,
          workout_day_id: 1,
          muscle_group_id: 2,
          number_of_sets: 3,
          notes: '',
        };

        db.query.mockResolvedValue({ rows: [mockWorkoutDaySet] });

        const data = {
          workoutDayId: 1,
          muscleGroupId: 2,
          numberOfSets: 3,
          notes: '',
        };

        await WorkoutDaySetModel.create(data);

        expect(db.query).toHaveBeenCalledWith(
          expect.any(String),
          [1, 2, 3, '']
        );
      });

      it('should handle numberOfSets equal to 1', async () => {
        const mockWorkoutDaySet = {
          id: 6,
          workout_day_id: 1,
          muscle_group_id: 2,
          number_of_sets: 1,
          notes: null,
        };

        db.query.mockResolvedValue({ rows: [mockWorkoutDaySet] });

        const data = {
          workoutDayId: 1,
          muscleGroupId: 2,
          numberOfSets: 1,
        };

        await WorkoutDaySetModel.create(data);

        expect(db.query).toHaveBeenCalledWith(
          expect.any(String),
          [1, 2, 1, null]
        );
      });
    });

    describe('Error scenarios', () => {
      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database connection failed');
        db.query.mockRejectedValue(dbError);

        const data = {
          workoutDayId: 1,
          muscleGroupId: 2,
          numberOfSets: 3,
        };

        await expect(WorkoutDaySetModel.create(data)).rejects.toThrow(
          'Database connection failed'
        );
      });

      it('should propagate unique constraint violation error', async () => {
        const dbError = new Error('duplicate key');
        dbError.code = '23505';
        db.query.mockRejectedValue(dbError);

        const data = {
          workoutDayId: 1,
          muscleGroupId: 2,
          numberOfSets: 3,
        };

        await expect(WorkoutDaySetModel.create(data)).rejects.toMatchObject({
          code: '23505',
        });
      });

      it('should propagate foreign key constraint error for workout_day_id', async () => {
        const dbError = new Error('foreign key violation');
        dbError.code = '23503';
        db.query.mockRejectedValue(dbError);

        const data = {
          workoutDayId: 999, // non-existent workout day
          muscleGroupId: 2,
          numberOfSets: 3,
        };

        await expect(WorkoutDaySetModel.create(data)).rejects.toMatchObject({
          code: '23503',
        });
      });

      it('should propagate foreign key constraint error for muscle_group_id', async () => {
        const dbError = new Error('foreign key violation');
        dbError.code = '23503';
        db.query.mockRejectedValue(dbError);

        const data = {
          workoutDayId: 1,
          muscleGroupId: 999, // non-existent muscle group
          numberOfSets: 3,
        };

        await expect(WorkoutDaySetModel.create(data)).rejects.toMatchObject({
          code: '23503',
        });
      });

      it('should handle database returning no rows', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const data = {
          workoutDayId: 1,
          muscleGroupId: 2,
          numberOfSets: 3,
        };

        const result = await WorkoutDaySetModel.create(data);
        expect(result).toBeUndefined();
      });
    });
  });

  describe('update', () => {
    describe('Happy path', () => {
      it('should update all fields', async () => {
        const mockWorkoutDaySet = {
          id: 1,
          workout_day_id: 5,
          muscle_group_id: 3,
          number_of_sets: 5,
          notes: 'Increased volume',
          updated_at: new Date(),
        };

        db.query.mockResolvedValue({ rows: [mockWorkoutDaySet] });

        const data = {
          numberOfSets: 5,
          notes: 'Increased volume',
        };

        const result = await WorkoutDaySetModel.update(1, data);

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE workout_day_sets'),
          expect.arrayContaining([5, 'Increased volume', 1])
        );
        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('updated_at = CURRENT_TIMESTAMP'),
          expect.any(Array)
        );
        expect(result).toEqual(mockWorkoutDaySet);
      });

      it('should update only numberOfSets', async () => {
        const mockWorkoutDaySet = {
          id: 1,
          number_of_sets: 6,
        };

        db.query.mockResolvedValue({ rows: [mockWorkoutDaySet] });

        const data = { numberOfSets: 6 };

        await WorkoutDaySetModel.update(1, data);

        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('number_of_sets = $1'),
          expect.arrayContaining([6, 1])
        );
      });

      it('should update only notes', async () => {
        const mockWorkoutDaySet = {
          id: 2,
          notes: 'New notes',
        };

        db.query.mockResolvedValue({ rows: [mockWorkoutDaySet] });

        const data = { notes: 'New notes' };

        await WorkoutDaySetModel.update(2, data);

        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('notes = $1'),
          expect.arrayContaining(['New notes', 2])
        );
      });

      it('should handle updating notes to null', async () => {
        const mockWorkoutDaySet = {
          id: 3,
          notes: null,
        };

        db.query.mockResolvedValue({ rows: [mockWorkoutDaySet] });

        const data = { notes: null };

        await WorkoutDaySetModel.update(3, data);

        expect(db.query).toHaveBeenCalledWith(
          expect.any(String),
          expect.arrayContaining([null, 3])
        );
      });

      it('should use correct parameter numbering for multiple fields', async () => {
        const mockWorkoutDaySet = { id: 4 };
        db.query.mockResolvedValue({ rows: [mockWorkoutDaySet] });

        const data = {
          numberOfSets: 4,
          notes: 'Notes',
        };

        await WorkoutDaySetModel.update(4, data);

        const query = db.query.mock.calls[0][0];
        expect(query).toContain('$1');
        expect(query).toContain('$2');
        expect(query).toContain('$3'); // for the id
      });

      it('should use RETURNING clause', async () => {
        const mockWorkoutDaySet = { id: 5 };
        db.query.mockResolvedValue({ rows: [mockWorkoutDaySet] });

        await WorkoutDaySetModel.update(5, { numberOfSets: 3 });

        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('RETURNING *'),
          expect.any(Array)
        );
      });

      it('should always update updated_at timestamp', async () => {
        const mockWorkoutDaySet = { id: 6 };
        db.query.mockResolvedValue({ rows: [mockWorkoutDaySet] });

        await WorkoutDaySetModel.update(6, { numberOfSets: 3 });

        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('updated_at = CURRENT_TIMESTAMP'),
          expect.any(Array)
        );
      });

      it('should handle updating numberOfSets to 1', async () => {
        const mockWorkoutDaySet = { id: 7, number_of_sets: 1 };
        db.query.mockResolvedValue({ rows: [mockWorkoutDaySet] });

        await WorkoutDaySetModel.update(7, { numberOfSets: 1 });

        expect(db.query).toHaveBeenCalledWith(
          expect.any(String),
          expect.arrayContaining([1, 7])
        );
      });
    });

    describe('Validation and error scenarios', () => {
      it('should throw error when no fields to update', async () => {
        const data = {};

        await expect(WorkoutDaySetModel.update(1, data)).rejects.toThrow(
          'No fields to update'
        );

        expect(db.query).not.toHaveBeenCalled();
      });

      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database error');
        db.query.mockRejectedValue(dbError);

        const data = { numberOfSets: 5 };

        await expect(WorkoutDaySetModel.update(1, data)).rejects.toThrow(
          'Database error'
        );
      });

      it('should handle non-existent workout day set id', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const data = { numberOfSets: 5 };
        const result = await WorkoutDaySetModel.update(999, data);

        expect(result).toBeUndefined();
      });
    });

    describe('Edge cases', () => {
      it('should handle string id parameter', async () => {
        const mockWorkoutDaySet = { id: 1 };
        db.query.mockResolvedValue({ rows: [mockWorkoutDaySet] });

        await WorkoutDaySetModel.update('1', { numberOfSets: 3 });

        expect(db.query).toHaveBeenCalledWith(
          expect.any(String),
          expect.arrayContaining([3, '1'])
        );
      });

      it('should ignore undefined fields', async () => {
        const mockWorkoutDaySet = { id: 1 };
        db.query.mockResolvedValue({ rows: [mockWorkoutDaySet] });

        const data = {
          numberOfSets: 5,
          notes: undefined, // should be ignored
        };

        await WorkoutDaySetModel.update(1, data);

        const query = db.query.mock.calls[0][0];
        expect(query).toContain('number_of_sets = $1');
        expect(query).not.toContain('notes');
      });

      it('should handle very large numberOfSets', async () => {
        const mockWorkoutDaySet = { id: 1, number_of_sets: 100 };
        db.query.mockResolvedValue({ rows: [mockWorkoutDaySet] });

        await WorkoutDaySetModel.update(1, { numberOfSets: 100 });

        expect(db.query).toHaveBeenCalledWith(
          expect.any(String),
          expect.arrayContaining([100, 1])
        );
      });
    });
  });

  describe('delete', () => {
    describe('Happy path', () => {
      it('should delete a workout day set by id', async () => {
        const mockDeleted = { id: 1 };
        db.query.mockResolvedValue({ rows: [mockDeleted] });

        const result = await WorkoutDaySetModel.delete(1);

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(
          'DELETE FROM workout_day_sets WHERE id = $1 RETURNING id',
          [1]
        );
        expect(result).toEqual(mockDeleted);
      });

      it('should return the deleted workout day set id', async () => {
        const mockDeleted = { id: 5 };
        db.query.mockResolvedValue({ rows: [mockDeleted] });

        const result = await WorkoutDaySetModel.delete(5);

        expect(result.id).toBe(5);
      });

      it('should use RETURNING clause', async () => {
        db.query.mockResolvedValue({ rows: [{ id: 1 }] });

        await WorkoutDaySetModel.delete(1);

        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('RETURNING id'),
          expect.any(Array)
        );
      });
    });

    describe('Error scenarios', () => {
      it('should return undefined when workout day set does not exist', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const result = await WorkoutDaySetModel.delete(999);

        expect(result).toBeUndefined();
      });

      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database error');
        db.query.mockRejectedValue(dbError);

        await expect(WorkoutDaySetModel.delete(1)).rejects.toThrow(
          'Database error'
        );
      });

      it('should propagate foreign key constraint error if applicable', async () => {
        const dbError = new Error('foreign key violation');
        dbError.code = '23503';
        db.query.mockRejectedValue(dbError);

        await expect(WorkoutDaySetModel.delete(1)).rejects.toMatchObject({
          code: '23503',
        });
      });
    });

    describe('Edge cases', () => {
      it('should handle string id parameter', async () => {
        db.query.mockResolvedValue({ rows: [{ id: 1 }] });

        await WorkoutDaySetModel.delete('1');

        expect(db.query).toHaveBeenCalledWith(expect.any(String), ['1']);
      });

      it('should handle very large id numbers', async () => {
        const largeId = 999999999;
        db.query.mockResolvedValue({ rows: [{ id: largeId }] });

        await WorkoutDaySetModel.delete(largeId);

        expect(db.query).toHaveBeenCalledWith(expect.any(String), [largeId]);
      });
    });
  });

  describe('exists', () => {
    describe('Happy path', () => {
      it('should return true when workout day set exists', async () => {
        db.query.mockResolvedValue({ rows: [{ exists: true }] });

        const result = await WorkoutDaySetModel.exists(1);

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(
          'SELECT EXISTS(SELECT 1 FROM workout_day_sets WHERE id = $1)',
          [1]
        );
        expect(result).toBe(true);
      });

      it('should return false when workout day set does not exist', async () => {
        db.query.mockResolvedValue({ rows: [{ exists: false }] });

        const result = await WorkoutDaySetModel.exists(999);

        expect(result).toBe(false);
      });

      it('should use efficient EXISTS query', async () => {
        db.query.mockResolvedValue({ rows: [{ exists: true }] });

        await WorkoutDaySetModel.exists(1);

        const query = db.query.mock.calls[0][0];
        expect(query).toContain('EXISTS');
        expect(query).toContain('SELECT 1');
      });
    });

    describe('Error scenarios', () => {
      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database error');
        db.query.mockRejectedValue(dbError);

        await expect(WorkoutDaySetModel.exists(1)).rejects.toThrow(
          'Database error'
        );
      });

      it('should handle database returning no rows', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const result = await WorkoutDaySetModel.exists(1);

        expect(result).toBeUndefined();
      });
    });

    describe('Edge cases', () => {
      it('should handle string id parameter', async () => {
        db.query.mockResolvedValue({ rows: [{ exists: true }] });

        await WorkoutDaySetModel.exists('1');

        expect(db.query).toHaveBeenCalledWith(expect.any(String), ['1']);
      });

      it('should handle very large id numbers', async () => {
        const largeId = 999999999;
        db.query.mockResolvedValue({ rows: [{ exists: false }] });

        await WorkoutDaySetModel.exists(largeId);

        expect(db.query).toHaveBeenCalledWith(expect.any(String), [largeId]);
      });

      it('should handle null id', async () => {
        db.query.mockResolvedValue({ rows: [{ exists: false }] });

        await WorkoutDaySetModel.exists(null);

        expect(db.query).toHaveBeenCalledWith(expect.any(String), [null]);
      });
    });
  });
});
