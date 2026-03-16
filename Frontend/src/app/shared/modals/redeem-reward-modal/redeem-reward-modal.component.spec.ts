import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedeemRewardModalComponent } from './redeem-reward-modal.component';

describe('RedeemRewardModalComponent', () => {
  let component: RedeemRewardModalComponent;
  let fixture: ComponentFixture<RedeemRewardModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RedeemRewardModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RedeemRewardModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
