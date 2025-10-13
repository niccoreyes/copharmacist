import { useState, useEffect } from "react";
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
  const [formData, setFormData] = useState({
    name: medication?.name || '',
    dosage: medication?.dosage || '',
    frequency: medication?.frequency || '',
    route: medication?.route || '',
    status: medication?.status || 'active',
    startDate: medication?.startDate || new Date().toISOString().split('T')[0],
    endDate: medication?.endDate || '',
    notes: medication?.notes || '',
    labNotes: medication?.labNotes || '',
    quantity: medication?.quantity?.toString() || '',
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
  };

  // Helper to calculate days supply from quantity and frequency
  const calculateDaysSupply = (quantity: number, frequency: string): number | null => {
    const freq = frequency.toUpperCase();
    
    if (freq.includes('QID') || freq.includes('4X')) return quantity / 4;
    if (freq.includes('TID') || freq.includes('3X')) return quantity / 3;
    if (freq.includes('BID') || freq.includes('2X') || freq.includes('TWICE')) return quantity / 2;
    if (freq.includes('OD') || freq.includes('QD') || freq.includes('ONCE') || freq.includes('1X')) return quantity;
    
    const qhMatch = freq.match(/Q(\d+)H/);
    if (qhMatch) {
      const hours = parseInt(qhMatch[1]);
      const dosesPerDay = 24 / hours;
      return quantity / dosesPerDay;
    }
    
    if (freq.includes('WEEKLY') || freq.includes('1X/WEEK')) return quantity * 7;
    const weekMatch = freq.match(/(\d+)X\/WEEK/);
    if (weekMatch) {
      const timesPerWeek = parseInt(weekMatch[1]);
      return (quantity / timesPerWeek) * 7;
    }
    
    const qxdMatch = freq.match(/Q(\d+)D/);
    if (qxdMatch) {
      return quantity * parseInt(qxdMatch[1]);
    }
    
    return null;
  };

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
              <Label htmlFor="dosage">Dosage *</Label>
              <Input
                id="dosage"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                placeholder="e.g., 500mg"
                required
                className="bg-background"
              />
            </div>

            <div>
              <Label htmlFor="frequency">Frequency *</Label>
              <Input
                id="frequency"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                placeholder="e.g., BID, TID"
                required
                className="bg-background"
              />
            </div>

            <div>
              <Label htmlFor="route">Route *</Label>
              <Input
                id="route"
                value={formData.route}
                onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                placeholder="e.g., PO, IV"
                required
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
