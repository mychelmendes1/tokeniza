import { Injectable } from '@angular/core';
import BigNumber from 'bignumber.js';

declare const fbq: Function;

@Injectable({
  providedIn: 'root'
})
export class PixelService {
  
  private ensurePixelLoaded(): boolean {
    if (typeof fbq !== 'function') {
      console.warn('Facebook Pixel não carregado.');
      return false;
    }
    return true;
  }

  trackPurchase(info: { name: string; value: number | string; taxValue?: number | string }): void {
    if (!this.ensurePixelLoaded()) return;

    const amount = new BigNumber(info.value).minus(info.taxValue || 0).toNumber();

    fbq('track', 'Purchase', {
      content_ids: [info.name],
      value: amount,
      currency: 'BRL',
      utm_source: localStorage.getItem('utm_source'),
      utm_medium: localStorage.getItem('utm_medium'),
      utm_campaign: localStorage.getItem('utm_campaign'),
      utm_term: localStorage.getItem('utm_term'),
      utm_content: localStorage.getItem('utm_content')
    });
  }

  trackLead(info?: { contentName?: string }): void {
    if (!this.ensurePixelLoaded()) return;

    fbq('track', 'Lead', {
      content_name: info?.contentName || 'lead_form',
      utm_source: localStorage.getItem('utm_source'),
      utm_medium: localStorage.getItem('utm_medium'),
      utm_campaign: localStorage.getItem('utm_campaign'),
      utm_term: localStorage.getItem('utm_term'),
      utm_content: localStorage.getItem('utm_content')
    });
  }

  trackViewContent(info: { name: string; value?: number | string }): void {
    if (!this.ensurePixelLoaded()) return;

    fbq('track', 'ViewContent', {
      content_ids: [info.name],
      value: info.value ? new BigNumber(info.value).toNumber() : undefined,
      currency: 'BRL',
      utm_source: localStorage.getItem('utm_source'),
      utm_medium: localStorage.getItem('utm_medium'),
      utm_campaign: localStorage.getItem('utm_campaign'),
      utm_term: localStorage.getItem('utm_term'),
      utm_content: localStorage.getItem('utm_content')
    });
  }
}
