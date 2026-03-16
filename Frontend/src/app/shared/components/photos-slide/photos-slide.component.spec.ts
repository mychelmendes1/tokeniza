import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhotosSlideComponent } from './photos-slide.component';

describe('PhotosSlideComponent', () => {
    let component: PhotosSlideComponent;
    let fixture: ComponentFixture<PhotosSlideComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PhotosSlideComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(PhotosSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});