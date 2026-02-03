// const {
//   Worker, isMainThread, parentPort, workerData
// } = require('worker_threads');

// if (isMainThread) {
//   module.exports = function parseJSAsync(script) {
//     return new Promise((resolve, reject) => {
//       const worker = new Worker("./worker/worker.js", {
//         workerData: script
//       });
//       worker.on('message', resolve);
//       worker.on('error', reject);
//       worker.on('exit', (code) => {
//         if (code !== 0)
//           reject(new Error(`Worker stopped with exit code ${code}`));
//       });
//     });
//   };
// } else {
//   const { parse } = require('some-js-parsing-library');
//   const script = workerData;
//   parentPort.postMessage(parse(script));
// }

const { fork } = require('child_process')

setTimeout(() => {
  console.log(
    '\x1b[34m%s\x1b[0m',
    `forking started.....`,
  )
  const child = fork("./worker/worker.js")


  child.on("message", (result) => console.log(
    '\x1b[32m%s\x1b[0m',
    `for ${result}`,
  ))

  child.on('error', (error) => console.log(
    '\x1b[31m%s\x1b[0m',
    `for ${error}`,
  ))

  child.on('close', () => child.kill())
}, 60000)


