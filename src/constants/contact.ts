/**
 * Contact form constants
 */

export const SUBJECT_OPTIONS = [
  { value: "general", labelKey: "contact.subjects.general" },
  { value: "article", labelKey: "contact.subjects.article" },
  { value: "collaboration", labelKey: "contact.subjects.collaboration" },
  { value: "event", labelKey: "contact.subjects.event" },
  { value: "technical", labelKey: "contact.subjects.technical" },
  { value: "other", labelKey: "contact.subjects.other" },
] as const;

export type ContactSubject = (typeof SUBJECT_OPTIONS)[number]["value"];
