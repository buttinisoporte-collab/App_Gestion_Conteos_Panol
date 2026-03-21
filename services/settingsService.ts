import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SettingsData } from '../types';

// Usaremos un único documento llamado 'global' dentro de la colección 'settings'
const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'global';

export const settingsService = {
  
  // OBTENER LA CONFIGURACIÓN
  async getSettings(): Promise<SettingsData | null> {
    try {
      // Referencia exacta al documento 'global'
      const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as SettingsData;
      }
      
      console.log('No se encontraron settings, se usarán los valores por defecto.');
      return null;
    } catch (error) {
      console.error('Error al obtener los settings de Firebase:', error);
      return null;
    }
  },

  // ACTUALIZAR O CREAR LA CONFIGURACIÓN
  async updateAllSettings(settings: SettingsData): Promise<boolean> {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
      
      // setDoc con { merge: true } es clave: 
      // Si el documento no existe, lo crea. Si existe, solo actualiza los campos que le pasamos
      // sin borrar otros campos que pudieran existir.
      await setDoc(docRef, settings, { merge: true });
      
      return true;
    } catch (error) {
      console.error('Error al actualizar los settings en Firebase:', error);
      return false;
    }
  }
};