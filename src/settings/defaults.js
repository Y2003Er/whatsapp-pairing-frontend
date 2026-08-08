// This is the single source of truth for a brand-new bot configuration.
// Always create a copy before placing these values in React state or a request.
export const DEFAULT_SETTINGS = Object.freeze({
  botName: "",
  ownerName: "",
  prefix: ".",
  ownerCountry: "",
  ownerAge: "",
  botMode: "public",
  botLanguage: "en",
  autoReact: false,
  alwaysOnline: false,
  autoReadMessages: false,
  autoTypingIndicator: false,
  autoRecordingIndicator: false,
  autoSaveContacts: false,
  cmdReadReceipt: false,
  autoBlock: false,
  autoViewOnceUnlock: false,
  antiCall: false,
  antiTag: false,
  antiTagTarget: "groupAll",
  antiTagAction: "kick",
  antiTagScope: "all",
  antiTagGroups: "",
  antiTemu: false,
  autoBio: false,
  autoStatusView: false,
  autoStatusReact: false,
  autoStatusLike: false,
  chatbot: false,
  sendStartupMsg: false,
  antiDelete: "off",
  antiDeleteWorkType: "both",
  antiDeleteSendType: "owner",
  viewOnceUnlockDestination: "botdm",
  ownerImageUrl: "",
  menuLogoUrl: "",
  aliveLogoUrl: "",
  aliveMessage: "©POWERED BY 26-TECH",
  csongMessage: "🌸 *Now Playing* 🌸\n\n✨ *Title* : {title}\n⏱ *Duration* : {duration}\n👁 *Views* : {views}\n🎙 *Channel* : {author}",
  ownerNumber: "",
  sudoNumbers: "",
  bannedNumbers: "",
  callOpenList: "",
  callRejectList: "",
  welcomeEnabled: false,
  welcomeMessage: "👋 Welcome to *{groupName}*!\n\nHey @{member}, glad you joined us! 🎉",
  goodbyeEnabled: false,
  goodbyeMessage: "👋 *{groupName}* says goodbye to @{member}!\nWe'll miss you! 😢",
  antiLinkEnabled: false,
  antiLinkAction: "warn",
  antiLinkWarningMessage: "Links are not allowed in this group!",
  antiBadWordEnabled: false,
  antiBadWordAction: "warn",
  antiBadWordWarningMessage: "Bad words are not allowed!",
  badWordsList: "",
  autoReplies: Object.freeze([]),
  scheduledMessages: Object.freeze([]),
});

export const DEFAULT_APPEARANCE_PREFERENCES = Object.freeze({
  dark: false,
  density: "comfortable",
  motion: "full",
  radius: "default",
});

export const DEFAULT_THEME_ID = "warmStone";

export const DEFAULT_SCHEDULE_DRAFT = Object.freeze({
  recipientNumber: "",
  recipientName: "",
  day: "everyday",
  time: "08:00",
  date: "",
  message: "",
});

export function createDefaultSettings() {
  return structuredClone(DEFAULT_SETTINGS);
}

export function createDefaultAppearancePreferences() {
  return { ...DEFAULT_APPEARANCE_PREFERENCES };
}

export function createDefaultScheduleDraft() {
  return { ...DEFAULT_SCHEDULE_DRAFT };
}
