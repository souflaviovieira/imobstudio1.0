import { PortalPreset } from '../types';

export const PORTAL_PRESETS: PortalPreset[] = [
    {
        id: 'OLX',
        name: 'OLX Brasil',
        width: 1280, // Recommended width
        maxSizeBytes: 5 * 1024 * 1024, // 5MB limit
        watermarkAllowed: true
    },
    {
        id: 'ZAP',
        name: 'Zap Imóveis',
        width: 1920,
        maxSizeBytes: 10 * 1024 * 1024,
        watermarkAllowed: true
    },
    {
        id: 'VIVAREAL',
        name: 'VivaReal',
        width: 1920,
        maxSizeBytes: 10 * 1024 * 1024,
        watermarkAllowed: true
    }
];

export const getPreset = (id: string) => PORTAL_PRESETS.find(p => p.id === id);
