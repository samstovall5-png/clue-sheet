// ========= Deck (edit image names later if you want) =========
const DECK = [
  // Suspects
  { id: "sus_green", name: "Green", type: "suspect", img: "assets/cards/green.png" },
  { id: "sus_mustard", name: "Mustard", type: "suspect", img: "assets/cards/mustard.png" },
  { id: "sus_orchid", name: "Orchid", type: "suspect", img: "assets/cards/orchid.png" },
  { id: "sus_peacock", name: "Peacock", type: "suspect", img: "assets/cards/peacock.png" },
  { id: "sus_plum", name: "Plum", type: "suspect", img: "assets/cards/plum.png" },
  { id: "sus_scarlett", name: "Scarlett", type: "suspect", img: "assets/cards/scarlett.png" },

  // Weapons
  { id: "wep_candlestick", name: "Candlestick", type: "weapon", img: "assets/cards/candlestick.png" },
  { id: "wep_dagger", name: "Dagger", type: "weapon", img: "assets/cards/dagger.png" },
  { id: "wep_leadpipe", name: "Lead Pipe", type: "weapon", img: "assets/cards/leadpipe.png" },
  { id: "wep_revolver", name: "Revolver", type: "weapon", img: "assets/cards/revolver.png" },
  { id: "wep_rope", name: "Rope", type: "weapon", img: "assets/cards/rope.png" },
  { id: "wep_wrench", name: "Wrench", type: "weapon", img: "assets/cards/wrench.png" },

  // Rooms
  { id: "room_kitchen", name: "Kitchen", type: "room", img: "assets/cards/kitchen.png" },
  { id: "room_ballroom", name: "Ballroom", type: "room", img: "assets/cards/ballroom.png" },
  { id: "room_conservatory", name: "Conservatory", type: "room", img: "assets/cards/conservatory.png" },
  { id: "room_dining", name: "Dining Room", type: "room", img: "assets/cards/dining.png" },
  { id: "room_billiard", name: "Billiard Room", type: "room", img: "assets/cards/billiard.png" },
  { id: "room_library", name: "Library", type: "room", img: "assets/cards/library.png" },
  { id: "room_lounge", name: "Lounge", type: "room", img: "assets/cards/lounge.png" },
  { id: "room_hall", name: "Hall", type: "room", img: "assets/cards/hall.png" },
  { id: "room_study", name: "Study", type: "room", img: "assets/cards/study.png" },
];

const DEFAULT_PLAYERS = ["Player 1","Player 2","Player 3","Player 4","Player 5"];

const $ = (s) => document.querySelector(s);

// ========= State =========
// cell states: "" | "x" | "check" | "q"
let tab = localStorage.getItem("tab") || "suspect";
let players = JSON.parse(localStorage.getItem("players") || "null") || DEFAULT_PLAYERS;

// Per-card per-player marks
let marks = JSON.parse(localStorage.getItem("marks") || "null") || {}; // marks[cardId][playerIndex] = state
// rows discovered: if we know a card is owned by someone else
let discovered = JSON.parse(localStorage.getItem("discovered") || "null") || {}; // discovered[cardId] = ownerPlayerIndex
// my cards
let myCards = new Set(JSON.parse(localStorage.getItem("myCards") || "[]"));

function saveAll(){
  localStorage.setItem("tab", tab);
  localStorage.setItem("players", JSON.stringify(players));
  localStorage.setItem("marks", JSON.stringify(marks));
  localStorage.setItem("discovered", JSON.stringify(discovered));
  localStorage.setItem("myCards", JSON.stringify([...myCards]));
}

function getCard(id){ return DECK.find(c => c.id === id); }
function isOwned(id){ return myCards.has(id); }

function ensureMarks(cardId){
  if (!marks[cardId]) marks[cardId] = Array(players.length).fill("");
  if (marks[cardId].length !== players.length){
    const old = marks[cardId];
    marks[cardId] = Array(players.length).fill("");
    for (let i=0;i<Math.min(old.length, players.length);i++) marks[cardId][i] = old[i];
  }
}

function cycleState(state){
  // blank -> x -> check -> q -> blank
  if (state === "") return "x";
  if (state === "x") return "check";
  if (state === "check") return "q";
  return "";
}

