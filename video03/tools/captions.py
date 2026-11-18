"""Build caption chunks from recognised word timings.

Each line = one on-screen chunk. Tokens consume one recognised word each;
`TOKEN|n` consumes n words. `*` prefix = green highlight.
"""
import json
import sys

SPEC = """
ВЫ ВЛЮБИЛИСЬ
НЕ В *ХАРАКТЕР.
ВЫ ВЛЮБИЛИСЬ
В !ЗАПАХ.
А В КОНЦЕ~—
КАК ОДНА МАЛЕНЬКАЯ *ТАБЛЕТКА
ЛОМАЕТ ЭТОТ *ВЫБОР.
*БРЕД?
ПОСМОТРИТЕ НА *МЫШЕЙ.
*1976-Й.
МЫШИ ВЫБИРАЮТ ПАРУ
ПО *ЗАПАХУ
С НЕПОХОЖИМИ ГЕНАМИ *ИММУНИТЕТА.
*РЫБЫ-КОЛЮШКИ|2 ТОЖЕ.
ПО ЗАПАХУ *ВОДЫ.
ВЫ ДУМАЕТЕ,
ЧТО ВЫ *ВЫШЕ ЭТОГО?
*1995-Й.
*ШВЕЙЦАРИЯ.
БИОЛОГ КЛАУС *ВЕДЕКИНД
ПРОСИТ МУЖЧИН
ДВЕ *НОЧИ
СПАТЬ В ОДНОЙ *ФУТБОЛКЕ.
БЕЗ *ПАРФЮМА.
ПОТОМ *ЖЕНЩИНЫ
НЮХАЮТ *ФУТБОЛКИ.|2
ПРИЯТНЕЕ ВСЕГО ИМ ПАХНУТ
МУЖЧИНЫ С САМЫМИ
*НЕПОХОЖИМИ ГЕНАМИ
ИММУНИТЕТА.
И ЭТИ ЗАПАХИ *ЧАЩЕ
НАПОМИНАЮТ ИМ
СОБСТВЕННЫХ *ПАРТНЁРОВ.
ВАШЕ *СЕКРЕТНОЕ ОРУЖИЕ —
!НОС.
ЗА *СЕКУНДУ ОН ДЕЛАЕТ
*ГЕНЕТИЧЕСКИЙ АНАЛИЗ.
*ЗАЧЕМ?
РАЗНЫЕ ГЕНЫ *РОДИТЕЛЕЙ~—
И *ИММУНИТЕТ РЕБЁНКА
УЗНАЁТ *БОЛЬШЕ БОЛЕЗНЕЙ.
А ЕСЛИ ГЕНЫ *ПОХОЖИ?
В ТАКИХ ПАРАХ
ЖЕНЩИНЫ ЧАЩЕ ПРИЗНАЮТСЯ,
ЧТО ИХ *ТЯНЕТ
К *ДРУГИМ МУЖЧИНАМ.
И ТА САМАЯ !ТАБЛЕТКА.
В ОПЫТЕ *ВЕДЕКИНДА
ЖЕНЩИНЫ НА ГОРМОНАЛЬНЫХ
*КОНТРАЦЕПТИВАХ
ВЫБИРАЛИ *НАОБОРОТ~—
*ПОХОЖИЕ ЗАПАХИ.
ТАК ЧТО
«МЕЖДУ НАМИ *ХИМИЯ» —
ЭТО НЕ !МЕТАФОРА.
ВАШ *НОС
ВЫБРАЛ|2 РАНЬШЕ *ВАС.
А ВЫ *ПОМНИТЕ,
КАК *ПАХНЕТ ЧЕЛОВЕК,
КОТОРОГО ВЫ *ЛЮБИТЕ?
НАПИШИТЕ *ОДНИМ СЛОВОМ.
"""

words = json.load(open(sys.argv[1]))
total_end = float(sys.argv[3])
chunks = []
i = 0
for line in SPEC.strip().splitlines():
    toks = []
    for tok in line.split():
        n = 1
        if '|' in tok:
            tok, n = tok.split('|')
            n = int(n)
        acc = tok.startswith('!')
        hl = tok.startswith('*') or acc
        tok = tok.lstrip('*!').replace('~', ' ')
        start = words[i][0]
        end = words[i + n - 1][1]
        toks.append({'t': tok, 's': round(start, 3), 'e': round(end, 3), 'hl': hl, 'acc': acc})
        i += n
    chunks.append({'s': toks[0]['s'], 'w': toks})
assert i == len(words), (i, len(words))
for k, c in enumerate(chunks):
    nxt = chunks[k + 1]['s'] if k + 1 < len(chunks) else total_end
    c['e'] = round(nxt, 3)
json.dump(chunks, open(sys.argv[2], 'w'), ensure_ascii=False)
print(len(chunks), 'chunks')
