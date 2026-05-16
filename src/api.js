const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function handleResponse(res) {
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    console.error("Backend returned non-JSON:", text);

    return {
      success: false,
      message: `Backend returned non-JSON response. Status: ${res.status}`,
    };
  }
}

export async function healthCheck() {
  const res = await fetch(`${API_URL}/api/health`);
  return handleResponse(res);
}

export async function uploadDocuments(files, apiKey = "") {
  const formData = new FormData();

  Array.from(files).forEach((file) => {
    formData.append("files", file);
  });

  if (apiKey) {
    formData.append("api_key", apiKey);
  }

  const res = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  return handleResponse(res);
}

export async function askQuestion(question, apiKey = "") {
  const res = await fetch(`${API_URL}/api/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "x-api-key": apiKey } : {}),
    },
    body: JSON.stringify({
      question,
      ...(apiKey ? { api_key: apiKey } : {}),
    }),
  });

  return handleResponse(res);
}

export async function getDocuments() {
  const res = await fetch(`${API_URL}/api/documents`);
  return handleResponse(res);
}

export async function getHistory() {
  const res = await fetch(`${API_URL}/api/history`);
  return handleResponse(res);
}

export async function clearHistory() {
  const res = await fetch(`${API_URL}/api/history`, {
    method: "DELETE",
  });
  return handleResponse(res);
}
export async function deleteDocument(documentName) {
  const res = await fetch(`${API_URL}/api/documents/${encodeURIComponent(documentName)}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}
export async function getSettings() {
  const res = await fetch(`${API_URL}/api/settings`);
  return handleResponse(res);
}

export async function updateSettings(settings) {
  const res = await fetch(`${API_URL}/api/settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settings),
  });

  return handleResponse(res);
}