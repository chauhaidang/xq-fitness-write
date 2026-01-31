const SnapshotController = require('../../../src/controllers/snapshotController');
const SnapshotService = require('../../../src/services/snapshotService');
const RoutineModel = require('../../../src/models/routineModel');

// Mock the services and models
jest.mock('../../../src/services/snapshotService');
jest.mock('../../../src/models/routineModel');

describe('SnapshotController', () => {
  let req, res;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console.error to suppress expected error logs in tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    req = {
      params: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('createSnapshot', () => {
    describe('Happy path', () => {
      it('should create snapshot successfully', async () => {
        req.params.routineId = '10';

        const mockSnapshot = {
          id: 1,
          routineId: 10,
          weekStartDate: '2024-12-02',
          createdAt: new Date('2024-12-02T10:00:00Z'),
        };

        RoutineModel.exists.mockResolvedValue(true);
        SnapshotService.createSnapshot.mockResolvedValue(mockSnapshot);

        await SnapshotController.createSnapshot(req, res);

        expect(RoutineModel.exists).toHaveBeenCalledWith(10);
        expect(SnapshotService.createSnapshot).toHaveBeenCalledWith(10);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(mockSnapshot);
      });

      it('should handle string routineId and convert to integer', async () => {
        req.params.routineId = '5';

        const mockSnapshot = {
          id: 1,
          routineId: 5,
          weekStartDate: '2024-12-02',
          createdAt: new Date(),
        };

        RoutineModel.exists.mockResolvedValue(true);
        SnapshotService.createSnapshot.mockResolvedValue(mockSnapshot);

        await SnapshotController.createSnapshot(req, res);

        expect(RoutineModel.exists).toHaveBeenCalledWith(5);
        expect(SnapshotService.createSnapshot).toHaveBeenCalledWith(5);
        expect(res.status).toHaveBeenCalledWith(201);
      });
    });

    describe('Validation errors', () => {
      it('should return 400 for invalid routineId (non-numeric)', async () => {
        req.params.routineId = 'invalid';

        await SnapshotController.createSnapshot(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          code: 'VALIDATION_ERROR',
          message: 'Invalid routineId parameter',
          timestamp: expect.any(String),
          details: expect.any(Array),
        });
        expect(SnapshotService.createSnapshot).not.toHaveBeenCalled();
      });

      it('should return 400 for invalid routineId (negative)', async () => {
        req.params.routineId = '-1';

        await SnapshotController.createSnapshot(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          code: 'VALIDATION_ERROR',
          message: 'Invalid routineId parameter',
          timestamp: expect.any(String),
          details: expect.any(Array),
        });
      });

      it('should return 400 for invalid routineId (zero)', async () => {
        req.params.routineId = '0';

        await SnapshotController.createSnapshot(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          code: 'VALIDATION_ERROR',
          message: 'Invalid routineId parameter',
          timestamp: expect.any(String),
          details: expect.any(Array),
        });
      });

      it('should return 400 for invalid routineId (non-numeric string)', async () => {
        // parseInt('abc') returns NaN, which fails Joi validation
        req.params.routineId = 'abc';

        await SnapshotController.createSnapshot(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          code: 'VALIDATION_ERROR',
          message: 'Invalid routineId parameter',
          timestamp: expect.any(String),
          details: expect.any(Array),
        });
      });

      it('should accept float string that parseInt converts to valid integer', async () => {
        // parseInt('10.5', 10) returns 10, which is valid
        // This tests that the controller accepts values that parseInt can convert
        req.params.routineId = '10.5';

        RoutineModel.exists.mockResolvedValue(true);
        SnapshotService.createSnapshot.mockResolvedValue({
          id: 1,
          routineId: 10,
          weekStartDate: '2024-12-02',
          createdAt: new Date(),
        });

        await SnapshotController.createSnapshot(req, res);

        // Should parse to 10 and proceed
        expect(RoutineModel.exists).toHaveBeenCalledWith(10);
        expect(res.status).toHaveBeenCalledWith(201);
      });
    });

    describe('Routine not found', () => {
      it('should return 404 when routine does not exist', async () => {
        req.params.routineId = '999';

        RoutineModel.exists.mockResolvedValue(false);

        await SnapshotController.createSnapshot(req, res);

        expect(RoutineModel.exists).toHaveBeenCalledWith(999);
        expect(SnapshotService.createSnapshot).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          code: 'NOT_FOUND',
          message: 'Routine not found',
          timestamp: expect.any(String),
        });
      });

      it('should return 404 when service throws Routine not found error', async () => {
        req.params.routineId = '10';

        RoutineModel.exists.mockResolvedValue(true);
        SnapshotService.createSnapshot.mockRejectedValue(new Error('Routine not found'));

        await SnapshotController.createSnapshot(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          code: 'NOT_FOUND',
          message: 'Routine not found',
          timestamp: expect.any(String),
        });
      });
    });

    describe('Database errors', () => {
      it('should return 400 for PostgreSQL constraint violation (23xx codes)', async () => {
        req.params.routineId = '10';

        const error = new Error('Constraint violation');
        error.code = '23505'; // Unique constraint

        RoutineModel.exists.mockResolvedValue(true);
        SnapshotService.createSnapshot.mockRejectedValue(error);

        await SnapshotController.createSnapshot(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          code: 'VALIDATION_ERROR',
          message: 'Invalid snapshot data',
          timestamp: expect.any(String),
        });
      });

      it('should return 400 for other PostgreSQL constraint violations', async () => {
        req.params.routineId = '10';

        const error = new Error('Foreign key violation');
        error.code = '23503'; // Foreign key constraint

        RoutineModel.exists.mockResolvedValue(true);
        SnapshotService.createSnapshot.mockRejectedValue(error);

        await SnapshotController.createSnapshot(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          code: 'VALIDATION_ERROR',
          message: 'Invalid snapshot data',
          timestamp: expect.any(String),
        });
      });
    });

    describe('Generic errors', () => {
      it('should return 500 for generic database errors', async () => {
        req.params.routineId = '10';

        const error = new Error('Database connection failed');

        RoutineModel.exists.mockResolvedValue(true);
        SnapshotService.createSnapshot.mockRejectedValue(error);

        await SnapshotController.createSnapshot(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          code: 'INTERNAL_ERROR',
          message: 'Database connection failed',
          timestamp: expect.any(String),
        });
      });

      it('should return 500 with default message when error has no message', async () => {
        req.params.routineId = '10';

        const error = new Error();

        RoutineModel.exists.mockResolvedValue(true);
        SnapshotService.createSnapshot.mockRejectedValue(error);

        await SnapshotController.createSnapshot(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          code: 'INTERNAL_ERROR',
          message: 'Failed to create snapshot',
          timestamp: expect.any(String),
        });
      });
    });
  });
});
