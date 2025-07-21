import {writeHeapSnapshot} from 'v8';

const PROMISE_COUNT = 10_000;
const TIMEOUT_SHORT_MS = 10_000;
const TIMEOUT_LONG_MS = 30_000;

let resolvedCount = 0;

function captureSnapshot(number) {
    console.log(`Capturing heap snapshot: ${number}`);
    writeHeapSnapshot(`./${number}.heapsnapshot`);
}

captureSnapshot(1);

console.log('Creating promises...');
const promises = Array.from({length: PROMISE_COUNT}, (_, i) => i + 1)
    .map(async () => {
        return Promise.race([
            new Promise((resolve) => {
                setTimeout(() => {
                    resolvedCount++;
                    resolve();
                }, TIMEOUT_SHORT_MS);
            }),
            new Promise((resolve) => {
                setTimeout(() => {
                    resolvedCount++;
                    resolve();
                }, TIMEOUT_LONG_MS);
            })
        ]);
    });

captureSnapshot(2);

console.log('Waiting for raced promises to resolve...', resolvedCount);
await Promise.all(promises)
captureSnapshot(3);

console.log('Waiting for long timeout promises to resolve...', resolvedCount);
await new Promise((resolve) => {
    setTimeout(resolve, TIMEOUT_LONG_MS - TIMEOUT_SHORT_MS + 1_000)
});
captureSnapshot(4);

console.log('Done!', resolvedCount);
