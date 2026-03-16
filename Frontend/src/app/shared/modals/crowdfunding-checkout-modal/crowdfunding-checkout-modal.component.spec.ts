import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrowdfundingCheckoutModalComponent } from './crowdfunding-checkout-modal.component';

describe('CrowdfundingCheckoutModalComponent', () => {
    let component: CrowdfundingCheckoutModalComponent;
    let fixture: ComponentFixture<CrowdfundingCheckoutModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CrowdfundingCheckoutModalComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CrowdfundingCheckoutModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});