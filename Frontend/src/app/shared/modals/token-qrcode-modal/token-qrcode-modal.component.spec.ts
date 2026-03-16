import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TokenQrcodeModalComponent } from './token-qrcode-modal.component';

describe('TokenQrcodeModalComponent', () => {
  let component: TokenQrcodeModalComponent;
  let fixture: ComponentFixture<TokenQrcodeModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TokenQrcodeModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TokenQrcodeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
