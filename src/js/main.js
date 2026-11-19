import { setupThemeToggle } from "./theme.js";
import { setupNav } from "./nav.js";
import { loadRooms, saveRooms } from "./storage.js";
import { createRoom, startingRooms } from "./rooms.js";
import { loadCommands, buildCommand } from "./command.js";
import { renderRooms, focusRoom, setStatus } from "./render.js";
import { setupImport } from "./import.js";

const state = loadRooms() ?? { rooms: startingRooms(), currentId: null };
let commands = null;

const actions = {
    selectRoom(id){
        state.currentId = id;
        setStatus("");
        update();
        focusRoom(id);
    },
    getCommand(room){
        return commands === null ? null : buildCommand(commands, room.kit);
    },
};

// Saves and redraws after any change, keeping a room open if there are any
function update(){
    if (!state.rooms.some(room => room.id === state.currentId)){
        state.currentId = state.rooms[0]?.id ?? null;
    }
    saveRooms(state);
    renderRooms(state, actions);
}

function addRoom(){
    const room = createRoom(state.rooms);
    state.rooms.push(room);
    state.currentId = room.id;
    setStatus("");
    update();
    focusRoom(room.id);
}

// Brings back the starting rooms, keeps existing rooms if any
function restoreDefaults(){
    const restored = startingRooms(state.rooms);
    state.rooms.push(...restored);
    state.currentId = restored[0].id;
    setStatus("");
    update();
    focusRoom(restored[0].id);
}

function addRooms(added){
    state.rooms.push(...added);
    state.currentId = added[0].id;
    update();
    focusRoom(added[0].id);
    setStatus(`Imported ${added.length} ${added.length === 1 ? "room" : "rooms"}.`);
}

setupThemeToggle();
setupNav();
setupImport(state, addRooms);
update();

document.querySelector("#new-room").addEventListener("click", addRoom);
document.querySelector("#restore-defaults").addEventListener("click", restoreDefaults);

loadCommands()
    .then(loaded => {
        commands = loaded;
    })
    .catch(err => {
        console.error(err);
        setStatus("Couldn't load the commands, so copying won't work.", true);
    });
