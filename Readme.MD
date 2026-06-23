# Dot said

**Esperienza web interattiva in Three.js**

*Dare forma al sesto senso attraverso le parole che non diciamo ad alta voce.*

Dot said è un progetto interattivo sul non detto. L'utente scrive fino a dieci parole, le disperde nello spazio, le ricompone in una costellazione e poi la osserva dentro un sistema di pianeti-emozione popolato anche da frasi della community.

Concept, design e sviluppo: **Nicole Somma**.

---

## Stato del progetto

Questa versione non è più il semplice prototipo di un globo stellato. L'esperienza attuale include:

- schermata di caricamento con particella centrale, percentuale e reveal del logo;
- suono ambientale introduttivo e feedback audio sulle interazioni;
- cursore luminoso custom su desktop;
- intro testuale sul sesto senso e sul non detto;
- input centrale per scrivere massimo 10 parole;
- dispersione delle parole nello spazio e trasformazione in stelle selezionabili;
- costruzione manuale della propria costellazione tramite click sulle stelle;
- lancio della costellazione nello spazio;
- sistema di 8 pianeti-emozione;
- scelta del pianeta più vicino al proprio stato d'animo;
- cielo del pianeta in canvas 2D con costellazioni/frasi tematiche;
- pan, inerzia e zoom nella vista del cielo;
- download PNG della propria costellazione o della vista del pianeta;
- pannello About apribile da "beyond the stars".

L'entry point reale dell'app è [`index.html`](./index.html). Il file contiene markup, stile e logica principale della versione corrente.

---

## Flusso dell'esperienza

1. **Loading**
   La pagina apre un cielo scuro, una particella luminosa e il logo `dot said`. In parallelo viene preparato l'audio.

2. **Intro**
   Compare la domanda:

   > se il sesto senso fossero tutte le cose, che non siamo capaci di dire ad alta voce per paura?

   L'utente prosegue con un click o con tastiera.

3. **Il non detto**
   Il prompt chiede:

   > cosa ti va di non dire?

   L'utente scrive fino a 10 parole e preme Invio.

4. **Costellazione**
   Le parole si disperdono nel campo stellare. Ogni parola diventa una stella cliccabile: collegandole, l'utente disegna la propria costellazione.

5. **Lancio**
   Quando la costellazione è completa, viene inviata nello spazio e diventa parte del paesaggio visivo.

6. **Sistema planetario**
   L'app mostra 8 pianeti-emozione:

   - gratitudine
   - felicità
   - desiderio
   - empatia
   - malinconia
   - tristezza
   - paura
   - rabbia

7. **Cielo del pianeta**
   Dopo la scelta del pianeta, la vista entra in un cielo 2D navigabile, con frasi e costellazioni associate a quella emozione.

---

## Dati e contenuti

I contenuti principali sono in `data/`:

- [`data/frasi-sesto-senso.json`](./data/frasi-sesto-senso.json): dataset principale delle frasi curate per i pianeti, attualmente 160 frasi divise in 8 categorie;
- [`data/frasi-sesto-senso.js`](./data/frasi-sesto-senso.js): versione caricabile dal browser, esposta in `window.SESTOSENS_DATA.frasiSestoSenso`;
- [`data/community-phrases.json`](./data/community-phrases.json): frasi community di fallback;
- [`data/community-phrases.js`](./data/community-phrases.js): versione browser, esposta in `window.SESTOSENS_DATA.communityPhrases`;
- [`data/emotions.json`](./data/emotions.json): lessico e associazioni semantiche usate nel flusso modulare/sperimentale;
- [`data/config.json`](./data/config.json): parametri di camera, stelle, audio, controlli e UI per il flusso modulare.

La pagina corrente carica direttamente:

```html
<script src="./data/community-phrases.js"></script>
<script src="./data/frasi-sesto-senso.js"></script>
```

Se modifichi i JSON e vuoi rigenerare i file `.js`, usa la versione Node dello script:

```bash
node scripts/generate-data-js.mjs
```

Questa variante mantiene le chiavi camelCase attese da `index.html`, come `communityPhrases` e `frasiSestoSenso`.

