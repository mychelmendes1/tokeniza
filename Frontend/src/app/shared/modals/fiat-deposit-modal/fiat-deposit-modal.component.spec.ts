import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiatDepositModalComponent } from './fiat-deposit-modal.component';

describe('FiatDepositModalComponent', () => {
  let component: FiatDepositModalComponent;
  let fixture: ComponentFixture<FiatDepositModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FiatDepositModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FiatDepositModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
