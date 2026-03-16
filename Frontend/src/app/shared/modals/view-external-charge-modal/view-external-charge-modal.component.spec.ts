import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewExternalChargeModalComponent } from './view-external-charge-modal.component';

describe('ViewExternalChargeModalComponent', () => {
    let component: ViewExternalChargeModalComponent;
    let fixture: ComponentFixture<ViewExternalChargeModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ViewExternalChargeModalComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ViewExternalChargeModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
