import processDocument from "./documentProcessor.js";

const document1 = {
  id: 1,
  title: "Test Document",
};

const result1 = await processDocument(document1);
console.log(result1);

const document2 = {
  id: 1,
};
try {
  const result2 = await processDocument(document2);
  console.log(result2);
} catch (error) {
  console.log("Processing failed:", error.message);
}