function renderSheet(){
  const root = $("#sheet");
  root.innerHTML = "";

  // header
  const header = document.createElement("div");
  header.className = "gridHeader";
  header.innerHTML = `
    <div class="hCell name">PLAYERS</div>
    ${players.map(p => `<div class="hCell">${escapeHtml(p)}</div>`).join("")}
  `;
  root.appendChild(header);

  const body = document.createElement("div");
  body.className = "gridBody";

  const cards = DECK.filter(c => c.type === tab);

  for (const card of cards){
    ensureMarks(card.id);

    const row = document.createElement("div");
    row.className = "gridRow" + (discovered[card.id] !== undefined ? " discovered" : "");

    const name = document.createElement("div");
    name.className = "rName";
    name.textContent = card.name;
    row.appendChild(name);

    for (let pi=0; pi<players.length; pi++){
      const cell = document.createElement("div");
      cell.className = "cell";

      const state = marks[card.id][pi] || "";
      const box = document.createElement("div");
      box.className = "box" + (state ? ` ${state}` : "");
      box.textContent = state === "x" ? "X" : state === "check" ? "✔" : state === "q" ? "?" : "";
      cell.appendChild(box);

      const locked = discovered[card.id] !== undefined;
      if (!locked){
        cell.addEventListener("click", () => {
          const cur = marks[card.id][pi] || "";
          const next = cycleState(cur);
          marks[card.id][pi] = next;
          saveAll();
          renderSheet();
        });
      } else {
        cell.style.pointerEvents = "none";
      }

      row.appendChild(cell);
    }

    body.appendChild(row);
  }

  root.appendChild(body);
}

function renderMyCardsBottom(){
  const wrap = $("#myCardsList");
  wrap.innerHTML = "";
  const owned = DECK.filter(c => myCards.has(c.id));
  for (const c of owned){
    const img = document.createElement("img");
    img.className = "myCardImg";
    img.src = c.img;
    img.alt = c.name;
    img.title = c.name;
    wrap.appendChild(img);
  }
}

function setTab(newTab){
  tab = newTab;
  document.querySelectorAll(".tab").forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  saveAll();
  renderSheet();
}

// ========= New Game + My Cards Picker =========
let myCardsTemp = new Set();
let myCardsFilter = "all";

function openMyCardsModal(clearFirst){
  if (clearFirst){
    marks = {};
    discovered = {};
    myCards = new Set();
    saveAll();
  }

  myCardsTemp = new Set(myCards);
  myCardsFilter = "all";
  document.querySelectorAll(".chip").forEach(ch => ch.classList.toggle("active", ch.dataset.filter === "all"));

  buildMyCardsGrid();
  $("#myCardsModal").classList.remove("hidden");
}

function closeMyCardsModal(){
  $("#myCardsModal").classList.add("hidden");
}

function buildMyCardsGrid(){
  const grid = $("#myCardsGrid");
  grid.innerHTML = "";

  const list = (myCardsFilter === "all") ? DECK : DECK.filter(c => c.type === myCardsFilter);

  for (const c of list){
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cardPick" + (myCardsTemp.has(c.id) ? " selected" : "");
    btn.innerHTML = `
      <img src="${c.img}" alt="${escapeAttr(c.name)}">
      <div class="label">${escapeHtml(c.name)}</div>
    `;
    btn.addEventListener("click", ()=>{
      if (myCardsTemp.has(c.id)) myCardsTemp.delete(c.id);
      else myCardsTemp.add(c.id);
      btn.classList.toggle("selected");
    });
    grid.appendChild(btn);
  }
}

// ========= Guess flow =========
let lastGuess = null;

function openGuessModal(){
  const sus = $("#guessSuspect");
  const wep = $("#guessWeapon");
  const room = $("#guessRoom");

  sus.innerHTML = buildOptions("suspect");
  wep.innerHTML = buildOptions("weapon");
  room.innerHTML = buildOptions("room");

  $("#guessModal").classList.remove("hidden");
}
function closeGuessModal(){ $("#guessModal").classList.add("hidden"); }

function buildOptions(type){
  const cards = DECK.filter(c => c.type === type);
  return cards.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
}

