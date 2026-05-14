require("dotenv").config();
const { Telegraf } = require("telegraf");
const Database = require("better-sqlite3");

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = Number(process.env.ADMIN_CHAT_ID);

if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
  console.error("❌ BOT_TOKEN yoki ADMIN_CHAT_ID .env faylida yo'q!");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// ── DATABASE ──────────────────────────────────────────
const db = new Database("members.db");

db.prepare(
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
).run();

console.log("✅ Database tayyor.");

// ── SAVE EVENT ────────────────────────────────────────
function saveEvent(data) {
  db.prepare(
    `
    INSERT INTO events (
      event_type, user_id, username, full_name,
      language_code, is_bot,
      invited_by_id, invited_by_name, invited_by_username,
      channel_id, channel_title, channel_username, event_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
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
    data.event_time,
  );
}

// ── TIL NOMLARI ───────────────────────────────────────
const LANG_NAMES = {
  uz: "🇺🇿 O'zbek",
  ru: "🇷🇺 Rus",
  en: "🇬🇧 Ingliz",
  tr: "🇹🇷 Turk",
  ar: "🇸🇦 Arab",
  kk: "🇰🇿 Qozoq",
  tj: "🇹🇯 Tojik",
  ky: "🇰🇬 Qirg'iz",
};

function langDisplay(code) {
  return LANG_NAMES[code] || "🌐 " + (code || "Noma'lum");
}

// ── BUYRUQLAR ─────────────────────────────────────────
bot.start(async (ctx) => {
  await ctx.replyWithHTML(
    "✅ <b>Bot ishga tushdi!</b>\n\n" +
      "Meni kanalingizga <b>admin</b> qiling.\n" +
      "Kim qo'shilsa yoki chiqsa — darhol xabar olasiz.\n\n" +
      "📋 <b>Buyruqlar:</b>\n" +
      "/stats — So'nggi 10 ta voqea\n" +
      "/help — Yordam",
  );
});

bot.help(async (ctx) => {
  await ctx.replyWithHTML(
    "📋 <b>Buyruqlar:</b>\n" +
      "/start — Botni ishga tushirish\n" +
      "/stats — So'nggi 10 ta voqea\n" +
      "/help — Yordam",
  );
});

bot.command("stats", async (ctx) => {
  try {
    const rows = db
      .prepare(
        `
      SELECT * FROM events ORDER BY id DESC LIMIT 10
    `,
      )
      .all();

    if (rows.length === 0) {
      return ctx.reply("📭 Hali hech qanday voqea qayd etilmagan.");
    }

    let text = "📊 <b>So'nggi 10 ta voqea:</b>\n\n";

    rows.forEach((row) => {
      const emoji = row.event_type === "joined" ? "✅" : "❌";
      const action = row.event_type === "joined" ? "Qo'shildi" : "Chiqdi";
      const uname =
        row.username !== "yoq" ? "@" + row.username : "username yo'q";

      text +=
        `${emoji} <b>${action}</b>\n` +
        `👤 ${row.full_name} (${uname})\n` +
        `🌐 ${row.language_code}\n` +
        `📢 ${row.channel_title}\n` +
        `🕒 ${row.event_time}\n\n`;
    });

    await ctx.replyWithHTML(text);
  } catch (err) {
    console.error("stats xatosi:", err.message);
    ctx.reply("❌ Xatolik yuz berdi.");
  }
});

// ── A'ZOLARNI KUZATISH ────────────────────────────────
bot.on("chat_member", async (ctx) => {
  try {
    const update = ctx.update.chat_member;
    const oldStatus = update.old_chat_member.status;
    const newStatus = update.new_chat_member.status;
    const user = update.new_chat_member.user;
    const chat = update.chat;

    if (!["channel", "supergroup", "group"].includes(chat.type)) return;

    const fullName =
      `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Noma'lum";
    const username = user.username || "yoq";
    const langDisp = langDisplay(user.language_code);
    const unameDisp = user.username ? "@" + user.username : "username yo'q";

    const invitedBy = update.from;
    const invName = invitedBy
      ? `${invitedBy.first_name || ""} ${invitedBy.last_name || ""}`.trim()
      : "Noma'lum";
    const invUsername = invitedBy?.username ? "@" + invitedBy.username : "yo'q";

    const channelLink = chat.username ? "@" + chat.username : "ID: " + chat.id;
    const eventTime = new Date().toLocaleString("uz-UZ");

    const data = {
      user_id: user.id,
      username: username,
      full_name: fullName,
      language_code: user.language_code || "unknown",
      is_bot: user.is_bot ? "🤖 Ha" : "👤 Yo'q",
      invited_by_id: invitedBy?.id || null,
      invited_by_name: invName,
      invited_by_username: invUsername,
      channel_id: chat.id,
      channel_title: chat.title || "Noma'lum",
      channel_username: chat.username || "yoq",
      event_time: eventTime,
    };

    // ── QO'SHILDI ──
    if (
      ["left", "kicked", "banned"].includes(oldStatus) &&
      newStatus === "member"
    ) {
      data.event_type = "joined";
      saveEvent(data);

      const msg =
        "✅ <b>Yangi a'zo qo'shildi!</b>\n" +
        "━━━━━━━━━━━━━━━━━━\n" +
        `👤 <b>Ism:</b> ${fullName}\n` +
        `🔗 <b>Username:</b> ${unameDisp}\n` +
        `🆔 <b>Telegram ID:</b> <code>${user.id}</code>\n` +
        `🌐 <b>Til:</b> ${langDisp}\n` +
        `🤖 <b>Bot ekanmi:</b> ${data.is_bot}\n` +
        "━━━━━━━━━━━━━━━━━━\n" +
        `👑 <b>Kim taklif qildi:</b> ${invName} (${invUsername})\n` +
        "━━━━━━━━━━━━━━━━━━\n" +
        `📢 <b>Kanal:</b> ${chat.title} (${channelLink})\n` +
        `🕐 <b>Vaqt:</b> ${eventTime}`;

      await ctx.telegram.sendMessage(ADMIN_CHAT_ID, msg, {
        parse_mode: "HTML",
      });
    }

    // ── CHIQIB KETDI ──
    else if (
      oldStatus === "member" &&
      ["left", "kicked", "banned"].includes(newStatus)
    ) {
      const isLeft = newStatus === "left";
      data.event_type = "left";
      saveEvent(data);

      const emoji = isLeft ? "🚪" : "🚫";
      const actionText = isLeft ? "O'zi chiqib ketdi" : "Chiqarib yuborildi";

      const msg =
        `${emoji} <b>A'zo ${actionText}!</b>\n` +
        "━━━━━━━━━━━━━━━━━━\n" +
        `👤 <b>Ism:</b> ${fullName}\n` +
        `🔗 <b>Username:</b> ${unameDisp}\n` +
        `🆔 <b>Telegram ID:</b> <code>${user.id}</code>\n` +
        `🌐 <b>Til:</b> ${langDisp}\n` +
        `🤖 <b>Bot ekanmi:</b> ${data.is_bot}\n` +
        "━━━━━━━━━━━━━━━━━━\n" +
        `📢 <b>Kanal:</b> ${chat.title} (${channelLink})\n` +
        `🕐 <b>Vaqt:</b> ${eventTime}`;

      await ctx.telegram.sendMessage(ADMIN_CHAT_ID, msg, {
        parse_mode: "HTML",
      });
    }
  } catch (err) {
    console.error("chat_member xatosi:", err.message);
  }
});

// ── XATOLIK USHLAGICH ─────────────────────────────────
bot.catch((err, ctx) => {
  console.error(`[Xatolik] ${ctx?.updateType}:`, err.message);
});

// ── ISHGA TUSHIRISH ───────────────────────────────────
bot
  .launch()
  .then(() => {
    console.log("🤖 Bot muvaffaqiyatli ishga tushdi!");
  })
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
