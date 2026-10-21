const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  downloadMediaMessage,
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const sharp = require("sharp");
const fs = require("fs");
const yts = require("yt-search");
const ytdl = require("@distube/ytdl-core");

const PREFIX = "/";
const DEV = "Senpai";
const PHONE_NUMBER = "212710791573";
const OWNER_JID = PHONE_NUMBER + "@s.whatsapp.net";

const DATA_FILE = "./data.json";
const defaultData = {
  publicMode: false,
  warnings: {},
  antilink: {},
  welcome: {},
  groupMuted: {},
  mutedUsers: {},
  rules: {},
  afk: {},
  protection: {},
};
let data = { ...defaultData };

// FIX 5: دمج البيانات القديمة مع القيم الافتراضية حتى لا تنقص أي خانة
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      data = { ...defaultData, ...saved };
    }
  } catch (e) {}
}
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data));
  } catch (e) {}
}
loadData();

const flirtLines = [
  "في عينيك سحرٌ لا يدركه إلا من رآهما 🧡",
  "بعض الناس يُضيئون الغرفة، وبعضهم يُضيء القلب، وأنت من الصنف الثاني 🔥",
  "خلقك الله جميلاً لتسحر الأنظار، وذكياً لتدرك أنك كذلك 😏",
  "ليس كل أحدٍ يستحق الاهتمام، لكنك استثناء 🦊",
  "لبعض الوجوه بريقٌ خاص، يُضيء النهار كله بابتسامة واحدة 🎃",
];

const jokes = [
  "سأل أحدهم صديقه: كم تبعد المسافة إلى القمر؟ فأجابه: لا أدري، فأنا لا أسكن هناك 😂",
  "قال رجل لصديقه: عندي فكرة ستغيّر حياتك. فقال: أخبرني بها. فأجاب: لقد نسيتها 🤣",
  "سأل التلميذ أستاذه: هل يُعاقَب المرء على أمرٍ لم يفعله؟ فقال: لا. فقال التلميذ: جيد، فأنا لم أُنجز الواجب 😂",
];

const facts = [
  "💡 يُحرّك النحل جناحيه نحو مئتي مرة في الثانية الواحدة.",
  "💡 قلب الحوت الأزرق بحجم سيارة صغيرة.",
  "💡 العسل لا يفسد أبداً، ويبقى صالحاً للأكل آلاف السنين.",
  "💡 للأخطبوط ثلاثة قلوب وتسعة أدمغة.",
];

const quotes = [
  "📜 « من لا صبر له لا حكمة له »",
  "📜 « الطريق الطويل يبدأ بخطوة واحدة »",
  "📜 « في الفشل درسٌ، وفي النجاح غرور »",
];

const riddles = [
  "🧩 شيءٌ له مفاتيح لكن لا يفتح باباً؟ (الجواب: مفاتيح البيانو)",
  "🧩 ما الذي يزيد وينقص في الوقت نفسه؟ (الجواب: العمر)",
  "🧩 شيءٌ كلما زدت فيه نقص؟ (الجواب: الحفرة)",
];

const truths = [
  "💭 من كان آخر من خطر ببالك قبل أن تنام؟",
  "💭 هل سبق أن قلت كذبة كبيرة؟ ما هي؟",
  "💭 ما أكثر شيء تخافه؟",
];

const dares = [
  "🔥 أرسل ملصقاً عشوائياً دون اختيار، أول ما تجده",
  "🔥 غيّر اسم ملفك الشخصي لمدة عشر دقائق",
  "🔥 أرسل رسالة صوتية وأنت تُغنّي",
];

// ===== خط Small Caps: sᴇɴᴘᴀɪ =====
const SC_MAP = {
  a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ", i: "ɪ", j: "ᴊ",
  k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ǫ", r: "ʀ", s: "s", t: "ᴛ",
  u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ",
};
const sc = (str) => String(str).toLowerCase().replace(/[a-z]/g, (c) => SC_MAP[c]);

// ===== إطار موحد (ستايل 10) =====
const SC_REV = Object.fromEntries(Object.entries(SC_MAP).map(([k, v]) => [v, k.toUpperCase()]));
const toBold = (str) =>
  [...str]
    .map((c) => {
      if (c >= "A" && c <= "Z") return String.fromCodePoint(0x1d400 + c.charCodeAt(0) - 65);
      if (c >= "a" && c <= "z") return String.fromCodePoint(0x1d41a + c.charCodeAt(0) - 97);
      if (c >= "0" && c <= "9") return String.fromCodePoint(0x1d7ce + c.charCodeAt(0) - 48);
      return c;
    })
    .join("");

const bullet = (l) => {
  const t = String(l);
  if (!t.trim()) return "";
  if (/^(\s{2}|[❶-❿]|❖)/.test(t)) return t; // سطر متابعة أو مرقّم: بلا نقطة
  return `❖ ${t}`;
};

// الإطار الموحد: نفس هيكل قالب المنيو
const frame = (title, lines) => {
  let t = String(title).trim();
  const m = t.match(/^(\p{Extended_Pictographic}\uFE0F?)/u);
  const icon = m ? m[1] : "⚡";
  t = t.replace(/^[\p{Extended_Pictographic}\uFE0F\s]+/u, "").replace(/[\p{Extended_Pictographic}\uFE0F\s]+$/u, "");
  t = [...t].map((c) => SC_REV[c] ?? c).join("");
  return [
    "╭════════════╮",
    `  ${icon} *[ ${toBold(t)} ]* ${icon}`,
    "╰════════════╯",
    ...lines.map(bullet),
  ].join("\n");
};

const boxText = (title, lines) => frame(`🌸 ${sc(title)} 🌸`, lines);