---

## Stack tecnico

- **Three.js 0.182.0** via import map CDN;
- **OrbitControls** per rotazione, zoom e navigazione camera;
- **CSS2DRenderer** per etichette nello spazio 3D;
- **Canvas 2D** per loading, texture procedurali, export e cielo del pianeta;
- **Web Audio API** e tag `<audio>` per ambient sound e micro-feedback;
- **JavaScript ES modules** per la logica Three.js dentro `index.html`;
- **Python/Node scripts** per generazione dati, bundle di supporto e asset esportati.

Nota: l'app usa Three.js da CDN (`jsdelivr`). Per lavorare offline serve sostituire l'import map con una copia locale della libreria.

---

## Avvio locale

Serve un browser moderno con WebGL. Aprire direttamente il file con `file://` è sconsigliato: audio, moduli e asset sono più affidabili tramite server locale.

### Metodo rapido su Windows

Fai doppio click su:

```text
apri.bat
```

Lo script cerca Python, avvia un server locale sulla porta `8765` o sulla prima porta libera successiva, e apre:

```text
http://127.0.0.1:8765/index.html
```

In alternativa:

```powershell
powershell -ExecutionPolicy Bypass -File apri.ps1
```

### Metodo manuale

```bash
py -3 -m http.server 8765
```

Poi apri:

```text
http://127.0.0.1:8765/index.html
```

Su macOS/Linux puoi usare:

```bash
python3 -m http.server 8765
```

---

## Script utili

```bash
node scripts/generate-data-js.mjs
```

Rigenera i file `data/*.js` a partire dai rispettivi `data/*.json`.

```bash
py -3 scripts/build-frasi-sesto-senso.py
```

Ricostruisce `data/frasi-sesto-senso.json` dal dataset curato nello script.

```bash
py -3 scripts/export-sfondo.py
```

Esporta `sfondo-dot-said.png`, uno sfondo stellato ad alta risoluzione.

```bash
node scripts/build-bundle.mjs
```

Bundle sperimentale del flusso modulare in `js/`. Non è necessario per avviare la pagina corrente.

---

## Struttura

```text
3d-globe-stars-threejs-main/
|-- index.html                  # Esperienza interattiva principale
|-- Dotnation.ttf               # Font custom del brand
|-- star 1.mp3                  # Audio ambientale introduttivo
|-- star2.mp3                   # Feedback sonoro sulle interazioni
|-- apri.bat                    # Avvio rapido Windows
|-- apri.ps1                    # Avvio rapido PowerShell
|-- data/
|   |-- frasi-sesto-senso.json  # Dataset pianeti/frasi
|   |-- frasi-sesto-senso.js    # Dataset esposto al browser
|   |-- community-phrases.json  # Frasi community fallback
|   `-- community-phrases.js    # Frasi community esposte al browser
|-- js/                         # Moduli e bundle di supporto/sperimentali
|-- src/                        # Prototipo Three.js precedente
|-- scripts/                    # Utility per dati, bundle e asset
|-- public/                     # Texture e immagini di archivio
`-- assets/                     # Asset grafici di supporto
```

---

## Note di manutenzione

- La versione navigabile oggi è `index.html`.
- Le cartelle `src/` e `js/` contengono materiale modulare, prototipi e bundle di supporto: non sostituiscono l'entry point attuale.
- I pianeti della versione corrente sono generati in modo procedurale con canvas e Three.js.
- I dati dei pianeti/frasi vengono letti da `window.SESTOSENS_DATA`, popolato dagli script in `data/*.js`.
- Se cambi `data/frasi-sesto-senso.json` o `data/community-phrases.json`, rigenera i `.js` prima di provare la pagina.
- Il download genera file PNG direttamente nel browser.

---

## Crediti

- **Concept, design e sviluppo**: Nicole Somma
- **Font**: Dotnation, Andale Mono
- **Audio**: `star 1.mp3`, `star2.mp3`
- **Rendering**: Three.js, Canvas 2D, Web Audio API

---

*Dot said è uno spazio per lasciare andare quello che non diresti.*
