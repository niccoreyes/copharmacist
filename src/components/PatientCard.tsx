import { Patient, Medication } from "@/lib/db";
import { MedicationList } from "@/components/MedicationList";
import { InlineMedicationEntry } from "@/components/InlineMedicationEntry";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PatientCardProps {
  patient: Patient;
  medications: Medication[];
  onSaveMedication: (medData: {
    patientId: string;
    name: string;
    dosage: string;
    frequency: string;
    route: string;
    status: 'active' | 'discontinued' | 'prn';
    startDate: string;
    endDate?: string;
    notes?: string;
    labNotes?: string;
    quantity?: number;
    refillDate?: string;
  }) => void;
  onEditMedication: (medication: Medication) => void;
  onDeleteMedication: (id: string) => void;
  onDeletePatient: (id: string) => void;
  onToggleMedicationStatus: (medication: Medication) => void;
  filter: string;
  addEntryRef?: React.Ref<HTMLInputElement>;
}

export const PatientCard = ({
  patient,
  medications,
  onSaveMedication,
  onEditMedication,
  onDeleteMedication,
  onDeletePatient,
  onToggleMedicationStatus,
  filter,
  addEntryRef,
}: PatientCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const medCount = medications.length;
  const activeCount = medications.filter(m => m.status === 'active').length;

  return (
    <>
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
              size="icon"
              variant="ghost"
              onClick={() => setShowDeleteDialog(true)}
              className="hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-4">
            <InlineMedicationEntry
              patientId={patient.id}
              onSave={onSaveMedication}
              ref={addEntryRef}
            />
            <MedicationList
              medications={medications}
              onEdit={onEditMedication}
              onDelete={onDeleteMedication}
              onToggleStatus={onToggleMedicationStatus}
              filter={filter}
            />
          </CardContent>
        )}
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {patient.name}? This will also delete all {medCount} medication(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDeletePatient(patient.id);
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
