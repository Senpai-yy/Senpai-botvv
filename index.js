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

const boxText = (title, lines) => `╭━━━〔 🍊 ${title} 〕━━━╮
${lines.map((l) => `┃ 🍁・${l}`).join("\n")}
╰━━━━━━━━━━━━━━━━━━━━╯`;

const menuSections = {
  "إدارة": `┣━━━『 🔥 الإدارة 』
┃  🍁・${PREFIX}ضرد @شخص
┃  🍁・${PREFIX}انذار @شخص
┃  🍁・${PREFIX}تصفير_تحذير @شخص
┃  🍁・${PREFIX}اسكات @شخص
┃  🍁・${PREFIX}رفع_اسكات @شخص
┃  🍁・${PREFIX}اسكات غروب
┃  🍁・${PREFIX}فتح غروب
┃  🍁・${PREFIX}ترقية @شخص
┃  🍁・${PREFIX}تنزيل @شخص
┃  🍁・${PREFIX}روابط منع
┃  🍁・${PREFIX}روابط ايقاف
┃  🍁・${PREFIX}حماية تشغيل
┃  🍁・${PREFIX}ارسال_رابط رابط | رسالة`,

  "منشن": `┣━━━『 🦊 المنشن 』
┃  🍁・${PREFIX}منشن مشرفين
┃  🍁・${PREFIX}منشن كل
┃  🍁・${PREFIX}مخفي النص`,

  "معلومات": `┣━━━『 📋 معلومات 』
┃  🍁・${PREFIX}معلومات_الغروب
┃  🍁・${PREFIX}الادمنية
┃  🍁・${PREFIX}عدد_الاعضاء
┃  🍁・${PREFIX}معلومات @شخص
┃  🍁・${PREFIX}القوانين
┃  🍁・${PREFIX}تعيين_القوانين النص`,

  "الترحيب": `┣━━━『 🎃 الترحيب 』
┃  🍁・${PREFIX}ترحيب تشغيل
┃  🍁・${PREFIX}ترحيب ايقاف
┃  🍁・${PREFIX}وداع تشغيل
┃  🍁・${PREFIX}وداع ايقاف`,

  "التسلية": `┣━━━『 🧡 التسلية 』
┃  🍁・${PREFIX}ستيكرات
┃  🍁・${PREFIX}زواج @شخص @شخص
┃  🍁・${PREFIX}غزل @شخص
┃  🍁・${PREFIX}نكتة
┃  🍁・${PREFIX}معلومة
┃  🍁・${PREFIX}اقتباس
┃  🍁・${PREFIX}لغز
┃  🍁・${PREFIX}صراحة
┃  🍁・${PREFIX}تحدي
┃  🍁・${PREFIX}نرد
┃  🍁・${PREFIX}حجر_ورقة_مقص اختيارك`,

  "أدوات": `┣━━━『 🔍 أدوات 』
┃  🍁・${PREFIX}كشف (رد على رسالة)
┃  🍁・${PREFIX}فضح (رد على رسالة)`,

  "الغياب": `┣━━━『 😴 الغياب 』
┃  🍁・${PREFIX}غياب السبب
┃  🍁・${PREFIX}رجعت`,

  "عام": `┣━━━『 ⚙️ عام 』
┃  🍁・${PREFIX}بينج
┃  🍁・${PREFIX}المطور
┃  🍁・${PREFIX}الوقت
┃  🍁・${PREFIX}عام
┃  🍁・${PREFIX}خاص
┃  🍁・${PREFIX}البادئة
┃  🍁・${PREFIX}حول
┃  🍁・${PREFIX}الحالة`,
};

const BANNER_PATH = "./banner.jpg";

