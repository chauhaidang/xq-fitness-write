/**
 * API Client wrapper for PactumJS
 * Provides typed methods for common API operations
 */

import pactum from 'pactum';

export class ApiClient {
  constructor(baseUrl: string) {
    pactum.request.setBaseUrl(baseUrl);
  }

  /**
   * Get PactumJS spec for custom requests
   */
  spec() {
    return pactum.spec();
  }

  /**
   * Create a routine
   */
  async createRoutine(data: { name: string; description?: string; isActive: boolean }) {
    return pactum
        .spec()
        .post('/routines')
        .withJson(data)
        .expectStatus(201)
        .returns('res.body')
  }

  /**
   * Update a routine
   */
  async updateRoutine(id: number, data: Partial<{ name: string; description?: string; isActive: boolean }>) {
    return pactum
        .spec()
        .put(`/routines/${id}`)
        .withJson(data)
        .expectStatus(200)
        .returns('res.body');
  }

  /**
   * Delete a routine
   */
  async deleteRoutine(id: number) {
    return pactum
        .spec()
        .delete(`/routines/${id}`)
        .expectStatus(204)
        .returns('res.body');
  }

  /**
   * Create a workout day
   */
  async createWorkoutDay(data: { routineId: number; dayNumber: number; dayName: string }) {
    return pactum
        .spec()
        .post('/workout-days')
        .withJson(data)
        .expectStatus(201)
        .returns('res.body');
  }

  /**
   * Update a workout day
   */
  async updateWorkoutDay(id: number, data: Partial<{ dayNumber: number; dayName: string }>) {
    return pactum
        .spec()
        .put(`/workout-days/${id}`)
        .withJson(data)
        .expectStatus(200)
        .returns('res.body');
  }

  /**
   * Delete a workout day
   */
  async deleteWorkoutDay(id: number) {
    return pactum
        .spec()
        .delete(`/workout-days/${id}`)
        .expectStatus(204)
        .returns('res.body');
  }

  /**
   * Create workout day sets
   */
  async createWorkoutDaySets(data: { workoutDayId: number; muscleGroupId: number; numberOfSets: number }) {
    return pactum
        .spec()
        .post('/workout-day-sets')
        .withJson(data)
        .expectStatus(201)
        .returns('res.body');
  }

  /**
   * Update workout day sets
   */
  async updateWorkoutDaySets(id: number, data: Partial<{ muscleGroupId: number; numberOfSets: number }>) {
    return pactum
        .spec()
        .put(`/workout-day-sets/${id}`)
        .withJson(data)
        .expectStatus(200)
        .returns('res.body');
  }

  /**
   * Delete workout day sets
   */
  async deleteWorkoutDaySets(id: number) {
    return pactum
        .spec()
        .delete(`/workout-day-sets/${id}`)
        .expectStatus(204)
        .returns('res.body');
  }
}