import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClearLedgerModalComponent } from './clearledger-modal.component';

describe('ClearLedgerModalComponent', () => {
    let component: ClearLedgerModalComponent;
    let fixture: ComponentFixture<ClearLedgerModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ClearLedgerModalComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ClearLedgerModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});