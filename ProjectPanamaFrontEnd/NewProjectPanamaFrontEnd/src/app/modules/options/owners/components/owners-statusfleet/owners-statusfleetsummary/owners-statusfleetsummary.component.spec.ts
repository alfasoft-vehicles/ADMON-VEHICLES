import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnersStatusfleetsummaryComponent } from './owners-statusfleetsummary.component';

describe('OwnersStatusfleetsummaryComponent', () => {
  let component: OwnersStatusfleetsummaryComponent;
  let fixture: ComponentFixture<OwnersStatusfleetsummaryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OwnersStatusfleetsummaryComponent]
    });
    fixture = TestBed.createComponent(OwnersStatusfleetsummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