const menuData = {
  ADMIN: ["🔥 ADMIN", [
    ["kick @user", "طرد عضو", "🚫"],
    ["warn @user", "إنذار عضو", "⚠️"],
    ["rwarn @user", "تصفير الإنذارات", "♻️"],
    ["mute @user", "إسكات عضو", "🔇"],
    ["unmute @user", "رفع الإسكات", "🔊"],
    ["mute group", "كتم المجموعة", "🔒"],
    ["open group", "فتح المجموعة", "🔓"],
    ["pro @user", "ترقية لمشرف", "⬆️"],
    ["dem @user", "تنزيل من الإشراف", "⬇️"],
    ["links on", "تفعيل منع الروابط", "🔗"],
    ["links off", "إيقاف منع الروابط", "✂️"],
    ["protect on", "تفعيل الحماية", "🛡️"],
    ["bc link | msg", "إرسال رسالة لمجموعة", "📢"],
  ]],
  TAG: ["🦊 TAG", [
    ["tag admins", "منشن المشرفين", "👮"],
    ["tag all", "منشن الجميع", "📣"],
    ["htag text", "منشن مخفي", "👻"],
  ]],
  INFO: ["📋 INFO", [
    ["ginfo", "معلومات المجموعة", "📋"],
    ["admins", "قائمة المشرفين", "👑"],
    ["count", "عدد الأعضاء", "👥"],
    ["info @user", "بطاقة عضو", "👤"],
    ["rules", "قوانين المجموعة", "📜"],
    ["setr text", "تعيين القوانين", "✏️"],
  ]],
  WELCOME: ["🎃 WELCOME", [
    ["welcome on", "تفعيل الترحيب", "🎉"],
    ["welcome off", "إيقاف الترحيب", "🔕"],
    ["bye on", "تفعيل الوداع", "👋"],
    ["bye off", "إيقاف الوداع", "🚪"],
  ]],
  FUN: ["🧡 FUN", [
    ["sticker", "تحويل صورة لستيكر", "🖼️"],
    ["marry @a @b", "زواج عضوين", "💍"],
    ["flirt @user", "غزل", "😏"],
    ["joke", "نكتة", "😂"],
    ["fact", "معلومة", "💡"],
    ["quote", "اقتباس", "💬"],
    ["riddle", "لغز", "🧩"],
    ["truth", "سؤال صراحة", "💭"],
    ["dare", "تحدي", "🔥"],
    ["dice", "نرد", "🎲"],
    ["rps rock", "حجر ورقة مقص", "✊"],
  ]],
  TOOLS: ["🔍 TOOLS", [
    ["rev (reply)", "كشف ميديا بالرد", "👁️"],
    ["song name", "تحميل أغنية", "🎵"],
  ]],
  AFK: ["😴 AFK", [
    ["afk reason", "تفعيل الغياب", "😴"],
    ["back", "إنهاء الغياب", "✅"],
  ]],
  GENERAL: ["⚙️ GENERAL", [
    ["ping", "سرعة البوت", "🏓"],
    ["owner", "المطور", "👑"],
    ["time", "الوقت", "🕐"],
    ["public", "وضع عام", "🌍"],
    ["private", "وضع خاص", "🔒"],
    ["prefix", "البادئة", "⌨️"],
    ["about", "حول البوت", "ℹ️"],
    ["status", "حالة البوت", "📊"],
  ]],
};

const menuSections = Object.fromEntries(
  Object.entries(menuData).map(([key, [title, items]]) => [
    key,
    [
      "┌────────────┐",
      `  ${sc(title)}`,
      "└────────────┘",
      ...items.map(([cmd, desc, emo]) => {
        const [name, ...rest] = cmd.split(" ");
        return `${emo} ${sc(name)}: ${rest.length ? rest.join(" ") + " — " : ""}${desc}`;
      }),
    ].join("\n"),
  ])
);
const PLUGINS_COUNT = Object.values(menuData).reduce((n, [, items]) => n + items.length, 0);

const BANNER_PATH = "./banner.jpg";

async function sendMenuList(sock, from) {
  const caption = `╭════════════╮
  ⚡ *[ 𝐒𝐄𝐍𝐏𝐀𝐈 • 𝐌𝐄𝐍𝐔 ]* ⚡
╰════════════╯`;

  let bannerBuffer = null;
  try {
    if (fs.existsSync(BANNER_PATH)) {
      bannerBuffer = fs.readFileSync(BANNER_PATH);
    }
  } catch (e) {}

  if (bannerBuffer) {
    await sock.sendMessage(from, { image: bannerBuffer, caption: caption });
  } else {
    await sock.sendMessage(from, { text: caption });
  }

  const footer = `╭────────────╮
  ⚖️ الـقـوانـيـن لا تـعـرف الاسـتـثـنـاءات
╰────────────╯`;
  const allSections = Object.values(menuSections).join("\n\n") + "\n\n" + footer;
  await sock.sendMessage(from, { text: allSections });
}

const kickText = (jid, adminJid) => frame("☠️ ᴇxᴇᴄᴜᴛɪᴏɴ ☠️", [
  "🚫 تم طرد عضو من المجموعة!",
  `👤 العضو ⟶ @${jid.split("@")[0]}`,
  `👑 المنفّذ ⟶ @${adminJid.split("@")[0]}`,
  "",
  "⚖️ صدر القرار، وانتهى النقاش.",
  "🗿 لم يعد لهذا المقعد صاحب.",
  "🌸 القوانين ليست زينةً للواجهة،",
  "  بل حدودٌ لا يتجاوزها أحد.",
  "",
  "☠️ انتهت صلاحية وجودك هنا.",
]);

const leaveText = (jid) => frame("🍂 ɢᴏᴏᴅʙʏᴇ 🍂", [
  "📤 انسحاب عضو من المجموعة!",
  `👤 العضو ⟶ @${jid.split("@")[0]}`,
  "",
  "☠️ لقد اختار الرحيل بنفسه...",
  "🗿 لا أحد سيوقفك، ولا أحد سيطاردك.",
  "🍂 فالأبواب لا تُغلق خلف الراحلين،",
  "  بل تُفتح لمن يستحق البقاء.",
  "",
  "🌸 SENPAI لا يتوقف لأجل أحد.",
]);

const antilinkText = (jid) => frame("🛡️ حـمـايـة الـروابـط 🛡️", [
  "⛔ تم رصد رابط غير مسموح به!",
  "",
  `👤 العضو ⟶ @${jid.split("@")[0]}`,
  "🔗 الحالة ⟶ رابط ممنوع",
  "⚔️ الإجراء ⟶ حذف الرسالة",
  "",
  "⚠️ كررها مرة أخرى، وتحمّل العواقب.",
]);

const marriageText = (bride, groom) => frame("💍 إعلان زواج جديد 💍", [
  "🎊 بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ 🎊",
  "",
  "💍 يسرّنا أن نعلن عن زواج عضوين",
  "  من أعضاء المجموعة، في أجواء",
  "  مليئة بالفرح والمودة ❤️✨",
  "",
  `👰 العروس ⟶ @${bride.split("@")[0]}`,
  `🤵 العريس ⟶ @${groom.split("@")[0]}`,
  "",
  "🌹 ألف ألف مبارك للعروسين، ونسأل",
  "  الله أن يبارك لهما ويجمع بينهما",
  "  في خير، ويرزقهما حياةً سعيدةً",
  "  مليئةً بالمحبة والوفاء 🤍",
  "",
  "🎉 باركوا للعروسين يا أهل",
  "  المجموعة، وشاركونا فرحتنا 🌸",
]);

const ownerBroadcastText = (message) => frame("📢 إعلان المالك 👑", [
  ...String(message).split("\n").map((l) => "  " + l),
]);

