import processDocument from "./documentProcessor.js";
import { Document } from "./documentReader.js";

const document1: Document = {
  id: 1,
  title: "Test Document",
  filePath: "jshbjhbsh",
};

const result1 = await processDocument(document1);
console.log(result1);

const document2: Document = {
  id: 1,
  title: "",
  filePath: "jshbjhbsh",
};
try {
  const result2 = await processDocument(document2);
  console.log(result2);
} catch (error: any) {
  console.log("Processing failed:", error.message);
}
