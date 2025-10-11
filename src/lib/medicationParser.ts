export interface ParsedMedication {
  name: string;
  dosage: string;
  frequency: string;
  route: string;
}

export function parseMedicationString(input: string): ParsedMedication {
  const trimmed = input.trim();

  // Helpers
  const toUpper = (s: string) => s.toUpperCase();
  const WORD_NUMS: Record<string, string> = {
    one: '1', once: '1', two: '2', twice: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
  };

  // ROUTE detection - default PO, map descriptive phrases to standard codes
  let route = 'PO';
  const routeMap: Array<{ re: RegExp; val: string }> = [
    { re: /\b(intravenous|iv\b|i\.v\.)/i, val: 'IV' },
    { re: /\b(intramuscular(ly)?|im\b|i\.m\.)/i, val: 'IM' },
    { re: /\b(subcutaneous(ly)?|sc\b|s\.c\.)/i, val: 'SC' },
    { re: /\b(sublingual|sl\b|s\.l\.)/i, val: 'SL' },
    { re: /\b(rectal|per rectum|pr\b|p\.r\.)/i, val: 'PR' },
    { re: /\b(oral(ly)?|by mouth|po\b|p\.o\.)/i, val: 'PO' },
    { re: /\b(topical(ly)?|apply|ointment|lotion|cream|ung\b|top\b)/i, val: 'TOP' },
    { re: /\b(inhal(ation|e|ed)|neb|nebuliz(ed|er)|inh\b)/i, val: 'INH' },
    { re: /\b(nasal\s*cannula|intranasal|nasal)/i, val: 'INH' },
  ];
  for (const m of routeMap) {
    if (m.re.test(trimmed)) { route = m.val; break; }
  }

  // FREQUENCY detection - capture many common patterns
  let frequency = '';
  const freqPatterns: Array<{ re: RegExp; map?: (m: RegExpMatchArray) => string }> = [
    // Standard abbreviations
    { re: /\b(OD|QD)\b/i, map: (m) => 'OD' },
    { re: /\b(BID)\b/i, map: (m) => 'BID' },
    { re: /\b(TID)\b/i, map: (m) => 'TID' },
    { re: /\b(QID)\b/i, map: (m) => 'QID' },
    { re: /\b(QHS|HS)\b/i, map: () => 'QHS' },
    { re: /\b(ODHS)\b/i, map: () => 'OD HS' },
    { re: /\b(PRN)\b/i, map: () => 'PRN' },
    { re: /\b(STAT)\b/i, map: () => 'STAT' },
  // Every X hours: every 4 hours, every 12 h, q4h, q12h
    { re: /\b(?:every|q)\s*(\d{1,2})\s*(h|hr|hrs|hour|hours)\b/i, map: (m) => `Q${m[1]}H` },
  // Every X days/weeks/months: "every 2 weeks", "q3d", "q2wk", "q1mo"
  { re: /\b(?:every|q)\s*(\d{1,2})\s*(d|day|days)\b/i, map: (m) => `Q${m[1]}D` },
  { re: /\b(?:every|q)\s*(\d{1,2})\s*(w|wk|wks|week|weeks)\b/i, map: (m) => `Q${m[1]}W` },
  { re: /\b(?:every|q)\s*(\d{1,2})\s*(mo|mos|month|months)\b/i, map: (m) => `Q${m[1]}M` },
  // Shorthand without space: q2w, q2wk, q2mo
  { re: /\bq\s*(\d{1,2})\s*(w|wk|wks)\b/i, map: (m) => `Q${m[1]}W` },
  { re: /\bq\s*(\d{1,2})\s*(mo|mos|m)\b/i, map: (m) => `Q${m[1]}M` },
  { re: /\bq\s*(\d{1,2})\s*(d|day|days)\b/i, map: (m) => `Q${m[1]}D` },
  // Every other day/week: qod/eod, every other day, every other week
  { re: /\b(qod|eod|every\s+other\s+day)\b/i, map: () => 'QOD' },
  { re: /\b(every\s+other\s+(week|wk|w))\b/i, map: () => 'Q2W' },
  { re: /\b(biweekly)\b/i, map: () => 'Q2W' },
  { re: /\b(bimonthly)\b/i, map: () => 'Q2M' },
    // X times a day variants: 3x/day, 3x a day, THREE times a day
    { re: /\b(\d)\s*x\s*(?:\/|per|a)?\s*(?:day|d)\b/i, map: (m) => ({ '1': 'OD', '2': 'BID', '3': 'TID', '4': 'QID' }[m[1]] || `${m[1]}x/day`) },
    { re: /\b(one|two|three|four)\s+times\s+(?:a|per)\s+day\b/i, map: (m) => ({ one: 'OD', two: 'BID', three: 'TID', four: 'QID' }[m[1].toLowerCase()] || `${m[1]}x/day`) },
    { re: /\b(once|twice)\s+(?:a|per)?\s*day\b/i, map: (m) => ({ once: 'OD', twice: 'BID' }[m[1].toLowerCase()]) },
    // Times per week: 1x a week, 3x/week, 2x a wk
    { re: /\b(\d)\s*x\s*(?:\/|a|per)?\s*(?:week|wk)\b/i, map: (m) => `${m[1]}x/week` },
    { re: /\b(once|twice|three)\s+(?:a|per)\s*(?:week|wk)\b/i, map: (m) => ({ once: '1x/week', twice: '2x/week', three: '3x/week' }[m[1].toLowerCase()]!) },
    // Weekly/monthly single frequency
    { re: /\b(weekly|every\s*week)\b/i, map: () => '1x/week' },
    { re: /\b(monthly|once\s+a\s*month)\b/i, map: () => '1x/month' },
    // Complex schedules we keep as-is (e.g., weekdays/weekends)
    { re: /\bOD\s+weekdays\s*;?\s*BID\s+weekends\b/i, map: (m) => 'OD weekdays; BID weekends' },
    // Specific phrases: at night, before bedtime
    { re: /\b(at\s+night|before\s+bed(?:time)?)\b/i, map: () => 'QHS' },
  ];
  for (const f of freqPatterns) {
    const m = trimmed.match(f.re);
    if (m) { frequency = f.map ? f.map(m) : toUpper(m[0]); break; }
  }

  // PRN often accompanies a base frequency like every 4 hours
  if (/\bPRN\b/i.test(trimmed)) {
    frequency = frequency ? `${frequency} PRN` : 'PRN';
  }

  // Doses schedule patterns like vaccines (0,1,6 months)
  if (!frequency) {
    const doseSeries = trimmed.match(/\b(\d+\s*doses?)\b.*?\b(?:at\s*)?(0\s*,\s*1\s*,\s*6|\d+[\s,]+\d+(?:[\s,]+\d+)*)\s*months?/i);
    if (doseSeries) {
      frequency = `${doseSeries[1]} at ${doseSeries[2]} months`.replace(/\s+/g, ' ');
    }
  }

  // Extract dosage - include wide variety (e.g., 500mg/tab, 37.5 mg/325, 20mcg/mL, 1 sachet, 1 tab, 1 mL)
  let dosage = '';
  const dosageRegexes: RegExp[] = [
    /(\b\d+\.?\d*\s*(mg|g|mcg|iu|ml|mL|meq)\s*\/\s*\d*\.?\d*\s*(mL|ml|mg|g)\b)/i, // 20mcg/mL
    /(\b\d+\.?\d*\s*(mg|g|mcg|iu)\b(?:\s*\/\s*\d+\.?\d*\s*(mg|g))?)/i,          // 37.5 mg/325
    /(\b\d+\s*(?:tab(?:s|let|lets)?|cap(?:s|sule|sules)?|sachet(?:s)?|tablet(?:s)?|capsule(?:s)?|dose|unit(?:s)?|mL|ml|cc)\b)/i, // 1 tab, 1 capsule
    /(\b\d+\.?\d*\s*(?:mg|g|mcg|iu|meq)\b)/i,                                         // 500mg
  ];
  let dosageMatch: RegExpMatchArray | null = null;
  for (const r of dosageRegexes) {
    const m = trimmed.match(r);
    if (m) { dosageMatch = m; dosage = m[1].trim(); break; }
  }

  // Extract medication name (everything before the first clear dosage/frequency/route cue)
  let name = trimmed;
  // Identify first cue index
  const indices: number[] = [];
  if (dosageMatch) indices.push(trimmed.indexOf(dosageMatch[0]));
  for (const f of freqPatterns) {
    const m = trimmed.match(f.re);
    if (m) { indices.push(trimmed.indexOf(m[0])); break; }
  }
  for (const m of routeMap) {
    const rm = trimmed.match(m.re);
    if (rm) { indices.push(trimmed.indexOf(rm[0])); break; }
  }
  if (indices.length) {
    const cut = Math.min(...indices);
    name = trimmed.substring(0, cut).replace(/[#:;,-]+\s*$/,'').trim();
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
