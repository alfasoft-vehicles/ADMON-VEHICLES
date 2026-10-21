import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnersRelationshipOptionsComponent } from './owners-relationship-options.component';

describe('OwnersRelationshipOptionsComponent', () => {
  let component: OwnersRelationshipOptionsComponent;
  let fixture: ComponentFixture<OwnersRelationshipOptionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OwnersRelationshipOptionsComponent]
    });
    fixture = TestBed.createComponent(OwnersRelationshipOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
