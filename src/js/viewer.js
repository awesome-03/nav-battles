import { buildInventory, fillSlot, itemLabel, itemName, isShiny, potionName, stackedItems, kitChanges } from "./kit.js";

const roomView = document.querySelector("#room-view");
const nameField = document.querySelector("#room-name");
const descriptionField = document.querySelector("#room-description");
const playerCards = document.querySelector("#player-cards");
const listButton = document.querySelector("#list-view");
const galleryButton = document.querySelector("#gallery-view");
const cardTemplate = document.querySelector("#player-card");
const rowTemplate = document.querySelector("#player-row");

const VIEW_KEY = "nav-battles:players-view";

let view = loadView();
let shown = null;
let actions = null;

function loadView(){
    try {
        return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "gallery";
    } catch {
        // if storage is blocked
        return "gallery";
    }
}

function saveView(){
    try {
        localStorage.setItem(VIEW_KEY, view);
    } catch {
        // if storage is blocked
    }
}

function playerList(){
    const { room } = shown;
    const roomKit = room.kit ?? {};
    return [
        { index: -1, name: "Default", kit: roomKit, isDefault: true },
        ...room.players.map((player, index) => ({ index, name: player.name, kit: player.kit ?? roomKit, ownKit: player.kit !== null, roomKit })),
    ];
}

function badge(text, kind){
    const element = document.createElement("span");
    element.className = `badge badge-${kind}`;
    element.textContent = text;
    return element;
}

// "+1 Oak Planks", "−12 Bread", "+1 Enchanted Golden Boots", "+1 Fire Resistance"
function changeText({ id, nbt, difference }){
    const name = !nbt ? itemName(id) : potionName({ id, nbt }, true) ?? (isShiny({ id, nbt }) ? `Enchanted ${itemName(id)}` : `${itemName(id)} (NBT)`);
    return `${difference > 0 ? "+" : "−"}${Math.abs(difference)} ${name}`;
}

function summaryBadge(count){
    return badge(count === 1 ? "1 item changed" : `${count} items changed`, "changed");
}

// Up to three changed items (added green, removed red), "N items changed" for more
function buildBadges(player){
    if (!player.ownKit){
        return [];
    }
    const { changes, moved } = kitChanges(player.kit, player.roomKit);
    if (changes.length === 0){
        return moved ? [badge("Changed Order", "changed")] : [];
    }
    if (changes.length > 3){
        return [summaryBadge(changes.length)];
    }
    return changes.map(change => badge(changeText(change), change.difference > 0 ? "added" : "removed"));
}

function badgesWidth(badges){
    return badges.lastElementChild.getBoundingClientRect().right - badges.firstElementChild.getBoundingClientRect().left;
}

function fitBadges(elements){
    const tight = elements.map(element => {
        const name = element.querySelector(".player-name");
        const badges = element.querySelector(".player-badges");
        const count = badges.querySelectorAll(".badge-added, .badge-removed").length;
        if (count === 0){
            return null;
        }
        const width = badgesWidth(badges);
        return name.scrollWidth > name.clientWidth || width > badges.clientWidth + 0.5 ? { badges, count, width, changes: [...badges.children] } : null;
    }).filter(Boolean);
    for (const fit of tight){
        fit.badges.replaceChildren(summaryBadge(fit.count));
    }
    const wider = tight.filter(fit => badgesWidth(fit.badges) >= fit.width);
    for (const fit of wider){
        fit.badges.replaceChildren(...fit.changes);
    }
}

function fillHead(element, player){
    element.querySelector(".player-name").textContent = player.name;
    const badges = element.querySelector(".player-badges");
    badges.replaceChildren(...buildBadges(player));
    if (player.ownKit){
        badges.title = kitChanges(player.kit, player.roomKit).changes.map(changeText).join("\n");
    }
    element.querySelector(".player-open").addEventListener("click", () => actions.openPlayer(player.index));
}

function buildCard(player){
    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    fillHead(card, player);
    card.querySelector(".player-open").append(buildInventory(player.kit));
    return card;
}

function buildRow(player){
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    fillHead(row, player);
    const items = stackedItems(player.kit).map(item => {
        const square = document.createElement("span");
        square.className = "slot";
        square.title = itemLabel(item);
        fillSlot(square, item);
        return square;
    });
    row.querySelector(".player-items").replaceChildren(...items);
    return row;
}

function renderPlayers(){
    playerCards.classList.toggle("list", view === "list");
    listButton.setAttribute("aria-pressed", view === "list");
    galleryButton.setAttribute("aria-pressed", view === "gallery");
    const elements = playerList().map(view === "list" ? buildRow : buildCard);
    playerCards.replaceChildren(...elements);
    fitBadges(elements);
}

export function renderRoom(room){
    roomView.hidden = !room;
    if (!room){
        shown = null;
        return;
    }
    shown = { room };
    // Not while someone is typing in them
    if (document.activeElement !== nameField){
        nameField.value = room.name;
    }
    if (document.activeElement !== descriptionField){
        descriptionField.value = room.description;
    }
    renderPlayers();
}

function setupEditField(field, save){
    let before = "";
    field.addEventListener("focus", () => {
        before = field.value;
    });
    field.addEventListener("keydown", event => {
        if (event.key === "Enter"){
            field.blur();
        } else if (event.key === "Escape"){
            field.value = before;
            field.blur();
        }
    });
    field.addEventListener("blur", () => {
        if (field.value !== before){
            save(field.value.trim(), before);
        }
    });
}

export function setupViewer(viewerActions){
    actions = viewerActions;

    setupEditField(nameField, (name, before) => {
        // A room always keeps a name
        nameField.value = name || before;
        actions.renameRoom(nameField.value);
    });
    setupEditField(descriptionField, description => {
        descriptionField.value = description;
        actions.describeRoom(description);
    });

    listButton.addEventListener("click", () => {
        view = "list";
        saveView();
        renderPlayers();
    });
    galleryButton.addEventListener("click", () => {
        view = "gallery";
        saveView();
        renderPlayers();
    });
    document.querySelector("#new-player").addEventListener("click", () => actions.newPlayer());
    document.querySelector("#import-players").addEventListener("click", () => actions.importPlayer());

    document.fonts.ready.then(() => shown && renderPlayers());
    let width = 0;
    new ResizeObserver(([entry]) => {
        if (shown && entry.contentRect.width !== width){
            width = entry.contentRect.width;
            renderPlayers();
        }
    }).observe(playerCards.parentElement);
}
