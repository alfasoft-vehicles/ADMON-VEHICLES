import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoDocumentsDialogComponent } from './info-documents-dialog.component';

describe('InfoDocumentsDialogComponent', () => {
  let component: InfoDocumentsDialogComponent;
  let fixture: ComponentFixture<InfoDocumentsDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InfoDocumentsDialogComponent]
    });
    fixture = TestBed.createComponent(InfoDocumentsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
