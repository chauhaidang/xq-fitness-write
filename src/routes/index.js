const express = require('express');
const router = express.Router();
const validate = require('../middleware/validator');
const schemas = require('../validators/schemas');
const RoutineController = require('../controllers/routineController');
const WorkoutDayController = require('../controllers/workoutDayController');
const WorkoutDaySetController = require('../controllers/workoutDaySetController');

// Routine routes
router.post(
  '/routines',
  validate(schemas.createRoutineSchema),
  RoutineController.createRoutine
);

router.put(
  '/routines/:routineId',
  validate(schemas.updateRoutineSchema),
  RoutineController.updateRoutine
);

router.delete('/routines/:routineId', RoutineController.deleteRoutine);

// Workout day routes
router.post(
  '/workout-days',
  validate(schemas.createWorkoutDaySchema),
  WorkoutDayController.createWorkoutDay
);

router.put(
  '/workout-days/:dayId',
  validate(schemas.updateWorkoutDaySchema),
  WorkoutDayController.updateWorkoutDay
);

router.delete('/workout-days/:dayId', WorkoutDayController.deleteWorkoutDay);

// Workout day sets routes
router.post(
  '/workout-day-sets',
  validate(schemas.createWorkoutDaySetSchema),
  WorkoutDaySetController.createWorkoutDaySet
);

router.put(
  '/workout-day-sets/:setId',
  validate(schemas.updateWorkoutDaySetSchema),
  WorkoutDaySetController.updateWorkoutDaySet
);

router.delete('/workout-day-sets/:setId', WorkoutDaySetController.deleteWorkoutDaySet);

module.exports = router;
