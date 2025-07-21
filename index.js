import {writeHeapSnapshot} from 'v8';

const PROMISE_COUNT = 10_000;
const TIMEOUT_SHORT_MS = 10_000;
const TIMEOUT_LONG_MS = 30_000;

function captureSnapshot(number) {
    console.log(`Capturing heap snapshot: ${number}`);
    writeHeapSnapshot(`./${number}.heapsnapshot`);
}

// Grab an initial heap snapshot, before any promises are created.
captureSnapshot(1);

let resolvedCount = 0; // Count of how many promises have resolved.

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

// At this point, all promises have been created, but none have resolved yet.
captureSnapshot(2);

console.log(`Waiting for raced promises to resolve... (Resolved: ${resolvedCount})`);
await Promise.all(promises);

// At this point, the short timeout promises have resolved and can be GC'd, but the long timeout ones haven't.
captureSnapshot(3);

console.log(`Waiting for long timeout promises to resolve... (Resolved: ${resolvedCount})`);
await new Promise((resolve) => {
    setTimeout(resolve, TIMEOUT_LONG_MS - TIMEOUT_SHORT_MS + 1_000)
});

// After waiting for the long timeout promises to resolve, they can also be GC'd.
captureSnapshot(4);

console.log(`Done! (Resolved: ${resolvedCount})`);
