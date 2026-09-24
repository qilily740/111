(() => {
  'use strict';

  // Large Ideal Machine records live in IndexedDB. A memory cache keeps the
  // existing synchronous App APIs working while the browser storage layer is
  // migrated in the background.
  const dataDatabaseName = 'ideal-machine-data';
  const imageDatabaseName = 'ideal-machine-images';
  const dataStoreName = 'records';
  const imageStoreName = 'images';
  const largeKeys = new Set([
    'ideal-machine-chat',
    'ideal-machine-settings',
    'ideal-machine-worldbooks',
    'ideal-machine-worldbook-analyses',
    'ideal-machine-memory-library',
    'ideal-machine-ta-groups',
    'ideal-machine-ta-npcs',
    'ideal-machine-album-v1',
    'ideal-machine-books',
    'ideal-machine-couple',
    'ideal-machine-forum',
    'ideal-machine-magazine',
    'ideal-machine-fanfic',
    'ideal-machine-debate',
    'ideal-machine-ifshikong',
    'ideal-machine-shopping',
    'ideal-machine-calendar-events'
  ]);
  const nativeGet = Storage.prototype.getItem;
  const nativeSet = Storage.prototype.setItem;
  const nativeRemove = Storage.prototype.removeItem;
  const cache = new Map();
  let dataDb = null;
  let imageDb = null;
  let patched = false;
  let quotaNoticeShown = false;

  function openDatabase(name, storeName) {
    if (!window.indexedDB) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName, { keyPath:'key' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB 打开失败'));
      request.onblocked = () => reject(new Error('IndexedDB 被其他页面占用'));
    });
  }

  function readAll(db, storeName) {
    if (!db) return Promise.resolve([]);
    return new Promise((resolve, reject) => {
      const request = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error || new Error('IndexedDB 读取失败'));
    });
  }

  function writeRecord(db, storeName, key, value) {
    if (!db) return Promise.reject(new Error('IndexedDB 不可用'));
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).put({ key, value });
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error || new Error('IndexedDB 保存失败'));
      transaction.onabort = () => reject(transaction.error || new Error('IndexedDB 保存被中止'));
    });
  }

  function deleteRecord(db, storeName, key) {
    if (!db) return Promise.resolve(false);
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).delete(key);
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error || new Error('IndexedDB 删除失败'));
    });
  }

  function emitStorageError(error, key) {
    window.dispatchEvent(new CustomEvent('ideal-machine-storage-error', { detail:{ error, key } }));
    const message = String(error?.message || error || '').toLowerCase();
    if (!quotaNoticeShown && (error?.name === 'QuotaExceededError' || message.includes('quota') || message.includes('storage'))) {
      quotaNoticeShown = true;
      window.alert('理想机本地存储空间不足。请先导出数据，再清理旧图片、旧聊天或朋友圈记录。');
      window.setTimeout(() => { quotaNoticeShown = false; }, 10000);
    }
  }

  function patchStorage() {
    if (patched) return;
    patched = true;
    Storage.prototype.getItem = function(key) {
      const name = String(key);
      if (this === localStorage && largeKeys.has(name) && cache.has(name)) return cache.get(name);
      return nativeGet.call(this, key);
    };
    Storage.prototype.setItem = function(key, value) {
      const name = String(key);
      if (this === localStorage && largeKeys.has(name)) {
        const serialized = String(value);
        cache.set(name, serialized);
        writeRecord(dataDb, dataStoreName, name, serialized)
          .then(() => nativeRemove.call(this, name))
          .catch(error => emitStorageError(error, name));
        return;
      }
      return nativeSet.call(this, key, value);
    };
    Storage.prototype.removeItem = function(key) {
      const name = String(key);
      if (this === localStorage && largeKeys.has(name)) {
        cache.delete(name);
        deleteRecord(dataDb, dataStoreName, name).catch(error => emitStorageError(error, name));
        return;
      }
      return nativeRemove.call(this, key);
    };
  }

  async function prepare() {
    try {
      dataDb = await openDatabase(dataDatabaseName, dataStoreName);
      imageDb = await openDatabase(imageDatabaseName, imageStoreName);
      const records = await readAll(dataDb, dataStoreName);
      const stored = new Map(records.map(item => [String(item.key), String(item.value ?? '')]));
      for (const key of largeKeys) {
        const localValue = nativeGet.call(localStorage, key);
        // A local copy is the newest source during first migration. Once it is
        // copied successfully, the browser no longer needs the large string.
        if (localValue !== null) {
          cache.set(key, localValue);
          if (dataDb) await writeRecord(dataDb, dataStoreName, key, localValue);
          nativeRemove.call(localStorage, key);
        } else if (stored.has(key)) {
          cache.set(key, stored.get(key));
        }
      }
    } catch (error) {
      // If IndexedDB is unavailable, preserve the original localStorage path.
      console.warn('[Ideal] 本地大数据存储初始化失败，继续使用浏览器原存储：', error);
    }
    if (dataDb) patchStorage();
    window.IdealMachineStorage = {
      ready:true,
      databaseName:dataDatabaseName,
      imageDatabaseName:imageDatabaseName,
      largeKeys:[...largeKeys],
      get(key, fallback = null) { const value = cache.get(String(key)); return value == null ? fallback : value; },
      async save(key, value) { const name = String(key); const serialized = typeof value === 'string' ? value : JSON.stringify(value); cache.set(name, serialized); return writeRecord(dataDb, dataStoreName, name, serialized); },
      async remove(key) { cache.delete(String(key)); return deleteRecord(dataDb, dataStoreName, String(key)); },
      async getImage(key) { if (!imageDb) return null; const rows = await new Promise((resolve, reject) => { const request = imageDb.transaction(imageStoreName, 'readonly').objectStore(imageStoreName).get(String(key)); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); return rows?.value ?? null; },
      async saveImage(key, value) { return writeRecord(imageDb, imageStoreName, String(key), value); },
      async removeImage(key) { return deleteRecord(imageDb, imageStoreName, String(key)); }
    };
  }

  window.IdealMachineStorageReady = prepare();
})();
