import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DiscussionModalComponent } from './discussion-modal.component';

describe('DiscussionModalComponent', () => {
    let component: DiscussionModalComponent;
    let fixture: ComponentFixture<DiscussionModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DiscussionModalComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(DiscussionModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});