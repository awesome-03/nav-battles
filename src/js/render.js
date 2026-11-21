import { copyFromButton } from "./copy.js";
import { COMMAND_LIMIT } from "./command.js";

const roomCards = document.querySelector("#room-cards");
const cardTemplate = document.querySelector("#room-card");
const noRooms = document.querySelector("#no-rooms");
const statusLine = document.querySelector("#room-list-status");

export function setStatus(text, isError = false){
    statusLine.textContent = text;
    statusLine.classList.toggle("error", isError);
}

function playerCount(room){
    const count = room.players.length;
    return `${count} ${count === 1 ? "player" : "players"}`;
}

function buildCard(room, isCurrent, actions){
    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    card.dataset.id = room.id;

    const select = card.querySelector(".room-select");
    if (isCurrent){
        select.setAttribute("aria-current", "true");
    }
    select.addEventListener("click", () => actions.selectRoom(room.id));

    card.querySelector(".room-card-title").textContent = room.name;
    const description = card.querySelector(".room-card-description");
    description.textContent = room.description;
    description.hidden = room.description === "";
    card.querySelector(".room-card-players").textContent = playerCount(room);

    const copyButton = card.querySelector(".copy");
    if (actions.getCommand(room)?.length > COMMAND_LIMIT){
        copyButton.disabled = true;
        copyButton.title = "Too long for Ranked";
    }
    copyButton.addEventListener("click", () => {
        const command = actions.getCommand(room);
        if (command === null){
            setStatus("Nothing to copy yet.", true);
            return;
        }
        copyFromButton(copyButton, command);
    });
    return card;
}

export function renderRooms(state, actions){
    roomCards.replaceChildren(...state.rooms.map(room => buildCard(room, room.id === state.currentId, actions)));
    noRooms.hidden = state.rooms.length > 0;
}

// Focus the room card on click and creation
export function focusRoom(id){
    const card = roomCards.querySelector(`[data-id="${id}"]`);
    if (!card){
        return;
    }
    card.scrollIntoView({ block: "nearest" });
    card.querySelector(".room-select").focus();
}
