import { api } from './api';
import type { Settings } from '../types';

let cachedSettings: Settings | null = null;
let fetchPromise: Promise<Settings> | null = null;

const DEFAULTS: Settings = {
  restaurant_name: 'Zaika Lounge',
  restaurant_tagline: 'Authentic Flavours, Modern Comfort.',
  contact_email: 'zaikalounge@gmail.com',
  contact_phone: '+91 7678311885',
  whatsapp_number: '917678311885',
  address: '334, Delhi Haridwar Road, Rampur Tiraha, Muzaffarnagar, Uttar Pradesh 251002',
  default_delivery_charge: '40.00',
  free_delivery_threshold: '499.00',
  tax_percent: '5.00',
  currency_code: 'INR',
  currency_symbol: '₹',
  min_order_value: '99.00',
  enable_cod: '1',
  enable_upi: '1',
  enable_whatsapp_order: '1',
  opening_hours: '11:00 AM - 11:00 PM',
  footer_text: '© 2026 Zaika Lounge. All rights reserved.',
};

export async function fetchSettings(force = false): Promise<Settings> {
  if (cachedSettings && !force) return cachedSettings;
  if (fetchPromise && !force) return fetchPromise;

  fetchPromise = api.get('/settings.php')
    .then(({ data }): Settings => {
      if (data?.success && data.settings) {
        cachedSettings = { ...DEFAULTS, ...data.settings };
      } else {
        cachedSettings = DEFAULTS;
      }
      return cachedSettings as Settings;
    })
    .catch((): Settings => {
      cachedSettings = DEFAULTS;
      return cachedSettings as Settings;
    });

  return fetchPromise;
}

export function getSettings(): Settings {
  return cachedSettings || DEFAULTS;
}

export function money(amount: number | string): string {
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  const symbol = getSettings().currency_symbol || '₹';
  return `${symbol}${val.toFixed(2)}`;
}

export function effectivePrice(product: { price: number | string; discount_price?: number | string | null }): number {
  const price = parseFloat(String(product.price));
  if (product.discount_price !== null && product.discount_price !== undefined && product.discount_price !== '') {
    const discount = parseFloat(String(product.discount_price));
    if (discount > 0 && discount < price) return discount;
  }
  return price;
}
