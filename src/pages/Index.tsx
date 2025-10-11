import { useState, useEffect } from "react";
import { Patient, Medication, initDB, getAllPatients, addPatient, updatePatient, deletePatient, addMedication, getMedicationsByPatient, updateMedication, deleteMedication, exportData, importData } from "@/lib/db";
import { PatientSelector } from "@/components/PatientSelector";
import { MedicationList } from "@/components/MedicationList";
import { MedicationForm } from "@/components/MedicationForm";
import { PatientForm } from "@/components/PatientForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Upload, Plus, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | undefined>();
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    initDB().then(loadPatients);
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      loadMedications(selectedPatientId);
    }
  }, [selectedPatientId]);

  const loadPatients = async () => {
    const allPatients = await getAllPatients();
    setPatients(allPatients);
    if (allPatients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(allPatients[0].id);
    }
  };

  const loadMedications = async (patientId: string) => {
    const meds = await getMedicationsByPatient(patientId);
    setMedications(meds);
  };

  const handleSavePatient = async (patientData: Omit<Patient, 'id' | 'createdAt'> & { id?: string }) => {
    const now = new Date().toISOString();
    if (patientData.id) {
      await updatePatient({ ...patientData as Patient });
    } else {
      const newPatient: Patient = {
        id: crypto.randomUUID(),
        ...patientData,
        createdAt: now,
      };
      await addPatient(newPatient);
      setSelectedPatientId(newPatient.id);
    }
    await loadPatients();
    setShowPatientForm(false);
    toast({ title: "Patient saved successfully" });
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
    if (selectedPatientId) {
      await loadMedications(selectedPatientId);
    }
    setShowMedicationForm(false);
    setEditingMedication(undefined);
    toast({ title: "Medication saved successfully" });
  };

  const handleDeleteMedication = async (id: string) => {
    if (confirm("Delete this medication?")) {
      await deleteMedication(id);
      if (selectedPatientId) {
        await loadMedications(selectedPatientId);
      }
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
        await loadPatients();
        toast({ title: "Data imported successfully" });
      }
    };
    input.click();
  };

  const filteredMedications = medications.filter((med) =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.dosage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Medication Reconciliation</h1>
              <p className="text-sm text-muted-foreground">Patient medication management system</p>
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
        <div className="mb-6 flex items-center justify-between gap-4">
          <PatientSelector
            patients={patients}
            selectedPatientId={selectedPatientId}
            onPatientChange={setSelectedPatientId}
            onAddPatient={() => setShowPatientForm(true)}
          />

          {selectedPatientId && (
            <Button onClick={() => setShowMedicationForm(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Medication
              <span className="text-xs ml-2 opacity-70">(Ctrl+N)</span>
            </Button>
          )}
        </div>

        {selectedPatientId && (
          <>
            <div className="mb-6 flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search medications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card border-border"
                />
              </div>

              <Tabs value={filter} onValueChange={setFilter}>
                <TabsList className="bg-muted">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="prn">PRN</TabsTrigger>
                  <TabsTrigger value="discontinued">Discontinued</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <MedicationList
              medications={filteredMedications}
              onEdit={handleEditMedication}
              onDelete={handleDeleteMedication}
              filter={filter}
            />
          </>
        )}

        {!selectedPatientId && patients.length === 0 && (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-foreground mb-2">No patients yet</h2>
            <p className="text-muted-foreground mb-6">Add a patient to start managing medications</p>
            <Button onClick={() => setShowPatientForm(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Patient
            </Button>
          </div>
        )}
      </main>

      {showMedicationForm && selectedPatientId && (
        <MedicationForm
          medication={editingMedication}
          patientId={selectedPatientId}
          onSave={handleSaveMedication}
          onCancel={() => {
            setShowMedicationForm(false);
            setEditingMedication(undefined);
          }}
        />
      )}

      {showPatientForm && (
        <PatientForm
          onSave={handleSavePatient}
          onCancel={() => setShowPatientForm(false)}
        />
      )}
    </div>
  );
};

export default Index;
