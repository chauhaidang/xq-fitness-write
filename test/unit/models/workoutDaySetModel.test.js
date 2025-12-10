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
        const createdAt = new Date();
        const updatedAt = new Date();
        const mockDbRow = {
          id: 1,
          workout_day_id: 5,
          muscle_group_id: 3,
          number_of_sets: 4,
          notes: 'Heavy weight',
          created_at: createdAt,
          updated_at: updatedAt,
        };

        db.query.mockResolvedValue({ rows: [mockDbRow] });

        const data = {
          workoutDayId: 5,
          muscleGroupId: 3,
          numberOfSets: 4,
          notes: 'Heavy weight',
        };

        const result = await WorkoutDaySetModel.create(data);

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO workout_day_sets'), [
          5,
          3,
          4,
          'Heavy weight',
        ]);
        expect(result).toEqual({
          id: 1,
          workoutDayId: 5,
          muscleGroupId: 3,
          numberOfSets: 4,
          notes: 'Heavy weight',
          createdAt: createdAt,
          updatedAt: updatedAt,
        });
      });

      it('should create a workout day set with only required fields', async () => {
        const mockDbRow = {
          id: 2,
          workout_day_id: 10,
          muscle_group_id: 7,
          number_of_sets: 3,
          notes: null,
        };

        db.query.mockResolvedValue({ rows: [mockDbRow] });

        const data = {
          workoutDayId: 10,
          muscleGroupId: 7,
          numberOfSets: 3,
        };

        const result = await WorkoutDaySetModel.create(data);

        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO workout_day_sets'), [
          10,
          7,
          3,
          null,
        ]);
        expect(result).toEqual({
          id: 2,
          workoutDayId: 10,
          muscleGroupId: 7,
          numberOfSets: 3,
          notes: null,
        });
      });

      it('should convert undefined notes to null', async () => {
        const mockWorkoutDaySet = {
          id: 3,
          workoutDayId: 1,
          muscleGroupId: 2,
          numberOfSets: 5,
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

        expect(db.query).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([null]));
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

        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('RETURNING *'), expect.any(Array));
      });

      it('should convert empty string notes to null', async () => {
        const mockDbRow = {
          id: 5,
          workout_day_id: 1,
          muscle_group_id: 2,
          number_of_sets: 3,
          notes: null,
        };

        db.query.mockResolvedValue({ rows: [mockDbRow] });

        const data = {
          workoutDayId: 1,
          muscleGroupId: 2,
          numberOfSets: 3,
          notes: '',
        };

        await WorkoutDaySetModel.create(data);

        expect(db.query).toHaveBeenCalledWith(expect.any(String), [1, 2, 3, null]);
      });

      it('should handle numberOfSets equal to 1', async () => {
        const mockWorkoutDaySet = {
          id: 6,
          workoutDayId: 1,
          muscleGroupId: 2,
          numberOfSets: 1,
          notes: null,
        };

        db.query.mockResolvedValue({ rows: [mockWorkoutDaySet] });

        const data = {
          workoutDayId: 1,
          muscleGroupId: 2,
          numberOfSets: 1,
        };

        await WorkoutDaySetModel.create(data);

        expect(db.query).toHaveBeenCalledWith(expect.any(String), [1, 2, 1, null]);
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

        await expect(WorkoutDaySetModel.create(data)).rejects.toThrow('Database connection failed');
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

      it('should propagate foreign key constraint error for workoutDayId', async () => {
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

      it('should propagate foreign key constraint error for muscleGroupId', async () => {
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

      it('should return null when database returns no rows', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const data = {
          workoutDayId: 1,
          muscleGroupId: 2,
          numberOfSets: 3,
        };

        const result = await WorkoutDaySetModel.create(data);
        expect(result).toBeNull();
      });
    });
  });

  describe('update', () => {
    describe('Happy path', () => {
      it('should update all fields', async () => {
        const createdAt = new Date();
        const updatedAt = new Date();
        const mockDbRow = {
          id: 1,
          workout_day_id: 5,
          muscle_group_id: 3,
          number_of_sets: 5,
          notes: 'Increased volume',
          created_at: createdAt,
          updated_at: updatedAt,
        };

        db.query.mockResolvedValue({ rows: [mockDbRow] });

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
        expect(result).toEqual({
          id: 1,
          workoutDayId: 5,
          muscleGroupId: 3,
          numberOfSets: 5,
          notes: 'Increased volume',
          createdAt: createdAt,
          updatedAt: updatedAt,
        });
      });

      it('should update only numberOfSets', async () => {
        const mockDbRow = {
          id: 1,
          workout_day_id: 5,
          muscle_group_id: 3,
          number_of_sets: 6,
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        };

        db.query.mockResolvedValue({ rows: [mockDbRow] });

        const data = { numberOfSets: 6 };

        const result = await WorkoutDaySetModel.update(1, data);

        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('number_of_sets = $1'),
          expect.arrayContaining([6, 1])
        );
        expect(result.numberOfSets).toBe(6);
        expect(result.workoutDayId).toBe(5);
        expect(result.muscleGroupId).toBe(3);
      });

      it('should update only notes', async () => {
        const mockDbRow = {
          id: 2,
          workout_day_id: 5,
          muscle_group_id: 3,
          number_of_sets: 4,
          notes: 'New notes',
          created_at: new Date(),
          updated_at: new Date(),
        };

        db.query.mockResolvedValue({ rows: [mockDbRow] });

        const data = { notes: 'New notes' };

        const result = await WorkoutDaySetModel.update(2, data);

        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('notes = $1'),
          expect.arrayContaining(['New notes', 2])
        );
        expect(result.notes).toBe('New notes');
      });

      it('should handle updating notes to null', async () => {
        const mockDbRow = {
          id: 3,
          workout_day_id: 5,
          muscle_group_id: 3,
          number_of_sets: 4,
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        };

        db.query.mockResolvedValue({ rows: [mockDbRow] });

        const data = { notes: null };

        const result = await WorkoutDaySetModel.update(3, data);

        expect(db.query).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([null, 3]));
        expect(result.notes).toBeNull();
      });

      it('should use correct parameter numbering for multiple fields', async () => {
        const mockDbRow = {
          id: 4,
          workout_day_id: 5,
          muscle_group_id: 3,
          number_of_sets: 4,
          notes: 'Notes',
          created_at: new Date(),
          updated_at: new Date(),
        };
        db.query.mockResolvedValue({ rows: [mockDbRow] });

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
        const mockDbRow = {
          id: 5,
          workout_day_id: 5,
          muscle_group_id: 3,
          number_of_sets: 3,
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
        db.query.mockResolvedValue({ rows: [mockDbRow] });

        await WorkoutDaySetModel.update(5, { numberOfSets: 3 });

        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('RETURNING *'), expect.any(Array));
      });

      it('should always update updatedAt timestamp', async () => {
        const mockDbRow = {
          id: 6,
          workout_day_id: 5,
          muscle_group_id: 3,
          number_of_sets: 3,
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
        db.query.mockResolvedValue({ rows: [mockDbRow] });

        await WorkoutDaySetModel.update(6, { numberOfSets: 3 });

        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('updated_at = CURRENT_TIMESTAMP'),
          expect.any(Array)
        );
      });

      it('should handle updating numberOfSets to 1', async () => {
        const mockDbRow = {
          id: 7,
          workout_day_id: 5,
          muscle_group_id: 3,
          number_of_sets: 1,
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
        db.query.mockResolvedValue({ rows: [mockDbRow] });

        const result = await WorkoutDaySetModel.update(7, { numberOfSets: 1 });

        expect(db.query).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([1, 7]));
        expect(result.numberOfSets).toBe(1);
      });
    });

    describe('Validation and error scenarios', () => {
      it('should throw error when no fields to update', async () => {
        const data = {};

        await expect(WorkoutDaySetModel.update(1, data)).rejects.toThrow('No fields to update');

        expect(db.query).not.toHaveBeenCalled();
      });

      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database error');
        db.query.mockRejectedValue(dbError);

        const data = { numberOfSets: 5 };

        await expect(WorkoutDaySetModel.update(1, data)).rejects.toThrow('Database error');
      });

      it('should throw error when workout day set does not exist', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const data = { numberOfSets: 5 };

        await expect(WorkoutDaySetModel.update(999, data)).rejects.toThrow('Workout day set not found');
      });
    });

    describe('Edge cases', () => {
      it('should handle string id parameter', async () => {
        const mockDbRow = {
          id: 1,
          workout_day_id: 5,
          muscle_group_id: 3,
          number_of_sets: 3,
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
        db.query.mockResolvedValue({ rows: [mockDbRow] });

        await WorkoutDaySetModel.update('1', { numberOfSets: 3 });

        expect(db.query).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([3, '1']));
      });

      it('should ignore undefined fields', async () => {
        const mockDbRow = {
          id: 1,
          workout_day_id: 5,
          muscle_group_id: 3,
          number_of_sets: 5,
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
        db.query.mockResolvedValue({ rows: [mockDbRow] });

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
        const mockDbRow = {
          id: 1,
          workout_day_id: 5,
          muscle_group_id: 3,
          number_of_sets: 100,
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
        db.query.mockResolvedValue({ rows: [mockDbRow] });

        const result = await WorkoutDaySetModel.update(1, { numberOfSets: 100 });

        expect(db.query).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([100, 1]));
        expect(result.numberOfSets).toBe(100);
      });
    });
  });

  describe('findByWorkoutDayAndMuscleGroup', () => {
    describe('Happy path', () => {
      it('should find a workout day set by workoutDayId and muscleGroupId', async () => {
        const createdAt = new Date();
        const updatedAt = new Date();
        const mockDbRow = {
          id: 1,
          workout_day_id: 5,
          muscle_group_id: 3,
          number_of_sets: 4,
          notes: 'Test notes',
          created_at: createdAt,
          updated_at: updatedAt,
        };

        db.query.mockResolvedValue({ rows: [mockDbRow] });

        const result = await WorkoutDaySetModel.findByWorkoutDayAndMuscleGroup(5, 3);

        expect(db.query).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM workout_day_sets'),
          [5, 3]
        );
        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('WHERE workout_day_id = $1 AND muscle_group_id = $2'),
          expect.any(Array)
        );
        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('LIMIT 1'),
          expect.any(Array)
        );
        expect(result).toEqual({
          id: 1,
          workoutDayId: 5,
          muscleGroupId: 3,
          numberOfSets: 4,
          notes: 'Test notes',
          createdAt: createdAt,
          updatedAt: updatedAt,
        });
      });

      it('should return null when workout day set does not exist', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const result = await WorkoutDaySetModel.findByWorkoutDayAndMuscleGroup(999, 999);

        expect(db.query).toHaveBeenCalledWith(expect.any(String), [999, 999]);
        expect(result).toBeNull();
      });

      it('should transform database row to camelCase', async () => {
        const mockDbRow = {
          id: 2,
          workout_day_id: 10,
          muscle_group_id: 7,
          number_of_sets: 3,
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        };

        db.query.mockResolvedValue({ rows: [mockDbRow] });

        const result = await WorkoutDaySetModel.findByWorkoutDayAndMuscleGroup(10, 7);

        expect(result).toHaveProperty('workoutDayId');
        expect(result).toHaveProperty('muscleGroupId');
        expect(result).toHaveProperty('numberOfSets');
        expect(result).toHaveProperty('createdAt');
        expect(result).toHaveProperty('updatedAt');
        expect(result).not.toHaveProperty('workout_day_id');
        expect(result).not.toHaveProperty('muscle_group_id');
        expect(result).not.toHaveProperty('number_of_sets');
      });
    });

    describe('Error scenarios', () => {
      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database connection failed');
        db.query.mockRejectedValue(dbError);

        await expect(
          WorkoutDaySetModel.findByWorkoutDayAndMuscleGroup(5, 3)
        ).rejects.toThrow('Database connection failed');
      });

      it('should return null when database returns empty result', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const result = await WorkoutDaySetModel.findByWorkoutDayAndMuscleGroup(5, 3);

        expect(result).toBeNull();
      });
    });

    describe('Edge cases', () => {
      it('should handle string parameters', async () => {
        const mockDbRow = {
          id: 1,
          workout_day_id: 5,
          muscle_group_id: 3,
          number_of_sets: 4,
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        };

        db.query.mockResolvedValue({ rows: [mockDbRow] });

        await WorkoutDaySetModel.findByWorkoutDayAndMuscleGroup('5', '3');

        expect(db.query).toHaveBeenCalledWith(expect.any(String), ['5', '3']);
      });

      it('should handle very large workoutDayId and muscleGroupId', async () => {
        const largeWorkoutDayId = 999999999;
        const largeMuscleGroupId = 888888888;
        db.query.mockResolvedValue({ rows: [] });

        await WorkoutDaySetModel.findByWorkoutDayAndMuscleGroup(largeWorkoutDayId, largeMuscleGroupId);

        expect(db.query).toHaveBeenCalledWith(expect.any(String), [largeWorkoutDayId, largeMuscleGroupId]);
      });

      it('should use LIMIT 1 to ensure only one result', async () => {
        const mockDbRow = {
          id: 1,
          workout_day_id: 5,
          muscle_group_id: 3,
          number_of_sets: 4,
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        };

        db.query.mockResolvedValue({ rows: [mockDbRow] });

        await WorkoutDaySetModel.findByWorkoutDayAndMuscleGroup(5, 3);

        const query = db.query.mock.calls[0][0];
        expect(query).toContain('LIMIT 1');
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
        expect(db.query).toHaveBeenCalledWith('DELETE FROM workout_day_sets WHERE id = $1 RETURNING id', [1]);
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

        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('RETURNING id'), expect.any(Array));
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

        await expect(WorkoutDaySetModel.delete(1)).rejects.toThrow('Database error');
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
        expect(db.query).toHaveBeenCalledWith('SELECT EXISTS(SELECT 1 FROM workout_day_sets WHERE id = $1)', [1]);
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

        await expect(WorkoutDaySetModel.exists(1)).rejects.toThrow('Database error');
      });

      it('should return false when database returns no rows', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const result = await WorkoutDaySetModel.exists(1);

        expect(result).toBe(false);
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
