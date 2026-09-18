function saveDocument(document) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                ...document,
                saved: true,
            });
        }, 1000);
    });
}
function generateEmbedding(document) {
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
async function processDocument(document) {
    try {
        const savedDocument = await saveDocument(document);
        const processedDocument = await generateEmbedding(savedDocument);
        return processedDocument;
    }
    catch (error) {
        console.log("Document processing failed:", error.message);
        throw error;
    }
}
export default processDocument;
