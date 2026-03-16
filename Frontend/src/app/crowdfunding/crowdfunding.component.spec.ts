import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrowdfundingComponent } from './crowdfunding.component';

describe('OpportunitiesComponent', () => {
    let component: CrowdfundingComponent;
    let fixture: ComponentFixture<CrowdfundingComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CrowdfundingComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CrowdfundingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});