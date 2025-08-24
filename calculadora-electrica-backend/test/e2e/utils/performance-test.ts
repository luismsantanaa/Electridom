import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

export interface PerformanceTestResult {
  testName: string;
  responseTime: number;
  statusCode: number;
  passed: boolean;
  threshold: number;
  response?: any; // Agregar propiedad response opcional
}

export class PerformanceTester {
  private results: PerformanceTestResult[] = [];

  async testEndpoint(
    app: INestApplication,
    testName: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: any,
    authToken?: string,
    expectedStatus?: number,
    threshold: number = 800,
  ): Promise<PerformanceTestResult> {
    const startTime = Date.now();
    
    let req = request(app.getHttpServer())[method.toLowerCase()](endpoint);
    
    if (authToken) {
      req = req.set('Authorization', `Bearer ${authToken}`);
    }
    
    if (data) {
      req = req.send(data);
    }
    
    try {
      const response = await req;
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const passed = responseTime <= threshold && 
        (expectedStatus ? response.status === expectedStatus : true);
      
      const result: PerformanceTestResult = {
        testName,
        responseTime,
        statusCode: response.status,
        passed,
        threshold,
        response, // Incluir la respuesta completa
      };
      
      this.results.push(result);
      return result;
      
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const result: PerformanceTestResult = {
        testName,
        responseTime,
        statusCode: error.status || 500,
        passed: false,
        threshold,
        response: error.response, // Incluir la respuesta de error
      };
      
      this.results.push(result);
      return result;
    }
  }

  getResults(): PerformanceTestResult[] {
    return this.results;
  }

  getSummary(): {
    total: number;
    passed: number;
    failed: number;
    averageResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
  } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;
    
    const responseTimes = this.results.map(r => r.responseTime);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
    const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
    
    return {
      total,
      passed,
      failed,
      averageResponseTime,
      maxResponseTime,
      minResponseTime,
    };
  }

  printSummary(): void {
    const summary = this.getSummary();
    
    console.log('\n📊 PERFORMANCE TEST SUMMARY');
    console.log('============================');
    console.log(`Total Tests: ${summary.total}`);
    console.log(`Passed: ${summary.passed} ✅`);
    console.log(`Failed: ${summary.failed} ❌`);
    console.log(`Average Response Time: ${summary.averageResponseTime.toFixed(2)}ms`);
    console.log(`Max Response Time: ${summary.maxResponseTime}ms`);
    console.log(`Min Response Time: ${summary.minResponseTime}ms`);
  }
}

export const performanceTester = new PerformanceTester();
