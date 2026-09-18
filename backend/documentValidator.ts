export function validateDocument(document: any) {
  if (!document) {
    return false;
  }

  if (document.title === undefined || document.title === null) {
    return false;
  }

  if (document.fileType === undefined || document.fileType === null) {
    return false;
  }

  if (document.size === undefined || document.size === null) {
    return false;
  }

  if (document.uploadedBy === undefined || document.uploadedBy === null) {
    return false;
  }

  if (document.status === undefined || document.status === null) {
    return false;
  }
  return true;
}

export default validateDocument;
