import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnersStatusfleetOptionsComponent } from './owners-statusfleet-options.component';

describe('OwnersStatusfleetOptionsComponent', () => {
  let component: OwnersStatusfleetOptionsComponent;
  let fixture: ComponentFixture<OwnersStatusfleetOptionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OwnersStatusfleetOptionsComponent]
    });
    fixture = TestBed.createComponent(OwnersStatusfleetOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
