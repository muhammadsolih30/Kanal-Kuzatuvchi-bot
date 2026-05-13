import logging
import sqlite3
from datetime import datetime
from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    ChatMemberHandler,
    ContextTypes,
)

# =============================================
# SOZLAMALAR
# =============================================
BOT_TOKEN = "8443658995:AAHSCry5l60gwcnvOObYisvMysPeJZRR9Ug"
ADMIN_CHAT_ID = 6466549994  # Sizning shaxsiy Telegram ID ingiz
# =============================================

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

DB_FILE = "members.db"


def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT,
            user_id INTEGER,
            username TEXT,
            full_name TEXT,
            language_code TEXT,
            is_bot TEXT,
            invited_by_id INTEGER,
            invited_by_name TEXT,
            invited_by_username TEXT,
            channel_id INTEGER,
            channel_title TEXT,
            channel_username TEXT,
            event_time TEXT
        )
    """)
    conn.commit()
    conn.close()


def save_event(data: dict):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO events (
            event_type, user_id, username, full_name,
            language_code, is_bot,
            invited_by_id, invited_by_name, invited_by_username,
            channel_id, channel_title, channel_username, event_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get("event_type"),
        data.get("user_id"),
        data.get("username", "Yo'q"),
        data.get("full_name", "Noma'lum"),
        data.get("language_code", "Noma'lum"),
        data.get("is_bot", "Yo'q"),
        data.get("invited_by_id"),
        data.get("invited_by_name", "Noma'lum"),
        data.get("invited_by_username", "Yo'q"),
        data.get("channel_id"),
        data.get("channel_title", "Noma'lum"),
        data.get("channel_username", "Yo'q"),
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))
    conn.commit()
    conn.close()


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "✅ <b>Bot ishga tushdi!</b>\n\n"
        "Meni kanalingizga <b>admin</b> qiling.\n"
        "Kim qo'shilsa yoki chiqsa — darhol xabar olasiz.\n\n"
        "📋 <b>Buyruqlar:</b>\n"
        "/start — Botni ishga tushirish\n"
        "/stats — So'nggi 10 ta voqea\n"
        "/help — Yordam",
        parse_mode="HTML"
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🤖 <b>Bot qo'llanmasi:</b>\n\n"
        "1️⃣ Botni kanalingizga admin qiling\n"
        "2️⃣ Bot avtomatik a'zolarni kuzatadi\n"
        "3️⃣ Har o'zgarishda sizga xabar keladi\n\n"
        "📋 <b>Buyruqlar:</b>\n"
        "/stats — So'nggi 10 ta voqea\n"
        "/help — Yordam",
        parse_mode="HTML"
    )


async def stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT event_type, full_name, username, channel_title, event_time, language_code
        FROM events
        ORDER BY id DESC
        LIMIT 10
    """)
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        await update.message.reply_text("📭 Hali hech qanday voqea qayd etilmagan.")
        return

    text = "📊 <b>So'nggi 10 ta voqea:</b>\n\n"
    for row in rows:
        event_type, full_name, username, channel_title, event_time, lang = row
        emoji = "✅" if event_type == "joined" else "❌"
        action = "Qo'shildi" if event_type == "joined" else "Chiqdi"
        uname = f"@{username}" if username and username != "Yo'q" else "yo'q"
        text += (
            f"{emoji} <b>{action}</b> | {full_name} ({uname})\n"
            f"🌐 Til: {lang} | 📢 {channel_title}\n"
            f"🕐 {event_time}\n\n"
        )

    await update.message.reply_text(text, parse_mode="HTML")


