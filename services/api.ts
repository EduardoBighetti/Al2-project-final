
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { db, auth } from '../firebase';
import { User, Sensor, Reading, AccessKey } from '../types';

// TEST MODE CONFIGURATION
const TEST_MODE_KEY = 'al2_iot_test_mode';

export const testModeService = {
  isActive: (): boolean => {
    return localStorage.getItem(TEST_MODE_KEY) === 'true';
  },
  toggle: (active: boolean): void => {
    localStorage.setItem(TEST_MODE_KEY, String(active));
    window.location.reload(); // Reload to reset all listeners
  }
};

// MOCK DATA FOR TEST MODE
const MOCK_USER: User = {
  id: 1,
  username: 'Eduardo',
  full_name: 'Eduardo Teste',
  email: 'eduardo@teste.com',
  role: 'gerencia',
  created_at: new Date().toISOString()
};

const MOCK_SENSORS: Sensor[] = [
  { id: 101, identifier: 'SN-TEST-01', name: 'Sensor Teste 01', status: 'active', token: 'test-token-01', last_seen: new Date().toISOString() },
  { id: 102, identifier: 'SN-TEST-02', name: 'Sensor Teste 02', status: 'active', token: 'test-token-02', last_seen: new Date().toISOString() }
];

const generateMockReadings = (sensorId: number, count: number): Reading[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: Math.floor(Math.random() * 100000),
    sensor_id: sensorId,
    temperature: 20 + Math.random() * 10,
    humidity: 40 + Math.random() * 30,
    created_at: new Date(Date.now() - i * 60000).toISOString()
  }));
};

let mockReadings: Reading[] = [
  ...generateMockReadings(101, 20),
  ...generateMockReadings(102, 20)
];

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

// QUOTA EXCEEDED STATE
let isQuotaExceeded = false;
const READINGS_CACHE_KEY = 'al2_readings_cache';
const SENSORS_CACHE_KEY = 'al2_sensors_cache';

