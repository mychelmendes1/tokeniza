import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MfaConfigModalComponent } from './mfa-config-modal.component';

describe('MfaConfigModalComponent', () => {
  let component: MfaConfigModalComponent;
  let fixture: ComponentFixture<MfaConfigModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MfaConfigModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MfaConfigModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
