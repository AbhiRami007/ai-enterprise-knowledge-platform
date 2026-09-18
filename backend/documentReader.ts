import fs from "fs/promises";

export interface Document {
  id: number;
  title: string;
  filePath: string;
}

const document: Document = {
  id: 1,
  title: "Company Strategy",
  filePath: "./backend/sample.txt",
};

async function readDocument(document: Document) {
  const content = await fs.readFile(document.filePath, "utf8");

  return {
    ...document,
    content,
  };
}

const result = await readDocument(document);

console.log(result);