function openRevealModal(guessIds){
  lastGuess = guessIds;

  const summary = guessIds.map(id=>{
    const c = getCard(id);
    return `• ${c.name}${isOwned(id) ? " (Owned)" : ""}`;
  }).join("<br>");

  $("#guessSummary").innerHTML = summary;

  const revealPlayer = $("#revealPlayer");
  revealPlayer.innerHTML = `<option value="none">— Select —</option>` + players.map((p,i)=>`<option value="${i}">${escapeHtml(p)}</option>`).join("");

  const revealCard = $("#revealCard");
  revealCard.innerHTML = `<option value="none">— Select —</option>` + guessIds.map(id=>{
    const c = getCard(id);
    const label = `${c.name}${isOwned(id) ? " (Owned)" : ""}`;
    return `<option value="${id}">${escapeHtml(label)}</option>`;
  }).join("");

  $("#revealModal").classList.remove("hidden");
}
function closeRevealModal(){ $("#revealModal").classList.add("hidden"); }

function applyRevealedCard(cardId, ownerIndex){
  ensureMarks(cardId);
  for (let pi=0; pi<players.length; pi++){
    marks[cardId][pi] = (pi === ownerIndex) ? "check" : "x";
  }
  discovered[cardId] = ownerIndex;
}

function applyNoOneShowed(guessIds){
  const notOwned = guessIds.filter(id => !isOwned(id));
  for (const cardId of notOwned){
    ensureMarks(cardId);
    for (let pi=0; pi<players.length; pi++){
      if (!marks[cardId][pi]) marks[cardId][pi] = "x";
    }
  }
}

// ========= Wire UI =========
document.querySelectorAll(".tab").forEach(btn=>{
  btn.addEventListener("click", ()=> setTab(btn.dataset.tab));
});

$("#newGameBtn").addEventListener("click", ()=>{
  openMyCardsModal(true);
});

$("#playersBtn").addEventListener("click", ()=>{
  alert("Players editing isn’t wired yet in this zip build. Tell me and I’ll add rename + player count.");
});
$("#listsBtn").addEventListener("click", ()=>{
  alert("Lists screen isn’t wired yet in this zip build. Tell me and I’ll add it.");
});

$("#guessBtn").addEventListener("click", openGuessModal);
$("#guessClose").addEventListener("click", closeGuessModal);
$("#guessCancel").addEventListener("click", closeGuessModal);

$("#guessContinue").addEventListener("click", ()=>{
  const guessIds = [
    $("#guessSuspect").value,
    $("#guessWeapon").value,
    $("#guessRoom").value
  ];
  closeGuessModal();
  openRevealModal(guessIds);
});

// My cards modal buttons
$("#myCardsClose").addEventListener("click", closeMyCardsModal);
$("#myCardsCancel").addEventListener("click", closeMyCardsModal);
$("#myCardsDone").addEventListener("click", ()=>{
  myCards = new Set(myCardsTemp);
  saveAll();
  closeMyCardsModal();
  renderMyCardsBottom();
  renderSheet();
});

// filter chips
document.querySelectorAll(".chip").forEach(ch=>{
  ch.addEventListener("click", ()=>{
    document.querySelectorAll(".chip").forEach(c=>c.classList.remove("active"));
    ch.classList.add("active");
    myCardsFilter = ch.dataset.filter;
    buildMyCardsGrid();
  });
});

// Reveal modal buttons
$("#revealClose").addEventListener("click", closeRevealModal);

$("#noOneShowed").addEventListener("click", ()=>{
  if (!lastGuess) return;
  applyNoOneShowed(lastGuess);
  saveAll();
  closeRevealModal();
  renderSheet();
});

$("#revealConfirm").addEventListener("click", ()=>{
  const p = $("#revealPlayer").value;
  const cardId = $("#revealCard").value;

  if (p === "none" || cardId === "none"){
    alert("Pick who showed, and which card was shown.");
    return;
  }

  const ownerIndex = Number(p);

  if (isOwned(cardId)){
    alert("That card is marked as Owned by you. Choose a different shown card.");
    return;
  }

  applyRevealedCard(cardId, ownerIndex);
  saveAll();
  closeRevealModal();
  renderSheet();
});

// ========= Helpers =========
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}
function escapeAttr(s){ return escapeHtml(s); }

// ========= Initial render =========
setTab(tab);
renderMyCardsBottom();
renderSheet();
