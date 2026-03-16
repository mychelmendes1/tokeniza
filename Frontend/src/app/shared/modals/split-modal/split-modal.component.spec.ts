import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResellModalComponent } from './split-modal.component';

describe('ResellModalComponent', () => {
  let component: ResellModalComponent;
  let fixture: ComponentFixture<ResellModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResellModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResellModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
