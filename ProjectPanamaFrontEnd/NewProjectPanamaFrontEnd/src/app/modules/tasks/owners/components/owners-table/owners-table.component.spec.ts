import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnersTableComponent } from './owners-table.component';

describe('OwnersTableComponent', () => {
  let component: OwnersTableComponent;
  let fixture: ComponentFixture<OwnersTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OwnersTableComponent]
    });
    fixture = TestBed.createComponent(OwnersTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
