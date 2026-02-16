import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  FiSearch,
  FiSend,
  FiUsers,
  FiPaperclip,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { socket } from "../socket";

/* ================= AXIOS ================= */
const api = axios.create({
  baseURL: "https://emsbackend-2w9c.onrender.com/api",
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ================= HELPERS ================= */
const safeJson = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const formatTime = (d) =>
  new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const bubbleAnim = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

/* =========================================================
   FINAL CHAT PAGE
========================================================= */
export default function ChatPage() {
  const me = safeJson("user");
  const meId = me?._id || me?.id;

  const [activeTab, setActiveTab] = useState("employee");
  const [allowedUsers, setAllowedUsers] = useState([]);
  const [allowedTeams, setAllowedTeams] = useState([]);
  const [search, setSearch] = useState("");

  const [chatMode, setChatMode] = useState("dm");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");

  const [onlineUsers, setOnlineUsers] = useState([]);

  const msgRef = useRef(null);
  const fileRef = useRef(null);

  /* ================= INIT ================= */
  useEffect(() => {
    if (!meId) return;

    socket.emit("join", meId);

    api.get("/chat/allowed-users").then((res) => {
      setAllowedUsers(res.data.allowedUsers || []);
      setAllowedTeams(res.data.allowedTeams || []);
    });
  }, [meId]);

  useEffect(() => {
    msgRef.current?.scrollTo(0, msgRef.current.scrollHeight);
  }, [messages]);

  /* ================= SOCKET ================= */
  useEffect(() => {
    socket.on("onlineUsers", setOnlineUsers);

    socket.on("chat:receiveMessage", (msg) => {
      if (msg.conversationId !== conversationId) return;
      setMessages((p) => [...p, msg]);
    });

    return () => {
      socket.off("onlineUsers");
      socket.off("chat:receiveMessage");
    };
  }, [conversationId]);

  /* ================= FILTER ================= */
  const filteredUsers = useMemo(
    () =>
      allowedUsers.filter((u) =>
        (u.name || "").toLowerCase().includes(search.toLowerCase())
      ),
    [allowedUsers, search]
  );

  const filteredTeams = useMemo(
    () =>
      allowedTeams.filter((t) =>
        (t.team_name || "").toLowerCase().includes(search.toLowerCase())
      ),
    [allowedTeams, search]
  );

  /* ================= OPEN CHAT ================= */
  const openDM = async (u) => {
    setChatMode("dm");
    setSelectedUser(u);
    setSelectedTeam(null);
    setMessages([]);

    const res = await api.post("/chat/conversation/create", {
      receiverId: u._id,
    });

    setConversationId(res.data._id);

    const msgs = await api.get(`/chat/message/${res.data._id}`);
    setMessages(msgs.data || []);
  };

  const openTeam = async (t) => {
    setChatMode("team");
    setSelectedTeam(t);
    setSelectedUser(null);
    setMessages([]);

    const res = await api.post("/chat/conversation/team/create", {
      teamId: t._id,
    });

    setConversationId(res.data._id);

    const msgs = await api.get(`/chat/message/${res.data._id}`);
    setMessages(msgs.data || []);
  };

  /* ================= FILE PICK (2MB) ================= */
  const pickFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    if (f.size > 2 * 1024 * 1024) {
      setFileError("File size must be under 2 MB");
      fileRef.current.value = "";
      setTimeout(() => setFileError(""), 3000);
      return;
    }

    setFile({
      raw: f,
      preview: f.type.startsWith("image")
        ? URL.createObjectURL(f)
        : null,
    });
  };

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!conversationId || (!input.trim() && !file)) return;

    const tempId = Date.now().toString();

    const temp = {
      _id: tempId,
      conversationId,
      text: input || "",
      file: file ? { name: file.raw.name, type: file.raw.type } : null,
      senderId: { _id: meId, name: me.name, role: me.role },
      status: "sent",
      createdAt: new Date(),
    };

    setMessages((p) => [...p, temp]);
    setInput("");

    const form = new FormData();
    form.append("conversationId", conversationId);
    if (input) form.append("text", input);
    if (file?.raw) form.append("file", file.raw);

    setFile(null);
    fileRef.current.value = "";

    const res = await api.post("/chat/message/send", form);
    setMessages((p) => p.map((m) => (m._id === tempId ? res.data : m)));
  };

  /* ================= UI ================= */
  return (
    <div className="h-full flex bg-slate-100">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-sm font-semibold">Chats</h2>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setActiveTab("employee")}
              className={`flex-1 py-2 text-sm rounded ${
                activeTab === "employee"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100"
              }`}
            >
              Employees
            </button>
            <button
              onClick={() => setActiveTab("team")}
              className={`flex-1 py-2 text-sm rounded ${
                activeTab === "team"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100"
              }`}
            >
              Teams
            </button>
          </div>

          <div className="mt-3 relative">
            <FiSearch className="absolute left-3 top-2.5 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border rounded"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === "employee" &&
            filteredUsers.map((u) => (
              <button
                key={u._id}
                onClick={() => openDM(u)}
                className={`w-full px-4 py-3 text-left border-l-4 ${
                  selectedUser?._id === u._id
                    ? "bg-blue-50 border-blue-600"
                    : "border-transparent hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      onlineUsers.includes(u._id)
                        ? "bg-green-500"
                        : "bg-slate-300"
                    }`}
                  />
                  <span className="text-sm font-medium">{u.name}</span>
                </div>
              </button>
            ))}

          {activeTab === "team" &&
            filteredTeams.map((t) => (
              <button
                key={t._id}
                onClick={() => openTeam(t)}
                className={`w-full px-4 py-3 text-left border-l-4 flex items-center gap-2 ${
                  selectedTeam?._id === t._id
                    ? "bg-blue-50 border-blue-600"
                    : "border-transparent hover:bg-slate-100"
                }`}
              >
                <FiUsers /> {t.team_name}
              </button>
            ))}
        </div>
      </aside>

      {/* ================= CHAT ================= */}
      <main className="flex-1 flex flex-col">
        <div ref={msgRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {messages.map((m) => {
              const senderId =
                typeof m.senderId === "string"
                  ? m.senderId
                  : m.senderId?._id;

              const isMe = senderId === meId;

              return (
                <motion.div
                  key={m._id}
                  variants={bubbleAnim}
                  initial="hidden"
                  animate="show"
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm ${
                      isMe ? "bg-blue-600 text-white" : "bg-white border"
                    }`}
                  >
                    {chatMode === "team" && !isMe && (
                      <div className="text-xs font-bold mb-1">
                        {m.senderId?.name}
                        <span className="ml-2 text-[10px] bg-slate-100 px-2 rounded">
                          {m.senderId?.role}
                        </span>
                      </div>
                    )}

                    {m.text && <p>{m.text}</p>}

                    {m.file && (
                      <div className="mt-2">
                        {m.file.type?.startsWith("image") ? (
                          <img
                            src={m.file.url}
                            alt=""
                            className="rounded border max-w-xs"
                          />
                        ) : (
                          <a
                            href={m.file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs underline"
                          >
                            📄 {m.file.name}
                          </a>
                        )}
                      </div>
                    )}

                    <div className="text-[10px] text-right mt-1 opacity-70">
                      {formatTime(m.createdAt)}{" "}
                      {isMe && (
                        <span className="text-white font-bold">
                          {m.status === "seen"
                            ? "Seen"
                            : m.status === "delivered"
                            ? "Delivered"
                            : "Sent"}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* FILE ERROR */}
        <AnimatePresence>
          {fileError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mx-4 mb-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm"
            >
              ⚠️ {fileError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* SELECTED FILE PREVIEW */}
        {file && (
          <div className="mx-4 mb-2 px-4 py-3 rounded-xl border bg-white flex items-center gap-3">
            {file.preview ? (
              <img
                src={file.preview}
                alt=""
                className="w-14 h-14 object-cover rounded border"
              />
            ) : (
              <div className="w-14 h-14 bg-slate-100 rounded flex items-center justify-center">
                📄
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {file.raw.name}
              </p>
              <p className="text-xs text-slate-500">
                {(file.raw.size / 1024).toFixed(1)} KB
              </p>
            </div>

            <button
              onClick={() => {
                setFile(null);
                fileRef.current.value = "";
              }}
              className="text-red-500 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* INPUT */}
        <div className="p-3 bg-white border-t flex gap-2 items-center">
          <input ref={fileRef} type="file" hidden onChange={pickFile} />

          <button onClick={() => fileRef.current.click()}>
            <FiPaperclip />
          </button>

          <input
            className="flex-1 border rounded px-3 py-2 text-sm"
            placeholder="Type a message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />

          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            <FiSend />
          </button>
        </div>
      </main>
    </div>
  );
}
