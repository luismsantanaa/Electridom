import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportReports } from './export-reports';

describe('ExportReports', () => {
  let component: ExportReports;
  let fixture: ComponentFixture<ExportReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
