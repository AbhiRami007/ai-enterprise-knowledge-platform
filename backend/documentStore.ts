import validateDocument from "./documentValidator.js";

let documentMap = new Map();

function addDocument(document: any) {
  let isDocValid = validateDocument(document);
  if (isDocValid) {
    documentMap.set(document.id, document);
  } else {
    return "Invalid";
  }
}

function getDocument(id: number) {
  return documentMap.get(id);
}

function hasDocument(id: number) {
  return documentMap.has(id);
}

export default {
  addDocument,
  getDocument,
  hasDocument,
};
