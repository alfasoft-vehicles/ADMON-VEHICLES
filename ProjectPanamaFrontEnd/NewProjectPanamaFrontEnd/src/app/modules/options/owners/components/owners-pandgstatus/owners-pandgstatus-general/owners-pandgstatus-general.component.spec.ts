import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnersPandgstatusGeneralComponent } from './owners-pandgstatus-general.component';

describe('OwnersPandgstatusGeneralComponent', () => {
  let component: OwnersPandgstatusGeneralComponent;
  let fixture: ComponentFixture<OwnersPandgstatusGeneralComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OwnersPandgstatusGeneralComponent]
    });
    fixture = TestBed.createComponent(OwnersPandgstatusGeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
