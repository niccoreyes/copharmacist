import { useState } from "react";
import { Input } from "@/components/ui/input";
import { parseMedicationString } from "@/lib/medicationParser";
import { Plus } from "lucide-react";

interface InlineMedicationEntryProps {
  patientId: string;
  onSave: (medData: {
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
  }) => void;
}

export const InlineMedicationEntry = ({ patientId, onSave }: InlineMedicationEntryProps) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const parsed = parseMedicationString(input);
    
    // Determine status based on frequency
    let status: 'active' | 'discontinued' | 'prn' = 'active';
    if (parsed.frequency.toUpperCase().includes('PRN')) {
      status = 'prn';
    }

    onSave({
      patientId,
      name: parsed.name,
      dosage: parsed.dosage,
      frequency: parsed.frequency,
      route: parsed.route,
      status,
      startDate: new Date().toISOString(),
    });

    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="relative">
        <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Add medication (e.g., "Sevelamer 500mg/tab BID" or "Caltrate Plus OD")'
          className="pl-10 bg-card border-border"
        />
      </div>
    </form>
  );
};
