"""Build caption chunks from recognised word timings.

Each line = one on-screen chunk. Tokens consume one recognised word each;
`TOKEN|n` consumes n words. `*` prefix = green highlight.
"""
import json
import sys

SPEC = """
ВЫ РОДИЛИСЬ
!НЕДОНОШЕННЫМ.
КАК И КАЖДЫЙ
ЧЕЛОВЕК НА *ЗЕМЛЕ.
НЕ ВЕРИТЕ?
*ЖЕРЕБЁНОК ВСТАЁТ НА НОГИ
ЧЕРЕЗ *ЧАС
ПОСЛЕ РОЖДЕНИЯ.
ЧЕРЕЗ НЕСКОЛЬКО ЧАСОВ
*БЕЖИТ ЗА ТАБУНОМ.
ВЫ ВСТАЛИ
ЧЕРЕЗ !ГОД.
ЗООЛОГ|2 АДОЛЬФ *ПОРТМАН
ПОДСЧИТАЛ:
ЧТОБЫ РОДИТЬСЯ
ТАКИМ ЖЕ РАЗВИТЫМ,
КАК ДЕТЁНЫШ *ОБЕЗЬЯНЫ,
ВАМ НУЖНО БЫЛО
ПРОВЕСТИ В УТРОБЕ
*21 *МЕСЯЦ.
МОЗГ *НОВОРОЖДЁННОГО~—
МЕНЬШЕ *ТРЕТИ ОТ ВЗРОСЛОГО.
У ДЕТЁНЫША *МАКАКИ~—
БОЛЬШЕ *ДВУХ *ТРЕТЕЙ.
ПОЧЕМУ *ТАК?
ВАШИ ПРЕДКИ ВСТАЛИ
НА *ДВЕ НОГИ~—
И *ТАЗ СТАЛ УЗКИМ.
А *ГОЛОВА~—|2 ВСЁ БОЛЬШЕ.
ЕЩЁ НЕСКОЛЬКО МЕСЯЦЕВ~—
И ОНА БЫ НЕ *ПРОШЛА.
А *МАТЬ УЖЕ НЕ СМОГЛА БЫ
ПРОКОРМИТЬ ТАКОЙ *МОЗГ ИЗНУТРИ.
ВЫХОД *ОДИН~—
РОДИТЬСЯ *РАНЬШЕ.
И ДОСТРАИВАТЬ МОЗГ *СНАРУЖИ.
ЗА ПЕРВЫЙ ГОД
ОН ВЫРАСТАЕТ *ВДВОЕ.
ТАК ЧТО НА *БУМАГЕ
ВЫ~— САМЫЙ *БЕСПОМОЩНЫЙ
ДЕТЁНЫШ НА ЗЕМЛЕ.
НО…
В ЭТОМ
ВАШЕ *СЕКРЕТНОЕ
!ОРУЖИЕ.
*ЖЕРЕБЁНОК РОЖДАЕТСЯ
С *ГОТОВЫМ МОЗГОМ~—
ПОД ОДНУ-ЕДИНСТВЕННУЮ|2 *ЖИЗНЬ.
ВАШ МОЗГ *НЕДОСТРОЕН.
И ДОСТРАИВАЕТ ЕГО
*МИР ВОКРУГ.
БОЛЬШЕ *МИЛЛИОНА
НОВЫХ СВЯЗЕЙ~—
КАЖДУЮ *СЕКУНДУ.
ДО *ПОЛУГОДА МЛАДЕНЕЦ
РАЗЛИЧАЕТ ЗВУКИ
*ВСЕХ ЯЗЫКОВ ЗЕМЛИ.
К *ГОДУ~— ТОЛЬКО ТЕХ,
ЧТО СЛЫШИТ *РЯДОМ.
МОЗГ *ПОДСТРАИВАЕТСЯ
ПОД МИР, В КОТОРЫЙ ПОПАЛ:
*ДЖУНГЛИ,
*ТУНДРА,
*МЕГАПОЛИС.
ВЫ РОДИЛИСЬ *НЕДОДЕЛАННЫМ~—
ЧТОБЫ ВАС ДОДЕЛАЛ *МИР.
ЖЕРЕБЁНОК МОЖЕТ СТАТЬ
ТОЛЬКО *ЛОШАДЬЮ.
А ВЫ~—
КЕМ !УГОДНО.
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
