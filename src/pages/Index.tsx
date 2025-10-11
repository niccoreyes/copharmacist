import { useState, useEffect } from "react";
import { Patient, Medication, initDB, getAllPatients, addPatient, updatePatient, deletePatient, addMedication, getMedicationsByPatient, updateMedication, deleteMedication, exportData, importData } from "@/lib/db";
import { PatientCard } from "@/components/PatientCard";
import { MedicationForm } from "@/components/MedicationForm";
import { QuickPatientEntry } from "@/components/QuickPatientEntry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Upload, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [allMedications, setAllMedications] = useState<Map<string, Medication[]>>(new Map());
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | undefined>();
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    initDB().then(loadAllData);
  }, []);

  const loadAllData = async () => {
    const allPatients = await getAllPatients();
    setPatients(allPatients);
    
    const medMap = new Map<string, Medication[]>();
    for (const patient of allPatients) {
      const meds = await getMedicationsByPatient(patient.id);
      medMap.set(patient.id, meds);
    }
    // Sort patients so those with the most recent medication (by updatedAt or createdAt) appear first
    const patientsWithLatest = allPatients.map(p => {
      const meds = medMap.get(p.id) || [];
      // determine latest date among meds
      const latestMedDate = meds.reduce((latest, m) => {
        const d1 = m.updatedAt || m.createdAt;
        return !latest || d1 > latest ? d1 : latest;
      }, '' as string);
      return { patient: p, latestMedDate };
    });

    patientsWithLatest.sort((a, b) => {
      if (a.latestMedDate === b.latestMedDate) return 0;
      if (!a.latestMedDate) return 1; // push patients without meds to end
      if (!b.latestMedDate) return -1;
      return b.latestMedDate.localeCompare(a.latestMedDate);
    });

    const sortedPatients = patientsWithLatest.map(p => p.patient);
    setPatients(sortedPatients);
    setAllMedications(medMap);
  };

  const handleSavePatient = async (patientData: Omit<Patient, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const newPatient: Patient = {
      id: crypto.randomUUID(),
      ...patientData,
      createdAt: now,
    };
    await addPatient(newPatient);
    await loadAllData();
    toast({ title: "Patient added successfully" });
  };

  const handleSaveQuickMedication = async (medData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newMed: Medication = {
      id: crypto.randomUUID(),
      ...medData,
      createdAt: now,
      updatedAt: now,
    };
    await addMedication(newMed);
    await loadAllData();
    toast({ title: "Medication added" });
  };

  const handleSaveMedication = async (medData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const now = new Date().toISOString();
    if (medData.id) {
      await updateMedication({ ...medData as Medication, updatedAt: now });
    } else {
      const newMed: Medication = {
        id: crypto.randomUUID(),
        ...medData,
        createdAt: now,
        updatedAt: now,
      };
      await addMedication(newMed);
    }
    await loadAllData();
    setShowMedicationForm(false);
    setEditingMedication(undefined);
    toast({ title: "Medication saved successfully" });
  };

  const handleDeleteMedication = async (id: string) => {
    if (confirm("Delete this medication?")) {
      await deleteMedication(id);
      await loadAllData();
      toast({ title: "Medication deleted" });
    }
  };

  const handleEditMedication = (med: Medication) => {
    setEditingMedication(med);
    setShowMedicationForm(true);
  };

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medication-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast({ title: "Data exported successfully" });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        await importData(text);
        await loadAllData();
        toast({ title: "Data imported successfully" });
      }
    };
    input.click();
  };

  const filteredPatients = patients.filter((patient) =>
    (patient.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    ((patient.mrn || '') as string).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Medication Reconciliation</h1>
              <p className="text-sm text-muted-foreground">Multi-patient medication management</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleImport} variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <QuickPatientEntry onSave={handleSavePatient} />

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>

            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="bg-muted w-full grid grid-cols-4">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
                <TabsTrigger value="prn" className="text-xs">PRN</TabsTrigger>
                <TabsTrigger value="discontinued" className="text-xs">D/C</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {filteredPatients.length === 0 && patients.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-lg border border-border">
                <h2 className="text-xl font-semibold text-foreground mb-2">No patients yet</h2>
                <p className="text-muted-foreground">Add your first patient using the quick entry form</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-lg border border-border">
                <p className="text-muted-foreground">No patients match your search</p>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  medications={allMedications.get(patient.id) || []}
                  onSaveMedication={handleSaveQuickMedication}
                  onEditMedication={handleEditMedication}
                  onDeleteMedication={handleDeleteMedication}
                  filter={filter}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {showMedicationForm && editingMedication && (
        <MedicationForm
          medication={editingMedication}
          patientId={editingMedication.patientId}
          onSave={handleSaveMedication}
          onCancel={() => {
            setShowMedicationForm(false);
            setEditingMedication(undefined);
          }}
        />
      )}
    </div>
  );
};

export default Index;
