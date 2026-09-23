import { db, isFirebaseConfigured } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SettingsData } from '../types';

const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'global';
const LOCAL_SETTINGS_KEY = 'panol_settings';

export const defaultSettings: SettingsData = {
  companyName: 'Gestión de Pañol',
  logoUrl: '',
  loginLogoUrl: '',
  predefinedObservations: [
    'Diferencia de conteo',
    'Material dañado',
    'Ubicación incorrecta',
    'Sin código legible'
  ]
};

export const settingsService = {
  // OBTENER LA CONFIGURACIÓN
  async getSettings(): Promise<SettingsData | null> {
    // 1. Si Firebase está configurado, intentar obtener desde Firestore con timeout
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 6000)
        );
        const docSnap = await Promise.race([getDoc(docRef), timeoutPromise]);

        if (docSnap && docSnap.exists()) {
          const data = docSnap.data() as SettingsData;
          try {
            localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(data));
          } catch {
            // ignore localStorage quota
          }
          return data;
        }
      } catch {
        // En caso de offline o timeout, continuar silenciosamente al almacenamiento local
      }
    }

    // 2. Almacenamiento local (offline-first)
    try {
      const localData = localStorage.getItem(LOCAL_SETTINGS_KEY);
      if (localData) {
        return JSON.parse(localData) as SettingsData;
      }
    } catch {
      // ignore JSON parse error
    }

    // 3. Si no existe, guardar valores por defecto
    try {
      localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(defaultSettings));
    } catch {
      // ignore
    }

    return defaultSettings;
  },

  // ACTUALIZAR O CREAR LA CONFIGURACIÓN
  async updateAllSettings(settings: SettingsData): Promise<boolean> {
    // 1. Guardar siempre inmediatamente en almacenamiento local
    try {
      localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Error guardando configuración local:', e);
    }

    // 2. Si Firebase está disponible, sincronizar en segundo plano
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        await setDoc(docRef, settings, { merge: true });
      } catch (error) {
        console.warn('No se pudo sincronizar configuración con Firebase:', error);
      }
    }

    return true;
  }
};
