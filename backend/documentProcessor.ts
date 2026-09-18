import { Document } from "./documentReader.js";

function saveDocument(document: Document) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...document,
        saved: true,
      });
    }, 1000);
  });
}
function generateEmbedding(document: Document) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (document.title && document.title !== " ") {
        resolve({
          ...document,
          embeddingGenerated: true,
        });
      }
      reject(new Error("Document title is missing"));
    }, 1000);
  });
}

async function processDocument(document: Document) {
  try {
    const savedDocument: any = await saveDocument(document);

    const processedDocument = await generateEmbedding(savedDocument);

    return processedDocument;
  } catch (error: any) {
    console.log("Document processing failed:", error.message);
    throw error;
  }
}

export default processDocument;
