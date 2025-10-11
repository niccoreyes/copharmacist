import { Patient } from "@/lib/db";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PatientSelectorProps {
  patients: Patient[];
  selectedPatientId: string | null;
  onPatientChange: (patientId: string) => void;
  onAddPatient: () => void;
}

export const PatientSelector = ({
  patients,
  selectedPatientId,
  onPatientChange,
  onAddPatient,
}: PatientSelectorProps) => {
  return (
    <div className="flex items-center gap-3">
      <Select value={selectedPatientId || undefined} onValueChange={onPatientChange}>
        <SelectTrigger className="w-[300px] bg-card border-border">
          <SelectValue placeholder="Select patient..." />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {patients.map((patient) => (
            <SelectItem key={patient.id} value={patient.id}>
              <div className="flex flex-col items-start">
                <span className="font-medium">{patient.name}</span>
                <span className="text-xs text-muted-foreground">MRN: {patient.mrn}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={onAddPatient} size="icon" className="bg-primary hover:bg-primary/90">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};
