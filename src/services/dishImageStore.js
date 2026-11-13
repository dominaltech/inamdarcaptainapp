import { supabase } from './supabaseClient';

// Local IndexedDB Storage + One-Time Supabase Sync for Food Item Images
const DB_NAME = 'inamdar_pos_db';
const DB_VERSION = 1;
const STORE_NAME = 'dish_images';
const DOWNLOAD_BATCH_SIZE = 25;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'code' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

export function isSameRemoteVersion(localRemoteUpdatedAt, remoteUpdatedAt) {
  if (!localRemoteUpdatedAt || !remoteUpdatedAt) return false;
  if (localRemoteUpdatedAt === remoteUpdatedAt) return true;
  const a = Date.parse(localRemoteUpdatedAt);
  const b = Date.parse(remoteUpdatedAt);
  return Number.isFinite(a) && Number.isFinite(b) && a === b;
}

// Compress and resize image to lightweight thumbnail (max 260x260, ~20KB)
export async function compressImage(file, maxDimension = 260, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Save dish image + sync metadata locally in IndexedDB
export async function saveDishImage(code, dataOrRecord) {
  try {
    const db = await getDB();
    const record =
      typeof dataOrRecord === 'string'
        ? {
            code: String(code),
            dataUrl: dataOrRecord,
            remoteUpdatedAt: '',
            synced: false,
            updated_at: Date.now(),
          }
        : {
            code: String(code),
            dataUrl: dataOrRecord?.dataUrl || '',
            remoteUpdatedAt: dataOrRecord?.remoteUpdatedAt || '',
            synced: Boolean(dataOrRecord?.synced),
            updated_at: Date.now(),
          };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error saving dish image:', err);
    return false;
  }
}

// Get single dish image
export async function getDishImage(code) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(String(code));
      req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error fetching dish image:', err);
    return null;
  }
}

// Get full IndexedDB records map: { [dishCode]: { code, dataUrl, remoteUpdatedAt, synced } }
export async function getAllDishImageRecords() {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const result = {};
        (req.result || []).forEach(item => {
          result[item.code] = item;
        });
        resolve(result);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error fetching all dish image records:', err);
    return {};
  }
}

// Get all dish images as a map: { [dishCode]: dataUrl }
export async function getAllDishImages() {
  const records = await getAllDishImageRecords();
  const result = {};
  Object.keys(records).forEach(code => {
    if (records[code]?.dataUrl) {
      result[code] = records[code].dataUrl;
    }
  });
  return result;
}

// Delete dish image locally
export async function deleteDishImage(code) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(String(code));
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error deleting dish image:', err);
    return false;
  }
}

// Upload or update a dish image in Supabase and mark synced in local IndexedDB
export async function uploadDishImageToSupabase(code, dataUrl) {
  const key = String(code);
  const { data, error } = await supabase
    .from('dish_images')
    .upsert(
      {
        code: key,
        image_data: dataUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'code' }
    )
    .select('code, updated_at')
    .single();

  if (error) {
    return { ok: false, error: error.message || 'Supabase upload failed' };
  }

  const remoteUpdatedAt = data?.updated_at || new Date().toISOString();
  await saveDishImage(key, {
    dataUrl,
    remoteUpdatedAt,
    synced: true,
  });

  return { ok: true, code: key, remoteUpdatedAt };
}

// Delete a dish image from Supabase
export async function deleteDishImageFromSupabase(code) {
  const key = String(code);
  const { error } = await supabase
    .from('dish_images')
    .delete()
    .eq('code', key);

  if (error) {
    return { ok: false, error: error.message || 'Supabase delete failed' };
  }
  return { ok: true, code: key };
}

/**
 * Syncs local IndexedDB cache with Supabase `dish_images`:
 * 1. Fetches ONLY `(code, updated_at)` metadata (no image blobs transferred).
 * 2. Downloads `image_data` ONLY for codes missing locally or updated remotely.
 * 3. Stores downloaded images in local IndexedDB so future loads read 100% locally.
 * 4. Removes locally cached synced images if deleted from Supabase.
 */
export async function syncDishImagesFromSupabase({ onBatchDownloaded } = {}) {
  const localRecords = await getAllDishImageRecords();

  const { data: metaRows, error: metaErr } = await supabase
    .from('dish_images')
    .select('code, updated_at');

  if (metaErr) {
    const images = {};
    const meta = {};
    Object.entries(localRecords).forEach(([code, rec]) => {
      if (rec?.dataUrl) {
        images[code] = rec.dataUrl;
        meta[code] = { synced: Boolean(rec.synced), remoteUpdatedAt: rec.remoteUpdatedAt || '' };
      }
    });
    return { ok: false, images, meta, error: metaErr.message };
  }

  const remoteByCode = new Map();
  (metaRows || []).forEach(row => {
    remoteByCode.set(String(row.code), row.updated_at);
  });

  const images = {};
  const meta = {};
  const codesToDownload = [];

  for (const [code, remoteUpdatedAt] of remoteByCode.entries()) {
    const local = localRecords[code];
    if (local && local.dataUrl && isSameRemoteVersion(local.remoteUpdatedAt, remoteUpdatedAt)) {
      // Already cached locally with matching version — skip Supabase download!
      images[code] = local.dataUrl;
      meta[code] = { synced: true, remoteUpdatedAt };
    } else {
      codesToDownload.push(code);
      if (local?.dataUrl) {
        images[code] = local.dataUrl;
      }
    }
  }

  for (const [code, local] of Object.entries(localRecords)) {
    if (remoteByCode.has(code)) continue;
    if (local.synced) {
      await deleteDishImage(code);
    } else if (local.dataUrl) {
      images[code] = local.dataUrl;
      meta[code] = { synced: false, remoteUpdatedAt: '' };
    }
  }

  for (let i = 0; i < codesToDownload.length; i += DOWNLOAD_BATCH_SIZE) {
    const batch = codesToDownload.slice(i, i + DOWNLOAD_BATCH_SIZE);
    const { data: rows, error: dlErr } = await supabase
      .from('dish_images')
      .select('code, image_data, updated_at')
      .in('code', batch);

    if (dlErr || !rows) continue;

    const batchImages = {};
    const batchMeta = {};
    for (const row of rows) {
      const code = String(row.code);
      if (!row.image_data) continue;
      await saveDishImage(code, {
        dataUrl: row.image_data,
        remoteUpdatedAt: row.updated_at || '',
        synced: true,
      });
      images[code] = row.image_data;
      meta[code] = { synced: true, remoteUpdatedAt: row.updated_at || '' };
      batchImages[code] = row.image_data;
      batchMeta[code] = meta[code];
    }

    if (Object.keys(batchImages).length > 0) {
      onBatchDownloaded?.(batchImages, batchMeta);
    }
  }

  return { ok: true, images, meta };
}
