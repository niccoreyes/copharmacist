import { useState, useEffect, useCallback } from "react";

// Top-level helper to calculate days supply from quantity and frequency
function calculateDaysSupply(quantity: number, frequency: string): number | null {
  const freq = frequency.toUpperCase().trim();

  // Common abbreviations
  if (freq.includes('QID') || /4X/.test(freq)) return quantity / 4; // 4 times/day
  if (freq.includes('TID') || /3X/.test(freq)) return quantity / 3; // 3 times/day
  if (freq.includes('BID') || /2X/.test(freq) || /TWICE/.test(freq)) return quantity / 2; // 2 times/day
  if (freq.includes('OD') || freq.includes('QD') || freq.includes('ONCE') || /1X(?!\/)/.test(freq) || /^ONCE$/.test(freq)) return quantity; // once daily

  // QnH -> every n hours
  const qhMatch = freq.match(/Q(\d+)H/);
  if (qhMatch) {
    const hours = parseInt(qhMatch[1], 10);
    if (hours > 0) {
      const dosesPerDay = 24 / hours;
      return quantity / dosesPerDay;
    }
  }

  // QnD -> every n days (dose every n days)
  const qxdMatch = freq.match(/Q(\d+)D/);
  if (qxdMatch) {
    const days = parseInt(qxdMatch[1], 10);
    if (days > 0) return quantity * days;
  }

  // Every N days/weeks/months (e.g., Every 2 weeks)
  const everyMatch = freq.match(/EVERY\s+(\d+)\s*(DAY|DAYS|WEEK|WEEKS|MONTH|MONTHS)/);
  if (everyMatch) {
    const n = parseInt(everyMatch[1], 10);
    const unit = everyMatch[2];
    if (unit.startsWith('DAY')) return quantity * n;
    if (unit.startsWith('WEEK')) return quantity * n * 7;
    if (unit.startsWith('MONTH')) return quantity * n * 30;
  }

  // Weekly / Xx/week / twice weekly / 3x/week
  if (freq.includes('WEEKLY') || /WEEK/.test(freq)) {
    // alternating patterns like "2x / 3x weekly"
    const altMatch = freq.match(/(\d+)\s*X?\s*\/\s*(\d+)\s*X?.*WEEK/);
    if (altMatch) {
      const a = parseInt(altMatch[1], 10);
      const b = parseInt(altMatch[2], 10);
      const avgPerWeek = (a + b) / 2;
      if (avgPerWeek > 0) return (quantity / avgPerWeek) * 7;
    }

    const timesMatch = freq.match(/(\d+)\s*X(?:\/WEEK|\s*WEEK)/);
    if (timesMatch) {
      const timesPerWeek = parseInt(timesMatch[1], 10);
      if (timesPerWeek > 0) return (quantity / timesPerWeek) * 7;
    }

    if (/TWICE\s+WEEKLY|TWICE\s+WEEK/.test(freq) || /TWO\s*X\s*WEEK/.test(freq) || /2X\/WEEK/.test(freq)) {
      return (quantity / 2) * 7;
    }

    // "Weekly" with no explicit count => 1x/week
    if (/WEEKLY|WEEK/.test(freq)) return quantity * 7;
  }

  // Monthly
  if (/MONTHLY|MONTH/.test(freq)) {
    // "0,1,6 months" or series - not a regular dosing schedule
    if (/\d+,?\d*,?\d*/.test(freq) && freq.includes(',')) return null;
    return quantity * 30;
  }

  // Once or single-dose events
  if (/ONCE|SINGLE|ONE\s*TIME|ONETIME/.test(freq)) return quantity;

  // Patterns like "Each HD x10 doses" or "Each HD x10" — treat as course/series (unknown daily rate)
  if (/HD|HEMODIALYSIS|EACH HD/.test(freq) && /X\s*\d+/.test(freq)) return null;

  // Series schedules (vaccines) like "0,1,6 months", "4-dose schedule" — not calculable here
  if (/DOSE|SCHEDULE|BOOSTER|SERIES|MONTHS?/.test(freq) && /,|\bDOSE\b|SCHEDULE|BOOSTER|SERIES/.test(freq)) return null;

  // Fallback: try to parse simple "Nx/day" or numeric prefixes
  const perDayMatch = freq.match(/(\d+)\s*X\s*(?:DAILY|DAY|D)/);
  if (perDayMatch) {
    const perDay = parseInt(perDayMatch[1], 10);
    if (perDay > 0) return quantity / perDay;
  }

  return null; // unknown/unsupported pattern
}
import { Medication } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface MedicationFormProps {
  medication?: Medication;
  patientId: string;
  onSave: (medication: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  onCancel: () => void;
}

export const MedicationForm = ({ medication, patientId, onSave, onCancel }: MedicationFormProps) => {
  

  // Calculate initial end date if medication has quantity and frequency
  const calculateEndDate = (startDate: string, quantity?: number, frequency?: string): string => {
    if (!quantity || !frequency) return '';
    const daysSupply = calculateDaysSupply(quantity, frequency);
    if (!daysSupply) return '';
    const end = new Date(startDate);
    end.setDate(end.getDate() + daysSupply);
    return end.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    name: medication?.name || '',
    dosage: medication?.dosage || '',
    frequency: medication?.frequency || '',
    route: medication?.route || '',
    status: medication?.status || 'active',
    startDate: medication?.startDate ? new Date(medication.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    endDate: medication?.endDate ? new Date(medication.endDate).toISOString().split('T')[0] : calculateEndDate(
      medication?.startDate || new Date().toISOString(),
      medication?.quantity,
      medication?.frequency
    ),
    notes: medication?.notes || '',
    labNotes: medication?.labNotes || '',
    quantity: medication?.quantity?.toString() || '',
  });

  const handleSubmit = useCallback((e?: React.FormEvent | KeyboardEvent) => {
    if (e && 'preventDefault' in e && typeof e.preventDefault === 'function') e.preventDefault();
    
    // Calculate refill date if quantity and frequency are available
    let refillDate: string | undefined = medication?.refillDate;
    if (formData.quantity && formData.frequency) {
      const qty = parseInt(formData.quantity);
      if (!isNaN(qty)) {
        const daysSupply = calculateDaysSupply(qty, formData.frequency);
        if (daysSupply) {
          const refill = new Date(formData.startDate);
          refill.setDate(refill.getDate() + daysSupply);
          refillDate = refill.toISOString();
        }
      }
    }
    
    onSave({
      ...(medication?.id && { id: medication.id }),
      ...formData,
      patientId,
      status: formData.status as 'active' | 'discontinued' | 'prn',
      quantity: formData.quantity ? parseInt(formData.quantity) : undefined,
      refillDate,
    });
  }, [formData, medication, patientId, onSave]);

  // Attach keyboard shortcuts after handleSubmit is declared
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter' && e.ctrlKey) {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, handleSubmit, onCancel]);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            {medication ? 'Edit Medication' : 'Add Medication'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Medication Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoFocus
                className="bg-background"
              />
            </div>

            <div>
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                placeholder="e.g., 500mg"
                className="bg-background"
              />
            </div>

            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Input
                id="frequency"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                placeholder="e.g., BID, TID"
                className="bg-background"
              />
            </div>

            <div>
              <Label htmlFor="route">Route</Label>
              <Input
                id="route"
                value={formData.route}
                onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                placeholder="e.g., PO, IV"
                className="bg-background"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'discontinued' | 'prn' })}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                  <SelectItem value="prn">PRN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="bg-background"
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="bg-background"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="quantity">Quantity Dispensed</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="e.g., 30"
                className="bg-background"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">General Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="bg-background resize-none"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="labNotes" className="text-warning-foreground">Lab Notes</Label>
              <Textarea
                id="labNotes"
                value={formData.labNotes}
                onChange={(e) => setFormData({ ...formData, labNotes: e.target.value })}
                placeholder="Notable lab values, monitoring requirements..."
                rows={3}
                className="bg-background resize-none"
              />
            </div>
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
