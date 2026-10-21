import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnersRelationshiprevenuesComponent } from './owners-relationshiprevenues.component';

describe('OwnersRelationshiprevenuesComponent', () => {
  let component: OwnersRelationshiprevenuesComponent;
  let fixture: ComponentFixture<OwnersRelationshiprevenuesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OwnersRelationshiprevenuesComponent]
    });
    fixture = TestBed.createComponent(OwnersRelationshiprevenuesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
