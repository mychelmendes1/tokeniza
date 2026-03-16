import { Injectable } from '@angular/core';
import { Device } from '@capacitor/device';
import { DeviceDetectorService } from 'ngx-device-detector';
import { DeviceTypeEnum, UsersDevicesModel } from '../../models/users.devices.model';

@Injectable({
    providedIn: 'root',
})
export class DeviceService {
    public deviceData!: UsersDevicesModel;

    constructor(
        private deviceDetectorService: DeviceDetectorService
    ) { }

    public async getDeviceData(): Promise<UsersDevicesModel> {
        if (this.deviceData) {
            return this.deviceData;
        }

        const deviceModel = new UsersDevicesModel();
        const capacitorInfo = await Device.getInfo();
        const isNative = !capacitorInfo?.platform?.includes('web');
        deviceModel.model = capacitorInfo.model;
        deviceModel.isNative = isNative;
        deviceModel.platform = capacitorInfo?.platform;
        deviceModel.manufacturer = capacitorInfo?.manufacturer;

        if (isNative) { // Android o IOS.
            deviceModel.deviceType = DeviceTypeEnum.MOBILE;
            deviceModel.browser = 'unknown';
            deviceModel.operatingSystem = capacitorInfo?.operatingSystem;
        } else {
            deviceModel.deviceType = DeviceTypeEnum.WEB;
            const device = this.deviceDetectorService.getDeviceInfo();
            deviceModel.browser = device?.browser;
            deviceModel.operatingSystem = device?.os;
        }

        this.deviceData = deviceModel;
        return this.deviceData;
    }
}