export const quotaService = {
  isExceeded: () => isQuotaExceeded,
  setExceeded: (value: boolean) => {
    isQuotaExceeded = value;
    window.dispatchEvent(new CustomEvent('firestore-quota-exceeded', { detail: { exceeded: value } }));
  },
  saveToBackup: (readings: Reading[]) => {
    try {
      localStorage.setItem(READINGS_CACHE_KEY, JSON.stringify(readings));
    } catch (e) {}
  },
  saveSensorsToBackup: (sensors: Sensor[]) => {
    try {
      localStorage.setItem(SENSORS_CACHE_KEY, JSON.stringify(sensors));
    } catch (e) {}
  },
  loadFromBackup: (): Reading[] => {
    try {
      const cached = localStorage.getItem(READINGS_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  },
  loadSensorsFromBackup: (): Sensor[] => {
    try {
      const cached = localStorage.getItem(SENSORS_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  }
};

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Check for quota exceeded
  if (errorMessage.includes('Quota exceeded') || errorMessage.includes('quota metric') || errorMessage.includes('429')) {
    quotaService.setExceeded(true);
    console.warn('Firestore Quota Exceeded:', errorMessage);
    // Return gracefully instead of throwing to avoid component crashes
    return; 
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface SystemLog {
  id?: string;
  user_name: string;
  action: string;
  type?: string;
  created_at: string;
}

let MOCK_SYSTEM_LOGS: SystemLog[] = [
  { id: '1', user_name: 'Sistema', action: 'Sistema iniciado em modo de teste', type: 'info', created_at: new Date().toISOString() }
];

export const systemLogService = {
  getLogs: async (): Promise<SystemLog[]> => {
    if (testModeService.isActive()) {
      return MOCK_SYSTEM_LOGS;
    }
    try {
      const q = query(collection(db, 'system_logs'), orderBy('created_at', 'desc'), limit(100));
      const querySnapshot = await getDocs(q);
      const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemLog));
      
      // Filter logs older than 5 days
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      
      return logs.filter(log => new Date(log.created_at) >= fiveDaysAgo);
    } catch (error) {
      console.error("Failed to fetch logs", error);
      return [];
    }
  },
  addLog: async (userName: string, action: string, type: string = 'INFO'): Promise<void> => {
    if (testModeService.isActive()) {
      MOCK_SYSTEM_LOGS.unshift({
        id: Math.random().toString(),
        user_name: userName,
        action,
        type,
        created_at: new Date().toISOString()
      });
      return;
    }
    try {
      await addDoc(collection(db, 'system_logs'), {
        user_name: userName,
        action,
        type,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to add log", error);
    }
  }
};

export const authService = {
  me: async (): Promise<{ user: User | null }> => {
    if (testModeService.isActive()) {
      return { user: MOCK_USER };
    }
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              resolve({ user: userDoc.data() as User });
            } else {
              resolve({ user: null });
            }
          } catch (error) {
            resolve({ user: null });
          }
        } else {
          resolve({ user: null });
        }
      });
    });
  },
  login: async (username: string, password: string, accessKey?: string): Promise<{ user: User }> => {
    const cleanUsername = username.trim();
    
    if (testModeService.isActive()) {
      console.log('[Test Mode] Login bypass active');
      return { user: MOCK_USER };
    }
    
    try {
      let email = cleanUsername;
      let userData: User | null = null;
      
      // Se não for um e-mail, tenta buscar o e-mail associado ao nome de usuário no Firestore
      if (!cleanUsername.includes('@')) {
        // Tenta busca exata primeiro
        let q = query(collection(db, 'users'), where('username', '==', cleanUsername), limit(1));
        let querySnapshot = await getDocs(q);
        
        // Se não encontrar, tenta busca em minúsculo (caso tenha sido salvo assim)
        if (querySnapshot.empty) {
          q = query(collection(db, 'users'), where('username', '==', cleanUsername.toLowerCase()), limit(1));
          querySnapshot = await getDocs(q);
        }

        if (querySnapshot.empty) {
          // DEBUG: List all usernames to help the user find theirs
          const allUsers = await getDocs(collection(db, 'users'));
          const usernames = allUsers.docs.map(d => d.data().username);
          console.log('[DEBUG] Usernames in DB:', usernames);
          
          throw new Error(`Usuário "${cleanUsername}" não encontrado. Verifique se digitou corretamente (letras maiúsculas/minúsculas importam).`);
        }
        
        userData = querySnapshot.docs[0].data() as User;
        email = userData.email || `${cleanUsername}@al2.tecnologia`;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Se ainda não pegamos os dados do usuário (caso tenha logado direto por e-mail)
      if (!userData) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (!userDoc.exists()) {
          throw new Error('Perfil do usuário não encontrado no banco de dados.');
        }
        userData = userDoc.data() as User;
      }
      
      // Validate Access Key
      if (!accessKey) {
        throw new Error('Chave de acesso é obrigatória para entrar no sistema.');
      }
      
      const isValid = await accessKeyService.validate(accessKey, userData.role);
      const staticKeys: Record<string, string> = {
        'gerencia': 'Al2@@',
        'admin': 'AdminAL2',
        'user': 'UserAL2'
      };

      if (!isValid && accessKey !== staticKeys[userData.role]) {
        throw new Error(`A chave "${accessKey}" não é válida para o cargo ${userData.role.toUpperCase()}.`);
      }
      
      return { user: userData };
    } catch (error: any) {
      console.error('[Login Error]', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('Senha incorreta. Tente novamente.');
      }
      throw new Error(error.message || 'Falha no login');
    }
  },
  logout: async (): Promise<void> => {
    await signOut(auth);
  },
  register: async (payload: any): Promise<{ user: User }> => {
    try {
      let firebaseUser;
      try {
        // 1. Create Auth User FIRST
        const userCredential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
        firebaseUser = userCredential.user;
      } catch (authError: any) {
        // Se o e-mail já estiver em uso, tenta fazer login para completar o perfil no Firestore
        if (authError.code === 'auth/email-already-in-use') {
          const loginCredential = await signInWithEmailAndPassword(auth, payload.email, payload.password);
          firebaseUser = loginCredential.user;
        } else {
          throw authError;
        }
      }

      // 2. Validate Access Key if needed
      if (payload.role !== 'user' && payload.access_key) {
        const isValid = await accessKeyService.validate(payload.access_key, payload.role);
        
        const staticKeys: Record<string, string> = {
          'gerencia': 'Al2@@',
          'admin': 'AdminAL2',
          'user': 'UserAL2'
        };

        if (!isValid && payload.access_key !== staticKeys[payload.role]) {
          // Se acabamos de criar o usuário, deletamos para rollback
          // Mas se ele já existia, não deletamos
          throw new Error('Chave de acesso inválida ou já utilizada.');
        }
      }

      // 3. Create User Document
      const newUser: User = {
        id: Math.floor(Math.random() * 10000),
        username: payload.username,
        full_name: payload.full_name,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        created_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

      // 4. Mark key as used
      if (payload.access_key) {
        const q = query(collection(db, 'accessKeys'), where('key', '==', payload.access_key));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const keyDoc = querySnapshot.docs[0];
          await setDoc(keyDoc.ref, { is_used: true }, { merge: true });
        }
      }

      return { user: newUser };
    } catch (error: any) {
      throw new Error(error.message || 'Erro no registro');
    }
  },
  getUsers: async (): Promise<User[]> => {
    if (testModeService.isActive()) {
      return [MOCK_USER];
    }
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
      return [];
    }
  },
  sendFeedback: async (email: string, message: string): Promise<boolean> => {
    try {
      await addDoc(collection(db, 'feedback'), {
        email,
        message,
        created_at: Timestamp.now()
      });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'feedback');
      return false;
    }
  },
  getFeedbacks: async (): Promise<any[]> => {
    try {
      const q = query(collection(db, 'feedback'), orderBy('created_at', 'desc'), limit(100));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'feedback');
      return [];
    }
  },
  updateUser: async (userId: string | number, data: Partial<User>): Promise<void> => {
    try {
      if (typeof userId === 'string') {
        // Assume it's the document ID (Firebase Auth UID)
        await setDoc(doc(db, 'users', userId), data, { merge: true });
      } else {
        // Assume it's the numeric user.id
        const q = query(collection(db, 'users'), where('id', '==', userId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          await setDoc(querySnapshot.docs[0].ref, data, { merge: true });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  },
  deleteUser: async (userId: number): Promise<void> => {
    try {
      const q = query(collection(db, 'users'), where('id', '==', userId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        await deleteDoc(querySnapshot.docs[0].ref);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    }
  }
};

export const accessKeyService = {
  getAll: async (): Promise<AccessKey[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, 'accessKeys'));
      return querySnapshot.docs.map(doc => doc.data() as AccessKey);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'accessKeys');
      return [];
    }
  },
  generate: async (role: 'admin' | 'gerencia' | 'gerente'): Promise<AccessKey> => {
    const newKeyStr = Math.random().toString(36).substring(2, 10).toUpperCase();
    const keyObj: AccessKey = {
      id: Math.floor(Math.random() * 10000),
      key: newKeyStr,
      role,
      is_used: false,
      created_at: new Date().toISOString()
    };
    try {
      await addDoc(collection(db, 'accessKeys'), keyObj);
      return keyObj;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'accessKeys');
      throw error;
    }
  },
  validate: async (key: string, role: string): Promise<boolean> => {
    try {
      const q = query(collection(db, 'accessKeys'), 
        where('key', '==', key), 
        where('role', '==', role), 
        where('is_used', '==', false)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'accessKeys');
      return false;
    }
  },
  delete: async (key: string): Promise<void> => {
    try {
      const q = query(collection(db, 'accessKeys'), where('key', '==', key));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        await deleteDoc(querySnapshot.docs[0].ref);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `accessKeys/${key}`);
      throw error;
    }
  }
};

