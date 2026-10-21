import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TakeSignatureComponent } from './take-signature.component';

describe('TakeSignatureComponent', () => {
  let component: TakeSignatureComponent;
  let fixture: ComponentFixture<TakeSignatureComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TakeSignatureComponent]
    });
    fixture = TestBed.createComponent(TakeSignatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
