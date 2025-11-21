/**
 * API Client wrapper for Write Service
 * Provides typed methods for common API operations using the generated write client
 */

import {
  Configuration,
  RoutinesApi,
  WorkoutDaysApi,
  WorkoutDaySetsApi,
  RoutineResponse,
  WorkoutDayResponse,
  WorkoutDaySetResponse,
} from 'xq-fitness-write-client';

export class ApiClient {
  private routinesApi: RoutinesApi;
  private workoutDaysApi: WorkoutDaysApi;
  private workoutDaySetsApi: WorkoutDaySetsApi;

  constructor(baseUrl: string) {
    const config = new Configuration({
      basePath: baseUrl,
    });

    this.routinesApi = new RoutinesApi(config);
    this.workoutDaysApi = new WorkoutDaysApi(config);
    this.workoutDaySetsApi = new WorkoutDaySetsApi(config);
  }

  /**
   * Create a routine
   */
  async createRoutine(data: { name: string; description?: string; isActive: boolean }): Promise<RoutineResponse> {
    return this.routinesApi.createRoutine({
      createRoutineRequest: data,
    });
  }

  /**
   * Update a routine
   */
  async updateRoutine(
    id: number,
    data: Partial<{ name: string; description?: string; isActive: boolean }>
  ): Promise<RoutineResponse> {
    return this.routinesApi.updateRoutine({
      routineId: id,
      updateRoutineRequest: data,
    });
  }

  /**
   * Delete a routine
   */
  async deleteRoutine(id: number): Promise<void> {
    return this.routinesApi.deleteRoutine({
      routineId: id,
    });
  }

  /**
   * Create a workout day
   */
  async createWorkoutDay(data: { routineId: number; dayNumber: number; dayName: string }): Promise<WorkoutDayResponse> {
    return this.workoutDaysApi.createWorkoutDay({
      createWorkoutDayRequest: data,
    });
  }

  /**
   * Update a workout day
   */
  async updateWorkoutDay(
    id: number,
    data: Partial<{ dayNumber: number; dayName: string }>
  ): Promise<WorkoutDayResponse> {
    return this.workoutDaysApi.updateWorkoutDay({
      dayId: id,
      updateWorkoutDayRequest: data,
    });
  }

  /**
   * Delete a workout day
   */
  async deleteWorkoutDay(id: number): Promise<void> {
    return this.workoutDaysApi.deleteWorkoutDay({
      dayId: id,
    });
  }

  /**
   * Create workout day sets
   */
  async createWorkoutDaySets(data: {
    workoutDayId: number;
    muscleGroupId: number;
    numberOfSets: number;
  }): Promise<WorkoutDaySetResponse> {
    return this.workoutDaySetsApi.createWorkoutDaySet({
      createWorkoutDaySetRequest: data,
    });
  }

  /**
   * Update workout day sets
   */
  async updateWorkoutDaySets(
    id: number,
    data: Partial<{ muscleGroupId: number; numberOfSets: number }>
  ): Promise<WorkoutDaySetResponse> {
    return this.workoutDaySetsApi.updateWorkoutDaySet({
      setId: id,
      updateWorkoutDaySetRequest: data,
    });
  }

  /**
   * Delete workout day sets
   */
  async deleteWorkoutDaySets(id: number): Promise<void> {
    return this.workoutDaySetsApi.deleteWorkoutDaySet({
      setId: id,
    });
  }
}
