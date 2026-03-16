import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class HoverIconClassService {

    public hoverStates: Map<string, boolean> = new Map();
    public hoverTimeout: Map<string, number> = new Map();

    constructor() { }

    public getSvgClass(id: string, mouseEnter: string, mouseLeave: string): string {
        return this.hoverStates.get(id) ? mouseEnter : mouseLeave;
    }

    public onMouseEnter(id: string): void {
        clearTimeout(this.hoverTimeout.get(id));
        const timeout: number = window.setTimeout(() => {
            this.hoverStates.set(id, true);
        }, 60);
        this.hoverTimeout.set(id, timeout);
    }

    public onMouseLeave(id: string): void {
        clearTimeout(this.hoverTimeout.get(id));
        const timeout: number = window.setTimeout(() => {
            this.hoverStates.set(id, false);
        }, 60);
        this.hoverTimeout.set(id, timeout);
    }
}