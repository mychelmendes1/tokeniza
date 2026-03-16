import { Routes } from '@angular/router';
import { AuthGuardService } from './guards/auth-guard.service';
import { RouteGuard } from './guards/route.guard';
import { mobileRedirectGuard } from './guards/mobile-redirect.guard';

export const routes: Routes = [
    {
        path: 'home',
        loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
        canActivate: [mobileRedirectGuard]
    },
    {
        path: 'account',
        loadComponent: () => import('./account/account.component').then((m) => m.AccountComponent),
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'login',
            },
            {
                path: 'login',
                loadComponent: () => import('./account/login/login.component').then((m) => m.LoginComponent)
            },
            {
                path: 'forgot',
                loadComponent: () => import('./account/forgot/forgot.component').then((m) => m.ForgotComponent)
            },
            {
                path: 'sign-up',
                loadComponent: () => import('./account/sign-up/sign-up.component').then((m) => m.SignUpComponent)
            },
            {
                path: 'complete-your-registration',
                loadComponent: () => import('./account/complete-your-registration/complete-your-registration.component').then((m) => m.CompleteYourRegistrationComponent),
                canActivate: [RouteGuard]
            }
        ]
    },
    {
        path: 'profile',
        loadComponent: () => import('./profile/profile.component').then((m) => m.ProfileComponent),
        canActivate: [AuthGuardService]
    },
    {
        path: 'antifraud-approval',
        loadComponent: () =>
            import('./antifraud-approval/antifraud-approval.component').then((m) => m.AntifraudApprovalComponent)
    },
    {
        path: 'crowdfunding',
        loadComponent: () => import('./crowdfunding/crowdfunding.component').then((m) => m.CrowdfundingComponent)
    },
    {
        path: 'crowdfunding/details/:id',
        loadComponent: () => import('./crowdfunding/details/details.component').then((m) => m.DetailsComponent)
    },
    {
        path: 'marketplace',
        loadComponent: () => import('./marketplace/marketplace.component').then((m) => m.MarketplaceComponent),
        canActivate: [AuthGuardService]
    },
    {
        path: 'marketplace/product/:id',
        loadComponent: () => import('./marketplace/product-details/product-details.component').then((m) => m.ProductDetailsComponent),
        canActivate: [AuthGuardService]
    },
    {
        path: 'marketplace/product/:id/checkout',
        loadComponent: () => import('./marketplace/product-details/checkout/checkout.component').then((m) => m.CheckoutComponent),
        canActivate: [AuthGuardService]
    },
    {
        path: 'wallet',
        loadComponent: () => import('./wallet/wallet.component').then((m) => m.WalletComponent),
        canActivate: [AuthGuardService]
    },
    {
        path: 'wallet/extract',
        loadComponent: () => import('./wallet/extract/extract.component').then((m) => m.ExtractComponent),
        canActivate: [AuthGuardService]
    },
    {
        path: 'indications',
        loadComponent: () => import('./indications/indications.component').then((m) => m.IndicationsComponent),
        canActivate: [AuthGuardService]
    },
    {
        path: 'external-deposit',
        loadComponent: () => import('./external-deposit/external-deposit.component').then((m) => m.ExternalDepositComponent),
    },
    {
        path: 'external-deposit/:userId',
        loadComponent: () => import('./external-deposit/external-deposit.component').then((m) => m.ExternalDepositComponent),
    },
    {
        path: 'external-deposit/:userId/:value',
        loadComponent: () => import('./external-deposit/external-deposit.component').then((m) => m.ExternalDepositComponent)
    },
    {
        path: 'income-report',
        loadComponent: () => import('./income-report/income-report.component').then((m) => m.IncomeReportComponent)
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: '**',
        redirectTo: 'home'
    }
];