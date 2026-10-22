// Starter lookup values (docs/04-data-model.md § Seed data). Admins maintain them in Maintenance.
export const LOOKUPS = {
  genders: ["Male", "Female", "Prefer not to say"],
  employmentTypes: ["Regular", "Probationary", "Project-Hired", "Consultant"],
  engagementTypes: [
    "Staff Augmentation",
    "One-Lot",
    "Managed Services",
    "Implementation",
    "Maintenance",
  ],
  // Ordered from junior to senior; sortOrder follows this order.
  levels: ["Junior", "Mid", "Senior", "Lead", "Principal"],
  positions: [
    "Software Engineer",
    "QA Engineer",
    "Business Analyst",
    "Project Manager",
    "Technical Consultant",
    "System Administrator",
  ],
} as const;
