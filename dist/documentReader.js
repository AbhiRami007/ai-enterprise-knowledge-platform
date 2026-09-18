import fs from "fs/promises";
const document = {
    id: 1,
    title: "Company Strategy",
    filePath: "./backend/sample.txt",
};
async function readDocument(document) {
    const content = await fs.readFile(document.filePath, "utf8");
    return {
        ...document,
        content,
    };
}
const result = await readDocument(document);
console.log(result);
