/**
 * Cleanup utilities for E2E tests
 * Helps manage test data cleanup
 */

import { ApiClient } from './api-client';

export class CleanupHelper {
  private apiClient: ApiClient;
  private createdRoutines: number[] = [];
  private createdWorkoutDays: number[] = [];
  private createdWorkoutDaySets: number[] = [];

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Track created routine for cleanup
   */
  trackRoutine(id: number): void {
    this.createdRoutines.push(id);
  }

  /**
   * Track created workout day for cleanup
   */
  trackWorkoutDay(id: number): void {
    this.createdWorkoutDays.push(id);
  }

  /**
   * Track created workout day sets for cleanup
   */
  trackWorkoutDaySets(id: number): void {
    this.createdWorkoutDaySets.push(id);
  }

  /**
   * Clean up all tracked resources
   * Deletes in reverse order: sets -> days -> routines
   */
  async cleanupAll(): Promise<void> {
    // Delete workout day sets first
    for (const setId of this.createdWorkoutDaySets) {
      try {
        await this.apiClient.deleteWorkoutDaySets(setId);
      } catch (error) {
        console.warn(`Failed to delete workout day set ${setId}:`, error);
      }
    }

    // Delete workout days
    for (const dayId of this.createdWorkoutDays) {
      try {
        await this.apiClient.deleteWorkoutDay(dayId);
      } catch (error) {
        console.warn(`Failed to delete workout day ${dayId}:`, error);
      }
    }

    // Delete routines
    for (const routineId of this.createdRoutines) {
      try {
        await this.apiClient.deleteRoutine(routineId);
      } catch (error) {
        console.warn(`Failed to delete routine ${routineId}:`, error);
      }
    }

    // Clear tracking arrays
    this.createdWorkoutDaySets = [];
    this.createdWorkoutDays = [];
    this.createdRoutines = [];
  }

  /**
   * Reset tracking without deleting
   */
  reset(): void {
    this.createdWorkoutDaySets = [];
    this.createdWorkoutDays = [];
    this.createdRoutines = [];
  }
}
