import { useState, useEffect } from "react";
import { Patient } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuickPatientEntryProps {
  onSave: (patient: Omit<Patient, 'id' | 'createdAt'>) => void;
}

export const QuickPatientEntry = ({ onSave }: QuickPatientEntryProps) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave({
        name: name.trim(),
        mrn: '',
        dateOfBirth: '',
      });
      setName('');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'n' && e.ctrlKey) {
        e.preventDefault();
        document.getElementById('quick-patient-name')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Add Patient</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="quick-patient-name" className="sr-only">Patient Name</Label>
            <Input
              id="quick-patient-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter patient name and press Enter..."
              className="bg-background"
            />
          </div>
          <Button type="submit" className="bg-primary hover:bg-primary/90">
            Add
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl+N</kbd> to focus
        </p>
      </CardContent>
    </Card>
  );
};
