import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnersAddnewComponent } from './owners-addnew.component';

describe('OwnersAddnewComponent', () => {
  let component: OwnersAddnewComponent;
  let fixture: ComponentFixture<OwnersAddnewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OwnersAddnewComponent]
    });
    fixture = TestBed.createComponent(OwnersAddnewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
