import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnifilarSvg } from './unifilar-svg';

describe('UnifilarSvg', () => {
  let component: UnifilarSvg;
  let fixture: ComponentFixture<UnifilarSvg>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnifilarSvg]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnifilarSvg);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
