import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-bottom-nav',
    standalone: true,
    imports: [CommonModule, RouterModule, MatIconModule],
    templateUrl: './bottom-nav.component.html',
    styleUrl: './bottom-nav.component.scss'
})
export class BottomNavComponent { }


