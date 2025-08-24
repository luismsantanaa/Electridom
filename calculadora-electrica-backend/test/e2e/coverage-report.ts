import { performanceTester } from './utils/performance-test';

export interface CoverageReport {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  coveragePercentage: number;
  performanceSummary: {
    averageResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    performancePassed: number;
    performanceFailed: number;
  };
  testCategories: {
    happyPath: number;
    validationErrors: number;
    performance: number;
    businessLogic: number;
    edgeCases: number;
  };
}

export class CoverageReporter {
  private testResults: any[] = [];
  private performanceResults = performanceTester.getResults();

  addTestResult(result: any) {
    this.testResults.push(result);
  }

  generateReport(): CoverageReport {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'passed').length;
    const failedTests = totalTests - passedTests;
    const coveragePercentage = (passedTests / totalTests) * 100;

    const perfSummary = performanceTester.getSummary();

    return {
      totalTests,
      passedTests,
      failedTests,
      coveragePercentage,
      performanceSummary: {
        averageResponseTime: perfSummary.averageResponseTime,
        maxResponseTime: perfSummary.maxResponseTime,
        minResponseTime: perfSummary.minResponseTime,
        performancePassed: perfSummary.passed,
        performanceFailed: perfSummary.failed,
      },
      testCategories: {
        happyPath: this.testResults.filter(r => r.category === 'happyPath').length,
        validationErrors: this.testResults.filter(r => r.category === 'validationErrors').length,
        performance: this.testResults.filter(r => r.category === 'performance').length,
        businessLogic: this.testResults.filter(r => r.category === 'businessLogic').length,
        edgeCases: this.testResults.filter(r => r.category === 'edgeCases').length,
      },
    };
  }

  printReport(): void {
    const report = this.generateReport();
    
    console.log('\n📊 E2E TEST COVERAGE REPORT');
    console.log('============================');
    console.log(`Total Tests: ${report.totalTests}`);
    console.log(`Passed: ${report.passedTests} ✅`);
    console.log(`Failed: ${report.failedTests} ❌`);
    console.log(`Coverage: ${report.coveragePercentage.toFixed(2)}%`);
    
    console.log('\n📈 PERFORMANCE SUMMARY');
    console.log('----------------------');
    console.log(`Average Response Time: ${report.performanceSummary.averageResponseTime.toFixed(2)}ms`);
    console.log(`Max Response Time: ${report.performanceSummary.maxResponseTime}ms`);
    console.log(`Min Response Time: ${report.performanceSummary.minResponseTime}ms`);
    console.log(`Performance Tests Passed: ${report.performanceSummary.performancePassed}/${report.performanceSummary.performancePassed + report.performanceSummary.performanceFailed}`);
    
    console.log('\n📋 TEST CATEGORIES');
    console.log('------------------');
    console.log(`Happy Path Tests: ${report.testCategories.happyPath}`);
    console.log(`Validation Error Tests: ${report.testCategories.validationErrors}`);
    console.log(`Performance Tests: ${report.testCategories.performance}`);
    console.log(`Business Logic Tests: ${report.testCategories.businessLogic}`);
    console.log(`Edge Case Tests: ${report.testCategories.edgeCases}`);
    
    console.log('\n🎯 COVERAGE STATUS');
    console.log('------------------');
    if (report.coveragePercentage >= 90) {
      console.log('✅ EXCELLENT COVERAGE (≥90%)');
    } else if (report.coveragePercentage >= 80) {
      console.log('🟡 GOOD COVERAGE (≥80%)');
    } else {
      console.log('❌ NEEDS IMPROVEMENT (<80%)');
    }
    
    if (report.performanceSummary.performanceFailed === 0) {
      console.log('✅ ALL PERFORMANCE TESTS PASSED');
    } else {
      console.log(`❌ ${report.performanceSummary.performanceFailed} PERFORMANCE TESTS FAILED`);
    }
  }

  exportToJson(): string {
    const report = this.generateReport();
    return JSON.stringify(report, null, 2);
  }
}

export const coverageReporter = new CoverageReporter();
