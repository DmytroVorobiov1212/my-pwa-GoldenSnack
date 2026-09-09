const QUEUE_KEY = 'gs_production_offline_queue_v1';
export const OFFLINE_QUEUE_EVENT = 'gs-production-offline-queue-change';
const MAX_QUEUE_SIZE = 100;

function readQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  notifyQueueChanged();
}

function notifyQueueChanged() {
  try {
    window.dispatchEvent(new CustomEvent(OFFLINE_QUEUE_EVENT));
  } catch (error) {
    // Queue persistence still works even if CustomEvent is unavailable.
  }
}

function createClientRequestId(type) {
  const stamp = Date.now().toString(36);
  const randomA = Math.floor(Math.random() * 0x7fffffff).toString(36);
  const randomB = Math.floor(Math.random() * 0x7fffffff).toString(36);
  return `gs-${type}-${stamp}-${randomA}${randomB}`;
}

function createQueueEntry({ type, endpoint, body, deviceId }) {
  const clientRequestId = createClientRequestId(type);
  const createdAt = new Date().toISOString();
  const requestBody = {
    ...body,
    clientRequestId,
  };

  if (type === 'material-order' && !requestBody.requestedAt) {
    requestBody.requestedAt = createdAt;
  }

  if (type === 'fault' && !requestBody.reportedAt) {
    requestBody.reportedAt = createdAt;
  }

  return {
    id: clientRequestId,
    type,
    endpoint,
    body: requestBody,
    deviceId,
    createdAt,
    attempts: 0,
    lastError: '',
    blocked: false,
  };
}

function enqueue(entry) {
  const queue = readQueue();

  if (queue.length >= MAX_QUEUE_SIZE) {
    throw new Error('Offline fronta je plná. Připojte terminál k síti a zkuste to znovu.');
  }

  queue.push(entry);
  writeQueue(queue);
}

async function parseResponse(response) {
  try {
    return await response.json();
  } catch (error) {
    return {};
  }
}

async function sendEntry(entry, token) {
  try {
    const response = await fetch(entry.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(entry.body),
      cache: 'no-store',
    });

    const result = await parseResponse(response);

    if (response.ok) {
      return { status: 'sent', result };
    }

    const message = result.message || `HTTP ${response.status}`;

    if (response.status === 401) {
      return { status: 'unauthorized', message };
    }

    if (
      response.status >= 400 &&
      response.status < 500 &&
      response.status !== 408 &&
      response.status !== 425 &&
      response.status !== 429
    ) {
      return { status: 'permanent', message };
    }

    return { status: 'retry', message };
  } catch (error) {
    return {
      status: 'retry',
      message: error.message || 'Síť není dostupná',
    };
  }
}

export function getOfflineQueueSummary(deviceId) {
  const queue = readQueue().filter((entry) => !deviceId || entry.deviceId === deviceId);
  return {
    pending: queue.filter((entry) => !entry.blocked).length,
    blocked: queue.filter((entry) => entry.blocked).length,
    total: queue.length,
  };
}

export async function submitOrQueue({ type, endpoint, body, deviceId, token }) {
  const entry = createQueueEntry({ type, endpoint, body, deviceId });

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    enqueue(entry);
    return { status: 'queued', entry };
  }

  const result = await sendEntry(entry, token);

  if (result.status === 'sent') {
    return { status: 'sent', entry, result: result.result };
  }

  if (result.status === 'unauthorized') {
    return { status: 'unauthorized', message: result.message };
  }

  if (result.status === 'permanent') {
    return { status: 'error', message: result.message };
  }

  entry.attempts = 1;
  entry.lastError = result.message || '';
  enqueue(entry);
  return { status: 'queued', entry, message: result.message };
}

export async function flushOfflineQueue({ token, deviceId }) {
  const queue = readQueue();
  if (!token || !deviceId || queue.length === 0) {
    return { sent: 0, blocked: 0, pending: 0, unauthorized: false };
  }

  const nextQueue = [];
  let sent = 0;
  let unauthorized = false;

  for (let index = 0; index < queue.length; index += 1) {
    const entry = queue[index];

    if (entry.deviceId !== deviceId || entry.blocked) {
      nextQueue.push(entry);
      continue;
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      nextQueue.push(entry);
      continue;
    }

    const result = await sendEntry(entry, token);

    if (result.status === 'sent') {
      sent += 1;
      continue;
    }

    if (result.status === 'unauthorized') {
      unauthorized = true;
      nextQueue.push(entry);
      for (let rest = index + 1; rest < queue.length; rest += 1) {
        nextQueue.push(queue[rest]);
      }
      break;
    }

    nextQueue.push({
      ...entry,
      attempts: (entry.attempts || 0) + 1,
      lastError: result.message || '',
      blocked: result.status === 'permanent',
    });
  }

  writeQueue(nextQueue);
  const summary = getOfflineQueueSummary(deviceId);

  return {
    sent,
    blocked: summary.blocked,
    pending: summary.pending,
    unauthorized,
  };
}
