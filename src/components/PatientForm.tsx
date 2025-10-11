import { useState, useEffect } from "react";
import { Patient } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface PatientFormProps {
  patient?: Patient;
  onSave: (patient: Omit<Patient, 'id' | 'createdAt'> & { id?: string }) => void;
  onCancel: () => void;
}

export const PatientForm = ({ patient, onSave, onCancel }: PatientFormProps) => {
  const [formData, setFormData] = useState({
    name: patient?.name || '',
    mrn: patient?.mrn || '',
    dateOfBirth: patient?.dateOfBirth || '',
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter' && e.ctrlKey) {
        handleSubmit(e as any);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(patient?.id && { id: patient.id }),
      ...formData,
    });
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full">
        <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-xl font-semibold text-foreground">
            {patient ? 'Edit Patient' : 'Add Patient'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="name">Patient Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter patient name..."
              required
              autoFocus
              className="bg-background"
            />
          </div>

          <div>
            <Label htmlFor="mrn">Medical Record Number</Label>
            <Input
              id="mrn"
              value={formData.mrn}
              onChange={(e) => setFormData({ ...formData, mrn: e.target.value })}
              placeholder="Optional"
              className="bg-background"
            />
          </div>

          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              placeholder="Optional"
              className="bg-background"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel <span className="text-xs ml-2 text-muted-foreground">(Esc)</span>
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Save <span className="text-xs ml-2 opacity-70">(Ctrl+Enter)</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
