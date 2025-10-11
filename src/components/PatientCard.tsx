import { Patient, Medication } from "@/lib/db";
import { MedicationList } from "@/components/MedicationList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";

interface PatientCardProps {
  patient: Patient;
  medications: Medication[];
  onAddMedication: (patientId: string) => void;
  onEditMedication: (medication: Medication) => void;
  onDeleteMedication: (id: string) => void;
  filter: string;
}

export const PatientCard = ({
  patient,
  medications,
  onAddMedication,
  onEditMedication,
  onDeleteMedication,
  filter,
}: PatientCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const medCount = medications.length;
  const activeCount = medications.filter(m => m.status === 'active').length;

  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-3 flex-1 text-left group"
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">{patient.name}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                {patient.mrn && <span>MRN: {patient.mrn}</span>}
                {patient.dateOfBirth && <span>DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}</span>}
                <span className="text-accent font-medium">
                  {activeCount} active • {medCount} total
                </span>
              </div>
            </div>
          </button>
          <Button
            size="sm"
            onClick={() => onAddMedication(patient.id)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Med
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <MedicationList
            medications={medications}
            onEdit={onEditMedication}
            onDelete={onDeleteMedication}
            filter={filter}
          />
        </CardContent>
      )}
    </Card>
  );
};
