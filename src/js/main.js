import { setupThemeToggle } from "./theme.js";
import { setupNav } from "./nav.js";
import { loadRooms, saveRooms } from "./storage.js";
import { createRoom, startingRooms, readRooms, encodeRoom } from "./rooms.js";
import { loadCommands, buildCommand, onOptimized } from "./command.js";
import { renderRooms, focusRoom, setStatus } from "./render.js";
import { setupImport, openImport, ROOM_IMPORT } from "./import.js";
import { renderRoom, setupViewer } from "./viewer.js";
import { askConfirm } from "./confirm.js";
import { setupExport, openExport } from "./export.js";
import { setupInventory } from "./inventory.js";
import { setupPlayers } from "./players.js";
import { renderLength, setupLength } from "./length.js";

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
        return commands === null ? null : buildCommand(commands, room);
    },
};

// Saves and redraws after any change, keeping a room open if there are any
function update(){
    if (!state.rooms.some(room => room.id === state.currentId)){
        state.currentId = state.rooms[0]?.id ?? null;
    }
    saveRooms(state);
    renderRooms(state, actions);
    renderRoom(currentRoom());
    renderLength(currentRoom(), commands);
}

function currentRoom(){
    return state.rooms.find(room => room.id === state.currentId) ?? null;
}

function addRoom(){
    // New rooms start with an empty inventory
    const room = createRoom(state.rooms, "New Room", "", {});
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

function deleteRoom(){
    const index = state.rooms.findIndex(room => room.id === state.currentId);
    state.rooms.splice(index, 1);
    // The next room down opens, or the one above if it was the last
    state.currentId = state.rooms[Math.min(index, state.rooms.length - 1)]?.id ?? null;
    setStatus("");
    update();
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
setupImport();
setupExport();
setupInventory();
setupLength();
onOptimized(() => {
    renderRooms(state, actions);
    renderLength(currentRoom(), commands);
});
setupViewer({
    renameRoom(name){
        currentRoom().name = name;
        update();
    },
    describeRoom(description){
        currentRoom().description = description;
        update();
    },
    ...setupPlayers(currentRoom, update),
});
update();

document.querySelector("#new-room").addEventListener("click", addRoom);
document.querySelector("#restore-defaults").addEventListener("click", restoreDefaults);
document.querySelector("#import-rooms").addEventListener("click", () => openImport({
    ...ROOM_IMPORT,
    read: text => readRooms(text, state.rooms),
    done: addRooms,
}));
document.querySelector("#export-room").addEventListener("click", async () => {
    const room = currentRoom();
    openExport({
        title: "Export Room",
        message: "Copy room code or save as .txt",
        code: await encodeRoom(room),
        name: room.name,
    });
});
document.querySelector("#delete-room").addEventListener("click", async () => {
    if (await askConfirm(`Delete ${currentRoom().name}?`, "Delete", "Cancel", { danger: true, note: "This action cannot be taken back" })){
        deleteRoom();
    }
});

loadCommands()
    .then(loaded => {
        commands = loaded;
        // Rooms without a kit show the mcfunction's own
        update();
    })
    .catch(err => {
        console.error(err);
        setStatus("Unable to load copy commands", true);
    });