export const sensorService = {
  getAll: async (): Promise<Sensor[]> => {
    if (testModeService.isActive()) {
      return MOCK_SENSORS;
    }
    try {
      const querySnapshot = await getDocs(collection(db, 'sensors'));
      return querySnapshot.docs.map(doc => doc.data() as Sensor);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'sensors');
      return [];
    }
  },
  subscribeAll: (callback: (sensors: Sensor[]) => void) => {
    if (testModeService.isActive()) {
      callback(MOCK_SENSORS);
      return () => {};
    }
    return onSnapshot(collection(db, 'sensors'), (snapshot) => {
      const sensors = snapshot.docs.map(doc => doc.data() as Sensor);
      quotaService.saveSensorsToBackup(sensors);
      callback(sensors);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'sensors');
      if (quotaService.isExceeded()) {
        callback(quotaService.loadSensorsFromBackup());
      }
    });
  },
  create: async (payload: Partial<Sensor> & { identifier: string; name: string }): Promise<Sensor> => {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Create object and remove undefined fields to avoid Firestore errors
    const sensorData: any = {
      id: Math.floor(Math.random() * 10000),
      identifier: payload.identifier,
      name: payload.name,
      status: 'offline', // Começa offline até o Arduino conectar
      token,
      owner_uid: auth.currentUser?.uid,
      last_seen: null // Nunca visto ainda
    };

    if (payload.temp_limit !== undefined) sensorData.temp_limit = payload.temp_limit;
    if (payload.latitude !== undefined && !isNaN(payload.latitude)) sensorData.latitude = payload.latitude;
    if (payload.longitude !== undefined && !isNaN(payload.longitude)) sensorData.longitude = payload.longitude;
    if (payload.address) sensorData.address = payload.address;
    if (payload.has_alerts !== undefined) sensorData.has_alerts = payload.has_alerts;
    if (payload.alert_limits) sensorData.alert_limits = payload.alert_limits;
    if (payload.monitored_magnitudes) sensorData.monitored_magnitudes = payload.monitored_magnitudes;

    try {
      await setDoc(doc(db, 'sensors', payload.identifier), sensorData);
      return sensorData as Sensor;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `sensors/${payload.identifier}`);
      throw error;
    }
  },
  updateLimit: async (identifier: string, tempLimit: number): Promise<void> => {
    try {
      await updateDoc(doc(db, 'sensors', identifier), {
        temp_limit: tempLimit
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sensors/${identifier}`);
      throw error;
    }
  },
  delete: async (id: number): Promise<void> => {
    // Note: In Firestore we usually use string IDs. If id is number, we need to find the doc.
    try {
      const q = query(collection(db, 'sensors'), where('id', '==', id));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        await deleteDoc(querySnapshot.docs[0].ref);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sensors/${id}`);
    }
  }
};

