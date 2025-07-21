# promise-memory-usage-demo

Demo exploring how JS promises utilise memory, and how they can lead to high memory consumption when used with a common pattern for implementing timeouts.


## Context

A common pattern to set a timeout to a `Promise` in JavaScript is to use `Promise.race()` against a `Timeout`. That might look something like this:

```javascript
const promiseWithTimeout = (promise, timeout) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out')), timeout))
  ]);
}
```

This is a useful pattern, but it can lead to high memory consumption if you are doing a lot of async work:
1. Promises and the closure it references are not eligible for garbage collection until the `Promise` is settled (either resolved or rejected).
2. The Promise which loses the race doesn't get settled (resolved or rejected), but continues to run.


## Scripts

### `index.js`

This script highlights the memory usage of the above pattern. It creates a large number of Promises that are raced against timeouts. Memory snapshots are taken at various points to illustrate the memory usage:

![Snapshot sizes](./img/snapshot_sizes_1.png)

1. Snapshot 1: Initial memory usage before any Promises are created.
2. Snapshot 2: After creating a large number of Promises, memory usage increases significantly.
3. Snapshot 3: Memory usage is significantly higher than in snapshot 1, despite the fact that our batch of work has apparently completed. Because the Promises that resolve after a timeout have not been settled, they are still in memory - we have a lot of references along the lines of: `GC root -> stuff -> Timeout -> Promise -> closure`
4. After waiting for the Timeouts to complete, the memory usage drops close to that in snapshot 1, as the Timeout Promises are now eligible for garbage collection.


### `index-abortController.js`

This script demonstrates a more memory-efficient approaches, using `AbortController` to cancel the slow Timeouts once the fast ones complete. The snapshots look more like this:

![Snapshot sizes](./img/snapshot_sizes_2.png)

1. Snapshot 1: Initial memory usage before any Promises are created.
2. Snapshot 2: After creating a large number of Promises, memory usage increases significantly.
3. Snapshot 3: Memory usage drops back to around the level of snapshot 1, as all the Promises are eligible for garbage collection.

Note that the memory usage in snapshot 2 is higher than that in `index.js`, since we create an extra `AbortController` instance for each pair of Promises. This more than doubles the memory usage in this simple demo, but would have a relatively small impact in a real-world application. 

### `index-clearTimeout.js`

Another more memory-efficient approach, this time using `clearTimeout to cancel the Timeouts.
