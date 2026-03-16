import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BridgeCryptoModalComponent } from './bridge-crypto-modal.component';

describe('BridgeCryptoModalComponent', () => {
  let component: BridgeCryptoModalComponent;
  let fixture: ComponentFixture<BridgeCryptoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BridgeCryptoModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BridgeCryptoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
