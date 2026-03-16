import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DeviceService } from '../shared/services/util/device.service';

export const mobileRedirectGuard: CanActivateFn = async (route, state) => {
    const deviceService = inject(DeviceService);
    const router = inject(Router);

    try {
        const deviceData = await deviceService.getDeviceData();
        
        // Se for mobile (nativo), redirecionar para login
        if (deviceData.isNative && deviceData.deviceType === 'mobile') {
            router.navigate(['/account/login']);
            return false;
        }
        
        // Se for web, permitir acesso à rota home
        return true;
    } catch (error) {
        console.error('Erro ao verificar dispositivo no guard:', error);
        // Em caso de erro, permitir acesso padrão
        return true;
    }
};
