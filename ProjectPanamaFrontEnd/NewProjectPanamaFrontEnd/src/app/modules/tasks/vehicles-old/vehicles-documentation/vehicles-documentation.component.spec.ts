import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiclesDocumentationComponent } from './vehicles-documentation.component';

describe('VehiclesDocumentationComponent', () => {
  let component: VehiclesDocumentationComponent;
  let fixture: ComponentFixture<VehiclesDocumentationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VehiclesDocumentationComponent]
    });
    fixture = TestBed.createComponent(VehiclesDocumentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
