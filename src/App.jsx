import { useEffect, useState } from "react";
import {
  Upload,
  Send,
  FileText,
  Settings,
  Activity,
  MessageCircle,
  Database,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertCircle,
  X,
  Trash2,
  Moon,
  Sun,
} from "lucide-react";

import {
  healthCheck,
  uploadDocuments,
  askQuestion,
  getDocuments,
  getHistory,
  getSettings,
  updateSettings,
  clearHistory,
  deleteDocument,
} from "./api";
import "./index.css";

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [files, setFiles] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [history, setHistory] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState(null);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  const [settings, setSettings] = useState({
    chunk_size: 1000,
    chunk_overlap: 200,
    top_k: 4,
    temperature: 0.3,
  });

  // Apply theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      const [healthData, docsData, historyData, settingsData] =
        await Promise.all([
          healthCheck(),
          getDocuments(),
          getHistory(),
          getSettings(),
        ]);

      setHealth(healthData);
      setDocuments(docsData.documents || []);
      setHistory(historyData.history || []);

      if (settingsData.settings) {
        setSettings(settingsData.settings);
      }
    } catch {
      setHealth(null);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpload = async () => {
    if (!files.length) {
      showToast("Please select PDF, DOCX, or TXT files first.", "error");
      return;
    }

    setUploading(true);

    try {
      const data = await uploadDocuments(files, apiKey);

      if (!data.success) {
        showToast(data.message || "Upload failed", "error");
        return;
      }

      showToast("Documents uploaded and indexed successfully!", "success");
      setFiles([]);
      await loadData();
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docName) => {
    if (!window.confirm(`Are you sure you want to delete "${docName}"?`)) {
      return;
    }

    setDeletingDoc(docName);
    try {
      const data = await deleteDocument(docName);
      if (!data.success) {
        showToast(data.message || "Failed to delete document", "error");
        return;
      }
      showToast(`"${docName}" deleted successfully!`, "success");
      await loadData();
    } catch (error) {
      showToast("Failed to delete document", "error");
    } finally {
      setDeletingDoc(null);
    }
  };

  const handleClearAllDocuments = async () => {
    if (!window.confirm("⚠️ Are you sure you want to delete ALL documents? This action cannot be undone.")) {
      return;
    }

    setDeletingDoc("all");
    try {
      // Delete each document individually
      for (const doc of documents) {
        await deleteDocument(doc.name);
      }
      showToast("All documents deleted successfully!", "success");
      await loadData();
    } catch (error) {
      showToast("Failed to delete all documents", "error");
    } finally {
      setDeletingDoc(null);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    if (documents.length === 0) {
      showToast("Please upload documents first before asking questions.", "error");
      return;
    }

    setLoading(true);
    setAnswer("");
    setSources([]);

    try {
      const data = await askQuestion(question, apiKey);

      if (!data.success) {
        setAnswer(data.message || "Something went wrong.");
        return;
      }

      setAnswer(data.answer);
      setSources(data.sources || []);
      setQuestion("");
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSave = async () => {
    const data = await updateSettings(settings);

    if (!data.success) {
      showToast(data.message || "Settings update failed.", "error");
      return;
    }

    showToast("Settings updated successfully!", "success");
    await loadData();
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear all question history?")) {
      return;
    }

    setClearingHistory(true);
    try {
      const data = await clearHistory();
      if (!data.success) {
        showToast(data.message || "Failed to clear history", "error");
        return;
      }
      showToast("History cleared successfully!", "success");
      await loadData();
    } catch (error) {
      showToast("Failed to clear history", "error");
    } finally {
      setClearingHistory(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const removeFile = (fileName) => {
    setFiles(files.filter(f => f.name !== fileName));
  };

  const hasDocuments = documents.length > 0;

  // Theme classes
  const themeClasses = {
    bg: isDark ? "bg-gray-900" : "bg-gradient-to-br from-gray-50 to-gray-100",
    cardBg: isDark ? "bg-gray-800" : "bg-white",
    cardBorder: isDark ? "border-gray-700" : "border-gray-200",
    textPrimary: isDark ? "text-gray-100" : "text-gray-900",
    textSecondary: isDark ? "text-gray-400" : "text-gray-600",
    inputBg: isDark ? "bg-gray-900" : "bg-white",
    inputBorder: isDark ? "border-gray-700" : "border-gray-300",
    headerBg: isDark ? "bg-gray-900/50" : "bg-white/50",
  };

  return (
    <div className={`min-h-screen ${themeClasses.bg} transition-colors duration-300`}>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${toast.type === "error"
              ? (isDark ? "bg-red-900/90 text-red-200 border border-red-800" : "bg-red-50 text-red-800 border border-red-200")
              : (isDark ? "bg-green-900/90 text-green-200 border border-green-800" : "bg-green-50 text-green-800 border border-green-200")
            }`}>
            {toast.type === "error" ? <AlertCircle size={20} /> : <Check size={20} />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header/Hero Section */}
      <div className={`border-b ${themeClasses.cardBorder} ${themeClasses.headerBg} backdrop-blur-sm sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Sparkles className="text-white" size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">RAG Document QA</p>
                <h1 className={`text-xl font-bold ${themeClasses.textPrimary}`}>Intelligent Document Query</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Toggle Button */}
              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-2 rounded-lg transition-all ${isDark ? "bg-gray-700 text-yellow-400 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Status Indicator - Simple Dot */}
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${health?.success ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main Content - Adjusted Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upload Card */}
          <div className={`${themeClasses.cardBg} rounded-2xl shadow-sm border ${themeClasses.cardBorder} overflow-hidden hover:shadow-md transition-all`}>
            <div className={`p-5 border-b ${themeClasses.cardBorder}`}>
              <div className="flex items-center gap-2">
                <Upload size={18} className="text-blue-600" />
                <h2 className={`text-base font-semibold ${themeClasses.textPrimary}`}>Upload Documents</h2>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  placeholder="Optional: Google API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className={`w-full px-3 py-1.5 text-sm border ${themeClasses.inputBorder} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${themeClasses.inputBg} ${themeClasses.textPrimary}`}
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              <label className={`block border-2 border-dashed ${themeClasses.cardBorder} rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors ${isDark ? "bg-gray-900/50" : "bg-gray-50"}`}>
                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                <p className={`text-sm font-medium ${themeClasses.textPrimary} mb-1`}>Click or drag files</p>
                <p className="text-xs text-gray-500">PDF, DOCX, TXT</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => setFiles(Array.from(e.target.files))}
                  className="hidden"
                />
              </label>

              {files.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  <p className="text-xs font-medium text-gray-500">{files.length} file(s) selected</p>
                  {files.map((file) => (
                    <div key={file.name} className={`flex items-center justify-between p-1.5 ${isDark ? "bg-gray-900" : "bg-gray-50"} rounded-lg`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={14} className="text-blue-500 flex-shrink-0" />
                        <span className={`text-xs ${themeClasses.textPrimary} truncate`}>{file.name}</span>
                      </div>
                      <button onClick={() => removeFile(file.name)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                {uploading ? "Uploading..." : "Upload & Index"}
              </button>
            </div>
          </div>

          {/* Ask Question Card */}
          <div className={`${themeClasses.cardBg} rounded-2xl shadow-sm border ${themeClasses.cardBorder} overflow-hidden hover:shadow-md transition-all flex flex-col`}>
            <div className={`p-5 border-b ${themeClasses.cardBorder}`}>
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-purple-600" />
                <h2 className={`text-base font-semibold ${themeClasses.textPrimary}`}>Ask a Question</h2>
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col space-y-3">
              <textarea
                placeholder={hasDocuments ? "Ask anything about your documents..." : "📄 Upload documents first"}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey && hasDocuments) handleAsk();
                }}
                disabled={!hasDocuments}
                rows={2}
                className={`w-full px-3 py-2 text-sm border ${themeClasses.inputBorder} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition disabled:opacity-50 disabled:cursor-not-allowed resize-none ${themeClasses.inputBg} ${themeClasses.textPrimary}`}
              />

              <div className="flex items-center justify-end gap-2">
                <p className="text-xs text-gray-400">Ctrl + Enter ↵</p>
                <button
                  onClick={handleAsk}
                  disabled={loading || !hasDocuments || !question.trim()}
                  className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                  {loading ? "Thinking..." : "Ask"}
                </button>
              </div>

              {!hasDocuments && (
                <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <AlertCircle size={14} className="text-yellow-600 dark:text-yellow-500" />
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">Upload documents to start asking questions</p>
                </div>
              )}

              {answer && (
                <div className="mt-3 space-y-3 max-h-80 overflow-y-auto">
                  <div className={`p-3 ${isDark ? "bg-gradient-to-r from-blue-900/50 to-purple-900/50" : "bg-gradient-to-r from-blue-50 to-purple-50"} rounded-xl`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-sm font-semibold ${themeClasses.textPrimary}`}>Answer</h3>
                      <button
                        onClick={() => copyToClipboard(answer)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className={`text-sm ${themeClasses.textSecondary} leading-relaxed whitespace-pre-wrap`}>{answer}</p>
                  </div>

                  {sources.length > 0 && (
                    <div className={`p-3 ${isDark ? "bg-gray-900" : "bg-gray-50"} rounded-xl`}>
                      <h4 className={`text-xs font-semibold ${themeClasses.textPrimary} mb-2`}>Sources</h4>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {sources.map((source, index) => (
                          <div key={index} className={`text-xs ${themeClasses.textSecondary} p-2 ${themeClasses.cardBg} rounded border ${themeClasses.cardBorder}`}>
                            <pre className="whitespace-pre-wrap font-mono text-xs">{JSON.stringify(source, null, 2)}</pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lower Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* Documents Card with Delete Options */}
          <div className={`${themeClasses.cardBg} rounded-2xl shadow-sm border ${themeClasses.cardBorder} overflow-hidden`}>
            <div className={`p-5 border-b ${themeClasses.cardBorder}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database size={18} className="text-green-600" />
                  <h2 className={`text-base font-semibold ${themeClasses.textPrimary}`}>Indexed Documents</h2>
                  {documents.length > 0 && (
                    <span className={`text-xs ${themeClasses.textSecondary} ${isDark ? "bg-gray-700" : "bg-gray-100"} px-2 py-0.5 rounded-full`}>
                      {documents.length}
                    </span>
                  )}
                </div>
                {documents.length > 0 && (
                  <button
                    onClick={handleClearAllDocuments}
                    disabled={deletingDoc === "all"}
                    className="flex items-center gap-1.5 px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition text-xs font-medium disabled:opacity-50"
                  >
                    {deletingDoc === "all" ? <Loader2 className="animate-spin" size={12} /> : <Trash2 size={12} />}
                    Delete All
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 max-h-64 overflow-y-auto">
              {documents.length === 0 ? (
                <div className="text-center py-6">
                  <FileText size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className={`text-sm ${themeClasses.textSecondary}`}>No documents uploaded</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Upload PDF, DOCX, or TXT files</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div className={`flex items-center justify-between p-2 ${isDark ? "bg-gray-900" : "bg-gray-50"} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition`} key={doc.name}>
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={14} className="text-green-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className={`text-sm font-medium ${themeClasses.textPrimary} truncate`}>{doc.name}</p>
                          <p className={`text-xs ${themeClasses.textSecondary}`}>{doc.chunks} chunks</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteDocument(doc.name)}
                        disabled={deletingDoc === doc.name}
                        className="text-gray-400 hover:text-red-500 transition p-1"
                        title={`Delete ${doc.name}`}
                      >
                        {deletingDoc === doc.name ? <Loader2 className="animate-spin" size={14} /> : <X size={14} />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Settings Card */}
          <div className={`${themeClasses.cardBg} rounded-2xl shadow-sm border ${themeClasses.cardBorder} overflow-hidden`}>
            <div className={`p-5 border-b ${themeClasses.cardBorder}`}>
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-gray-600 dark:text-gray-400" />
                <h2 className={`text-base font-semibold ${themeClasses.textPrimary}`}>Settings</h2>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className={`block text-xs font-medium ${themeClasses.textSecondary} mb-1`}>Chunk Size</label>
                  <input
                    type="number"
                    value={settings.chunk_size}
                    onChange={(e) => setSettings({ ...settings, chunk_size: parseInt(e.target.value) })}
                    className={`w-full px-2 py-1.5 text-sm border ${themeClasses.inputBorder} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${themeClasses.inputBg} ${themeClasses.textPrimary}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium ${themeClasses.textSecondary} mb-1`}>Chunk Overlap</label>
                  <input
                    type="number"
                    value={settings.chunk_overlap}
                    onChange={(e) => setSettings({ ...settings, chunk_overlap: parseInt(e.target.value) })}
                    className={`w-full px-2 py-1.5 text-sm border ${themeClasses.inputBorder} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${themeClasses.inputBg} ${themeClasses.textPrimary}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium ${themeClasses.textSecondary} mb-1`}>Top K</label>
                  <input
                    type="number"
                    value={settings.top_k}
                    onChange={(e) => setSettings({ ...settings, top_k: parseInt(e.target.value) })}
                    className={`w-full px-2 py-1.5 text-sm border ${themeClasses.inputBorder} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${themeClasses.inputBg} ${themeClasses.textPrimary}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium ${themeClasses.textSecondary} mb-1`}>Temperature</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                    className={`w-full px-2 py-1.5 text-sm border ${themeClasses.inputBorder} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${themeClasses.inputBg} ${themeClasses.textPrimary}`}
                  />
                </div>
              </div>

              <button
                onClick={handleSettingsSave}
                className="w-full py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-900 dark:hover:bg-gray-600 transition-all"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>

        {/* History Card with Clear Button */}
        <div className={`${themeClasses.cardBg} rounded-2xl shadow-sm border ${themeClasses.cardBorder} overflow-hidden mt-6`}>
          <div className={`p-5 border-b ${themeClasses.cardBorder}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-indigo-600" />
                <h2 className={`text-base font-semibold ${themeClasses.textPrimary}`}>Question History</h2>
                {history.length > 0 && (
                  <span className={`text-xs ${themeClasses.textSecondary} ${isDark ? "bg-gray-700" : "bg-gray-100"} px-2 py-0.5 rounded-full`}>
                    {history.length}
                  </span>
                )}
              </div>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  disabled={clearingHistory}
                  className="flex items-center gap-1.5 px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition text-sm font-medium disabled:opacity-50"
                >
                  {clearingHistory ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                  Clear All
                </button>
              )}
            </div>
          </div>

          <div className="p-5 max-h-80 overflow-y-auto">
            {history.length === 0 ? (
              <div className="text-center py-6">
                <MessageCircle size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className={`text-sm ${themeClasses.textSecondary}`}>No questions asked yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Your Q&A history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.slice().reverse().map((item, index) => (
                  <div key={index} className={`p-3 ${isDark ? "bg-gray-900" : "bg-gray-50"} rounded-lg hover:shadow-sm transition`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${themeClasses.textPrimary} mb-1 break-words`}>Q: {item.question}</p>
                        <p className={`text-sm ${themeClasses.textSecondary} break-words line-clamp-2`}>A: {item.answer}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(item.answer)}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-1"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}