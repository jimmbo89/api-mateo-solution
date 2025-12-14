const async_hooks = require('async_hooks');

const asyncLocalStorage = new async_hooks.AsyncLocalStorage();

function runWithUser(user_id, callback) {
    asyncLocalStorage.run({ user_id }, callback);
}

function getUserId() {
    const store = asyncLocalStorage.getStore();
    return store ? store.user_id : null;
}

module.exports = { runWithUser, getUserId };
