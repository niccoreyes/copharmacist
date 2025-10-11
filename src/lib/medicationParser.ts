export interface ParsedMedication {
  name: string;
  dosage: string;
  frequency: string;
  route: string;
}

export function parseMedicationString(input: string): ParsedMedication {
  const trimmed = input.trim();
  
  // Extract route (IV, IM, PO, etc.) - default to PO
  let route = 'PO';
  const routeMatch = trimmed.match(/\b(IV|IM|PO|SC|SL|PR|TOP|INH)\b/i);
  if (routeMatch) {
    route = routeMatch[1].toUpperCase();
  }
  
  // Extract frequency (BID, TID, QID, OD, QD, PRN, etc.)
  let frequency = '';
  const freqMatch = trimmed.match(/\b(BID|TID|QID|OD|QD|QHS|Q\d+H|PRN|DAILY|ONCE DAILY|TWICE DAILY|THREE TIMES DAILY|FOUR TIMES DAILY)\b/i);
  if (freqMatch) {
    frequency = freqMatch[1].toUpperCase();
  }
  
  // Extract dosage (numbers with units like mg, g, ml, tab, etc.)
  let dosage = '';
  const dosageMatch = trimmed.match(/(\d+\.?\d*\s*(mg|g|mcg|ml|tab|tabs|tablet|tablets|unit|units|cc|iu|meq)(\s*\/\s*(tab|tablet|ml|dose))?)/i);
  if (dosageMatch) {
    dosage = dosageMatch[1].trim();
  }
  
  // Extract medication name (everything before the dosage or frequency)
  let name = trimmed;
  if (dosageMatch) {
    name = trimmed.substring(0, dosageMatch.index).trim();
  } else if (freqMatch) {
    name = trimmed.substring(0, freqMatch.index).trim();
  } else if (routeMatch) {
    name = trimmed.substring(0, routeMatch.index).trim();
  }
  
  // Clean up name
  name = name.replace(/\s+/g, ' ').trim();
  
  return {
    name: name || trimmed,
    dosage: dosage || '',
    frequency: frequency || '',
    route,
  };
}
