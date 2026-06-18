#!/usr/bin/env python3
"""Build data/frasi-sesto-senso.json from curated planet phrases."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "frasi-sesto-senso.json"

PHRASES_BY_CATEGORY = {
    "gratitudine": [
        "Ti sono grato anche se non l'ho mai detto.",
        "Mi hai aiutato più di quanto immagini davvero.",
        "Vorrei ringraziarti senza sembrare debole o esagerato.",
        "Ti penso con gratitudine, anche da lontano.",
        "Hai fatto per me più del necessario.",
        "Mi hai dato presenza quando non chiedevo nulla.",
        "Non dimentico chi mi ha fatto sentire visto.",
        "Ti devo più parole di quelle che uso.",
        "Mi hai sostenuto anche senza accorgertene davvero.",
        "Vorrei dirti grazie, ma mi blocco sempre.",
        "Ho capito tardi quanto mi sei stato vicino.",
        "Alcune persone aiutano senza pretendere spiegazioni.",
        "Mi hai fatto sentire meno solo, davvero.",
        "Ti ringrazio dentro, anche quando non parlo.",
        "Hai avuto cura di me senza chiedere niente.",
        "Mi ricordo bene chi c'era nei momenti peggiori.",
        "La tua presenza mi ha cambiato alcune giornate.",
        "Non so dirtelo bene, ma ti sono grato.",
        "Hai fatto la differenza, anche nei dettagli piccoli.",
        "Mi hai dato forza quando non ne avevo.",
    ],
    "felicità": [
        "Mi sento bene quando posso essere me stesso.",
        "Con te rido senza dover controllare tutto.",
        "Mi basta poco per sentirmi felice davvero.",
        "Alcuni giorni migliorano appena ti sento arrivare.",
        "Sorrido spesso pensando a cose semplici con te.",
        "Mi fai stare leggero senza fare nulla.",
        "Questa felicità mi sorprende, perché non la cercavo.",
        "Sto bene quando non devo fingere niente.",
        "Mi piace quello che divento vicino a te.",
        "Certi momenti normali mi rendono felice per ore.",
        "Mi sento vivo quando smetto di proteggermi.",
        "La tua compagnia mi cambia l'umore davvero.",
        "Sono felice, anche se non so spiegarlo.",
        "Mi fa bene sentirmi accolto senza sforzo.",
        "A volte basta sentirti per stare meglio.",
        "Mi sento fortunato quando condividiamo qualcosa.",
        "Non lo dico, ma mi rendi felice.",
        "Con te anche il silenzio non pesa.",
        "Mi piace questa calma che arriva con te.",
        "Sto imparando a riconoscere quando sono felice.",
    ],
    "desiderio": [
        "Vorrei avvicinarmi, ma temo di sbagliare tutto.",
        "Ti desidero più di quanto riesca ad ammettere.",
        "Mi trattengo perché non so cosa provi.",
        "Vorrei cercarti senza sembrare troppo presente.",
        "Ho voglia di dirti tutto, ma aspetto.",
        "Ti penso anche quando provo a distrarmi.",
        "Mi manca il coraggio di fare un passo.",
        "Vorrei sapere se mi pensi anche tu.",
        "Ti cerco nei gesti più piccoli.",
        "Mi piacerebbe restare, ma temo di invadere.",
        "Ho desideri che non riesco a dire chiaramente.",
        "Vorrei essere più importante per te.",
        "Mi attiri anche quando provo a negarlo.",
        "Vorrei chiederti di restare ancora un po'.",
        "Ti vorrei vicino, ma resto prudente.",
        "Mi pesa desiderare qualcuno senza poterlo dire.",
        "Vorrei capire se questa cosa è reciproca.",
        "Mi trattengo perché ho paura del rifiuto.",
        "Ti penso più spesso di quanto ammetta.",
        "Vorrei parlarti, ma temo di espormi troppo.",
    ],
    "empatia": [
        "Ti capisco anche quando non riesci a spiegarti.",
        "Vedo che stai facendo fatica, anche sorridendo.",
        "Non so risolvere tutto, ma posso ascoltarti.",
        "Mi accorgo quando qualcosa ti pesa dentro.",
        "Vorrei aiutarti senza farti sentire giudicato.",
        "Sento quando ti chiudi per proteggerti.",
        "Ti vedo stanco, anche se dici niente.",
        "Non devi spiegare tutto per essere compreso.",
        "Mi importa come stai, non solo cosa dici.",
        "Capisco il tuo silenzio più delle risposte.",
        "Vorrei starti accanto senza aggiungere peso.",
        "So che certe giornate ti costano molto.",
        "Ti ascolto anche quando cambi discorso.",
        "Mi accorgo delle cose che non dici.",
        "Vorrei farti sentire meno solo adesso.",
        "Non minimizzo quello che stai attraversando.",
        "Ti credo, anche quando fai fatica.",
        "Riconosco il dolore dietro il tuo controllo.",
        "Vorrei proteggerti, ma rispetto i tuoi spazi.",
        "Ti sto vicino nel modo che posso.",
    ],
    "tristezza": [
        "Mi sento vuoto, anche se continuo normalmente.",
        "Fingo di stare bene per non spiegare.",
        "Ci sono giorni in cui pesa tutto.",
        "Mi manca qualcosa che non so nominare.",
        "Sorrido, ma dentro non mi sento leggero.",
        "Mi porto addosso cose che non racconto.",
        "Vorrei stare meglio, ma oggi non riesco.",
        "Alcune assenze mi fanno ancora molto male.",
        "Mi sento lontano anche quando sono presente.",
        "Non so perché mi sento così spento.",
        "Ho imparato a nascondere certe tristezze.",
        "Mi fa male ammettere quanto ci tengo.",
        "A volte mi manca la mia vecchia serenità.",
        "Mi sento fragile, ma provo a funzionare.",
        "Tengo dentro tutto per non disturbare nessuno.",
        "Alcune parole non dette mi pesano ancora.",
        "Mi manca chi ero prima di soffrire.",
        "Ci penso ancora, anche se sembra passato.",
        "Mi sento stanco di fingere forza.",
        "Vorrei piangere senza dovermi giustificare.",
    ],
    "paura": [
        "Ho paura di dire troppo e perdere tutto.",
        "Mi spaventa mostrarmi per come sono davvero.",
        "Taccio perché temo di non essere capito.",
        "Ho paura che la verità cambi tutto.",
        "Mi blocco quando qualcosa conta davvero.",
        "Ho paura di essere rifiutato ancora.",
        "Preferisco sembrare freddo che troppo vulnerabile.",
        "Mi spaventa dipendere emotivamente da qualcuno.",
        "Ho paura che tu non provi lo stesso.",
        "Non parlo perché temo la tua risposta.",
        "Ho paura di essere troppo per qualcuno.",
        "Mi proteggo anche quando vorrei avvicinarmi.",
        "Ho paura di sembrare bisognoso.",
        "Evito certi discorsi perché mi espongono troppo.",
        "Mi spaventa perdere il controllo dei sentimenti.",
        "Ho paura di non bastare mai davvero.",
        "Resto in silenzio per non rovinare tutto.",
        "Ho paura che avvicinarmi mi faccia male.",
        "Mi nascondo dietro frasi semplici e sicure.",
        "Ho paura di volere qualcosa impossibile.",
    ],
    "malinconia": [
        "Mi manca qualcosa, anche se non so cosa.",
        "Ripenso a momenti che non tornano più.",
        "Alcuni ricordi mi raggiungono senza avvisare.",
        "Mi manca com'ero prima di cambiare.",
        "Ogni tanto torno lì con la testa.",
        "Mi manca una versione di noi ormai lontana.",
        "Non voglio tornare indietro, però ci penso.",
        "Certi luoghi mi riportano a persone precise.",
        "Mi pesa sapere che alcune cose finiscono.",
        "Ho nostalgia di giorni che sembravano normali.",
        "Mi manca ciò che non ho capito allora.",
        "Alcuni ricordi fanno bene e male insieme.",
        "Mi accorgo tardi di cosa ho perso.",
        "Vorrei rivivere qualcosa senza cambiarne il finale.",
        "Mi manca la leggerezza di certi periodi.",
        "Alcune mancanze arrivano nei momenti più semplici.",
        "Mi ritrovo a pensare a chi eravamo.",
        "Non soffro più, ma qualcosa resta.",
        "Mi manca una casa che non esiste.",
        "Certi addii continuano anche dopo anni.",
    ],
    "rabbia": [
        "Mi arrabbio perché mi sono sentito ignorato.",
        "Non te l'ho detto, ma mi hai ferito.",
        "Mi pesa fingere che vada tutto bene.",
        "Avrei voluto più rispetto da parte tua.",
        "Mi fa rabbia aver sempre capito gli altri.",
        "Ho taciuto troppo per paura del conflitto.",
        "Mi arrabbio perché ho dato più del ricevuto.",
        "Non meritavo di essere trattato così.",
        "Mi fa male quanto ti ho giustificato.",
        "Vorrei dirti che mi hai deluso profondamente.",
        "Mi arrabbio quando minimizzi quello che provo.",
        "Ho ingoiato parole che meritavano spazio.",
        "Mi pesa essere sempre quello che capisce.",
        "Avrei voluto che ti importasse di più.",
        "Mi fa rabbia essere rimasto in silenzio.",
        "Non riesco più a fingere indifferenza.",
        "Mi arrabbio perché mi sono sentito usato.",
        "Ho sopportato cose che non dovevo sopportare.",
        "Mi ferisce che tu non te ne accorga.",
        "Vorrei smettere di proteggere chi mi ferisce.",
    ],
}


def make_sintesi(frase: str) -> str:
    text = frase.rstrip(".")
    if len(text) <= 48:
        return text
    cut = text[:48].rsplit(" ", 1)[0]
    return cut if cut else text[:48]


def main() -> None:
    frasi = []
    phrase_id = 1
    for category, phrases in PHRASES_BY_CATEGORY.items():
        for frase in phrases:
            frasi.append(
                {
                    "frase": frase,
                    "sintesi": make_sintesi(frase),
                    "categoriaPrincipale": category,
                    "categorieSecondarie": [],
                    "id": phrase_id,
                }
            )
            phrase_id += 1

    payload = {"version": 2, "frasi": frasi}
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} ({len(frasi)} frasi)")


if __name__ == "__main__":
    main()
