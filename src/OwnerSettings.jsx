import { useState, useEffect } from "react";
import {
  Settings, Users, MessageCircle, CalendarClock, Save, RotateCcw,
  AlertTriangle, Image as ImageIcon, MessageSquare, Lock, Loader2,
  Plus, Trash2,
} from "lucide-react";
import { BACKEND_URL } from "./config";
import { toast } from "./Toast";
import { DEFAULT_SETTINGS, createDefaultSettings, createDefaultScheduleDraft } from "./settings/defaults";

const TABS = [
  { key: "basic", label: "Basic Settings", icon: Settings },
  { key: "automation", label: "Group Automation", icon: Users },
  { key: "autoreply", label: "Auto Replies", icon: MessageCircle },
  { key: "scheduled", label: "Scheduled Messages", icon: CalendarClock },
];

const DEFAULT_WELCOME = DEFAULT_SETTINGS.welcomeMessage;
const DEFAULT_GOODBYE = DEFAULT_SETTINGS.goodbyeMessage;
const DEFAULT_CSONG = DEFAULT_SETTINGS.csongMessage;

const TOGGLE_ROWS = [
  // Label imebadilishwa kidogo ili isichanganywe na "Auto Status React"
  // (ile inayoreact status za WhatsApp) — hii ni auto-react ya ujumbe wa kawaida.
  ["autoReact", "Auto React Messages", "alwaysOnline", "Always Online"],
  ["autoReadStatus", "Auto Read Status", "autoReadMessages", "Auto Read Messages"],
  ["autoTypingIndicator", "Auto Typing Indicator", "autoRecordingIndicator", "Auto Recording Indicator"],
  ["autoSaveContacts", "Auto Save Contacts", "cmdReadReceipt", "CMD Read Receipt"],
  ["autoBlock", "Auto Block", "autoViewOnceUnlock", "Auto View-Once Unlock"],
  ["antiCall", "Anti Call", "chatbot", "Chatbot"],
  ["autoBio", "Auto Bio", "autoStatusView", "Auto Status View"],
  ["autoStatusReact", "Auto Status React", "autoStatusLike", "Auto Status Like"],
  ["antiTag", "Anti Tag", "antiTemu", "Anti Temu"],
  ["sendStartupMsg", "Send Startup Message", null, null],
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

// ✅ Migration: bots zilizosanidiwa KABLA ya jina kubadilishwa kutoka
// "commandPrefix"/"autoReactStatus" kwenda "prefix"/"autoReact" bado zina
// thamani zao za zamani kwenye database. Bila hii, dashboard ingeonyesha
// (na kisha ku-save) default tupu badala ya thamani halisi mtu aliyoiweka
// awali. Ikiwa jina jipya halipo bado, tunalisoma kutoka jina la zamani.
function migrateLegacySettings(raw) {
  const s = { ...(raw || {}) };
  if (s.prefix === undefined && s.commandPrefix !== undefined) s.prefix = s.commandPrefix;
  if (s.autoReact === undefined && s.autoReactStatus !== undefined) s.autoReact = s.autoReactStatus;
  return s;
}

export default function OwnerSettings({ bot, auth, onRefresh }) {
  const [tab, setTab] = useState("basic");
  const [form, setForm] = useState({ ...createDefaultSettings(), ...migrateLegacySettings(bot.settings) });
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resettingField, setResettingField] = useState(null);

  const [newTrigger, setNewTrigger] = useState("");
  const [newResponse, setNewResponse] = useState("");

  const [newSchedule, setNewSchedule] = useState(createDefaultScheduleDraft);

  useEffect(() => {
    setForm({ ...createDefaultSettings(), ...migrateLegacySettings(bot.settings) });
  }, [bot.id, bot.settings]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const addAutoReply = () => {
    if (!newTrigger.trim() || !newResponse.trim()) {
      toast("Enter a trigger word and response message");
      return;
    }
    const list = form.autoReplies || [];
    if (list.length >= 20) {
      toast("You have reached the 20-trigger limit");
      return;
    }
    if (list.some((a) => a.trigger.toLowerCase() === newTrigger.trim().toLowerCase())) {
      toast("This trigger word already exists");
      return;
    }
    set("autoReplies", [...list, { id: Date.now().toString(36), trigger: newTrigger.trim(), response: newResponse.trim() }]);
    setNewTrigger("");
    setNewResponse("");
  };

  const removeAutoReply = (id) => set("autoReplies", (form.autoReplies || []).filter((a) => a.id !== id));

  const addSchedule = () => {
    if (!newSchedule.recipientNumber.trim() || !newSchedule.message.trim()) {
      toast("Enter a recipient number and message");
      return;
    }
    if (newSchedule.day === "once" && !newSchedule.date) {
      toast("Choose a date for the one-time message");
      return;
    }
    const entry = { id: Date.now().toString(36), ...newSchedule, recipientNumber: newSchedule.recipientNumber.trim() };
    set("scheduledMessages", [...(form.scheduledMessages || []), entry]);
    setNewSchedule(createDefaultScheduleDraft());
  };

  const removeSchedule = (id) => set("scheduledMessages", (form.scheduledMessages || []).filter((s) => s.id !== id));

  const save = async () => {
    setSaving(true);
    try {
      const result = await apiCall(`/bots/${encodeURIComponent(bot.id)}/settings`, {
        method: "PATCH",
        auth,
        body: form,
      });
      toast("Settings saved successfully.", "success");

      // The settings endpoint restarts the bot unless it explicitly reports
      // that no restart was needed. Wait for the owner's normal refresh before
      // confirming that the new configuration is active.
      const restarted = result?.restart !== false && result?.restarted !== false && result?.restartRequired !== false;
      if (restarted) toast("Restarting bot...", "info");
      await onRefresh?.();
      if (restarted) toast("Bot is now running with the new settings.", "success");
    } catch (err) {
      toast(err?.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = async () => {
    if (!window.confirm("Are you sure you want to reset this setting?")) return;
    const previousForm = structuredClone(form);
    const previousDrafts = { newTrigger, newResponse, newSchedule: structuredClone(newSchedule) };
    const defaults = createDefaultSettings();
    setResetting(true);
    setForm(defaults);
    setNewTrigger("");
    setNewResponse("");
    setNewSchedule(createDefaultScheduleDraft());
    try {
      toast("Resetting settings...", "info");
      toast("Saving default settings...", "info");
      await apiCall(`/bots/${encodeURIComponent(bot.id)}/settings`, {
        method: "PATCH",
        auth,
        body: defaults,
      });
      // The existing settings endpoint performs the bot restart when the
      // changed configuration requires it. Refresh only after that flow.
      toast("Restarting bot...", "info");
      await onRefresh?.();
      toast("Settings successfully restored.", "success");
    } catch (err) {
      setForm(previousForm);
      setNewTrigger(previousDrafts.newTrigger);
      setNewResponse(previousDrafts.newResponse);
      setNewSchedule(previousDrafts.newSchedule);
      toast(err?.message || "Unable to reset settings.");
    } finally {
      setResetting(false);
    }
  };

  const resetField = async (key, value) => {
    if (!window.confirm("Are you sure you want to reset this setting?")) return;
    const previousValue = structuredClone(form[key]);
    setResettingField(key);
    set(key, value);
    try {
      toast("Resetting settings...", "info");
      toast("Saving default settings...", "info");
      await apiCall(`/bots/${encodeURIComponent(bot.id)}/settings`, {
        method: "PATCH",
        auth,
        body: { [key]: value },
      });
      toast("Restarting bot...", "info");
      await onRefresh?.();
      toast("Settings successfully restored.", "success");
    } catch (err) {
      set(key, previousValue);
      toast(err?.message || "Unable to reset this setting.");
    } finally {
      setResettingField(null);
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

      {tab === "automation" && (
        <div className="os-card">
          <h3 className="os-section-title">Group Automation &amp; Safety</h3>

          <div className="os-togglecard">
            <div>
              <div className="os-togglecard-title">Welcome Messages</div>
              <div className="os-togglecard-desc">Send custom greeting when a new member joins group</div>
            </div>
            <Toggle checked={!!form.welcomeEnabled} onChange={(v) => set("welcomeEnabled", v)} />
          </div>
          <div className="os-field" style={{ marginBottom: 22 }}>
            <div className="os-label-row">
              <label className="os-label">Welcome Message Template — @USER = mention</label>
              <button type="button" className="os-reset-mini" onClick={() => resetField("welcomeMessage", DEFAULT_WELCOME)} disabled={resettingField === "welcomeMessage"} aria-label="Reset welcome message template">
                <RotateCcw size={11} /> Reset
              </button>
            </div>
            <textarea
              className="os-input os-textarea"
              rows={3}
              value={form.welcomeMessage}
              onChange={(e) => set("welcomeMessage", e.target.value)}
            />
          </div>

          <div className="os-togglecard">
            <div>
              <div className="os-togglecard-title">Goodbye Messages</div>
              <div className="os-togglecard-desc">Send a message when a member leaves the group</div>
            </div>
            <Toggle checked={!!form.goodbyeEnabled} onChange={(v) => set("goodbyeEnabled", v)} />
          </div>
          <div className="os-field" style={{ marginBottom: 22 }}>
            <div className="os-label-row">
              <label className="os-label">Goodbye Message Template — @USER = mention</label>
              <button type="button" className="os-reset-mini" onClick={() => resetField("goodbyeMessage", DEFAULT_GOODBYE)} disabled={resettingField === "goodbyeMessage"} aria-label="Reset goodbye message template">
                <RotateCcw size={11} /> Reset
              </button>
            </div>
            <textarea
              className="os-input os-textarea"
              rows={3}
              value={form.goodbyeMessage}
              onChange={(e) => set("goodbyeMessage", e.target.value)}
            />
          </div>

          <div className="os-togglecard">
            <div>
              <div className="os-togglecard-title">Anti-Link System</div>
              <div className="os-togglecard-desc">Auto remove or warn members who send invite links</div>
            </div>
            <Toggle checked={!!form.antiLinkEnabled} onChange={(v) => set("antiLinkEnabled", v)} />
          </div>
          <div className="os-field" style={{ marginBottom: 14 }}>
            <label className="os-label">Action When Link Found</label>
            <select
              className="os-input os-select"
              value={form.antiLinkAction}
              onChange={(e) => set("antiLinkAction", e.target.value)}
            >
              <option value="warn">Warn Only</option>
              <option value="delete">Delete Message</option>
              <option value="kick">Kick Member</option>
            </select>
          </div>
          <div className="os-field" style={{ marginBottom: 22 }}>
            <label className="os-label">Anti-Link Warning Message — @USER = mention</label>
            <textarea
              className="os-input os-textarea"
              rows={2}
              value={form.antiLinkWarningMessage}
              onChange={(e) => set("antiLinkWarningMessage", e.target.value)}
            />
          </div>

          <div className="os-togglecard">
            <div>
              <div className="os-togglecard-title">Anti-Bad Word System</div>
              <div className="os-togglecard-desc">Auto remove or warn members who use listed bad words</div>
            </div>
            <Toggle checked={!!form.antiBadWordEnabled} onChange={(v) => set("antiBadWordEnabled", v)} />
          </div>
          <div className="os-field" style={{ marginBottom: 14 }}>
            <label className="os-label">Action When Bad Word Found</label>
            <select
              className="os-input os-select"
              value={form.antiBadWordAction}
              onChange={(e) => set("antiBadWordAction", e.target.value)}
            >
              <option value="warn">Warn Only</option>
              <option value="delete">Delete Message</option>
              <option value="kick">Kick Member</option>
            </select>
          </div>
          <div className="os-field" style={{ marginBottom: 14 }}>
            <label className="os-label">Anti-Bad Word Warning Message — @USER = mention</label>
            <textarea
              className="os-input os-textarea"
              rows={2}
              value={form.antiBadWordWarningMessage}
              onChange={(e) => set("antiBadWordWarningMessage", e.target.value)}
            />
          </div>
          <div className="os-field">
            <label className="os-label">Bad Words List (comma separated, case insensitive)</label>
            <textarea
              className="os-input os-textarea"
              rows={3}
              placeholder="word1,word2,word3,..."
              value={form.badWordsList}
              onChange={(e) => set("badWordsList", e.target.value)}
            />
          </div>

          <button className="os-save-btn" type="button" onClick={save} disabled={saving}>
            {saving ? <Loader2 size={15} className="spin-icon" /> : <Save size={15} />}
            Save Group Settings
          </button>
        </div>
      )}

      {tab === "autoreply" && (
        <div className="os-card">
          <h3 className="os-section-title">Auto Reply Manager</h3>

          <div className="os-subcard">
            <p className="os-subcard-title">Add New Trigger (Max 20)</p>
            <div className="os-grid-2">
              <input
                className="os-input"
                placeholder="Trigger Word (e.g. hello)"
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
              />
              <input
                className="os-input"
                placeholder="Response Message"
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
              />
            </div>
            <button className="os-add-btn" type="button" onClick={addAutoReply}>
              <Plus size={14} /> Add Auto Reply
            </button>
          </div>

          {(form.autoReplies || []).length === 0 && (
            <p className="dash-empty">No auto replies yet — add your first one above.</p>
          )}

          <div className="os-list">
            {(form.autoReplies || []).map((a) => (
              <div key={a.id} className="os-list-row">
                <div className="os-list-info">
                  <span className="os-list-trigger">{a.trigger}</span>
                  <span className="os-list-response">{a.response}</span>
                </div>
                <button type="button" className="os-list-del" onClick={() => removeAutoReply(a.id)} aria-label="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <button className="os-save-btn" type="button" onClick={save} disabled={saving}>
            {saving ? <Loader2 size={15} className="spin-icon" /> : <Save size={15} />}
            Save Auto Replies
          </button>
        </div>
      )}

      {tab === "scheduled" && (
        <div className="os-card">
          <h3 className="os-section-title">Scheduled Messages</h3>

          <div className="os-subcard">
            <p className="os-subcard-title">Schedule New Message</p>
            <div className="os-grid-3">
              <input
                className="os-input"
                placeholder="Recipient Number (e.g. 94...)"
                value={newSchedule.recipientNumber}
                onChange={(e) => setNewSchedule((s) => ({ ...s, recipientNumber: e.target.value }))}
              />
              <input
                className="os-input"
                placeholder="Recipient Name (Optional)"
                value={newSchedule.recipientName}
                onChange={(e) => setNewSchedule((s) => ({ ...s, recipientName: e.target.value }))}
              />
              <select
                className="os-input os-select"
                value={newSchedule.day}
                onChange={(e) => setNewSchedule((s) => ({ ...s, day: e.target.value }))}
              >
                <option value="everyday">Everyday</option>
                <option value="once">Once (specific date)</option>
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>

            {newSchedule.day === "once" ? (
              <input
                className="os-input"
                type="date"
                style={{ marginTop: 12 }}
                value={newSchedule.date}
                onChange={(e) => setNewSchedule((s) => ({ ...s, date: e.target.value }))}
              />
            ) : (
              <input
                className="os-input"
                type="time"
                style={{ marginTop: 12 }}
                value={newSchedule.time}
                onChange={(e) => setNewSchedule((s) => ({ ...s, time: e.target.value }))}
              />
            )}

            <textarea
              className="os-input os-textarea"
              rows={3}
              style={{ marginTop: 12 }}
              placeholder="Scheduled Message Content..."
              value={newSchedule.message}
              onChange={(e) => setNewSchedule((s) => ({ ...s, message: e.target.value }))}
            />

            <button className="os-add-btn" type="button" onClick={addSchedule}>
              <Plus size={14} /> Schedule Message
            </button>
          </div>

          {(form.scheduledMessages || []).length === 0 && (
            <p className="dash-empty">No scheduled messages yet.</p>
          )}

          <div className="os-list">
            {(form.scheduledMessages || []).map((s) => (
              <div key={s.id} className="os-list-row">
                <div className="os-list-info">
                  <span className="os-list-trigger">
                    +{s.recipientNumber}{s.recipientName ? ` (${s.recipientName})` : ""}
                  </span>
                  <span className="os-list-response">
                    {s.day === "once" ? s.date : `${s.day} @ ${s.time}`} — {s.message}
                  </span>
                </div>
                <button type="button" className="os-list-del" onClick={() => removeSchedule(s.id)} aria-label="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <button className="os-save-btn" type="button" onClick={save} disabled={saving}>
            {saving ? <Loader2 size={15} className="spin-icon" /> : <Save size={15} />}
            Save Scheduled Messages
          </button>
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
              <input className="os-input" value={form.prefix} onChange={(e) => set("prefix", e.target.value)} />
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

          {form.antiTag && (
            <div className="os-grid-2" style={{ marginTop: 12 }}>
              <div className="os-field">
                <label className="os-label">Anti-Tag Target</label>
                <select className="os-input os-select" value={form.antiTagTarget} onChange={(e) => set("antiTagTarget", e.target.value)}>
                  <option value="bot">Someone tags the bot</option>
                  <option value="groupAll">Tag-All ya Group Nzima (mass-mention)</option>
                  <option value="both">Vyote Viwili</option>
                </select>
              </div>
              <div className="os-field">
                <label className="os-label">Anti Tag Action</label>
                <select className="os-input os-select" value={form.antiTagAction} onChange={(e) => set("antiTagAction", e.target.value)}>
                  <option value="warn">Onyo Tu (Warn)</option>
                  <option value="delete">Delete message only</option>
                  <option value="kick">Delete message and remove member</option>
                </select>
              </div>
              <div className="os-field">
                <label className="os-label">Anti Tag Scope</label>
                <select className="os-input os-select" value={form.antiTagScope} onChange={(e) => set("antiTagScope", e.target.value)}>
                  <option value="all">All groups (global)</option>
                  <option value="selected">Selected groups</option>
                </select>
              </div>
              {form.antiTagScope === "selected" && (
                <div className="os-field">
                  <label className="os-label">Groups (JIDs, comma-separated)</label>
                  <textarea
                    className="os-input os-textarea"
                    rows={2}
                    placeholder="120363xxxxxxxxxx@g.us,120363yyyyyyyyyy@g.us,..."
                    value={form.antiTagGroups}
                    onChange={(e) => set("antiTagGroups", e.target.value)}
                  />
                </div>
              )}
              {(form.antiTagAction === "delete" || form.antiTagAction === "kick") && (
                <p className="os-hint" style={{ gridColumn: "1 / -1", fontSize: 12, opacity: 0.75 }}>
                  ⚠️ Deleting a message or removing a member requires the bot to be an <strong>admin</strong> in that group. Otherwise, WhatsApp will not allow the action and the bot will send only a warning.
                </p>
              )}
            </div>
          )}

          <div className="os-grid-2" style={{ marginTop: 18 }}>
            <div className="os-field">
              <label className="os-label">Anti Delete</label>
              <select className="os-input os-select" value={form.antiDelete} onChange={(e) => set("antiDelete", e.target.value)}>
                <option value="off">Off</option>
                <option value="sender">From (Sender)</option>
                <option value="all">All Messages</option>
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
                <option value="samechat">Del Chat (Same Chat)</option>
              </select>
            </div>
            <div className="os-field">
              <label className="os-label">View-Once Unlock Destination</label>
              <select className="os-input os-select" value={form.viewOnceUnlockDestination} onChange={(e) => set("viewOnceUnlockDestination", e.target.value)}>
                <option value="botdm">Inbox (Bot&apos;s own DM)</option>
                <option value="samechat">Direct (Same Chat)</option>
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
              <button type="button" className="os-reset-mini" onClick={() => resetField("csongMessage", DEFAULT_CSONG)} disabled={resettingField === "csongMessage"} aria-label="Reset CSong message template">
                <RotateCcw size={11} /> Reset
              </button>
            </div>
            <textarea className="os-input os-textarea" rows={6} value={form.csongMessage} onChange={(e) => set("csongMessage", e.target.value)} />
          </div>

          <h3 className="os-section-title" style={{ marginTop: 26 }}><Lock size={15} /> Access Control</h3>
          <div className="os-grid-2">
            <div className="os-field">
              <label className="os-label">Owner Number</label>
              <input className="os-input" placeholder="e.g. 94712345678" value={form.ownerNumber} onChange={(e) => set("ownerNumber", e.target.value)} />
            </div>
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
            <p className="os-danger-sub">Restores every setting, including automation, replies, and schedules, to its default value.</p>
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
          background: var(--token-card); border: 1px solid var(--token-card-border);
          color: var(--token-muted); cursor: pointer; transition: 0.15s ease;
        }
        .os-tab:hover { background: var(--token-hover); color: var(--token-text); }
        .os-tab.active { background: var(--token-accent-fill); border-color: transparent; color: var(--token-on-accent); }

        .os-card {
          background: var(--token-card); backdrop-filter: blur(20px);
          border: 1px solid var(--token-card-border); border-radius: 20px; padding: 22px;
        }
        .os-section-title { display: flex; align-items: center; gap: 8px; color: var(--token-text); font-weight: 800; font-size: 1rem; margin-bottom: 16px; }

        .os-grid-2 { display: grid; grid-template-columns: 1fr; gap: 14px; }
        @media (min-width: 560px) { .os-grid-2 { grid-template-columns: 1fr 1fr; } }
        .os-grid-3 { display: grid; grid-template-columns: 1fr; gap: 14px; }
        @media (min-width: 720px) { .os-grid-3 { grid-template-columns: 1fr 1fr 1fr; } }

        .os-togglecard {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          background: var(--token-surface); border: 1px solid var(--token-card-border);
          border-radius: 12px; padding: 14px 16px; margin-bottom: 14px;
        }
        .os-togglecard-title { color: var(--token-text); font-weight: 700; font-size: 0.88rem; }
        .os-togglecard-desc { color: var(--token-muted); font-size: 0.72rem; margin-top: 2px; }

        .os-subcard {
          background: var(--token-surface); border: 1px solid var(--token-card-border);
          border-radius: 16px; padding: 18px; margin-bottom: 18px;
        }
        .os-subcard-title { color: var(--token-info); font-weight: 700; font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px; }

        .os-add-btn {
          display: inline-flex; align-items: center; gap: 7px; margin-top: 14px;
          padding: 10px 16px; border-radius: 10px; border: none; cursor: pointer;
          background: var(--token-accent-fill); color: var(--token-on-accent); font-weight: 700; font-size: 0.82rem;
        }
        .os-add-btn:hover { filter: brightness(1.1); }

        .os-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
        .os-list-row {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          background: var(--token-surface); border: 1px solid var(--token-card-border);
          border-radius: 12px; padding: 12px 14px;
        }
        .os-list-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .os-list-trigger { color: var(--token-text); font-weight: 700; font-size: 0.82rem; }
        .os-list-response { color: var(--token-muted); font-size: 0.76rem; overflow-wrap: anywhere; }
        .os-list-del {
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 9px; border: 1px solid var(--token-error);
          background: var(--token-error-bg); color: var(--token-error); cursor: pointer;
        }
        .os-list-del:hover { background: var(--token-error-bg); }
        .os-field { display: flex; flex-direction: column; gap: 6px; }
        .os-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--token-muted); }
        .os-label-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .os-input {
          width: 100%; background: var(--token-surface); border: 1px solid var(--token-card-border);
          border-radius: 10px; padding: 10px 12px; color: var(--token-text); font-size: 0.85rem; outline: none;
          transition: border-color 0.15s ease; font-family: inherit;
        }
        .os-input::placeholder { color: var(--token-muted); }
        .os-input:focus { border-color: var(--token-focus); }
        .os-select { appearance: none; cursor: pointer; }
        .os-textarea { resize: vertical; line-height: 1.5; }
        .os-reset-mini { display: inline-flex; align-items: center; gap: 4px; background: var(--token-info-bg); border: 1px solid var(--token-info-border); color: var(--token-info); font-size: 0.68rem; font-weight: 700; padding: 4px 8px; border-radius: 8px; cursor: pointer; white-space: nowrap; }

        .os-toggle-grid { display: flex; flex-direction: column; gap: 10px; margin-top: 18px; }
        .os-toggle-row { display: grid; grid-template-columns: 1fr; gap: 10px; }
        @media (min-width: 560px) { .os-toggle-row { grid-template-columns: 1fr 1fr; } }
        .os-toggle-item {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          background: var(--token-surface); border: 1px solid var(--token-card-border);
          border-radius: 12px; padding: 12px 14px;
        }
        .os-toggle-item span { color: var(--token-text); font-weight: 600; font-size: 0.84rem; }
        .os-toggle {
          width: 40px; height: 22px; border-radius: 999px; border: none; cursor: pointer;
          background: var(--token-card-strong); position: relative; flex-shrink: 0; padding: 0;
          transition: background 0.15s ease;
        }
        .os-toggle.on { background: var(--token-accent-fill); }
        .os-toggle-knob {
          position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%;
          background: var(--token-text); transition: transform 0.15s ease;
        }
        .os-toggle.on .os-toggle-knob { transform: translateX(18px); }
        .os-toggle:disabled { opacity: 0.5; cursor: not-allowed; }

        .os-save-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; margin-top: 26px; padding: 13px; border-radius: 12px; border: none;
          background: var(--token-accent-fill); color: var(--token-on-accent); font-weight: 700; font-size: 0.9rem;
          cursor: pointer; box-shadow: 0 0 24px var(--token-glow);
        }
        .os-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .os-danger { margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--token-border); }
        .os-danger-title { display: flex; align-items: center; gap: 6px; color: var(--token-error); font-weight: 700; font-size: 0.85rem; margin-bottom: 4px; }
        .os-danger-sub { color: var(--token-muted); font-size: 0.75rem; margin-bottom: 12px; }
        .os-danger-btn {
          display: inline-flex; align-items: center; gap: 7px;
          background: var(--token-error-bg); border: 1px solid var(--token-error); color: var(--token-error);
          font-weight: 700; font-size: 0.78rem; padding: 9px 14px; border-radius: 10px; cursor: pointer;
        }
        .os-danger-btn:hover:not(:disabled) { background: var(--token-error-bg); }
        .os-danger-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
