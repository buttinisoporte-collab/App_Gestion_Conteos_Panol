import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { User, CountCycle, WeekStatus, Item } from '../types';

export const dataService = {
  // OBTENER USUARIOS
  async getUsers(): Promise<User[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
      console.error('Error fetching users:', error);
      return[];
    }
  },

  // GUARDAR USUARIO
  async saveUser(user: User): Promise<boolean> {
    try {
      // Usamos setDoc para crear o sobrescribir el documento con el ID del usuario
      await setDoc(doc(db, 'users', user.id), user);
      return true;
    } catch (error) {
      console.error('Error saving user:', error);
      return false;
    }
  },

  // OBTENER EL CONTEO ACTUAL
  async getCurrentCount(): Promise<CountCycle | null> {
    try {
      // Buscamos ciclos donde archived sea false
      const q = query(collection(db, 'count_cycles'), where('archived', '==', false));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return null;
      
      // En NoSQL, el ciclo ya viene con las 'weeks' e 'items' anidados adentro!
      return querySnapshot.docs[0].data() as CountCycle;
    } catch (error) {
      console.error('Error fetching current count:', error);
      return null;
    }
  },

  // GUARDAR UN CICLO COMPLETO (¡Mira qué fácil es en NoSQL!)
  async saveCountCycle(cycle: CountCycle): Promise<boolean> {
    try {
      // Guarda todo el objeto de golpe (Ciclo > Semanas > Ítems) en un solo documento
      await setDoc(doc(db, 'count_cycles', cycle.id), {
        ...cycle,
        archived: false
      });
      return true;
    } catch (error) {
      console.error('Error saving count cycle:', error);
      return false;
    }
  },

  // ARCHIVAR CICLO
  async archiveCountCycle(cycleId: string): Promise<boolean> {
    try {
      const cycleRef = doc(db, 'count_cycles', cycleId);
      await updateDoc(cycleRef, { archived: true });
      return true;
    } catch (error) {
      console.error('Error archiving cycle:', error);
      return false;
    }
  },

  // OBTENER CONTEOS HISTÓRICOS (ARCHIVADOS)
  async getHistoricalCounts(): Promise<CountCycle[]> {
    try {
      // Buscamos los ciclos donde archived sea true
      const q = query(collection(db, 'count_cycles'), where('archived', '==', true));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data() as CountCycle);
    } catch (error) {
      console.error('Error fetching historical counts:', error);
      return
    }  
};