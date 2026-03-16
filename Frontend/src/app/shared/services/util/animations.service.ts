import { animate, AnimationMetadata, keyframes, state, style, transition, trigger } from "@angular/animations";

export const fadeIn: AnimationMetadata = trigger('fadeIn', [
    transition(':enter', [
        style({ opacity: 0 }),
        animate('0.5s ease-in-out', style({ opacity: 1 }))
    ])
]);

export const fadeInOut: AnimationMetadata = trigger('fadeInOut', [
    transition(':enter', [
        style({ opacity: 0 }),
        animate('1s ease-in-out', style({ opacity: 1 }))
    ]),
    transition(':leave', [
        animate('1s ease-in-out', style({ opacity: 0 }))
    ])
]);

export const moveElementForward: AnimationMetadata = trigger('moveElement', [
    state('normal', style({ transform: 'translate(0, 0)', opacity: 1 })),
    state('moved', style({ transform: 'translate(0, 0)', opacity: 1 })),
    transition('normal => moved', [
        animate('0.6s ease-in-out', keyframes([
            style({ transform: 'translate(0, 0)', opacity: 1, offset: 0 }),
            style({ transform: 'translate(10px, -10px)', opacity: 0, offset: 0.5 }),
            style({ transform: 'translate(-10px, 10px)', opacity: 0, offset: 0.51 }),
            style({ transform: 'translate(0, 0)', opacity: 1, offset: 1 })
        ]))
    ]),
    transition('moved => normal', [
        animate('0.3s ease-out', style({ transform: 'translate(0, 0)', opacity: 1 }))
    ])
]);