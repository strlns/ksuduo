// Keep the original random diagnostics and console puzzle drawings in Node.
globalThis.IS_DEVELOPMENT = true;
globalThis.LOG_LEVEL = process.argv.includes('--verbose') ? 2 : 1;

// Browser console.assert only logs; a failing CLI diagnostic must fail the run.
console.assert = (condition, ...message) => {
    if (!condition) throw new Error(message.join(' ') || 'Assertion failed');
};
