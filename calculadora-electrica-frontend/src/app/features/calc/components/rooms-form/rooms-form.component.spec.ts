import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RoomsFormComponent } from './rooms-form.component';

describe('RoomsFormComponent', () => {
  let component: RoomsFormComponent;
  let fixture: ComponentFixture<RoomsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RoomsFormComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(RoomsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.roomsForm.get('voltage')?.value).toBe(120);
    expect(component.roomsForm.get('phases')?.value).toBe(1);
    expect(component.roomsForm.get('frequency')?.value).toBe(60);
    expect(component.roomsArray().length).toBe(1);
  });

  it('should add a new room', () => {
    const initialLength = component.roomsArray().length;
    component.addRoom();
    expect(component.roomsArray().length).toBe(initialLength + 1);
  });

  it('should remove a room', () => {
    component.addRoom(); // Add a second room
    const initialLength = component.roomsArray().length;
    component.removeRoom(1);
    expect(component.roomsArray().length).toBe(initialLength - 1);
  });

  it('should not remove the last room', () => {
    const initialLength = component.roomsArray().length;
    component.removeRoom(0);
    expect(component.roomsArray().length).toBe(initialLength); // Should not change
  });

  it('should clear form correctly', () => {
    component.addRoom();
    component.clearForm();
    expect(component.roomsArray().length).toBe(1); // Should have one default room
    expect(component.roomsForm.get('voltage')?.value).toBe(120);
  });

  it('should calculate total area correctly', () => {
    const room1 = component.roomsArray().at(0);
    room1.patchValue({ nombre: 'Sala', area_m2: 20 });

    component.addRoom();
    const room2 = component.roomsArray().at(1);
    room2.patchValue({ nombre: 'Cocina', area_m2: 15 });

    expect(component.totalArea()).toBe(35);
  });

  it('should validate form correctly', () => {
    const room = component.roomsArray().at(0);
    room.patchValue({ nombre: 'Sala', area_m2: 20 });

    expect(component.roomsForm.valid).toBe(true);
  });

  it('should be invalid with empty room name', () => {
    const room = component.roomsArray().at(0);
    room.patchValue({ nombre: '', area_m2: 20 });

    expect(component.roomsForm.valid).toBe(false);
  });

  it('should be invalid with area less than 0.1', () => {
    const room = component.roomsArray().at(0);
    room.patchValue({ nombre: 'Sala', area_m2: 0.05 });

    expect(component.roomsForm.valid).toBe(false);
  });

  it('should emit rooms data on valid submit', () => {
    const room = component.roomsArray().at(0);
    room.patchValue({ nombre: 'Sala', area_m2: 20 });

    component.onSubmit();

    expect(component.roomsData()).toEqual({
      system: { voltage: 120, phases: 1, frequency: 60 },
      superficies: [{ nombre: 'Sala', area_m2: 20 }]
    });
  });

  it('should not emit data on invalid submit', () => {
    const room = component.roomsArray().at(0);
    room.patchValue({ nombre: '', area_m2: 0 });

    component.onSubmit();

    expect(component.roomsData()).toBeNull();
  });
});
