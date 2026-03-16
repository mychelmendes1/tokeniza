import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SwapCryptoModalComponent } from './swap-crypto-modal.component';

describe('SwapCryptoModalComponent', () => {
  let component: SwapCryptoModalComponent;
  let fixture: ComponentFixture<SwapCryptoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwapCryptoModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SwapCryptoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
