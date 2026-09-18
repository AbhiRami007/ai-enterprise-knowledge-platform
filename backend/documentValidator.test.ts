import validateDocument from "./documentValidator.js";

const validDocument = {
  title: "Employee Leave Policy",
  fileType: "pdf",
  size: 500000,
  uploadedBy: "user123",
  status: "pending",
};

console.log("Valid document:", validateDocument(validDocument));

const missingTitle = {
  fileType: "pdf",
  size: 500000,
  uploadedBy: "user123",
  status: "pending",
};

console.log("Missing title:", validateDocument(missingTitle));

const missingSize = {
  title: "Employee Leave Policy",
  fileType: "pdf",
  uploadedBy: "user123",
  status: "pending",
};

console.log("Missing size:", validateDocument(missingSize));
