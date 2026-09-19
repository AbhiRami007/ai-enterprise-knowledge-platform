import { Worker } from "worker_threads";

console.log("Main thread started");

const worker = new Worker("./dist/cpuWorker.js");

worker.on("message", (result) => {
  console.log("Worker finished:", result);
});

worker.on("error", (error: any) => {
  console.error("Worker error:", error.message);
});

console.log("Main thread is still responsive");

setInterval(() => {
  console.log("Main thread heartbeat");
}, 1000);