const notInGroupText = frame("🌸 sᴇɴᴘᴀɪ ʙᴏᴛ 🌸", [
  "⚠️ هذا البوت يعمل داخل المجموعات فقط.",
  "📌 لا يدعم المحادثات الخاصة.",
]);

const welcomeText = (jid, memberNumber, groupName) => frame("🌸 sᴇɴᴘᴀɪ ʙᴏᴛ 🌸", [
  "🎉✨ مــرحــبــاً بــك فــي الــمــجــمــوعــة!",
  "",
  "👤 العضو الجديد",
  `🌸 الاسم ⟶ @${jid.split("@")[0]}`,
  `🔥 الرقم ⟶ #${memberNumber}`,
  `🦊 المجموعة ⟶ ${groupName}`,
  "",
  "🎃 نــوّرتــي الــمــجــمــوعــة بــوجــودك! 🧡",
  "🍁 نتمنى ليك أوقات ممتعة معانا.",
  "🔥 احترم الجميع، وخلّي بصمتك مميّزة!",
  "🦊 استمتع بوقتك مع عائلة Senpai.",
]);

const BOT_SIGNATURE = `╭────────────╮
  🦊 sᴇɴᴘᴀɪ ʙᴏᴛ 🦂
╰────────────╯`;

function addSignature(message) {
  if (message.startsWith("┌──")) return message; // المنيو له إطار سفلي خاص
  return `${message}\n${BOT_SIGNATURE}`;
}

function getTargetJid(msg, args) {
  const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
  if (mentioned && mentioned.length > 0) return mentioned;
  const quotedParticipant = msg.message.extendedTextMessage?.contextInfo?.participant;
  if (quotedParticipant) return [quotedParticipant];
  if (args[0] && /^\d+$/.test(args[0].replace("+", ""))) {
    return [args[0].replace("+", "") + "@s.whatsapp.net"];
  }
  return [];
}

const normalizeJid = (jid) => (jid || "").split(":")[0].split("@")[0];

async function isSenderAdmin(sock, groupJid, senderJid) {
  try {
    const meta = await sock.groupMetadata(groupJid);
    const p = meta.participants.find((x) => normalizeJid(x.id) === normalizeJid(senderJid));
    return !!p && (p.admin === "admin" || p.admin === "superadmin");
  } catch (e) {
    return false;
  }
}

async function isBotAdmin(sock, groupJid) {
  try {
    const meta = await sock.groupMetadata(groupJid);
    const botId = normalizeJid(sock.user.id);
    const p = meta.participants.find((x) => normalizeJid(x.id) === botId);
    return !!p && (p.admin === "admin" || p.admin === "superadmin");
  } catch (e) {
    return false;
  }
}

// FIX 1: الأوامر التي يجب أن تكون للمشرفين فقط (والمالك طبعاً)
const adminOnlyCommands = new Set([
  "ضرد", "kick",
  "انذار", "warn",
  "تصفير_تحذير",
  "اسكات", "رفع_اسكات",
  "فتح",
  "روابط",
  "ترحيب", "وداع",
  "ترقية", "تنزيل",
  "مخفي",
  "تعيين_القوانين",
]);

