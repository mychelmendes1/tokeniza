import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagseguroModalComponent } from './pagseguro-modal.component';

describe('PagseguroModalComponent', () => {
  let component: PagseguroModalComponent;
  let fixture: ComponentFixture<PagseguroModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagseguroModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagseguroModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