export const readingService = {
  getLatest: async (sensorId?: number): Promise<Reading[]> => {
    if (testModeService.isActive()) {
      if (sensorId) {
        return mockReadings.filter(r => r.sensor_id === sensorId).slice(0, 20);
      }
      return mockReadings.slice(0, 50);
    }
    try {
      let q;
      if (sensorId) {
        q = query(collection(db, 'readings'), 
          where('sensor_id', '==', sensorId), 
          orderBy('created_at', 'desc'), 
          limit(20)
        );
      } else {
        q = query(collection(db, 'readings'), 
          orderBy('created_at', 'desc'), 
          limit(50)
        );
      }
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Reading);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'readings');
      return [];
    }
  },
  getHistorical: async (startDate: string, endDate: string): Promise<Reading[]> => {
    if (testModeService.isActive()) {
      return mockReadings.filter(r => r.created_at >= startDate && r.created_at <= endDate);
    }
    try {
      const q = query(
        collection(db, 'readings'),
        where('created_at', '>=', startDate),
        where('created_at', '<=', endDate),
        orderBy('created_at', 'asc'),
        limit(1000)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Reading);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'readings/historical');
      return [];
    }
  },
  subscribeLatest: (callback: (readings: Reading[]) => void, sensorId?: number) => {
    if (testModeService.isActive()) {
      callback(sensorId ? mockReadings.filter(r => r.sensor_id === sensorId).slice(0, 20) : mockReadings.slice(0, 50));
      
      const interval = setInterval(() => {
        const targetSensorId = sensorId || (Math.random() > 0.5 ? 101 : 102);
        const newReading: Reading = {
          id: Math.floor(Math.random() * 100000),
          sensor_id: targetSensorId,
          temperature: 20 + Math.random() * 10,
          humidity: 40 + Math.random() * 30,
          created_at: new Date().toISOString()
        };
        mockReadings = [newReading, ...mockReadings].slice(0, 100);
        
        // Update mock sensor last_seen
        const sensorIndex = MOCK_SENSORS.findIndex(s => s.id === targetSensorId);
        if (sensorIndex !== -1) {
          MOCK_SENSORS[sensorIndex].last_seen = new Date().toISOString();
        }
        
        callback(sensorId ? mockReadings.filter(r => r.sensor_id === sensorId).slice(0, 20) : mockReadings.slice(0, 50));
      }, 3000);
      
      return () => clearInterval(interval);
    }
    let q;
    if (sensorId) {
      q = query(collection(db, 'readings'), 
        where('sensor_id', '==', sensorId), 
        orderBy('created_at', 'desc'), 
        limit(20)
      );
    } else {
      q = query(collection(db, 'readings'), 
        orderBy('created_at', 'desc'), 
        limit(50)
      );
    }
    return onSnapshot(q, (snapshot) => {
      const readings = snapshot.docs.map(doc => doc.data() as Reading);
      quotaService.saveToBackup(readings);
      callback(readings);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'readings');
      // On error, emit local backup if it's a quota issue
      if (quotaService.isExceeded()) {
        callback(quotaService.loadFromBackup());
      }
    });
  },
  add: async (identifier: string, temperature: number, humidity?: number): Promise<void> => {
    try {
      // Find sensor by identifier to get its numeric ID
      const q = query(collection(db, 'sensors'), where('identifier', '==', identifier));
      const querySnapshot = await getDocs(q);
      
      let sensorId = 0;
      if (!querySnapshot.empty) {
        sensorId = querySnapshot.docs[0].data().id;
      } else {
        // AUTO-CREATE SENSOR IF NOT EXISTS
        // This ensures the data appears on the dashboard even if not manually registered
        const newSensorId = Math.floor(Math.random() * 10000);
        const newSensor: Sensor = {
          id: newSensorId,
          identifier: identifier,
          name: `Auto: ${identifier}`,
          status: 'active',
          token: 'auto-generated',
          owner_uid: auth.currentUser?.uid,
          last_seen: new Date().toISOString()
        };
        await setDoc(doc(db, 'sensors', identifier), newSensor);
        sensorId = newSensorId;
      }

      const newReading: Reading = {
        id: Math.floor(Math.random() * 1000000),
        sensor_id: sensorId,
        temperature,
        humidity: humidity || 0,
        created_at: new Date().toISOString()
      };

      await addDoc(collection(db, 'readings'), newReading);
      
      // Also update sensor's last_seen
      if (!querySnapshot.empty) {
        await updateDoc(querySnapshot.docs[0].ref, {
          last_seen: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'readings');
    }
  }
};
