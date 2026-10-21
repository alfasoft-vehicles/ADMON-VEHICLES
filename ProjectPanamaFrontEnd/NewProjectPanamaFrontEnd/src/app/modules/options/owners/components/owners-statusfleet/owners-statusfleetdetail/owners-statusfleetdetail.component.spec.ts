import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnersStatusfleetdetailComponent } from './owners-statusfleetdetail.component';

describe('OwnersStatusfleetdetailComponent', () => {
  let component: OwnersStatusfleetdetailComponent;
  let fixture: ComponentFixture<OwnersStatusfleetdetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OwnersStatusfleetdetailComponent]
    });
    fixture = TestBed.createComponent(OwnersStatusfleetdetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