const commands = {
  "بينج": async (sock, from, msg) => {
    // FIX: messageTimestamp قد يكون من نوع Long، لذلك نحوله إلى رقم
    const msgTimestamp = Number(msg.messageTimestamp || Math.floor(Date.now() / 1000)) * 1000;
    const start = Date.now();
    await sock.sendMessage(from, { text: "🏓 يجري قياس السرعة..." });
    const end = Date.now();
    const processingMs = end - start;
    const receiveLatencyMs = start - msgTimestamp;
    await sock.sendMessage(from, {
      text: `🏓 بونغ!\n⚡ سرعة الرد: ${processingMs}ms\n📡 زمن الاستقبال: ${receiveLatencyMs >= 0 ? receiveLatencyMs : "~"}ms`,
    });
  },
  "المطور": async (sock, from) => sock.sendMessage(from, { text: "المطور: " + DEV }),
  "الوقت": async (sock, from) =>
    sock.sendMessage(from, { text: "الوقت: " + new Date().toLocaleString("ar-MA") }),
  "منيو": async (sock, from) => sendMenuList(sock, from),
  "القائمة": async (sock, from) => sendMenuList(sock, from),

  "عام": async (sock, from, msg, isOwner) => {
    if (!isOwner) return sock.sendMessage(from, { text: "هذا الأمر خاص بالمالك فقط." });
    data.publicMode = true;
    saveData();
    await sock.sendMessage(from, { text: "✅ البوت أصبح عاماً الآن." });
  },
  "خاص": async (sock, from, msg, isOwner) => {
    if (!isOwner) return sock.sendMessage(from, { text: "هذا الأمر خاص بالمالك فقط." });
    data.publicMode = false;
    saveData();
    await sock.sendMessage(from, { text: "🔒 البوت أصبح خاصاً الآن." });
  },

  "ستيكرات": async (sock, from, msg) => {
    const quoted =
      msg.message.imageMessage ||
      msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if (!quoted) {
      return sock.sendMessage(from, { text: "أرسل صورة مع الأمر /sticker أو رُدّ بها على صورة" });
    }
    const buffer = await downloadMediaMessage(
      { message: { imageMessage: quoted } },
      "buffer",
      {},
      { logger: pino({ level: "silent" }), reuploadRequest: sock.updateMediaMessage }
    );
    const webpBuffer = await sharp(buffer)
      .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp()
      .toBuffer();
    await sock.sendMessage(from, { sticker: webpBuffer });
  },

  "زواج": async (sock, from, msg) => {
    const meta = await sock.groupMetadata(from).catch(() => null);
    const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
    let pair;
    if (mentioned.length >= 2) {
      pair = [mentioned[0], mentioned[1]];
    } else if (meta) {
      // FIX 6: لا بد من وجود عضوين على الأقل، ولا نعدّل مصفوفة الأعضاء الأصلية
      if (meta.participants.length < 2) {
        return sock.sendMessage(from, { text: "لا يوجد عدد كافٍ من الأعضاء لإتمام الزواج 😅" });
      }
      const members = meta.participants.map((p) => p.id);
      const shuffled = [...members].sort(() => 0.5 - Math.random());
      pair = [shuffled[0], shuffled[1]];
    } else {
      return sock.sendMessage(from, { text: "هذا الأمر يعمل داخل المجموعات فقط." });
    }
    await sock.sendMessage(from, {
      text: marriageText(pair[0], pair[1]),
      mentions: pair,
    });
  },

  "غزل": async (sock, from, msg) => {
    const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
    if (!mentioned || mentioned.length === 0) {
      return sock.sendMessage(from, { text: "الاستخدام: /flirt @user" });
    }
    const line = flirtLines[Math.floor(Math.random() * flirtLines.length)];
    await sock.sendMessage(from, {
      text: `@${mentioned[0].split("@")[0]} ${line}`,
      mentions: mentioned,
    });
  },

  "منشن": async (sock, from, msg, isOwner, args) => {
    const meta = await sock.groupMetadata(from).catch(() => null);
    if (!meta) return sock.sendMessage(from, { text: "هذا الأمر يعمل داخل المجموعات فقط." });
    const sub = args[0];
    if (sub === "مشرفين") {
      const admins = meta.participants.filter((p) => p.admin).map((p) => p.id);
      const text = admins.map((a) => `@${a.split("@")[0]}`).join(" ");
      await sock.sendMessage(from, { text: "👮 المشرفين:\n" + text, mentions: admins });
    } else if (sub === "كل") {
      const all = meta.participants.map((p) => p.id);
      const text = all.map((a) => `@${a.split("@")[0]}`).join(" ");
      await sock.sendMessage(from, { text: "📢 منشن جماعي:\n" + text, mentions: all });
    } else {
      await sock.sendMessage(from, { text: "الاستخدام: /tag admins أو /tag all" });
    }
  },

  "ضرد": async (sock, from, msg, isOwner, args) => {
    const targets = getTargetJid(msg, args);
    if (targets.length === 0) return sock.sendMessage(from, { text: "اذكر الشخص بمنشن أو رُدّ على رسالته." });
    const adminJid = msg.key.fromMe ? OWNER_JID : (msg.key.participant || msg.key.remoteJid);
    try {
      await sock.groupParticipantsUpdate(from, targets, "remove");
      await sock.sendMessage(from, { text: kickText(targets[0], adminJid), mentions: [targets[0], adminJid] });
    } catch (e) {
      await sock.sendMessage(from, { text: "تعذر الطرد، تأكد من أن البوت مشرف في المجموعة." });
    }
  },
  "kick": async (sock, from, msg, isOwner, args) => commands["ضرد"](sock, from, msg, isOwner, args),

  "انذار": async (sock, from, msg, isOwner, args) => {
    const targets = getTargetJid(msg, args);
    if (targets.length === 0) return sock.sendMessage(from, { text: "اذكر الشخص بمنشن أو رُدّ على رسالته." });
    const target = targets[0];
    const adminJid = msg.key.fromMe ? OWNER_JID : (msg.key.participant || msg.key.remoteJid);
    if (!data.warnings[from]) data.warnings[from] = {};
    data.warnings[from][target] = (data.warnings[from][target] || 0) + 1;
    saveData();
    const count = data.warnings[from][target];
    await sock.sendMessage(from, {
      text: `⚠️ تحذير لـ @${target.split("@")[0]} (${count}/3)`,
      mentions: [target],
    });
    if (count >= 3) {
      try {
        await sock.groupParticipantsUpdate(from, [target], "remove");
        await sock.sendMessage(from, { text: kickText(target, adminJid), mentions: [target, adminJid] });
        data.warnings[from][target] = 0;
        saveData();
      } catch (e) {}
    }
  },
  "warn": async (sock, from, msg, isOwner, args) => commands["انذار"](sock, from, msg, isOwner, args),

  "اسكات": async (sock, from, msg, isOwner, args) => {
    if (args[0] === "غروب") {
      try {
        await sock.groupSettingUpdate(from, "announcement");
        data.groupMuted[from] = true;
        saveData();
        await sock.sendMessage(from, { text: "🔇 تم كتم المجموعة، ولا يحق الكتابة فيها إلا للمشرفين." });
      } catch (e) {
        await sock.sendMessage(from, { text: "يجب أن يكون البوت مشرفاً في المجموعة." });
      }
      return;
    }
    const targets = getTargetJid(msg, args);
    if (targets.length === 0) return sock.sendMessage(from, { text: "الاستخدام: /mute @user أو /mute group" });
    if (!data.mutedUsers[from]) data.mutedUsers[from] = [];
    if (!data.mutedUsers[from].includes(targets[0])) data.mutedUsers[from].push(targets[0]);
    saveData();
    await sock.sendMessage(from, {
      text: `🔇 تم إسكات @${targets[0].split("@")[0]} (يجب أن يكون البوت مشرفاً ليتمكن من حذف رسائله)`,
      mentions: targets,
    });
  },

  "فتح": async (sock, from, msg, isOwner, args) => {
    if (args[0] !== "غروب") {
      return sock.sendMessage(from, { text: boxText("SENPAI BOT", ["الاستخدام:", `${PREFIX}open group`]) });
    }
    try {
      await sock.groupSettingUpdate(from, "not_announcement");
      data.groupMuted[from] = false;
      saveData();
      await sock.sendMessage(from, { text: "🔊 تم فتح المجموعة، ويحق للجميع الكتابة فيها." });
    } catch (e) {
      await sock.sendMessage(from, { text: "يجب أن يكون البوت مشرفاً في المجموعة." });
    }
  },

  "روابط": async (sock, from, msg, isOwner, args) => {
    if (args[0] === "منع" || args[0] === "تشغيل") {
      data.antilink[from] = true;
      saveData();
      await sock.sendMessage(from, { text: "🔗 تم تفعيل منع الروابط." });
    } else if (args[0] === "ايقاف") {
      data.antilink[from] = false;
      saveData();
      await sock.sendMessage(from, { text: "🔗 تم إيقاف منع الروابط." });
    } else {
      await sock.sendMessage(from, {
        text: boxText("SENPAI BOT", ["الاستخدام:", `${PREFIX}links on`, `${PREFIX}links off`]),
      });
    }
  },

  "ترحيب": async (sock, from, msg, isOwner, args) => {
    if (!["تشغيل", "ايقاف"].includes(args[0])) {
      return sock.sendMessage(from, {
        text: boxText("SENPAI BOT", ["الاستخدام:", `${PREFIX}welcome on`, `${PREFIX}welcome off`]),
      });
    }
    if (!data.welcome[from]) data.welcome[from] = {};
    data.welcome[from].on = args[0] === "تشغيل";
    saveData();
    await sock.sendMessage(from, { text: data.welcome[from].on ? "✅ تم تفعيل الترحيب." : "❌ تم إيقاف الترحيب." });
  },

  "وداع": async (sock, from, msg, isOwner, args) => {
    if (!["تشغيل", "ايقاف"].includes(args[0])) {
      return sock.sendMessage(from, {
        text: boxText("SENPAI BOT", ["الاستخدام:", `${PREFIX}bye on`, `${PREFIX}bye off`]),
      });
    }
    if (!data.welcome[from]) data.welcome[from] = {};
    data.welcome[from].bye = args[0] === "تشغيل";
    saveData();
    await sock.sendMessage(from, { text: data.welcome[from].bye ? "✅ تم تفعيل رسالة الوداع." : "❌ تم إيقاف رسالة الوداع." });
  },

  "ارسال_رابط": async (sock, from, msg, isOwner, args) => {
    if (!isOwner) return sock.sendMessage(from, { text: "هذا الأمر خاص بالمالك فقط." });
    const fullText = args.join(" ");
    const parts = fullText.split("|").map((p) => p.trim());
    const link = parts[0];
    const message = parts.slice(1).join("|").trim();

    if (!link || !message) {
      return sock.sendMessage(from, {
        text: "الاستخدام:\n/bc رابط_الدعوة | الرسالة\n\nمثال:\n/bc https://chat.whatsapp.com/XXXXXXXX | مرحباً بالجميع",
      });
    }

    const codeMatch = link.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/);
    if (!codeMatch) {
      return sock.sendMessage(from, { text: "رابط الدعوة غير صحيح." });
    }
    const inviteCode = codeMatch[1];

    try {
      const groupJid = await sock.groupAcceptInvite(inviteCode);
      await sock.sendMessage(groupJid, { text: ownerBroadcastText(message) });
      await sock.sendMessage(from, { text: "✅ تم الانضمام إلى المجموعة وإرسال الرسالة بنجاح." });
    } catch (e) {
      await sock.sendMessage(from, { text: "تعذر تنفيذ العملية، قد يكون البوت عضواً بالفعل أو الرابط غير صالح.\n" + e.message });
    }
  },

  "حماية": async (sock, from, msg, isOwner, args) => {
    if (!isOwner) return sock.sendMessage(from, { text: "هذا الأمر خاص بالمالك فقط." });
    if (!["تشغيل", "ايقاف"].includes(args[0])) {
      return sock.sendMessage(from, {
        text: boxText("SENPAI BOT", ["الاستخدام:", `${PREFIX}protect on`, `${PREFIX}protect off`]),
      });
    }
    const state = args[0] === "تشغيل";
    data.protection[from] = state;
    saveData();
    await sock.sendMessage(from, {
      text: state
        ? "🛡️ الحماية مُفعّلة.\nلا يملك ترقية الأعضاء أو تعديل إعدادات المجموعة إلا المالك، وأي محاولة من غيره ستُلغى تلقائياً.\n📵 وكذلك تُحذف أي جهة اتصال (vCard) يرسلها غير المالك لتفادي تعليق المجموعة."
        : "🔓 الحماية متوقفة.",
    });
  },
  "protect": async (sock, from, msg, isOwner, args) => commands["حماية"](sock, from, msg, isOwner, args),

  "مخفي": async (sock, from, msg, isOwner, args) => {
    const meta = await sock.groupMetadata(from).catch(() => null);
    if (!meta) return sock.sendMessage(from, { text: "هذا الأمر يعمل داخل المجموعات فقط." });
    const text = args.join(" ") || "📢";
    const all = meta.participants.map((p) => p.id);
    await sock.sendRaw(from, { text: text, mentions: all });
  },

  "help": async (sock, from) => sendMenuList(sock, from),

  "البادئة": async (sock, from) => sock.sendMessage(from, { text: `البادئة المعتمدة حالياً: ${PREFIX}` }),

  "حول": async (sock, from) =>
    sock.sendMessage(from, { text: "🦊 Senpai Bot — الإصدار V3\nمطور بواسطة: " + DEV }),

  "الحالة": async (sock, from) => {
    const uptimeMin = Math.floor(process.uptime() / 60);
    await sock.sendMessage(from, { text: `✅ البوت شغال\n⏱️ المدة: ${uptimeMin} دقيقة` });
  },

  "معلومات_الغروب": async (sock, from) => {
    const meta = await sock.groupMetadata(from).catch(() => null);
    if (!meta) return sock.sendMessage(from, { text: "هذا الأمر يعمل داخل المجموعات فقط." });
    await sock.sendMessage(from, {
      text: `📋 اسم الغروب: ${meta.subject}\n👥 عدد الأعضاء: ${meta.participants.length}\n📝 الوصف: ${meta.desc || "لا يوجد وصف"}`,
    });
  },

  "الادمنية": async (sock, from) => {
    const meta = await sock.groupMetadata(from).catch(() => null);
    if (!meta) return sock.sendMessage(from, { text: "هذا الأمر يعمل داخل المجموعات فقط." });
    const admins = meta.participants.filter((p) => p.admin).map((p) => p.id);
    await sock.sendMessage(from, { text: "👮 الادمنية:\n" + admins.map((a) => `@${a.split("@")[0]}`).join("\n"), mentions: admins });
  },

  "عدد_الاعضاء": async (sock, from) => {
    const meta = await sock.groupMetadata(from).catch(() => null);
    if (!meta) return sock.sendMessage(from, { text: "هذا الأمر يعمل داخل المجموعات فقط." });
    await sock.sendMessage(from, { text: `👥 عدد الأعضاء: ${meta.participants.length}` });
  },

  // ===== أمر جديد: كشف / فضح =====
  "كشف": async (sock, from, msg) => {
    const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg) {
      return sock.sendMessage(from, { text: "⌔🔍︙ قـم بـرد عـلـي `الـرسـالـة`- ⌗" });
    }
    // دعم رسائل "عرض لمرة واحدة"
    const inner =
      quotedMsg.viewOnceMessageV2?.message ||
      quotedMsg.viewOnceMessageV2Extension?.message ||
      quotedMsg.viewOnceMessage?.message ||
      quotedMsg;
    const type = ["imageMessage", "videoMessage", "audioMessage"].find((t) => inner[t]);
    if (!type) {
      return sock.sendMessage(from, { text: "❌ نوع الملف غير مدعوم" });
    }
    const media = inner[type];
    const buffer = await downloadMediaMessage(
      { message: { [type]: media } },
      "buffer",
      {},
      { logger: pino({ level: "silent" }), reuploadRequest: sock.updateMediaMessage }
    );
    if (type === "imageMessage") {
      await sock.sendMessage(from, { image: buffer, caption: media.caption || "" }, { quoted: msg });
    } else if (type === "videoMessage") {
      await sock.sendMessage(from, { video: buffer, caption: media.caption || "" }, { quoted: msg });
    } else {
      await sock.sendMessage(from, { audio: buffer, mimetype: media.mimetype || "audio/mpeg" }, { quoted: msg });
    }
  },
  "فضح": async (sock, from, msg, isOwner, args) => commands["كشف"](sock, from, msg, isOwner, args),

  // ===== أمر جديد: اغنية / song =====
  "اغنية": async (sock, from, msg, isOwner, args) => {
    const query = args.join(" ").trim();
    if (!query) {
      return sock.sendMessage(from, { text: boxText("SENPAI BOT", ["الاستخدام:", `${PREFIX}song اسم الأغنية`]) });
    }
    await sock.sendMessage(from, { text: "🔎 جاري البحث عن: " + query }, { quoted: msg });

    const res = await yts(query);
    const video = res.videos && res.videos[0];
    if (!video) {
      return sock.sendMessage(from, { text: "❌ لم أجد أي نتيجة." });
    }
    // حد أقصى 15 دقيقة لتفادي امتلاء الذاكرة
    if (video.seconds > 900) {
      return sock.sendMessage(from, { text: "⚠️ الفيديو طويل جداً (أكثر من 15 دقيقة). جرّب اسماً آخر." });
    }

    await sock.sendMessage(from, {
      text: `🎵 ${video.title}\n⏱️ ${video.timestamp}\n👤 ${video.author.name}\n\n⏳ جاري التحميل...`,
    });

    const info = await ytdl.getInfo(video.url);
    const format = ytdl.chooseFormat(info.formats, {
      quality: "highestaudio",
      filter: (f) => f.hasAudio && !f.hasVideo && f.container === "mp4",
    });
    const chunks = [];
    await new Promise((resolve, reject) => {
      const stream = ytdl.downloadFromInfo(info, { format });
      stream.on("data", (c) => chunks.push(c));
      stream.on("end", resolve);
      stream.on("error", reject);
    });
    const buffer = Buffer.concat(chunks);
    const safeName = video.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 60) || "song";

    await sock.sendMessage(
      from,
      { audio: buffer, mimetype: "audio/mp4", fileName: safeName + ".m4a" },
      { quoted: msg }
    );
  },

  "معلومات": async (sock, from, msg, isOwner, args) => {
    const targets = getTargetJid(msg, args);
    if (targets.length === 0) return sock.sendMessage(from, { text: "اذكر الشخص بمنشن أو رُدّ على رسالته." });
    await sock.sendMessage(from, {
      text: `👤 بطاقة تعريف العضو:\n📱 @${targets[0].split("@")[0]}`,
      mentions: targets,
    });
  },

  "القوانين": async (sock, from) => {
    const customRules = data.rules[from];
    const meta = await sock.groupMetadata(from).catch(() => null);
    const groupName = meta ? meta.subject : "";
    const rulesText = frame("📜 القوانين", [
      `🏷️ المجموعة ⟶ ${groupName ? groupName : "الـغُــرُوب"}`,
      "",
      "❶ 🌸 الاحترام واجب بين جميع الأعضاء.",
      "❷ 🚫 يُمنع السبّ والشتم والإهانة.",
      "❸ 🔞 يُمنع نشر المحتوى غير اللائق.",
      "❹ 📢 يُمنع الإشهار دون إذن الإدارة.",
      "❺ 🔗 يُمنع إرسال الروابط المشبوهة أو الضارة.",
      "❻ 💬 يُمنع الإزعاج والتكرار المفرط للرسائل.",
      "❼ ⚔️ يُمنع افتعال المشاكل وإثارة الفتن.",
      "❽ 🛡️ يُمنع انتحال شخصية عضو أو مشرف.",
      "❾ 👑 يجب احترام قرارات الإدارة وعدم تجاوزها.",
      "❿ 🍂 يُمنع نشر المعلومات الشخصية دون إذن أصحابها.",
      "",
      "⚖️ نِظَامُ العُقُوبَات",
      "🟠 المخالفة الأولى ⟶ تحذير.",
      "🟠 المخالفة الثانية ⟶ تحذير ثانٍ.",
      "🔴 المخالفة الثالثة ⟶ طرد من المجموعة.",
      "",
      "☠️ مخالفة خطيرة قد تؤدي إلى الطرد الفوري.",
      "",
      "🧡 دخولك إلى المجموعة يعني موافقتك على القوانين واحترامك لجميع الأعضاء.",
      ...(customRules ? ["", "📌 قوانين إضافية:", ...customRules.split("\n")] : []),
    ]);
    await sock.sendMessage(from, { text: rulesText });
  },

  "تعيين_القوانين": async (sock, from, msg, isOwner, args) => {
    data.rules[from] = args.join(" ");
    saveData();
    await sock.sendMessage(from, { text: "✅ تم تعيين القوانين بنجاح." });
  },

  "ترقية": async (sock, from, msg, isOwner, args) => {
    const targets = getTargetJid(msg, args);
    if (targets.length === 0) return sock.sendMessage(from, { text: "اذكر الشخص بمنشن أو رُدّ على رسالته." });
    try {
      await sock.groupParticipantsUpdate(from, targets, "promote");
      await sock.sendMessage(from, { text: `⬆️ تمت ترقية @${targets[0].split("@")[0]}`, mentions: targets });
    } catch (e) {
      await sock.sendMessage(from, { text: "يجب أن يكون البوت مشرفاً في المجموعة." });
    }
  },

  "تنزيل": async (sock, from, msg, isOwner, args) => {
    const targets = getTargetJid(msg, args);
    if (targets.length === 0) return sock.sendMessage(from, { text: "اذكر الشخص بمنشن أو رُدّ على رسالته." });
    try {
      await sock.groupParticipantsUpdate(from, targets, "demote");
      await sock.sendMessage(from, { text: `⬇️ تم تنزيل @${targets[0].split("@")[0]}`, mentions: targets });
    } catch (e) {
      await sock.sendMessage(from, { text: "يجب أن يكون البوت مشرفاً في المجموعة." });
    }
  },

  "تصفير_تحذير": async (sock, from, msg, isOwner, args) => {
    const targets = getTargetJid(msg, args);
    if (targets.length === 0) return sock.sendMessage(from, { text: "اذكر الشخص بمنشن أو رُدّ على رسالته." });
    if (data.warnings[from]) data.warnings[from][targets[0]] = 0;
    saveData();
    await sock.sendMessage(from, { text: `✅ تم تصفير التحذيرات الخاصة بـ @${targets[0].split("@")[0]}`, mentions: targets });
  },

  "رفع_اسكات": async (sock, from, msg, isOwner, args) => {
    const targets = getTargetJid(msg, args);
    if (targets.length === 0) return sock.sendMessage(from, { text: "اذكر الشخص بمنشن أو رُدّ على رسالته." });
    if (data.mutedUsers[from]) {
      data.mutedUsers[from] = data.mutedUsers[from].filter((j) => j !== targets[0]);
      saveData();
    }
    await sock.sendMessage(from, { text: `🔊 تم رفع الإسكات عن @${targets[0].split("@")[0]}`, mentions: targets });
  },

  "غياب": async (sock, from, msg, isOwner, args) => {
    if (!isOwner) return sock.sendMessage(from, { text: "هذا الأمر خاص بالمالك فقط." });
    data.afk[OWNER_JID] = { reason: args.join(" ") || "بلا سبب", since: Date.now() };
    saveData();
    await sock.sendMessage(from, { text: "😴 تم تفعيل وضع الغياب." });
  },

  "رجعت": async (sock, from, msg, isOwner) => {
    if (!isOwner) return sock.sendMessage(from, { text: "هذا الأمر خاص بالمالك فقط." });
    delete data.afk[OWNER_JID];
    saveData();
    await sock.sendMessage(from, { text: "✅ عُدت من الغياب، أهلاً بك." });
  },

  "نكتة": async (sock, from) =>
    sock.sendMessage(from, { text: jokes[Math.floor(Math.random() * jokes.length)] }),

  "معلومة": async (sock, from) =>
    sock.sendMessage(from, { text: facts[Math.floor(Math.random() * facts.length)] }),

  "اقتباس": async (sock, from) =>
    sock.sendMessage(from, { text: quotes[Math.floor(Math.random() * quotes.length)] }),

  "لغز": async (sock, from) =>
    sock.sendMessage(from, { text: riddles[Math.floor(Math.random() * riddles.length)] }),

  "صراحة": async (sock, from) =>
    sock.sendMessage(from, { text: truths[Math.floor(Math.random() * truths.length)] }),

  "تحدي": async (sock, from) =>
    sock.sendMessage(from, { text: dares[Math.floor(Math.random() * dares.length)] }),

  "نرد": async (sock, from) =>
    sock.sendMessage(from, { text: `🎲 النتيجة: ${Math.floor(Math.random() * 6) + 1}` }),

  "حجر_ورقة_مقص": async (sock, from, msg, isOwner, args) => {
    const choices = ["حجر", "ورقة", "مقص"];
    const userChoice = args[0];
    if (!choices.includes(userChoice)) {
      return sock.sendMessage(from, { text: "الاستخدام: /rps rock أو paper أو scissors" });
    }
    const botChoice = choices[Math.floor(Math.random() * 3)];
    let result;
    if (userChoice === botChoice) result = "تعادل 🤝";
    else if (
      (userChoice === "حجر" && botChoice === "مقص") ||
      (userChoice === "ورقة" && botChoice === "حجر") ||
      (userChoice === "مقص" && botChoice === "ورقة")
    ) result = "لقد فزت 🎉";
    else result = "لقد خسرت 😅";
    await sock.sendMessage(from, { text: `اختيارك: ${userChoice}\nاختيار البوت: ${botChoice}\n${result}` });
  },
};