async def track_member(update: Update, context: ContextTypes.DEFAULT_TYPE):
    result = update.chat_member

    if result.chat.type not in ["channel", "supergroup", "group"]:
        return

    old_status = result.old_chat_member.status
    new_status = result.new_chat_member.status
    user = result.new_chat_member.user
    chat = result.chat

    # Foydalanuvchi ma'lumotlari
    user_id = user.id
    username = user.username or "Yo'q"
    first = user.first_name or ""
    last = user.last_name or ""
    full_name = f"{first} {last}".strip() or "Noma'lum"
    language_code = getattr(user, "language_code", None) or "Noma'lum"
    is_bot = "🤖 Ha" if user.is_bot else "👤 Yo'q"

    # Kim taklif qildi
    invited_by = result.from_user
    if invited_by:
        inv_id = invited_by.id
        inv_name = f"{invited_by.first_name or ''} {invited_by.last_name or ''}".strip()
        inv_username = f"@{invited_by.username}" if invited_by.username else "Yo'q"
    else:
        inv_id = None
        inv_name = "Noma'lum"
        inv_username = "Yo'q"

    # Kanal ma'lumotlari
    channel_id = chat.id
    channel_title = chat.title or "Noma'lum"
    channel_username = chat.username or "Yo'q"
    channel_link = f"@{chat.username}" if chat.username else f"ID: {chat.id}"
    event_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Til nomi
    lang_names = {
        "uz": "🇺🇿 O'zbek", "ru": "🇷🇺 Rus", "en": "🇬🇧 Ingliz",
        "tr": "🇹🇷 Turk", "ar": "🇸🇦 Arab", "de": "🇩🇪 Nemis",
        "fr": "🇫🇷 Fransuz", "es": "🇪🇸 Ispan", "kk": "🇰🇿 Qozoq",
        "tj": "🇹🇯 Tojik", "ky": "🇰🇬 Qirg'iz"
    }
    lang_display = lang_names.get(language_code, f"🌐 {language_code}")

    uname_display = f"@{username}" if username != "Yo'q" else "username yo'q"

    # --- QOSHILDI ---
    if old_status in ["left", "kicked", "banned"] and new_status == "member":
        save_event({
            "event_type": "joined",
            "user_id": user_id, "username": username, "full_name": full_name,
            "language_code": language_code, "is_bot": is_bot,
            "invited_by_id": inv_id, "invited_by_name": inv_name, "invited_by_username": inv_username,
            "channel_id": channel_id, "channel_title": channel_title, "channel_username": channel_username
        })

        message = (
            f"✅ <b>Yangi a'zo qo'shildi!</b>\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"👤 <b>Ism:</b> {full_name}\n"
            f"🔗 <b>Username:</b> {uname_display}\n"
            f"🆔 <b>Telegram ID:</b> <code>{user_id}</code>\n"
            f"🌐 <b>Til:</b> {lang_display}\n"
            f"🤖 <b>Bot ekanmi:</b> {is_bot}\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"👑 <b>Kim taklif qildi:</b> {inv_name} ({inv_username})\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"📢 <b>Kanal:</b> {channel_title} ({channel_link})\n"
            f"🕐 <b>Vaqt:</b> {event_time}"
        )
        await context.bot.send_message(chat_id=ADMIN_CHAT_ID, text=message, parse_mode="HTML")

    # --- CHIQIB KETDI ---
    elif old_status == "member" and new_status in ["left", "kicked", "banned"]:
        if new_status == "left":
            action_text = "O'zi chiqib ketdi"
            emoji = "🚪"
        else:
            action_text = "Chiqarib yuborildi"
            emoji = "🚫"

        save_event({
            "event_type": "left",
            "user_id": user_id, "username": username, "full_name": full_name,
            "language_code": language_code, "is_bot": is_bot,
            "invited_by_id": inv_id, "invited_by_name": inv_name, "invited_by_username": inv_username,
            "channel_id": channel_id, "channel_title": channel_title, "channel_username": channel_username
        })

        message = (
            f"{emoji} <b>A'zo {action_text}!</b>\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"👤 <b>Ism:</b> {full_name}\n"
            f"🔗 <b>Username:</b> {uname_display}\n"
            f"🆔 <b>Telegram ID:</b> <code>{user_id}</code>\n"
            f"🌐 <b>Til:</b> {lang_display}\n"
            f"🤖 <b>Bot ekanmi:</b> {is_bot}\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"📢 <b>Kanal:</b> {channel_title} ({channel_link})\n"
            f"🕐 <b>Vaqt:</b> {event_time}"
        )
        await context.bot.send_message(chat_id=ADMIN_CHAT_ID, text=message, parse_mode="HTML")


def main():
    init_db()
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("stats", stats))
    app.add_handler(ChatMemberHandler(track_member, ChatMemberHandler.ANY_CHAT_MEMBER))
    logger.info("Bot ishga tushdi...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()