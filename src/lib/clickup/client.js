import 'server-only';
/**
 * ClickUp API client.
 *
 * Maintenance feature uses ClickUp as the task store. Each maintenance
 * ticket becomes a ClickUp task with custom fields (Property, Category,
 * Severity, Vendor, Estimated/Actual Cost, Photos).
 *
 * ClickUp workspace layout (created manually in the dashboard the first time):
 *   Space:  "Granderson Destinations"
 *   Folder per property: "Palm Springs", "San Miguel de Allende"
 *   Lists within each folder: "Maintenance"
 *
 * Custom fields on every maintenance task:
 *   - Property (label)
 *   - Category (label: HVAC/Plumbing/Electrical/Appliance/Pool/Landscape/Cleaning/Security/Other)
 *   - Severity (number 1-5)
 *   - Vendor (text)
 *   - Estimated Cost (number)
 *   - Actual Cost (number)
 *   - Guest-Reported (checkbox)
 *   - Photos (attachments)
 *
 * Stub mode (no CLICKUP_API_TOKEN): every call returns realistic mock
 * response so the UI works without keys.
 *
 * Docs: https://developer.clickup.com/reference
 */
import { FEATURE_FLAGS } from '@/lib/constants';

const BASE = 'https://api.clickup.com/api/v2';

function authHeader() {
  return {
    Authorization: process.env.CLICKUP_API_TOKEN,
    'Content-Type': 'application/json',
  };
}

async function call(path, init = {}) {
  if (!FEATURE_FLAGS.clickupLive()) {
    return { stub: true, error: 'CLICKUP_API_TOKEN missing — stub response.' };
  }
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers: { ...authHeader(), ...(init.headers || {}) } });
  } catch (err) {
    return { stub: true, error: `Network: ${String(err)}` };
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { stub: true, error: `ClickUp ${res.status}: ${text.slice(0, 250)}` };
  }
  const data = await res.json().catch(() => ({}));
  return { stub: false, data };
}

// ---------- Read helpers (workspace discovery) -----------------------------

export async function listSpaces({ teamId }) {
  return call(`/team/${teamId}/space?archived=false`);
}

export async function listFolders({ spaceId }) {
  return call(`/space/${spaceId}/folder?archived=false`);
}

export async function listListsInFolder({ folderId }) {
  return call(`/folder/${folderId}/list?archived=false`);
}

export async function getList({ listId }) {
  return call(`/list/${listId}`);
}

export async function getCustomFields({ listId }) {
  return call(`/list/${listId}/field`);
}

// ---------- Task CRUD ------------------------------------------------------

/**
 * Create a maintenance task in the given list.
 *
 * Input shape:
 *   {
 *     listId,
 *     title,
 *     description,        // markdown OK
 *     priority,           // 1=urgent, 2=high, 3=normal, 4=low (ClickUp scale)
 *     customFields: [{ id, value }, ...]
 *     dueDate,            // optional ms-since-epoch
 *   }
 */
export async function createTask({ listId, title, description, priority = 3, customFields = [], dueDate, tags = [] }) {
  if (!FEATURE_FLAGS.clickupLive()) {
    return {
      stub: true,
      id: `stub_${Date.now().toString(36)}`,
      url: 'https://app.clickup.com/stub/preview',
      name: title,
    };
  }
  const r = await call(`/list/${listId}/task`, {
    method: 'POST',
    body: JSON.stringify({
      name: title,
      description,
      priority,
      tags,
      custom_fields: customFields,
      due_date: dueDate,
      notify_all: false,
    }),
  });
  if (r.stub) return r;
  return {
    stub: false,
    id: r.data.id,
    url: r.data.url,
    name: r.data.name,
    raw: r.data,
  };
}

export async function updateTask({ taskId, fields = {} }) {
  return call(`/task/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(fields),
  });
}

export async function getTask({ taskId }) {
  return call(`/task/${taskId}`);
}

export async function addComment({ taskId, text, notifyAll = false }) {
  return call(`/task/${taskId}/comment`, {
    method: 'POST',
    body: JSON.stringify({ comment_text: text, notify_all: notifyAll }),
  });
}

export async function setCustomFieldValue({ taskId, fieldId, value }) {
  return call(`/task/${taskId}/field/${fieldId}`, {
    method: 'POST',
    body: JSON.stringify({ value }),
  });
}

// ---------- Listing tasks (for the owner dashboard) -----------------------

export async function listTasks({ listId, statuses = [], includeClosed = false }) {
  const params = new URLSearchParams();
  if (includeClosed) params.set('include_closed', 'true');
  if (statuses.length) statuses.forEach((s) => params.append('statuses[]', s));
  return call(`/list/${listId}/task?${params}`);
}