async function sendMenuList(sock, from) {
  const caption = `╭━━━〔 🦊🔥 𝑺𝑬𝑵𝑷𝑨𝑰 𝑩𝑶𝑻 🔥🦊 〕━━━╮
┃
┃   ⚖️  الـقـوانـيـن لا تـعـرف الاسـتـثـنـاءات
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

┣━━━『 ⚡ أوامر أساسية 』
┃  🍁・${PREFIX}بينج
┃  🍁・${PREFIX}ضرد @شخص
┃  🍁・${PREFIX}انذار @شخص
┃  🍁・${PREFIX}ستيكرات
┃  🍁・${PREFIX}منشن كل
┃  🍁・${PREFIX}القوانين
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

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

  const allSections = Object.values(menuSections).join("\n\n");
  await sock.sendMessage(from, { text: allSections });
}

const kickText = (jid, adminJid) => `╭━━━〔 ☠️ SENPAI EXECUTION 〕━━━╮
┃ 🚫 تم طرد عضو من المجموعة!
┃ 👤 العضو: @${jid.split("@")[0]}
┃ 👑 المشرف: @${adminJid.split("@")[0]}
┃
┃ ⚖️ صدر القرار، وانتهى النقاش.
┃ 🗿 لم يعد لهذا المقعد صاحب.
┃ 🍊 القوانين ليست زينةً للواجهة،
┃ بل حدودٌ لا يتجاوزها أحد.
┃
┃ ☠️ انتهت صلاحية وجودك هنا.
╰━━━━━━━━━━━━━━━━━━━━━━━━╯`;

const leaveText = (jid) => `╭━━━〔 🍊 SENPAI SYSTEM 〕━━━╮
┃ 📤 انسحاب عضو من المجموعة!
┃ 👤 العضو: @${jid.split("@")[0]}
┃
┃ ☠️ لقد اختار الرحيل بنفسه...
┃ 🗿 لا أحد سيوقفك، ولا أحد سيطاردك.
┃ 🍂 فالأبواب لا تُغلق خلف الراحلين،
┃ بل تُفتح لمن يستحق البقاء.
┃
┃ 🧡 SENPAI لا يتوقف لأجل أحد.
╰━━━━━━━━━━━━━━━━━━━━━━╯`;

const antilinkText = (jid) => `🟠 ══『 حـمـايـة الـروابـط 』══ 🍂

⛔ تم رصد رابط غير مسموح به!

👤 العضو: @${jid.split("@")[0]}
🔗 الحالة: تم رصد رابط
🛡️ الإجراء: صدر تحذير

⚠️ كررها مرة أخرى، وتحمّل العواقب.`;

const marriageText = (bride, groom) => `╭━━━〔 💍 إعلان زواج جديد 〕━━━╮
┃
┃  🎊 بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ 🎊
┃
┃  💍 يسرّنا أن نعلن عن زواج عضوين
┃  من أعضاء المجموعة، في أجواء
┃  مليئة بالفرح والمودة ❤️✨
┃
┃  🍁・👰 العروس : @${bride.split("@")[0]}
┃  🍁・🤵 العريس : @${groom.split("@")[0]}
┃
┃  🌹 ألف ألف مبارك للعروسين، ونسأل
┃  الله أن يبارك لهما ويجمع بينهما
┃  في خير، ويرزقهما حياةً سعيدةً
┃  مليئةً بالمحبة والوفاء 🤍
┃
┃  🎉 باركوا للعروسين يا أهل
┃  المجموعة، وشاركونا فرحتنا 🧡
┃
╰━━━〔 🦊 𝑺𝑬𝑵𝑷𝑨𝑰 🔥 〕━━━╯`;

const ownerBroadcastText = (message) => `✄←┈─◯[ 📢 ]◯─┈→✄
◯─┈─┈─◯⟨ 👑 ⟩◯─┈─┈─◯

   رِسَالَةٌ مِنْ مَالِكِ الْبُوتِ

◯─┈─┈─◯⟨ 👑 ⟩◯─┈─┈─◯

${message}

◯─┈─┈─◯⟨ 🦊 ⟩◯─┈─┈─◯
✄←┈─◯[ 📢 ]◯─┈→✄`;

const notInGroupText = `╭━━━〔 🍊 SENPAI BOT 〕━━━╮
┃ ⚠️ هذا البوت يعمل داخل المجموعات فقط.
┃ 📌 لا يدعم المحادثات الخاصة.
╰━━━━━━━━━━━━━━━━━━━━╯`;

const welcomeText = (jid, memberNumber, groupName) => `╭━━━⟪ 🦊🔥 ⟫━━━╮
    𝑺𝑬𝑵𝑷𝑨𝑰 𝑩𝑶𝑻
╰━━━━━━━━━━━━━━╯

🎉✨ مــرحــبــاً بــك فــي الــمــجــمــوعــة! 🧡

╭━━━『 👤 العضو الجديد 』
┃ 🍁 الاسم : @${jid.split("@")[0]}
┃ 🔥 الرقم : #${memberNumber}
┃ 🦊 المجموعة : ${groupName}
╰━━━━━━━━━━━━━━╯

🎃 نــوّرتــي الــمــجــمــوعــة بــوجــودك! 🧡
🍁 نتمنى ليك أوقات ممتعة معانا.
🔥 احترم الجميع، وخلّي بصمتك مميّزة!
🦊 استمتع بوقتك مع عائلة Senpai.

╭━━━⟪ 🧡🔥🦊 ⟫━━━╮
     نــوّرتــنــا ✨
╰━━━━━━━━━━━━━━╯`;

const BOT_SIGNATURE = `

  ~ 🦊 𝑺𝑬𝑵𝑷𝑨𝑰 𝑩𝑶𝑻 🦂`;

function addSignature(message) {
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
      return sock.sendMessage(from, { text: "أرسل صورة مع الأمر /ستيكرات أو رُدّ بها على صورة" });
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
      return sock.sendMessage(from, { text: "الاستخدام: /غزل @شخص" });
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
      await sock.sendMessage(from, { text: "الاستخدام: /منشن مشرفين أو /منشن كل" });
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
    if (targets.length === 0) return sock.sendMessage(from, { text: "الاستخدام: /اسكات @شخص أو /اسكات غروب" });
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
      return sock.sendMessage(from, { text: boxText("SENPAI BOT", ["الاستخدام:", `${PREFIX}فتح غروب`]) });
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
    if (args[0] === "منع") {
      data.antilink[from] = true;
      saveData();
      await sock.sendMessage(from, { text: "🔗 تم تفعيل منع الروابط." });
    } else if (args[0] === "ايقاف") {
      data.antilink[from] = false;
      saveData();
      await sock.sendMessage(from, { text: "🔗 تم إيقاف منع الروابط." });
    } else {
      await sock.sendMessage(from, {
        text: boxText("SENPAI BOT", ["الاستخدام:", `${PREFIX}روابط منع`, `${PREFIX}روابط ايقاف`]),
      });
    }
  },

  "ترحيب": async (sock, from, msg, isOwner, args) => {
    if (!["تشغيل", "ايقاف"].includes(args[0])) {
      return sock.sendMessage(from, {
        text: boxText("SENPAI BOT", ["الاستخدام:", `${PREFIX}ترحيب تشغيل`, `${PREFIX}ترحيب ايقاف`]),
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
        text: boxText("SENPAI BOT", ["الاستخدام:", `${PREFIX}وداع تشغيل`, `${PREFIX}وداع ايقاف`]),
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
        text: "الاستخدام:\n/ارسال_رابط رابط_الدعوة | الرسالة\n\nمثال:\n/ارسال_رابط https://chat.whatsapp.com/XXXXXXXX | مرحباً بالجميع",
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
        text: boxText("SENPAI BOT", ["الاستخدام:", `${PREFIX}حماية تشغيل`, `${PREFIX}حماية ايقاف`]),
      });
    }
    const state = args[0] === "تشغيل";
    data.protection[from] = state;
    saveData();
    await sock.sendMessage(from, {
      text: state
        ? "🛡️ الحماية مُفعّلة.\nلا يملك ترقية الأعضاء أو تعديل إعدادات المجموعة إلا المالك، وأي محاولة من غيره ستُلغى تلقائياً."
        : "🔓 الحماية متوقفة.",
    });
  },
  "protect": async (sock, from, msg, isOwner, args) => commands["حماية"](sock, from, msg, isOwner, args),

  "مخفي": async (sock, from, msg, isOwner, args) => {
    const meta = await sock.groupMetadata(from).catch(() => null);
    if (!meta) return sock.sendMessage(from, { text: "هذا الأمر يعمل داخل المجموعات فقط." });
    const text = args.join(" ") || "📢";
    const all = meta.participants.map((p) => p.id);
    await sock.sendMessage(from, { text: text, mentions: all });
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
    if (!from.endsWith("@g.us")) {
      return sock.sendMessage(from, { text: "هذا الأمر يعمل داخل المجموعات فقط." });
    }
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
    const rulesText = `꧁༺ 🧡 𝑺𝑬𝑵𝑷𝑨𝑰 ༻꧂
📜 قَــوَانِــيــنُ ${groupName ? groupName : "الـغُــرُوب"}
╌╌╌╌╌╌╌╌╌╌╌
❶ 🍊 الاحترام واجب بين جميع الأعضاء.
❷ 🚫 يُمنع السبّ والشتم والإهانة.
❸ 🔞 يُمنع نشر المحتوى غير اللائق.
❹ 📢 يُمنع الإشهار دون إذن الإدارة.
❺ 🔗 يُمنع إرسال الروابط المشبوهة أو الضارة.
❻ 💬 يُمنع الإزعاج والتكرار المفرط للرسائل.
❼ ⚔️ يُمنع افتعال المشاكل وإثارة الفتن.
❽ 🛡️ يُمنع انتحال شخصية عضو أو مشرف.
❾ 👑 يجب احترام قرارات الإدارة وعدم تجاوزها.
❿ 🍂 يُمنع نشر المعلومات الشخصية دون إذن أصحابها.

╭━━━〔 ⚖️ نِظَامُ العُقُوبَات 〕━━━╮
┃ 🟠 المخالفة الأولى: تحذير.
┃ 🟠 المخالفة الثانية: تحذير ثانٍ.
┃ 🔴 المخالفة الثالثة: طرد من المجموعة.
╰━━━━━━━━━━━━━━━━━━━━╯

☠️ مخالفة خطيرة قد تؤدي إلى الطرد الفوري.

🧡 دخولك إلى المجموعة يعني موافقتك على القوانين واحترامك لجميع الأعضاء.${customRules ? "\n\n📌 قوانين إضافية:\n" + customRules : ""}`;
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
      return sock.sendMessage(from, { text: "الاستخدام: /حجر_ورقة_مقص حجر أو ورقة أو مقص" });
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
  time: "الوقت",
  menu: "منيو",
  public: "عام",
  private: "خاص",
  sticker: "ستيكرات",
  marry: "زواج",
  flirt: "غزل",
  mention: "منشن",
  mute: "اسكات",
  unmute: "رفع_اسكات",
  open: "فتح",
  links: "روابط",
  welcome: "ترحيب",
  bye: "وداع",
  hidetag: "مخفي",
  prefix: "البادئة",
  about: "حول",
  status: "الحالة",
  groupinfo: "معلومات_الغروب",
  admins: "الادمنية",
  members: "عدد_الاعضاء",
  info: "معلومات",
  rules: "القوانين",
  setrules: "تعيين_القوانين",
  promote: "ترقية",
  demote: "تنزيل",
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
  reveal: "كشف",
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
  const cmd = parts[0];
  const args = parts.slice(1);

  // FIX 4: نتأكد أن الأمر موجود فعلاً (وليس من خصائص Object مثل constructor)
  if (!Object.hasOwn(commands, cmd)) {
    await sock.sendMessage(from, {
      text: boxText("SENPAI BOT", ["❌ أمر غير معروف", `📌 اكتب ${PREFIX}منيو لعرض الأوامر`]),
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
  sock.sendMessage = (jid, content, options) => {
    if (content && typeof content.text === "string" && !content.sticker) {
      content = { ...content, text: addSignature(content.text) };
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
