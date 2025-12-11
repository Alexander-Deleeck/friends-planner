export type DateValidationResult =
  | { valid: true }
  | { valid: false; error: string };

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const validateDateString = (dateStr: string): DateValidationResult => {
  if (!dateStr || typeof dateStr !== 'string') {
    return { valid: false, error: 'Date is required' };
  }

  if (!ISO_DATE_REGEX.test(dateStr)) {
    return { valid: false, error: 'Date must be in YYYY-MM-DD format' };
  }

  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date' };
  }

  // Check if the parsed date matches the input (catches invalid dates like 2025-02-30)
  const [year, month, day] = dateStr.split('-').map(Number);
  if (
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  ) {
    return { valid: false, error: 'Invalid date' };
  }

  return { valid: true };
};

export const validateDateRange = (
  startDate: string,
  endDate: string,
): DateValidationResult => {
  const startValidation = validateDateString(startDate);
  if (!startValidation.valid) {
    return startValidation;
  }

  const endValidation = validateDateString(endDate);
  if (!endValidation.valid) {
    return endValidation;
  }

  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  if (start > end) {
    return { valid: false, error: 'Start date must be before or equal to end date' };
  }

  return { valid: true };
};

export const datesOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string,
): boolean => {
  const s1 = new Date(start1 + 'T00:00:00');
  const e1 = new Date(end1 + 'T00:00:00');
  const s2 = new Date(start2 + 'T00:00:00');
  const e2 = new Date(end2 + 'T00:00:00');

  return s1 <= e2 && s2 <= e1;
};

