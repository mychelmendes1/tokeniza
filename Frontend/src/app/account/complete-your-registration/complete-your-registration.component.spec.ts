import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompleteYourRegistrationComponent } from './complete-your-registration.component';

describe('CompleteYourRegistrationComponent', () => {
  let component: CompleteYourRegistrationComponent;
  let fixture: ComponentFixture<CompleteYourRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompleteYourRegistrationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompleteYourRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
