import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrowdfundingCardComponent } from './crowdfunding-card.component';

describe('CrowdfundingCardComponent', () => {
    let component: CrowdfundingCardComponent;
    let fixture: ComponentFixture<CrowdfundingCardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CrowdfundingCardComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CrowdfundingCardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});