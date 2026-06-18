# Dot said

**Esperienza interattiva web · Three.js**

*Dare forma al sesto senso.*

---

## Il progetto

**Dot said** è un’esperienza interattiva nata da un brief abbastanza astratto: tradurre in immagine ciò che di solito resta nel non detto.

L’interfaccia invita l’utente a lasciarsi guidare dall’istinto, digitando fino a dieci parole che spesso si ha paura di dire o ammettere. Non serve ricomporre una frase perfetta: l’importante è averle scritte e trasformarle in una costellazione.

Ogni costellazione racchiude uno stato d’animo, un’emozione o una sensazione. Da lì, l’utente viene guidato verso un pianeta da cui osservare la propria traccia e quelle della community.

Dot said è questo: lasciare andare quello che non diresti.

 **Nicole Somma**

---

## L’esperienza

### 1. Ingresso nello spazio

- Schermata di caricamento con campo stellare animato
- Domanda introduttiva: *«se il sesto senso fossero tutte le cose, che non siamo capaci di dire ad alta voce per paura?»*
- Ambient sound e cursore luminoso a punto

### 2. Il non detto

- Prompt centrale: *«cosa ti va di non dire?»*
- L’utente digita fino a **10 parole** e le invia con Invio
- Le parole si disperdono nello spazio e diventano stelle editabili

### 3. La costellazione

- Clic sulle stelle per collegarle e disegnare la propria forma
- Zoom, rotazione e doppio clic per avvicinarsi
- Al completamento, la costellazione viene **lanciata**: si riduce, ruota e diventa un punto luminoso nello spazio

### 4. Il sistema planetario

- Compare il sistema di **8 pianeti-emozione**, ciascuno con orbita, colore e identità propria:
  - gratitudine · felicità · desiderio · empatia
  - malinconia · tristezza · paura · rabbia
- L’utente atterra sul pianeta più vicino al proprio stato d’animo

### 5. Il cielo del pianeta

- Vista immersiva a schermo intero con costellazioni della community
- La propria costellazione resta visibile e separata dalle altre
- Pan, zoom e navigazione nel cielo
- Possibilità di scaricare la propria costellazione

---

## Interfaccia


| Elemento             | Ruolo                                     |
| -------------------- | ----------------------------------------- |
| **dot said**         | Brand in alto a sinistra (font Dotnation) |
| **beyond the stars** | Apertura pannello About                   |
| **About**            | Testo del concept, firma, link GitHub     |
| **Cursore a punto**  | Identità visiva dell’interazione          |
| **Andale Mono**      | Testo descrittivo e UI funzionale         |
| **Dotnation**        | Titoli, firma, elementi simbolici         |


Il pannello About usa un fondo semi-trasparente con effetto specchio e tinta giallo-oliva, per dare contrasto leggero rispetto al cielo scuro.

---

## Stack tecnico


| Tecnologia        | Uso                                          |
| ----------------- | -------------------------------------------- |
| **Three.js**      | Rendering 3D, stelle, pianeti, costellazioni |
| **OrbitControls** | Navigazione camera                           |
| **CSS2DRenderer** | Etichette e testi nello spazio               |
| **Canvas 2D**     | Vista cielo del pianeta                      |
| **Web Audio API** | Suoni ambientali e feedback tattili          |
| **Python**        | Generazione dati e bundle                    |


---

## Avvio locale

### Metodo rapido (Windows)

Doppio clic su `apri.bat` — avvia un server locale e apre il browser.

### Manuale

```bash
# Con Python installato
python -m http.server 8765

# Poi apri nel browser
http://127.0.0.1:8765/index.html
```

### Build dati (opzionale)

```bash
npm install
npm run build
```

---

## Struttura del progetto

```
3d-globe-stars-threejs-main/
├── index.html              # Interfaccia principale
├── Dotnation.ttf           # Font custom
├── data/                   # Frasi, emozioni, copy
├── js/                     # Moduli (costellazioni, UI, audio…)
├── scripts/                # Script di build
├── apri.bat / apri.ps1     # Avvio rapido
└── Readme.MD
```

---

## Crediti

**Concept, design e sviluppo** — Nicole Somma

**Font** — Dotnation (custom), Andale Mono

**Audio** — `star 1.mp3`, `star2.mp3`

---

*Progetto sviluppato come esperienza interattiva sul tema del sesto senso e del non detto.*