const englishAliases = {
  ping: "بينج",
  owner: "المطور",
  dev: "المطور",
  time: "الوقت",
  menu: "منيو",
  public: "عام",
  pub: "عام",
  private: "خاص",
  priv: "خاص",
  sticker: "ستيكرات",
  s: "ستيكرات",
  marry: "زواج",
  flirt: "غزل",
  tag: "منشن",
  mention: "منشن",
  htag: "مخفي",
  hidetag: "مخفي",
  mute: "اسكات",
  unmute: "رفع_اسكات",
  open: "فتح",
  links: "روابط",
  welcome: "ترحيب",
  bye: "وداع",
  bc: "ارسال_رابط",
  prefix: "البادئة",
  about: "حول",
  status: "الحالة",
  ginfo: "معلومات_الغروب",
  groupinfo: "معلومات_الغروب",
  admins: "الادمنية",
  count: "عدد_الاعضاء",
  members: "عدد_الاعضاء",
  info: "معلومات",
  rules: "القوانين",
  setr: "تعيين_القوانين",
  setrules: "تعيين_القوانين",
  pro: "ترقية",
  promote: "ترقية",
  dem: "تنزيل",
  demote: "تنزيل",
  rwarn: "تصفير_تحذير",
  resetwarn: "تصفير_تحذير",
  afk: "غياب",
  back: "رجعت",
  joke: "نكتة",
  fact: "معلومة",
  quote: "اقتباس",
  riddle: "لغز",
  truth: "صراحة",
  dare: "تحدي",
  dice: "نرد",
  rps: "حجر_ورقة_مقص",
  rev: "كشف",
  reveal: "كشف",
  song: "اغنية",
  play: "اغنية",
};

