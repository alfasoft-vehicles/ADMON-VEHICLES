import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriversDocumentationComponent } from './drivers-documentation.component';

describe('DriversDocumentationComponent', () => {
  let component: DriversDocumentationComponent;
  let fixture: ComponentFixture<DriversDocumentationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DriversDocumentationComponent]
    });
    fixture = TestBed.createComponent(DriversDocumentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
