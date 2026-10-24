// In-memory fake data for endpoints the backend doesn't have yet.
// Field names and types match the backend's DocumentEntity, so these shapes
// are the contract the real endpoints must follow. sizeBytes is a string
// because Postgres bigint columns come back as strings.

const daysAgo = (days) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

function makeDocument(fields) {
  return {
    errorMessage: null,
    updatedAt: fields.createdAt,
    ...fields,
  };
}

export const documents = [
  makeDocument({
    id: "6f1d2c3a-4b5e-4f60-8a71-0b2c3d4e5f60",
    title: "Employee Handbook 2026",
    originalFilename: "employee-handbook-2026.pdf",
    mimeType: "application/pdf",
    sizeBytes: "2483712",
    status: "ready",
    createdAt: daysAgo(42),
  }),
  makeDocument({
    id: "7a2e3d4b-5c6f-4071-9b82-1c3d4e5f6071",
    title: "Security Policy",
    originalFilename: "security-policy-v3.docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    sizeBytes: "318464",
    status: "ready",
    createdAt: daysAgo(30),
  }),
  makeDocument({
    id: "8b3f4e5c-6d70-4182-8c93-2d4e5f607182",
    title: "Q3 Engineering Roadmap",
    originalFilename: "q3-roadmap.pdf",
    mimeType: "application/pdf",
    sizeBytes: "1048576",
    status: "ready",
    createdAt: daysAgo(14),
  }),
  makeDocument({
    id: "9c405f6d-7e81-4293-9da4-3e5f60718293",
    title: "Onboarding Checklist",
    originalFilename: "onboarding.md",
    mimeType: "text/markdown",
    sizeBytes: "12288",
    status: "ready",
    createdAt: daysAgo(9),
  }),
  makeDocument({
    id: "ad516071-8f92-43a4-8eb5-4f60718293a4",
    title: "Incident Postmortem — Payments Outage",
    originalFilename: "postmortem-payments.pdf",
    mimeType: "application/pdf",
    sizeBytes: "524288",
    status: "failed",
    errorMessage: "Could not extract text: the PDF is password-protected.",
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  }),
  makeDocument({
    id: "be627182-90a3-44b5-9fc6-50718293a4b5",
    title: "Vendor Contract — Cloud Hosting",
    originalFilename: "vendor-contract.pdf",
    mimeType: "application/pdf",
    sizeBytes: "3670016",
    status: "processing",
    createdAt: daysAgo(0.05),
  }),
  makeDocument({
    id: "cf738293-a1b4-45c6-80d7-618293a4b5c6",
    title: "Travel Expense Policy",
    originalFilename: "travel-expenses.txt",
    mimeType: "text/plain",
    sizeBytes: "8192",
    status: "pending",
    createdAt: daysAgo(0.01),
  }),
];

// Text passages ("chunks") of the ready documents, as the processing worker
// will produce them. Search returns chunks, not whole documents.
const HANDBOOK = "6f1d2c3a-4b5e-4f60-8a71-0b2c3d4e5f60";
const SECURITY = "7a2e3d4b-5c6f-4071-9b82-1c3d4e5f6071";
const ROADMAP = "8b3f4e5c-6d70-4182-8c93-2d4e5f607182";
const ONBOARDING = "9c405f6d-7e81-4293-9da4-3e5f60718293";

export const chunks = [
  {
    id: "c1a00001-0000-4000-8000-000000000001",
    documentId: HANDBOOK,
    text: "Full-time employees accrue 25 days of paid vacation per calendar year. Up to 5 unused vacation days can be carried over into the next year.",
  },
  {
    id: "c1a00001-0000-4000-8000-000000000002",
    documentId: HANDBOOK,
    text: "Vacation requests should be submitted in the HR portal at least two weeks in advance and approved by your manager.",
  },
  {
    id: "c1a00001-0000-4000-8000-000000000003",
    documentId: HANDBOOK,
    text: "Employees may work remotely up to three days per week. Core collaboration hours are 10:00 to 15:00 in your local time zone.",
  },
  {
    id: "c1a00001-0000-4000-8000-000000000004",
    documentId: HANDBOOK,
    text: "Parental leave is 16 weeks at full pay for all parents, available within the first year after birth or adoption.",
  },
  {
    id: "c1a00002-0000-4000-8000-000000000001",
    documentId: SECURITY,
    text: "Passwords must be at least 12 characters long. Use a password manager and never reuse a password across services.",
  },
  {
    id: "c1a00002-0000-4000-8000-000000000002",
    documentId: SECURITY,
    text: "Multi-factor authentication is required for email, the VPN and every production system.",
  },
  {
    id: "c1a00002-0000-4000-8000-000000000003",
    documentId: SECURITY,
    text: "Report a lost laptop or a suspected security incident to the security team within one hour, even outside working hours.",
  },
  {
    id: "c1a00002-0000-4000-8000-000000000004",
    documentId: SECURITY,
    text: "Customer data must never be copied to personal devices or shared through personal email or chat accounts.",
  },
  {
    id: "c1a00003-0000-4000-8000-000000000001",
    documentId: ROADMAP,
    text: "Q3 priority one: launch semantic search across all uploaded documents, with results ranked by relevance.",
  },
  {
    id: "c1a00003-0000-4000-8000-000000000002",
    documentId: ROADMAP,
    text: "Q3 priority two: an AI assistant that answers questions from company documents and cites its sources.",
  },
  {
    id: "c1a00003-0000-4000-8000-000000000003",
    documentId: ROADMAP,
    text: "Reliability goal for Q3: 99.9% uptime for the API and document processing finished within five minutes of upload.",
  },
  {
    id: "c1a00004-0000-4000-8000-000000000001",
    documentId: ONBOARDING,
    text: "In your first week: set up your laptop, enable multi-factor authentication and meet your onboarding buddy.",
  },
  {
    id: "c1a00004-0000-4000-8000-000000000002",
    documentId: ONBOARDING,
    text: "Request access to the code repository and the VPN through the IT help desk on your first day.",
  },
  {
    id: "c1a00004-0000-4000-8000-000000000003",
    documentId: ONBOARDING,
    text: "Read the employee handbook and the security policy before the end of your first week.",
  },
];
