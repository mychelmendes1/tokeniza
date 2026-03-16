import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthCodeModalComponent } from './auth-code-modal.component';

describe('AuthCodeModalComponent', () => {
  let component: AuthCodeModalComponent;
  let fixture: ComponentFixture<AuthCodeModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthCodeModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthCodeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
