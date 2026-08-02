import { useState, useEffect } from "react";
import {
  Settings, Users, MessageCircle, CalendarClock, Save, RotateCcw,
  AlertTriangle, Image as ImageIcon, MessageSquare, Lock, Loader2,
} from "lucide-react";
import { BACKEND_URL } from "./config";
import { toast } from "./Toast";

const TABS = [
  { key: "basic", label: "Basic Settings", icon: Settings },
  { key: "automation", label: "Group Automation", icon: Users },
  { key: "autoreply", label: "Auto Replies", icon: MessageCircle },
  { key: "scheduled", label: "Scheduled Messages", icon: CalendarClock },
];

const DEFAULTS = {
  botName: "",
  ownerName: "",
  commandPrefix: ".",
  ownerCountry: "",
  ownerAge: "",
  botMode: "public",
  botLanguage: "en",

  autoReactStatus: false,
  alwaysOnline: false,
  autoReadStatus: false,
  autoReadMessages: false,
  autoTypingIndicator: false,
  autoRecordingIndicator: false,
  autoSaveContacts: false,
  cmdReadReceipt: false,
  autoVoice: false,
  autoMessage: false,
  autoBlock: false,
  autoViewOnceUnlock: false,
  antiCall: false,

  antiDelete: "sender",
  antiDeleteWorkType: "both",
  antiDeleteSendType: "owner",
  viewOnceUnlockDestination: "botdm",

  ownerImageUrl: "",
  menuLogoUrl: "",
  aliveLogoUrl: "",

  aliveMessage: "©POWERED BY 26-TECH",
  csongMessage:
    "🌸 *Now Playing* 🌸\n\n✨ *Title* : {title}\n⏱ *Duration* : {duration}\n👁 *Views* : {views}\n🎙 *Channel* : {author}",

  sudoNumbers: "",
  bannedNumbers: "",
  callOpenList: "",
  callRejectList: "",
};

const DEFAULT_CSONG =
  "🌸 *Now Playing* 🌸\n\n✨ *Title* : {title}\n⏱ *Duration* : {duration}\n👁 *Views* : {views}\n🎙 *Channel* : {author}";

const TOGGLE_ROWS = [
  ["autoReactStatus", "Auto React Status", "alwaysOnline", "Always Online"],
  ["autoReadStatus", "Auto Read Status", "autoReadMessages", "Auto Read Messages"],
  ["autoTypingIndicator", "Auto Typing Indicator", "autoRecordingIndicator", "Auto Recording Indicator"],
  ["autoSaveContacts", "Auto Save Contacts", "cmdReadReceipt", "CMD Read Receipt"],
  ["autoVoice", "Auto Voice", "autoMessage", "Auto Message"],
  ["autoBlock", "Auto Block", "autoViewOnceUnlock", "Auto View-Once Unlock"],
  ["antiCall", "Anti Call", null, null],
];

async function apiCall(path, { method = "GET", auth, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth?.kind === "admin" && auth.key) headers["x-api-key"] = auth.key;
  if (auth?.kind === "owner" && auth.token) headers["Authorization"] = `Bearer ${auth.token}`;

  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      className={`os-toggle ${checked ? "on" : ""}`}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      aria-pressed={checked}
    >
      <span className="os-toggle-knob" />
    </button>
  );
}

