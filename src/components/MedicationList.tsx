import { Medication } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MedicationListProps {
  medications: Medication[];
  onEdit: (medication: Medication) => void;
  onDelete: (id: string) => void;
  filter: string;
}

export const MedicationList = ({ medications, onEdit, onDelete, filter }: MedicationListProps) => {
  const filtered = medications.filter((med) => {
    if (filter === 'all') return true;
    return med.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-accent text-accent-foreground';
      case 'discontinued':
        return 'bg-muted text-muted-foreground';
      case 'prn':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="space-y-2">
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No medications found
        </div>
      ) : (
        filtered.map((med) => (
          <div
            key={med.id}
            className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-foreground text-lg">{med.name}</h3>
                  <Badge className={cn("text-xs", getStatusColor(med.status))}>
                    {med.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Dosage:</span>{" "}
                    <span className="text-foreground font-medium">{med.dosage}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Frequency:</span>{" "}
                    <span className="text-foreground font-medium">{med.frequency}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Route:</span>{" "}
                    <span className="text-foreground font-medium">{med.route}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Started:</span>{" "}
                    <span className="text-foreground font-medium">
                      {new Date(med.startDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {med.notes && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-muted-foreground text-sm">Notes:</span>
                    <p className="text-foreground text-sm mt-1">{med.notes}</p>
                  </div>
                )}
                {med.labNotes && (
                  <div className="pt-2 border-t border-border bg-warning/5 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                    <span className="text-warning-foreground text-sm font-medium">Lab Notes:</span>
                    <p className="text-foreground text-sm mt-1">{med.labNotes}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => onEdit(med)}
                  className="hover:bg-primary hover:text-primary-foreground"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => onDelete(med.id)}
                  className="hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
