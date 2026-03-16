import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThumbsSlideComponent } from './thumbs-slide.component';

describe('ThumbsSlideComponent', () => {
    let component: ThumbsSlideComponent;
    let fixture: ComponentFixture<ThumbsSlideComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ThumbsSlideComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ThumbsSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});