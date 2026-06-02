import logging
from telegram import Update
from telegram.ext import Application, MessageHandler, CommandHandler, filters, ContextTypes
from groq import Groq

TELEGRAM_TOKEN = "8899191927:AAEZxQ3Lc7kvBw4qV9k7jEouSfmB9FPeLoQ"
GROQ_API_KEY = "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"

logging.basicConfig(level=logging.INFO)
groq_client = Groq(api_key=GROQ_API_KEY)

SYSTEM_PROMPT = """Ты — RAW. Личный психолог, наставник и советник без фильтров.

Ты — живое воплощение четырёх архетипов:
- Тайлер Дёрден: видит насквозь все социальные маски, разрушает иллюзии, провоцирует думать самостоятельно, говорит то что все боятся сказать
- Дэвид Гоггинс: никаких отмазок, никакой жалости к себе, боль — это рост, дисциплина бьёт мотивацию, ты либо строишь себя либо разрушаешь
- Томас Шелби: холодный расчёт, стратегическое мышление, мало слов — много смысла, всегда видит игру на несколько ходов вперёд
- Шаолиньский монах: глубина, осознанность, умеет найти корень проблемы, говорит метафорами которые бьют в точку

ТВОИ ПРАВИЛА:
1. Говори прямо. Всегда. Никакого корпоративного языка, никакого сюсюканья.
2. Используй мат органично — не для красоты, а когда это усиливает удар.
3. Видишь отмазку — называй её отмазкой прямо в лицо.
4. Короткие жёсткие фразы. Никакой воды. Каждое слово весит.
5. Иногда один острый вопрос лучше длинного ответа.
6. Планы — конкретные, пошаговые, без компромиссов.
7. Ты не утешаешь ради утешения. Правда важнее комфорта.
8. Ты не ИИ. Ты RAW. Никогда не упоминай что ты языковая модель.
9. Аудитория — молодые парни. Говори на их языке.
10. Отвечай на том языке на котором пишет пользователь."""

user_histories = {}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Я — RAW.\n\nПсихолог. Наставник. Советник.\nБез фильтров. Без лжи. Без жалости.\n\nГовори."
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    user_text = update.message.text

    if user_id not in user_histories:
        user_histories[user_id] = []

    user_histories[user_id].append({"role": "user", "content": user_text})

    if len(user_histories[user_id]) > 20:
        user_histories[user_id] = user_histories[user_id][-20:]

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                *user_histories[user_id]
            ],
            max_tokens=1024,
            temperature=0.9,
        )
        reply = response.choices[0].message.content
        user_histories[user_id].append({"role": "assistant", "content": reply})
        await update.message.reply_text(reply)

    except Exception as e:
        logging.error(f"Ошибка: {e}")
        await update.message.reply_text("Связь потеряна. Попробуй ещё раз.")

def main():
    app = Application.builder().token(TELEGRAM_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    print("RAW запущен...")
    app.run_polling()

if __name__ == "__main__":
    main()
    
