import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoanApplicationModalComponent } from './loan-application-modal.component';

describe('LoanApplicationModalComponent', () => {
  let component: LoanApplicationModalComponent;
  let fixture: ComponentFixture<LoanApplicationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoanApplicationModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoanApplicationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
