import { useState } from "react";
import { Input } from "@/components/ui/input";
import * as React from "react";
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
    quantity?: number;
    refillDate?: string;
  }) => void;
}

export const InlineMedicationEntry = React.forwardRef<HTMLInputElement, InlineMedicationEntryProps>(
  ({ patientId, onSave }, ref) => {
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

    // Calculate refill date if quantity and frequency are available
    let refillDate: string | undefined;
    if (parsed.quantity && parsed.frequency) {
      const daysSupply = calculateDaysSupply(parsed.quantity, parsed.frequency);
      if (daysSupply) {
        const refill = new Date();
        refill.setDate(refill.getDate() + daysSupply);
        refillDate = refill.toISOString();
      }
    }

    onSave({
      patientId,
      name: parsed.name,
      dosage: parsed.dosage,
      frequency: parsed.frequency,
      route: parsed.route,
      status,
      startDate: new Date().toISOString(),
      notes: parsed.notes,
      quantity: parsed.quantity,
      refillDate,
    });

    setInput('');
  };

  // Helper to calculate days supply from quantity and frequency
  const calculateDaysSupply = (quantity: number, frequency: string): number | null => {
    const freq = frequency.toUpperCase();
    
    // Extract doses per day from common patterns
    if (freq.includes('QID') || freq.includes('4X')) return quantity / 4;
    if (freq.includes('TID') || freq.includes('3X')) return quantity / 3;
    if (freq.includes('BID') || freq.includes('2X') || freq.includes('TWICE')) return quantity / 2;
    if (freq.includes('OD') || freq.includes('QD') || freq.includes('ONCE') || freq.includes('1X')) return quantity;
    
    // Q4H = 6x/day, Q6H = 4x/day, Q8H = 3x/day, Q12H = 2x/day
    const qhMatch = freq.match(/Q(\d+)H/);
    if (qhMatch) {
      const hours = parseInt(qhMatch[1]);
      const dosesPerDay = 24 / hours;
      return quantity / dosesPerDay;
    }
    
    // Weekly patterns
    if (freq.includes('WEEKLY') || freq.includes('1X/WEEK')) return quantity * 7;
    const weekMatch = freq.match(/(\d+)X\/WEEK/);
    if (weekMatch) {
      const timesPerWeek = parseInt(weekMatch[1]);
      return (quantity / timesPerWeek) * 7;
    }
    
    // Every X days
    const qxdMatch = freq.match(/Q(\d+)D/);
    if (qxdMatch) {
      return quantity * parseInt(qxdMatch[1]);
    }
    
    return null;
  };

    return (
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="relative">
          <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={ref}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Add medication (e.g., "Sevelamer 500mg/tab BID" or "Caltrate Plus OD")'
            className="pl-10 bg-card border-border"
          />
        </div>
      </form>
    );
  }
);
InlineMedicationEntry.displayName = 'InlineMedicationEntry';
