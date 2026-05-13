# 📖 Bot O'rnatish Qo'llanmasi

## 1. Kerakli dasturlarni o'rnatish

```bash
pip install -r requirements.txt
```

## 2. bot.py faylini sozlash

`bot.py` faylini oching va quyidagi qatorlarni o'zgartiring:

```python
BOT_TOKEN = "BU_YERGA_BOT_TOKENINGIZNI_KIRITING"
ADMIN_CHAT_ID = 123456789
```

### Bot tokenini olish:
1. Telegramda [@BotFather](https://t.me/BotFather) ga boring
2. `/newbot` buyrug'ini yuboring
3. Bot uchun nom va username kiriting
4. BotFather sizga token beradi — uni `BOT_TOKEN` ga kiriting

### Shaxsiy Telegram ID ni olish:
1. Telegramda [@userinfobot](https://t.me/userinfobot) ga boring
2. `/start` bosing
3. U sizga ID ni ko'rsatadi — uni `ADMIN_CHAT_ID` ga kiriting

## 3. Botni kanalga admin qilish

1. Kanalingizga kiring → Kanal sozlamalari
2. Adminlar → Admin qo'shish
3. Botingizni toping va qo'shing
4. **"Add Members"** huquqini bering (a'zolarni ko'rish uchun)

## 4. Botni ishga tushirish

```bash
python bot.py
```

## 5. Botni test qilish

1. Telegram da botingizga `/start` yuboring
2. Kanalingizga kimdir qo'shiling yoki chiqsin
3. Siz darhol xabar olasiz!

---

## Buyruqlar

| Buyruq | Tavsif |
|--------|--------|
| `/start` | Botni ishga tushirish |
| `/stats` | So'nggi 10 ta voqeani ko'rish |
| `/help` | Yordam |

---

## Xabar namunasi

**Qo'shilganda:**
```
✅ Yangi a'zo qo'shildi!

👤 Ism: Jahongir Toshmatov
🔗 Username: @jahongir_t
🆔 Telegram ID: 123456789
📢 Kanal: Mening Kanalim (@mening_kanal)
🕐 Vaqt: 2024-01-15 14:30:25
```

**Chiqib ketganda:**
```
🚪 A'zo Chiqib ketdi!

👤 Ism: Aziza Karimova
🔗 Username: @aziza_k
🆔 Telegram ID: 987654321
📢 Kanal: Mening Kanalim (@mening_kanal)
🕐 Vaqt: 2024-01-15 15:10:42
```

---

## Eslatma

- Telefon raqami Telegram API orqali avtomatik olib bo'lmaydi (foydalanuvchi yashirin saqlaydi)
- Faqat username, ism va Telegram ID ko'rinadi
- Bot ishlashi uchun doim server yoki kompyuterda ochiq turishi kerak

2-qadam

members.db faylini o‘chiring:

rm members.db
3-qadam

Botni qayta ishga tushiring:

python Bot.py

Shunda yangi jadval avtomatik yaratiladi va hammasi ishlaydi.