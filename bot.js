require("dotenv").config();
const { Telegraf } = require("telegraf");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = Number(process.env.ADMIN_CHAT_ID);

if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
  console.error("❌ BOT_TOKEN yoki ADMIN_CHAT_ID .env faylida yo'q!");
  process.exit(1);
}

const DB_FILE = path.join(__dirname, "members.db");
const bot = new Telegraf(BOT_TOKEN);

// ─── Database ───────────────────────────────
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error("❌ Database xatosi:", err.message);
    process.exit(1);
  }
  console.log("✅ Database ulandi.");
});

db.run(
  `
  CREATE TABLE IF NOT EXISTS events (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type          TEXT,
    user_id             INTEGER,
    username            TEXT,
    full_name           TEXT,
    language_code       TEXT,
    is_bot              TEXT,
    invited_by_id       INTEGER,
    invited_by_name     TEXT,
    invited_by_username TEXT,
    channel_id          INTEGER,
    channel_title       TEXT,
    channel_username    TEXT,
    event_time          TEXT
  )
`,
  (err) => {
    if (err) console.error("❌ Jadval xatosi:", err.message);
    else console.log("✅ Jadval tayyor.");
  },
);

// ─── Yordamchi funksiyalar ──────────────────
function saveEvent(data) {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  db.run(
    `
    INSERT INTO events (
      event_type, user_id, username, full_name,
      language_code, is_bot,
      invited_by_id, invited_by_name, invited_by_username,
      channel_id, channel_title, channel_username, event_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      data.event_type,
      data.user_id,
      data.username,
      data.full_name,
      data.language_code,
      data.is_bot,
      data.invited_by_id,
      data.invited_by_name,
      data.invited_by_username,
      data.channel_id,
      data.channel_title,
      data.channel_username,
      now,
    ],
    (err) => {
      if (err) console.error("❌ Saqlash xatosi:", err.message);
    },
  );
}

const LANG_NAMES = {
  uz: "🇺🇿 O'zbek",
  ru: "🇷🇺 Rus",
  en: "🇬🇧 Ingliz",
  tr: "🇹🇷 Turk",
  ar: "🇸🇦 Arab",
  de: "🇩🇪 Nemis",
  fr: "🇫🇷 Fransuz",
  es: "🇪🇸 Ispan",
  kk: "🇰🇿 Qozoq",
  tj: "🇹🇯 Tojik",
  ky: "🇰🇬 Qirg'iz",
};

function langDisplay(code) {
  return LANG_NAMES[code] || `🌐 ${code || "Noma'lum"}`;
}

function nowStr() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

// ─── Buyruqlar ──────────────────────────────
bot.start(async (ctx) => {
  await ctx.replyWithHTML(
    "✅ <b>Bot ishga tushdi!</b>\n\n" +
      "Meni kanalingizga <b>admin</b> qiling.\n" +
      "Kim qo'shilsa yoki chiqsa — darhol xabar olasiz.\n\n" +
      "📋 <b>Buyruqlar:</b>\n" +
      "/start — Botni ishga tushirish\n" +
      "/stats — So'nggi 10 ta voqea\n" +
      "/help — Yordam",
  );
});

bot.help(async (ctx) => {
  await ctx.replyWithHTML(
    "🤖 <b>Bot qo'llanmasi:</b>\n\n" +
      "1️⃣ Botni kanalingizga admin qiling\n" +
      "2️⃣ Bot avtomatik a'zolarni kuzatadi\n" +
      "3️⃣ Har o'zgarishda sizga xabar keladi\n\n" +
      "📋 <b>Buyruqlar:</b>\n" +
      "/stats — So'nggi 10 ta voqea\n" +
      "/help — Yordam",
  );
});

bot.command("stats", (ctx) => {
  db.all(
    `
    SELECT event_type, full_name, username, channel_title, event_time, language_code
    FROM events ORDER BY id DESC LIMIT 10
  `,
    [],
    async (err, rows) => {
      if (err || !rows || rows.length === 0) {
        return ctx.reply("📭 Hali hech qanday voqea qayd etilmagan.");
      }
      let text = "📊 <b>So'nggi 10 ta voqea:</b>\n\n";
      for (const row of rows) {
        const emoji = row.event_type === "joined" ? "✅" : "❌";
        const action = row.event_type === "joined" ? "Qo'shildi" : "Chiqdi";
        const uname =
          row.username && row.username !== "Yo'q" ? `@${row.username}` : "yo'q";
        text +=
          `${emoji} <b>${action}</b> | ${row.full_name} (${uname})\n` +
          `🌐 Til: ${row.language_code} | 📢 ${row.channel_title}\n` +
          `🕐 ${row.event_time}\n\n`;
      }
      await ctx.replyWithHTML(text);
    },
  );
});

// ─── A'zolar kuzatuvi ───────────────────────
bot.on("chat_member", async (ctx) => {
  const result = ctx.chatMember;
  const chat = result.chat;
  const oldStatus = result.old_chat_member.status;
  const newStatus = result.new_chat_member.status;
  const user = result.new_chat_member.user;

  if (!["channel", "supergroup", "group"].includes(chat.type)) return;

  const userId = user.id;
  const username = user.username || "Yo'q";
  const fullName =
    `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Noma'lum";
  const languageCode = user.language_code || "Noma'lum";
  const isBot = user.is_bot ? "🤖 Ha" : "👤 Yo'q";
  const langDisp = langDisplay(languageCode);
  const unameDisp = username !== "Yo'q" ? `@${username}` : "username yo'q";

  const invitedBy = result.from;
  const invId = invitedBy?.id ?? null;
  const invName = invitedBy
    ? `${invitedBy.first_name || ""} ${invitedBy.last_name || ""}`.trim()
    : "Noma'lum";
  const invUsername = invitedBy?.username ? `@${invitedBy.username}` : "Yo'q";

  const channelTitle = chat.title || "Noma'lum";
  const channelUsername = chat.username || "Yo'q";
  const channelLink = chat.username ? `@${chat.username}` : `ID: ${chat.id}`;
  const eventTime = nowStr();

  const eventBase = {
    user_id: userId,
    username,
    full_name: fullName,
    language_code: languageCode,
    is_bot: isBot,
    invited_by_id: invId,
    invited_by_name: invName,
    invited_by_username: invUsername,
    channel_id: chat.id,
    channel_title: channelTitle,
    channel_username: channelUsername,
  };

  // QO'SHILDI
  if (
    ["left", "kicked", "banned"].includes(oldStatus) &&
    newStatus === "member"
  ) {
    saveEvent({ ...eventBase, event_type: "joined" });

    const msg =
      `✅ <b>Yangi a'zo qo'shildi!</b>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>Ism:</b> ${fullName}\n` +
      `🔗 <b>Username:</b> ${unameDisp}\n` +
      `🆔 <b>Telegram ID:</b> <code>${userId}</code>\n` +
      `🌐 <b>Til:</b> ${langDisp}\n` +
      `🤖 <b>Bot ekanmi:</b> ${isBot}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `👑 <b>Kim taklif qildi:</b> ${invName} (${invUsername})\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📢 <b>Kanal:</b> ${channelTitle} (${channelLink})\n` +
      `🕐 <b>Vaqt:</b> ${eventTime}`;

    await ctx.telegram.sendMessage(ADMIN_CHAT_ID, msg, { parse_mode: "HTML" });
  }

  // CHIQIB KETDI
  else if (
    oldStatus === "member" &&
    ["left", "kicked", "banned"].includes(newStatus)
  ) {
    const isLeft = newStatus === "left";
    const actionText = isLeft ? "O'zi chiqib ketdi" : "Chiqarib yuborildi";
    const emoji = isLeft ? "🚪" : "🚫";

    saveEvent({ ...eventBase, event_type: "left" });

    const msg =
      `${emoji} <b>A'zo ${actionText}!</b>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>Ism:</b> ${fullName}\n` +
      `🔗 <b>Username:</b> ${unameDisp}\n` +
      `🆔 <b>Telegram ID:</b> <code>${userId}</code>\n` +
      `🌐 <b>Til:</b> ${langDisp}\n` +
      `🤖 <b>Bot ekanmi:</b> ${isBot}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📢 <b>Kanal:</b> ${channelTitle} (${channelLink})\n` +
      `🕐 <b>Vaqt:</b> ${eventTime}`;

    await ctx.telegram.sendMessage(ADMIN_CHAT_ID, msg, { parse_mode: "HTML" });
  }
});

// ─── Xatolik ────────────────────────────────
bot.catch((err, ctx) => {
  console.error(`[Xatolik] ${ctx?.updateType}:`, err.message);
});

// ─── Ishga tushirish ────────────────────────
bot
  .launch()
  .then(() => console.log("🤖 Bot muvaffaqiyatli ishga tushdi!"))
  .catch((err) => {
    console.error("❌ Bot ishga tushmadi:", err.message);
    process.exit(1);
  });

process.once("SIGINT", () => {
  db.close();
  bot.stop("SIGINT");
});
process.once("SIGTERM", () => {
  db.close();
  bot.stop("SIGTERM");
});

console.log("ishladi")