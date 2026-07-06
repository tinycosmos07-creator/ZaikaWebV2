import { useEffect, useState } from 'react';
import { adminApi, apiError } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { AdminLayout, PageHeader } from '../../components/admin/AdminLayout';
import ImageUpload from '../../components/ImageUpload';
import Loader from '../../components/Loader';
import { Save, Settings as SettingsIcon } from 'lucide-react';

const GROUPS = [
  {
    key: 'general',
    label: 'General',
    icon: SettingsIcon,
    fields: [
      { name: 'restaurant_name', label: 'Restaurant Name', type: 'text' },
      { name: 'restaurant_tagline', label: 'Tagline', type: 'text' },
      { name: 'logo_url', label: 'Logo', type: 'image' },
      { name: 'primary_color', label: 'Primary Color', type: 'text' },
    ],
  },
  {
    key: 'contact',
    label: 'Contact',
    icon: SettingsIcon,
    fields: [
      { name: 'contact_email', label: 'Contact Email', type: 'email' },
      { name: 'contact_phone', label: 'Contact Phone', type: 'text' },
      { name: 'whatsapp_number', label: 'WhatsApp Number', type: 'text' },
      { name: 'address', label: 'Address', type: 'textarea' },
    ],
  },
  {
    key: 'delivery',
    label: 'Delivery',
    icon: SettingsIcon,
    fields: [
      { name: 'default_delivery_charge', label: 'Default Delivery Charge', type: 'number' },
      { name: 'free_delivery_threshold', label: 'Free Delivery Threshold', type: 'number' },
      { name: 'min_order_value', label: 'Min Order Value', type: 'number' },
      { name: 'tax_percent', label: 'Tax Percent', type: 'number' },
    ],
  },
  {
    key: 'payment',
    label: 'Payment',
    icon: SettingsIcon,
    fields: [
      { name: 'enable_cod', label: 'Enable COD', type: 'toggle' },
      { name: 'enable_upi', label: 'Enable UPI', type: 'toggle' },
      { name: 'upi_id', label: 'UPI ID', type: 'text' },
      { name: 'enable_razorpay', label: 'Enable Razorpay', type: 'toggle' },
      { name: 'razorpay_key_id', label: 'Razorpay Key ID', type: 'text' },
      { name: 'enable_stripe', label: 'Enable Stripe', type: 'toggle' },
      { name: 'stripe_publishable_key', label: 'Stripe Publishable Key', type: 'text' },
    ],
  },
  {
    key: 'social',
    label: 'Social',
    icon: SettingsIcon,
    fields: [
      { name: 'facebook_url', label: 'Facebook URL', type: 'text' },
      { name: 'instagram_url', label: 'Instagram URL', type: 'text' },
      { name: 'twitter_url', label: 'Twitter URL', type: 'text' },
    ],
  },
  {
    key: 'hours',
    label: 'Hours',
    icon: SettingsIcon,
    fields: [
      { name: 'opening_hours', label: 'Opening Hours', type: 'text' },
      { name: 'footer_text', label: 'Footer Text', type: 'textarea' },
    ],
  },
];

const SECRET_FIELDS = ['razorpay_key_id', 'stripe_publishable_key'];

export default function AdminSettings() {
  const toast = useToast();
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const fetch = () => {
    setLoading(true);
    adminApi.get('/settings.php?all=1')
      .then(({ data }) => {
        const s = data.settings || data.data || data;
        setSettings(s);
      })
      .catch(() => toast(apiError(null, 'Failed to load settings'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []); // eslint-disable-line

  const update = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.put('/settings.php', settings);
      toast('Settings saved', 'success');
    } catch (err) {
      toast(apiError(err, 'Save failed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleSecret = (field: string) => {
    setRevealed(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) return <AdminLayout title="Settings"><Loader /></AdminLayout>;

  return (
    <AdminLayout title="Settings">
      <PageHeader title="Settings" action={
        <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50">
          <Save size={16} /> {saving ? 'Saving...' : 'Save All'}
        </button>
      } />

      <div className="grid gap-5 lg:grid-cols-2">
        {GROUPS.map(group => (
          <div key={group.key} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-neutral-900">
              <group.icon size={18} className="text-brand-500" />
              {group.label}
            </h3>
            <div className="space-y-3">
              {group.fields.map(field => {
                const val = settings[field.name];
                if (field.type === 'image') {
                  return (
                    <div key={field.name}>
                      <ImageUpload value={val || ''} onChange={url => update(field.name, url)} label={field.label} />
                    </div>
                  );
                }
                if (field.type === 'toggle') {
                  return (
                    <div key={field.name}>
                      <label className="flex items-center justify-between">
                        <span className="label mb-0">{field.label}</span>
                        <input type="checkbox" checked={val === '1' || val === 1 || val === true} onChange={e => update(field.name, e.target.checked ? '1' : '0')} className="accent-brand-500 h-5 w-5" />
                      </label>
                    </div>
                  );
                }
                if (field.type === 'textarea') {
                  return (
                    <div key={field.name}>
                      <label className="label">{field.label}</label>
                      <textarea value={val || ''} onChange={e => update(field.name, e.target.value)} rows={2} className="input" />
                    </div>
                  );
                }
                const isSecret = SECRET_FIELDS.includes(field.name);
                return (
                  <div key={field.name}>
                    <label className="label">{field.label}</label>
                    <div className="relative">
                      <input
                        type={isSecret && !revealed[field.name] ? 'password' : field.type === 'number' ? 'number' : 'text'}
                        value={val || ''}
                        onChange={e => update(field.name, e.target.value)}
                        className="input"
                        placeholder={isSecret && !revealed[field.name] && val ? '••••••••' : ''}
                      />
                      {isSecret && (
                        <button type="button" onClick={() => toggleSecret(field.name)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-500 hover:text-brand-600">
                          {revealed[field.name] ? 'Hide' : 'Show'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-end">
        <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50">
          <Save size={16} /> {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </AdminLayout>
  );
}
