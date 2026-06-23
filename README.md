# Němčina – zkoušení sloves

Jednoduchá webová aplikace na drilování německých nepravidelných sloves.
Ukáže český překlad a vy doplníte všechny tři tvary: **infinitiv · préteritum · příčestí (Partizip II)**.
Sloveso „vypadne“ ze zkoušení, jakmile ho zadáte **3× správně za sebou** (chyba počítadlo vynuluje).

Bez závislostí – čistá HTML/CSS/JS. Pokrok i vlastní seznam sloves se ukládají
do prohlížeče (`localStorage`).

## Spuštění

Stačí otevřít `index.html` v prohlížeči (funguje i přímo z disku přes `file://`,
protože data jsou v `data/verbs.js`).

Pokud chcete servírovat přes HTTP:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Vlastní slovesa

V záložce **Spravovat slovesa** vložíte text/tabulku – jeden řádek = jedno sloveso,
sloupce v pořadí:

```
infinitiv	préteritum	příčestí	překlad
```

Sloupce lze oddělit **tabulátorem** (kopírování z Excelu), **středníkem** nebo **čárkou**.
Více přijatelných variant v jednom poli oddělte lomítkem, např. `jít / chodit`.

Příklad:

```
gehen	ging	gegangen	jít / chodit
kommen	kam	gekommen	přijít
sehen	sah	gesehen	vidět
```

- **Nahradit seznam** – nahradí celý seznam a vynuluje pokrok.
- **Přidat k seznamu** – doplní nová slovesa (duplicity přeskočí).
- **Exportovat** – vygeneruje obsah pro soubor [`data/verbs.js`](data/verbs.js),
  který můžete commitnout do repa (a mít tak slovesa verzovaná v gitu).

## Vyhodnocení odpovědí

- na **velikosti písmen** nezáleží,
- přehlásky můžete psát i jako **ae / oe / ue** a `ß` jako `ss`.

## Soubory

| Soubor | Popis |
| --- | --- |
| `index.html` | UI aplikace |
| `styles.css` | vzhled |
| `app.js` | logika zkoušení, import/export, ukládání |
| `data/verbs.js` | výchozí (verzovaný) seznam sloves — 173 silných/nepravidelných sloves A1–C2 |
