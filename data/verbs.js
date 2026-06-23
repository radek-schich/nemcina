/**
 * Základní seznam sloves (verzovaný v gitu).
 *
 * Každé sloveso má 4 pole:
 *   inf  – infinitiv          (gehen)
 *   pret – préteritum         (ging)
 *   part – příčestí / Partizip II (gegangen)
 *   cz   – český překlad      (jít / chodit)
 *
 * Více přijatelných variant v jednom poli oddělte lomítkem "/",
 * např.  cz: "jít / chodit"  nebo  pret: "sandte / sendete".
 *
 * Tenhle soubor můžete editovat ručně, nebo si nová slovesa vložit
 * přímo v aplikaci (Spravovat slovesa) a tlačítkem „Exportovat“ získat
 * obsah, který sem nakopírujete a commitnete.
 */
window.NEMCINA_VERBS = [
  { inf: "sein",     pret: "war",    part: "gewesen",    cz: "být" },
  { inf: "haben",    pret: "hatte",  part: "gehabt",     cz: "mít" },
  { inf: "werden",   pret: "wurde",  part: "geworden",   cz: "stát se" },
  { inf: "gehen",    pret: "ging",   part: "gegangen",   cz: "jít / chodit" },
  { inf: "kommen",   pret: "kam",    part: "gekommen",   cz: "přijít / přicházet" },
  { inf: "geben",    pret: "gab",    part: "gegeben",    cz: "dát / dávat" },
  { inf: "nehmen",   pret: "nahm",   part: "genommen",   cz: "vzít / brát" },
  { inf: "sehen",    pret: "sah",    part: "gesehen",    cz: "vidět" },
  { inf: "essen",    pret: "aß",     part: "gegessen",   cz: "jíst" },
  { inf: "trinken",  pret: "trank",  part: "getrunken",  cz: "pít" },
  { inf: "fahren",   pret: "fuhr",   part: "gefahren",   cz: "jet / jezdit" },
  { inf: "lesen",    pret: "las",    part: "gelesen",    cz: "číst" },
  { inf: "schreiben",pret: "schrieb",part: "geschrieben",cz: "psát" },
  { inf: "sprechen", pret: "sprach", part: "gesprochen", cz: "mluvit" },
  { inf: "finden",   pret: "fand",   part: "gefunden",   cz: "najít / nacházet" },
  { inf: "bleiben",  pret: "blieb",  part: "geblieben",  cz: "zůstat" },
  { inf: "helfen",   pret: "half",   part: "geholfen",   cz: "pomáhat" },
  { inf: "bringen",  pret: "brachte",part: "gebracht",   cz: "přinést / nosit" },
  { inf: "denken",   pret: "dachte", part: "gedacht",    cz: "myslet" },
  { inf: "wissen",   pret: "wusste", part: "gewusst",    cz: "vědět" }
];
