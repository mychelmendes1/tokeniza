import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndicationsComponent } from './indications.component';

describe('IndicationsComponent', () => {
  let component: IndicationsComponent;
  let fixture: ComponentFixture<IndicationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndicationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IndicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
