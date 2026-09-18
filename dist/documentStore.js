import validateDocument from "./documentValidator.js";
let documentMap = new Map();
function addDocument(document) {
    let isDocValid = validateDocument(document);
    if (isDocValid) {
        documentMap.set(document.id, document);
    }
    else {
        return "Invalid";
    }
}
function getDocument(id) {
    return documentMap.get(id);
}
function hasDocument(id) {
    return documentMap.has(id);
}
export default {
    addDocument,
    getDocument,
    hasDocument,
};
