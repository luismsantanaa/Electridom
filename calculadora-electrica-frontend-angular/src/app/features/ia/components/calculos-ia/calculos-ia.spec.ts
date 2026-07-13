import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalculosIa } from './calculos-ia';

describe('CalculosIa', () => {
  let component: CalculosIa;
  let fixture: ComponentFixture<CalculosIa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalculosIa]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalculosIa);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
