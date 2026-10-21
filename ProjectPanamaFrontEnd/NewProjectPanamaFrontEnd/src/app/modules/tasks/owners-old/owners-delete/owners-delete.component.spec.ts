import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnersDeleteComponent } from './owners-delete.component';

describe('OwnersDeleteComponent', () => {
  let component: OwnersDeleteComponent;
  let fixture: ComponentFixture<OwnersDeleteComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OwnersDeleteComponent]
    });
    fixture = TestBed.createComponent(OwnersDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