for (const [en, ar] of Object.entries(englishAliases)) {
  if (!commands[en]) {
    commands[en] = (sock, from, msg, isOwner, args) => commands[ar](sock, from, msg, isOwner, args);
  }
}

async function handleMessage(sock, msgData) {
  const msg = msgData.messages[0];
  if (!msg || !msg.message) return;

  const from = msg.key.remoteJid;
  const senderJid = msg.key.fromMe ? OWNER_JID : msg.key.participant || msg.key.remoteJid;
  const isOwner = msg.key.fromMe || senderJid === OWNER_JID;

  // FIX 2: قراءة النص أيضاً من caption الصورة والفيديو
  const text =
    msg.message.conversation ||
    (msg.message.extendedTextMessage && msg.message.extendedTextMessage.text) ||
    (msg.message.imageMessage && msg.message.imageMessage.caption) ||
    (msg.message.videoMessage && msg.message.videoMessage.caption) ||
    "";

  // الحماية: منع جهات الاتصال (vCard) لتفادي تعليق المجموعة
  if (data.protection[from] && !isOwner && from.endsWith("@g.us")) {
    const m = msg.message;
    const inner =
      m.ephemeralMessage?.message ||
      m.viewOnceMessage?.message ||
      m.viewOnceMessageV2?.message ||
      m.documentWithCaptionMessage?.message ||
      m;
    const hasContact = !!(inner.contactMessage || inner.contactsArrayMessage);
    if (hasContact) {
      const botIsAdmin = await isBotAdmin(sock, from);
      if (botIsAdmin) {
        try {
          await sock.sendMessage(from, { delete: msg.key });
        } catch (e) {}
        await sock.sendMessage(from, {
          text: `🛡️ تم حذف جهة اتصال مرسلة من @${senderJid.split("@")[0]}، فالحماية تمنع جهات الاتصال لتفادي تعليق المجموعة.`,
          mentions: [senderJid],
        });
      }
      return;
    }
  }

  if (data.antilink[from] && !isOwner && /chat\.whatsapp\.com/.test(text)) {
    const botIsAdmin = await isBotAdmin(sock, from);
    if (botIsAdmin) {
      try {
        await sock.sendMessage(from, { delete: msg.key });
      } catch (e) {}
      await sock.sendMessage(from, { text: antilinkText(senderJid), mentions: [senderJid] });
    }
    return;
  }

  if (data.mutedUsers[from] && data.mutedUsers[from].includes(senderJid) && !isOwner) {
    try {
      await sock.sendMessage(from, { delete: msg.key });
    } catch (e) {}
    return;
  }

  const listResponse = msg.message.listResponseMessage;
  if (listResponse) {
    const rowId = listResponse.singleSelectReply?.selectedRowId || "";
    if (rowId.startsWith("menu_section_")) {
      const sectionKey = rowId.replace("menu_section_", "");
      const sectionText = menuSections[sectionKey];
      if (sectionText) {
        await sock.sendMessage(from, { text: sectionText });
      }
    }
    return;
  }

  const mentionedInMsg = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (data.afk[OWNER_JID] && mentionedInMsg.includes(OWNER_JID) && !isOwner) {
    const afkInfo = data.afk[OWNER_JID];
    const minutesAgo = Math.floor((Date.now() - afkInfo.since) / 60000);
    await sock.sendMessage(from, {
      text: `😴 المالك غير متواجد حالياً (${minutesAgo} دقيقة)\nالسبب: ${afkInfo.reason}`,
    });
  }

  if (!text.startsWith(PREFIX)) return;
  if (!isOwner && !data.publicMode) return;

  const isGroup = from.endsWith("@g.us");
  if (!isGroup && !isOwner) {
    await sock.sendMessage(from, { text: notInGroupText });
    return;
  }

  const parts = text.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  // FIX 4: نتأكد أن الأمر موجود فعلاً (وليس من خصائص Object مثل constructor)
  if (!Object.hasOwn(commands, cmd)) {
    await sock.sendMessage(from, {
      text: boxText("SENPAI BOT", ["❌ أمر غير معروف", `📌 اكتب ${PREFIX}menu لعرض الأوامر`]),
    });
    return;
  }

  // FIX 1: فحص صلاحيات المشرف قبل تنفيذ أوامر الإدارة
  const canonical = Object.hasOwn(englishAliases, cmd) ? englishAliases[cmd] : cmd;
  if (!isOwner && (adminOnlyCommands.has(cmd) || adminOnlyCommands.has(canonical))) {
    const admin = await isSenderAdmin(sock, from, senderJid);
    if (!admin) {
      await sock.sendMessage(from, { text: "هذا الأمر خاص بالمشرفين فقط." });
      return;
    }
  }

  // تحويل الوسيط الأول الإنجليزي إلى ما تفهمه الأوامر (للأوامر ذات الخيارات فقط)
  const subCmds = new Set(["اسكات", "فتح", "روابط", "ترحيب", "وداع", "حماية", "protect", "منشن", "حجر_ورقة_مقص"]);
  const argMap = { group: "غروب", on: "تشغيل", off: "ايقاف", admins: "مشرفين", all: "كل", rock: "حجر", paper: "ورقة", scissors: "مقص" };
  if (subCmds.has(canonical) && args[0]) {
    const k = args[0].toLowerCase();
    if (Object.hasOwn(argMap, k)) args[0] = argMap[k];
  }

  // FIX 3: أي خطأ داخل أمر لا يوقف البوت
  try {
    await commands[cmd](sock, from, msg, isOwner, args);
  } catch (e) {
    console.log(`Command error (${cmd}):`, e.message);
    try {
      await sock.sendMessage(from, { text: "❌ حدث خطأ أثناء تنفيذ الأمر." });
    } catch (e2) {}
  }
}

