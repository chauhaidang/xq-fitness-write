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
import { logger } from '@chauhaidang/xq-js-common-kit';

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
   * Extract error details from API error response
   * Handles ResponseError from generated client which has response property
   */
  private async extractErrorDetails(error: any): Promise<{ status?: number; message: string; body?: any }> {
    let status: number | undefined;
    let body: any;
    
    // Handle ResponseError from generated client (has response property)
    if (error.response && typeof error.response.status === 'number') {
      status = error.response.status;
      // Try to parse response body
      try {
        const clonedResponse = error.response.clone();
        body = await clonedResponse.json();
      } catch (e) {
        // If JSON parsing fails, try text
        try {
          const clonedResponse = error.response.clone();
          body = await clonedResponse.text();
        } catch (e2) {
          // If both fail, body remains undefined
        }
      }
    } else {
      // Fallback to other error formats
      status = error.status || error.response?.status || error.statusCode;
      body = error.body || error.response?.data || error.response?.body || error.data;
    }
    
    const message = error.message || 'Unknown error';
    
    return { status, message, body };
  }

  /**
   * Handle API errors with detailed logging
   */
  private async handleError(operation: string, error: any): Promise<never> {
    const { status, message, body } = await this.extractErrorDetails(error);
    
    logger.error(`❌ Failed to ${operation}`);
    logger.error(`Error status: ${status || 'unknown'}`);
    logger.error(`Error message: ${message}`);
    if (body) {
      logger.error(`Error body: ${JSON.stringify(body, null, 2)}`);
    }
    
    // Create a more informative error message
    const errorMessage = body?.message || body?.code || message;
    const enhancedError = new Error(`Failed to ${operation}: ${errorMessage}${status ? ` (HTTP ${status})` : ''}`);
    
    // Preserve original error details
    (enhancedError as any).status = status;
    (enhancedError as any).body = body;
    (enhancedError as any).originalError = error;
    
    throw enhancedError;
  }

  /**
   * Create a routine
   */
  async createRoutine(data: { name: string; description?: string; isActive: boolean }): Promise<RoutineResponse> {
    try {
      const result = await this.routinesApi.createRoutine({
        createRoutineRequest: data,
      });
      logger.info(`✅ Created routine: ${result.id} - ${result.name}`);
      return result;
    } catch (error) {
      return await this.handleError(`create routine "${data.name}"`, error);
    }
  }

  /**
   * Update a routine
   */
  async updateRoutine(
    id: number,
    data: Partial<{ name: string; description?: string; isActive: boolean }>
  ): Promise<RoutineResponse> {
    try {
      return await this.routinesApi.updateRoutine({
        routineId: id,
        updateRoutineRequest: data,
      });
    } catch (error) {
      return await this.handleError(`update routine ${id}`, error);
    }
  }

  /**
   * Delete a routine
   */
  async deleteRoutine(id: number): Promise<void> {
    try {
      return await this.routinesApi.deleteRoutine({
        routineId: id,
      });
    } catch (error) {
      return await this.handleError(`delete routine ${id}`, error);
    }
  }

  /**
   * Create a workout day
   */
  async createWorkoutDay(data: { routineId: number; dayNumber: number; dayName: string }): Promise<WorkoutDayResponse> {
    try {
      const result = await this.workoutDaysApi.createWorkoutDay({
        createWorkoutDayRequest: data,
      });
      logger.info(`✅ Created workout day: ${result.id} - ${result.dayName} (Day ${result.dayNumber})`);
      return result;
    } catch (error) {
      return await this.handleError(`create workout day "${data.dayName}" for routine ${data.routineId}`, error);
    }
  }

  /**
   * Update a workout day
   */
  async updateWorkoutDay(
    id: number,
    data: Partial<{ dayNumber: number; dayName: string }>
  ): Promise<WorkoutDayResponse> {
    try {
      return await this.workoutDaysApi.updateWorkoutDay({
        dayId: id,
        updateWorkoutDayRequest: data,
      });
    } catch (error) {
      return await this.handleError(`update workout day ${id}`, error);
    }
  }

  /**
   * Delete a workout day
   */
  async deleteWorkoutDay(id: number): Promise<void> {
    try {
      return await this.workoutDaysApi.deleteWorkoutDay({
        dayId: id,
      });
    } catch (error) {
      return await this.handleError(`delete workout day ${id}`, error);
    }
  }

  /**
   * Create workout day sets
   */
  async createWorkoutDaySets(data: {
    workoutDayId: number;
    muscleGroupId: number;
    numberOfSets: number;
  }): Promise<WorkoutDaySetResponse> {
    try {
      const result = await this.workoutDaySetsApi.createWorkoutDaySet({
        createWorkoutDaySetRequest: data,
      });
      logger.info(`✅ Created workout day sets: ${result.id} (muscle group ${data.muscleGroupId}, ${data.numberOfSets} sets)`);
      return result;
    } catch (error) {
      return await this.handleError(`create workout day sets for workout day ${data.workoutDayId} (muscle group ${data.muscleGroupId})`, error);
    }
  }

  /**
   * Update workout day sets by setId
   */
  async updateWorkoutDaySets(
    id: number,
    data: Partial<{ numberOfSets: number; notes?: string }>
  ): Promise<WorkoutDaySetResponse> {
    try {
      const result = await this.workoutDaySetsApi.updateWorkoutDaySet({
        setId: id,
        updateWorkoutDaySetRequest: data,
      });
      logger.info(`✅ Updated workout day sets: ${result.id} - workoutDayId: ${result.workoutDayId}, muscleGroupId: ${result.muscleGroupId}`);
      return result;
    } catch (error) {
      return await this.handleError(`update workout day sets ${id}`, error);
    }
  }

  /**
   * Update workout day sets by workoutDayId and muscleGroupId (query parameters)
   * This method allows updating when you only know the workout day and muscle group IDs
   */
  async updateWorkoutDaySetsByQuery(
    workoutDayId: number,
    muscleGroupId: number,
    data: Partial<{ numberOfSets: number; notes?: string }>
  ): Promise<WorkoutDaySetResponse> {
    try {
      // Use setId=0 (or any value) since query params take precedence
      const result = await this.workoutDaySetsApi.updateWorkoutDaySet({
        setId: 0, // Path parameter (ignored when query params are provided)
        workoutDayId: workoutDayId, // Query parameter
        muscleGroupId: muscleGroupId, // Query parameter
        updateWorkoutDaySetRequest: data,
      });
      logger.info(`✅ Updated workout day sets via query params (workoutDayId: ${workoutDayId}, muscleGroupId: ${muscleGroupId})`);
      return result;
    } catch (error) {
      return await this.handleError(`update workout day sets by query (workoutDayId: ${workoutDayId}, muscleGroupId: ${muscleGroupId})`, error);
    }
  }

  /**
   * Delete workout day sets
   */
  async deleteWorkoutDaySets(id: number): Promise<void> {
    try {
      return await this.workoutDaySetsApi.deleteWorkoutDaySet({
        setId: id,
      });
    } catch (error) {
      return await this.handleError(`delete workout day sets ${id}`, error);
    }
  }
}
