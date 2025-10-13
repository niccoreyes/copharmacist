// IndexedDB utilities for medication management

export interface Patient {
  id: string;
  name: string;
  // mrn was previously stored but is no longer used. Keep optional for compatibility with old imports.
  mrn?: string;
  dateOfBirth: string;
  createdAt: string;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  status: 'active' | 'discontinued' | 'prn';
  startDate: string;
  endDate?: string;
  notes: string;
  labNotes: string;
  quantity?: number; // Number dispensed (e.g., from #5)
  refillDate?: string; // Calculated refill date
  createdAt: string;
  updatedAt: string;
}

const DB_NAME = 'MedicationReconciliationDB';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains('patients')) {
      const patientStore = database.createObjectStore('patients', { keyPath: 'id' });
      // Don't create an index on mrn since it's no longer used. Keep the field optional on the interface for
      // compatibility when importing older exports that may include mrn.
      }

      if (!database.objectStoreNames.contains('medications')) {
        const medStore = database.createObjectStore('medications', { keyPath: 'id' });
        medStore.createIndex('patientId', 'patientId', { unique: false });
        medStore.createIndex('status', 'status', { unique: false });
      }
    };
  });
};

export const addPatient = async (patient: Patient): Promise<void> => {
  const database = db || await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['patients'], 'readwrite');
    const store = transaction.objectStore('patients');
    const request = store.add(patient);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAllPatients = async (): Promise<Patient[]> => {
  const database = db || await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['patients'], 'readonly');
    const store = transaction.objectStore('patients');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const updatePatient = async (patient: Patient): Promise<void> => {
  const database = db || await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['patients'], 'readwrite');
    const store = transaction.objectStore('patients');
    const request = store.put(patient);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const deletePatient = async (id: string): Promise<void> => {
  const database = db || await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['patients'], 'readwrite');
    const store = transaction.objectStore('patients');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const addMedication = async (medication: Medication): Promise<void> => {
  const database = db || await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['medications'], 'readwrite');
    const store = transaction.objectStore('medications');
    const request = store.add(medication);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getMedicationsByPatient = async (patientId: string): Promise<Medication[]> => {
  const database = db || await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['medications'], 'readonly');
    const store = transaction.objectStore('medications');
    const index = store.index('patientId');
    const request = index.getAll(patientId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const updateMedication = async (medication: Medication): Promise<void> => {
  const database = db || await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['medications'], 'readwrite');
    const store = transaction.objectStore('medications');
    const request = store.put(medication);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const deleteMedication = async (id: string): Promise<void> => {
  const database = db || await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['medications'], 'readwrite');
    const store = transaction.objectStore('medications');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const exportData = async (): Promise<string> => {
  const patients = await getAllPatients();
  const database = db || await initDB();
  
  const allMedications: Medication[] = await new Promise((resolve, reject) => {
    const transaction = database.transaction(['medications'], 'readonly');
    const store = transaction.objectStore('medications');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  // Strip mrn field from exported patients to avoid re-introducing unused field on import
  const exportedPatients = patients.map(p => {
    const { mrn, ...rest } = p as Patient;
    return rest as Omit<Patient, 'mrn'>;
  });

  return JSON.stringify({ patients: exportedPatients, medications: allMedications }, null, 2);
};

export const importData = async (jsonData: string): Promise<void> => {
  const data = JSON.parse(jsonData);
  const database = db || await initDB();

  const transaction = database.transaction(['patients', 'medications'], 'readwrite');
  const patientStore = transaction.objectStore('patients');
  const medStore = transaction.objectStore('medications');

  for (const patient of data.patients) {
  // Ensure imported patient objects do not include mrn to avoid storing unused field
  const { mrn, ...patientWithoutMrn } = patient as Patient;
    await new Promise((resolve, reject) => {
      const request = patientStore.put(patientWithoutMrn);
      request.onsuccess = () => resolve(null);
      request.onerror = () => reject(request.error);
    });
  }

  for (const medication of data.medications) {
    await new Promise((resolve, reject) => {
      const request = medStore.put(medication);
      request.onsuccess = () => resolve(null);
      request.onerror = () => reject(request.error);
    });
  }
};
