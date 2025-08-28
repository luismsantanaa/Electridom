import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCargas } from './dashboard-cargas';

describe('DashboardCargas', () => {
  let component: DashboardCargas;
  let fixture: ComponentFixture<DashboardCargas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCargas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardCargas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
