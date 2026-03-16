import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TokenPaymentModalComponent } from './token-payment-modal.component';

describe('TokenPaymentModalComponent', () => {
  let component: TokenPaymentModalComponent;
  let fixture: ComponentFixture<TokenPaymentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TokenPaymentModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TokenPaymentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