export default function OwnerSettings({ bot, auth, onRefresh }) {
  const [tab, setTab] = useState("basic");
  const [form, setForm] = useState({ ...DEFAULTS, ...(bot.settings || {}) });
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    setForm({ ...DEFAULTS, ...(bot.settings || {}) });
  }, [bot.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await apiCall(`/bots/${encodeURIComponent(bot.id)}/settings`, {
        method: "PATCH",
        auth,
        body: form,
      });
      toast("Settings zimehifadhiwa — bot inarestart ili zianze kutumika...", "success");
      onRefresh?.();
    } catch (err) {
      toast(err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = async () => {
    if (!window.confirm("Rudisha settings zote za Basic Settings kwenye default? Hii haiwezi kutenduliwa.")) return;
    setResetting(true);
    try {
      await apiCall(`/bots/${encodeURIComponent(bot.id)}/settings`, {
        method: "PATCH",
        auth,
        body: DEFAULTS,
      });
      setForm({ ...DEFAULTS });
      toast("Basic Settings zimerudishwa kwenye default", "success");
      onRefresh?.();
    } catch (err) {
      toast(err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="os-wrap fade-up">
      <div className="os-tabs">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`os-tab ${tab === key ? "active" : ""}`}
            onClick={() => setTab(key)}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab !== "basic" && (
        <div className="os-card">
          <p className="dash-empty">Sehemu hii inakuja hivi karibuni.</p>
        </div>
      )}

      {tab === "basic" && (
        <div className="os-card">
          <h3 className="os-section-title">Bot Information &amp; Automations</h3>

          <div className="os-grid-2">
            <div className="os-field">
              <label className="os-label">Bot Name</label>
              <input className="os-input" value={form.botName} onChange={(e) => set("botName", e.target.value)} />
            </div>
            <div className="os-field">
              <label className="os-label">Owner Name</label>
              <input className="os-input" value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
            </div>

            <div className="os-field">
              <label className="os-label">Command Prefix</label>
              <input className="os-input" value={form.commandPrefix} onChange={(e) => set("commandPrefix", e.target.value)} />
            </div>
            <div className="os-field">
              <label className="os-label">Owner Country</label>
              <input className="os-input" value={form.ownerCountry} onChange={(e) => set("ownerCountry", e.target.value)} />
            </div>

            <div className="os-field">
              <label className="os-label">Owner Age</label>
              <input className="os-input" value={form.ownerAge} onChange={(e) => set("ownerAge", e.target.value)} />
            </div>
            <div className="os-field">
              <label className="os-label">Bot Mode</label>
              <select className="os-input os-select" value={form.botMode} onChange={(e) => set("botMode", e.target.value)}>
                <option value="public">Public (Everyone)</option>
                <option value="sudo">Only Sudo Numbers</option>
                <option value="private">Private (Only Me)</option>
              </select>
            </div>

            <div className="os-field">
              <label className="os-label">Bot Language</label>
              <select className="os-input os-select" value={form.botLanguage} onChange={(e) => set("botLanguage", e.target.value)}>
                <option value="en">English</option>
                <option value="sw">Swahili</option>
              </select>
            </div>
          </div>

          <div className="os-toggle-grid">
            {TOGGLE_ROWS.map(([keyA, labelA, keyB, labelB], i) => (
              <div className="os-toggle-row" key={i}>
                <div className="os-toggle-item">
                  <span>{labelA}</span>
                  <Toggle checked={!!form[keyA]} onChange={(v) => set(keyA, v)} />
                </div>
                {keyB && (
                  <div className="os-toggle-item">
                    <span>{labelB}</span>
                    <Toggle checked={!!form[keyB]} onChange={(v) => set(keyB, v)} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="os-grid-2" style={{ marginTop: 18 }}>
            <div className="os-field">
              <label className="os-label">Anti Delete</label>
              <select className="os-input os-select" value={form.antiDelete} onChange={(e) => set("antiDelete", e.target.value)}>
                <option value="sender">From (Sender)</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
            <div className="os-field">
              <label className="os-label">Anti Delete Work Type</label>
              <select className="os-input os-select" value={form.antiDeleteWorkType} onChange={(e) => set("antiDeleteWorkType", e.target.value)}>
                <option value="both">Both (Inbox + Group)</option>
                <option value="inbox">Inbox Only</option>
                <option value="group">Group Only</option>
              </select>
            </div>

            <div className="os-field">
              <label className="os-label">Anti Delete Send Type</label>
              <select className="os-input os-select" value={form.antiDeleteSendType} onChange={(e) => set("antiDeleteSendType", e.target.value)}>
                <option value="owner">Inbox (Owner)</option>
                <option value="samechat">Same Chat</option>
              </select>
            </div>
            <div className="os-field">
              <label className="os-label">View-Once Unlock Destination</label>
              <select className="os-input os-select" value={form.viewOnceUnlockDestination} onChange={(e) => set("viewOnceUnlockDestination", e.target.value)}>
                <option value="botdm">Inbox (Bot&apos;s own DM)</option>
                <option value="ownerdm">Owner DM</option>
              </select>
            </div>
          </div>

          <h3 className="os-section-title" style={{ marginTop: 26 }}><ImageIcon size={15} /> Media &amp; Links</h3>
          <div className="os-grid-2">
            <div className="os-field">
              <label className="os-label">Owner Image URL</label>
              <input className="os-input" placeholder="https://..." value={form.ownerImageUrl} onChange={(e) => set("ownerImageUrl", e.target.value)} />
            </div>
            <div className="os-field">
              <label className="os-label">Menu Logo URL</label>
              <input className="os-input" placeholder="https://..." value={form.menuLogoUrl} onChange={(e) => set("menuLogoUrl", e.target.value)} />
            </div>
            <div className="os-field">
              <label className="os-label">Alive Logo URL</label>
              <input className="os-input" placeholder="https://..." value={form.aliveLogoUrl} onChange={(e) => set("aliveLogoUrl", e.target.value)} />
            </div>
          </div>

          <h3 className="os-section-title" style={{ marginTop: 26 }}><MessageSquare size={15} /> Messages</h3>
          <div className="os-field">
            <label className="os-label">Alive Message</label>
            <textarea className="os-input os-textarea" rows={2} value={form.aliveMessage} onChange={(e) => set("aliveMessage", e.target.value)} />
          </div>
          <div className="os-field">
            <div className="os-label-row">
              <label className="os-label">CSong Message — use {"{title} {duration} {views} {author} {ago} {videoUrl}"}</label>
              <button type="button" className="os-reset-mini" onClick={() => set("csongMessage", DEFAULT_CSONG)}>
                <RotateCcw size={11} /> Reset
              </button>
            </div>
            <textarea className="os-input os-textarea" rows={6} value={form.csongMessage} onChange={(e) => set("csongMessage", e.target.value)} />
          </div>

          <h3 className="os-section-title" style={{ marginTop: 26 }}><Lock size={15} /> Access Control</h3>
          <div className="os-grid-2">
            <div className="os-field">
              <label className="os-label">Sudo Numbers (comma separated)</label>
              <textarea className="os-input os-textarea" rows={2} placeholder="94712345678,94712345679,..." value={form.sudoNumbers} onChange={(e) => set("sudoNumbers", e.target.value)} />
            </div>
            <div className="os-field">
              <label className="os-label">Banned Numbers (comma separated)</label>
              <textarea className="os-input os-textarea" rows={2} placeholder="94712345678,..." value={form.bannedNumbers} onChange={(e) => set("bannedNumbers", e.target.value)} />
            </div>
            <div className="os-field">
              <label className="os-label">Call Open List</label>
              <textarea className="os-input os-textarea" rows={2} placeholder="Numbers that can call..." value={form.callOpenList} onChange={(e) => set("callOpenList", e.target.value)} />
            </div>
            <div className="os-field">
              <label className="os-label">Call Reject List</label>
              <textarea className="os-input os-textarea" rows={2} placeholder="Numbers to reject..." value={form.callRejectList} onChange={(e) => set("callRejectList", e.target.value)} />
            </div>
          </div>

          <button className="os-save-btn" type="button" onClick={save} disabled={saving}>
            {saving ? <Loader2 size={15} className="spin-icon" /> : <Save size={15} />}
            Save Basic Settings
          </button>

          <div className="os-danger">
            <p className="os-danger-title"><AlertTriangle size={14} /> Danger Zone</p>
            <p className="os-danger-sub">Restores every basic setting on this tab back to its default value.</p>
            <button className="os-danger-btn" type="button" onClick={resetDefaults} disabled={resetting}>
              {resetting ? <Loader2 size={13} className="spin-icon" /> : <AlertTriangle size={13} />}
              Reset All to Defaults
            </button>
          </div>
        </div>
      )}

      <style>{`
        .os-wrap { width: 100%; display: flex; flex-direction: column; gap: 14px; }
        .os-tabs { display: flex; flex-wrap: wrap; gap: 8px; }
        .os-tab {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 14px; border-radius: 12px; font-size: 0.78rem; font-weight: 700;
          background: rgba(15,10,40,0.5); border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.65); cursor: pointer; transition: 0.15s ease;
        }
        .os-tab:hover { background: rgba(255,255,255,0.08); color: white; }
        .os-tab.active { background: linear-gradient(135deg,#1d4ed8,#7c3aed); border-color: transparent; color: white; }

        .os-card {
          background: rgba(10,8,28,0.6); backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 22px;
        }
        .os-section-title { display: flex; align-items: center; gap: 8px; color: white; font-weight: 800; font-size: 1rem; margin-bottom: 16px; }

        .os-grid-2 { display: grid; grid-template-columns: 1fr; gap: 14px; }
        @media (min-width: 560px) { .os-grid-2 { grid-template-columns: 1fr 1fr; } }
        .os-field { display: flex; flex-direction: column; gap: 6px; }
        .os-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(148,163,184,0.85); }
        .os-label-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .os-input {
          width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px; padding: 10px 12px; color: white; font-size: 0.85rem; outline: none;
          transition: border-color 0.15s ease; font-family: inherit;
        }
        .os-input::placeholder { color: rgba(148,163,184,0.45); }
        .os-input:focus { border-color: rgba(124,58,237,0.6); }
        .os-select { appearance: none; cursor: pointer; }
        .os-textarea { resize: vertical; line-height: 1.5; }
        .os-reset-mini { display: inline-flex; align-items: center; gap: 4px; background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.35); color: #c4b5fd; font-size: 0.68rem; font-weight: 700; padding: 4px 8px; border-radius: 8px; cursor: pointer; white-space: nowrap; }

        .os-toggle-grid { display: flex; flex-direction: column; gap: 10px; margin-top: 18px; }
        .os-toggle-row { display: grid; grid-template-columns: 1fr; gap: 10px; }
        @media (min-width: 560px) { .os-toggle-row { grid-template-columns: 1fr 1fr; } }
        .os-toggle-item {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 12px 14px;
        }
        .os-toggle-item span { color: white; font-weight: 600; font-size: 0.84rem; }
        .os-toggle {
          width: 40px; height: 22px; border-radius: 999px; border: none; cursor: pointer;
          background: rgba(255,255,255,0.15); position: relative; flex-shrink: 0; padding: 0;
          transition: background 0.15s ease;
        }
        .os-toggle.on { background: linear-gradient(135deg,#1d4ed8,#2563eb); }
        .os-toggle-knob {
          position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%;
          background: white; transition: transform 0.15s ease;
        }
        .os-toggle.on .os-toggle-knob { transform: translateX(18px); }
        .os-toggle:disabled { opacity: 0.5; cursor: not-allowed; }

        .os-save-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; margin-top: 26px; padding: 13px; border-radius: 12px; border: none;
          background: linear-gradient(135deg,#1e3a8a,#1d4ed8); color: white; font-weight: 700; font-size: 0.9rem;
          cursor: pointer; box-shadow: 0 0 24px rgba(37,99,235,0.3);
        }
        .os-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .os-danger { margin-top: 22px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,0.1); }
        .os-danger-title { display: flex; align-items: center; gap: 6px; color: #fb7185; font-weight: 700; font-size: 0.85rem; margin-bottom: 4px; }
        .os-danger-sub { color: rgba(255,255,255,0.45); font-size: 0.75rem; margin-bottom: 12px; }
        .os-danger-btn {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(244,63,94,0.12); border: 1px solid rgba(244,63,94,0.4); color: #fb7185;
          font-weight: 700; font-size: 0.78rem; padding: 9px 14px; border-radius: 10px; cursor: pointer;
        }
        .os-danger-btn:hover:not(:disabled) { background: rgba(244,63,94,0.2); }
        .os-danger-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