const msgStore = new Map();
let pairingRequested = false;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    getMessage: async (key) => msgStore.get(key.id)?.message || undefined,
  });

  const originalSendMessage = sock.sendMessage.bind(sock);
  sock.sendRaw = originalSendMessage; // إرسال بدون زخرفة (مثل المنشن المخفي)
  sock.sendMessage = (jid, content, options) => {
    if (content && typeof content.text === "string" && !content.sticker) {
      let t = content.text;
      // أي رد نصي غير مزخرف يُلفّ تلقائياً بالإطار الموحد
      if (!/^(⸜|╭══|┌──)/.test(t)) t = frame("🌸 sᴇɴᴘᴀɪ 🌸", t.split("\n"));
      content = { ...content, text: addSignature(t) };
    }
    return originalSendMessage(jid, content, options);
  };

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const connection = update.connection;
    const lastDisconnect = update.lastDisconnect;

    if (connection === "connecting" && !sock.authState.creds.registered && !pairingRequested) {
      pairingRequested = true;
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(PHONE_NUMBER);
          console.log("PAIRING_CODE_START");
          console.log(code);
          console.log("PAIRING_CODE_END");
        } catch (e) {
          console.log("Pairing error: " + e.message);
          pairingRequested = false;
        }
      }, 5000);
    }

    if (connection === "close") {
      const statusCode = new Boom(lastDisconnect && lastDisconnect.error).output.statusCode;
      if (statusCode !== DisconnectReason.loggedOut) startBot();
    } else if (connection === "open") {
      console.log("Bot connected");
    }
  });

  sock.ev.on("group-participants.update", async (upd) => {
    try {
      const { id, participants, action, author } = upd;

      if (action === "add" && data.welcome[id]?.on) {
        const meta = await sock.groupMetadata(id);
        for (const p of participants) {
          const memberNumber = meta.participants.length;
          await sock.sendMessage(id, {
            text: welcomeText(p, memberNumber, meta.subject),
            mentions: [p],
          });
        }
      }

      if (action === "remove") {
        for (const p of participants) {
          const selfLeave = !author || author === p;
          if (selfLeave && data.welcome[id]?.bye) {
            await sock.sendMessage(id, { text: leaveText(p), mentions: [p] });
          }
        }
      }

      if (action === "promote" && data.protection[id]) {
        const promoter = author;
        if (promoter && promoter !== OWNER_JID) {
          await sock.groupParticipantsUpdate(id, participants, "demote");
          await sock.sendMessage(id, {
            text: `🛡️ تم كشف ترقية غير مصرح بها من طرف @${promoter.split("@")[0]}، تم التراجع عنها تلقائيا.`,
            mentions: [promoter],
          });
        }
      }
    } catch (e) {
      console.log("Group update error:", e.message);
    }
  });

  sock.ev.on("messages.upsert", async (msgData) => {
    for (const m of msgData.messages) {
      if (m.key?.id) {
        msgStore.set(m.key.id, m);
        // نحافظ على آخر 1000 رسالة فقط حتى لا تمتلئ الذاكرة
        if (msgStore.size > 1000) msgStore.delete(msgStore.keys().next().value);
      }
    }
    try {
      await handleMessage(sock, msgData);
    } catch (e) {
      console.log("Handler error:", e.message);
    }
  });
}

startBot();
