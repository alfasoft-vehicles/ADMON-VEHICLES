import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnersRelationshiprevenuesgeneralComponent } from './owners-relationshiprevenuesgeneral.component';

describe('OwnersRelationshiprevenuesgeneralComponent', () => {
  let component: OwnersRelationshiprevenuesgeneralComponent;
  let fixture: ComponentFixture<OwnersRelationshiprevenuesgeneralComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OwnersRelationshiprevenuesgeneralComponent]
    });
    fixture = TestBed.createComponent(OwnersRelationshiprevenuesgeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
