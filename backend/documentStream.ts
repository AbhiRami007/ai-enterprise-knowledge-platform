import fs from "fs";

const stream = fs.createReadStream("./backend/sample.txt");

stream.on("data", (chunk) => {
  console.log("Received chunk:", chunk);
});

stream.on("end", () => {
  console.log("Finished reading file");
});

stream.on("error", (error) => {
  console.error("Stream error:", error.message);
});
