require("dotenv").config();

const { Telegraf } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN || "TOKEN";
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "6466549994";

const bot = new Telegraf(BOT_TOKEN);

// START
bot.start((ctx) => {
  ctx.reply("✅ Bot ishlayapti!");
});

// MEMBER TRACKING
bot.on("chat_member", async (ctx) => {
  try {
    const update = ctx.update.chat_member;

    const oldStatus = update.old_chat_member.status;
    const newStatus = update.new_chat_member.status;

    const user = update.new_chat_member.user;
    const chat = update.chat;

    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

    // JOINED
    if (["left", "kicked"].includes(oldStatus) && newStatus === "member") {
      const message = `
✅ Yangi a'zo qo'shildi!

👤 ${fullName}
🔗 @${user.username || "yoq"}
🆔 ${user.id}
📢 ${chat.title}
            `;

      await ctx.telegram.sendMessage(ADMIN_CHAT_ID, message);
    }

    // LEFT
    if (oldStatus === "member" && ["left", "kicked"].includes(newStatus)) {
      const message = `
❌ A'zo chiqib ketdi!

👤 ${fullName}
🔗 @${user.username || "yoq"}
🆔 ${user.id}
📢 ${chat.title}
            `;

      await ctx.telegram.sendMessage(ADMIN_CHAT_ID, message);
    }
  } catch (err) {
    console.log(err);
  }
});

bot.launch();

console.log("✅ Bot ishga tushdi...");
