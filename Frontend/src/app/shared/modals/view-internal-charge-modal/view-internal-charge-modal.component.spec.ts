import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewInternalChargeModalComponent } from './view-internal-charge-modal.component';

describe('ViewInternalChargeModalComponent', () => {
    let component: ViewInternalChargeModalComponent;
    let fixture: ComponentFixture<ViewInternalChargeModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ViewInternalChargeModalComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ViewInternalChargeModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
