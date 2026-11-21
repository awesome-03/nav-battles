import { STARTING_ROOMS } from "./templates.js";
import { nbtProblem } from "./kit.js";
import { encodeCode, findCodes, readCode } from "./code.js";

// A room: { id, name, description, kit, players: [{ name, kit }] }
// A kit: { slot: { id, count, nbt? } }, or null to keep the mcfunction's own kit

function newId(){
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// "New Room", then "New Room 2", "New Room 3" etc.
function uniqueName(rooms, name){
    const taken = new Set(rooms.map(room => room.name));
    let candidate = name;
    for (let i = 2; taken.has(candidate); i++){
        candidate = `${name} ${i}`;
    }
    return candidate;
}

export function createRoom(rooms, name = "New Room", description = "", kit = null){
    return { id: newId(), name: uniqueName(rooms, name), description, kit, players: [] };
}

// The rooms for a first visit
export function startingRooms(existing = []){
    const rooms = [];
    for (const template of STARTING_ROOMS){
        rooms.push(createRoom([...existing, ...rooms], template.name, template.description, structuredClone(template.kit)));
    }
    return rooms;
}

// Proper usernames
const PLAYER_NAME = /^[A-Za-z0-9_]{1,16}$/;

export function isPlayerName(name){
    return PLAYER_NAME.test(name);
}

const SLOT = /^(hotbar\.[0-8]|inventory\.(1?[0-9]|2[0-6])|armor\.(head|chest|legs|feet)|weapon\.offhand)$/;

function cleanKit(raw){
    if (!raw || typeof raw !== "object"){
        return null;
    }
    const kit = {};
    for (const [slot, item] of Object.entries(raw)){
        const count = item?.count ?? 1;
        if (SLOT.test(slot) && typeof item?.id === "string" && /^[a-z0-9_]+$/.test(item.id)
            && Number.isInteger(count) && count >= 1 && count <= 64){
            const nbt = typeof item.nbt === "string" && item.nbt !== "" && nbtProblem(item.nbt) === null ? item.nbt : null;
            kit[slot] = nbt ? { id: item.id, count, nbt } : { id: item.id, count };
        }
    }
    return kit;
}

function cleanRoom(raw, rooms){
    if (!raw || typeof raw !== "object"){
        return null;
    }
    const name = typeof raw.name === "string" && raw.name.trim() !== "" ? raw.name.trim() : "Imported Room";
    const players = Array.isArray(raw.players) ? raw.players : [];
    return {
        id: newId(),
        name: uniqueName(rooms, name),
        description: typeof raw.description === "string" ? raw.description : "",
        kit: cleanKit(raw.kit),
        players: players
            .filter(player => isPlayerName(player?.name))
            .map(player => ({ name: player.name, kit: cleanKit(player.kit) })),
    };
}

export function encodeRoom(room){
    return encodeCode({ type: "room", name: room.name, description: room.description, kit: room.kit ?? null, players: room.players });
}

export function encodePlayer(player){
    return encodeCode({ type: "player", name: player.name, kit: player.kit });
}

async function readData(text){
    const data = await readCode(text);
    return data?.nb === 1 ? data : null;
}

export async function readRooms(text, rooms){
    text = text.trim();
    if (text === ""){
        throw new Error("Nothing to import.");
    }
    const data = await readData(text);
    if (data?.type !== "room"){
        throw new Error("Invalid room code or file.");
    }
    return [cleanRoom(data, rooms)];
}

export async function readPlayers(text){
    if (text.trim() === ""){
        throw new Error("Nothing to import.");
    }
    const players = [];
    for (const code of findCodes(text)){
        const data = await readData(code);
        if (data?.type === "player" && (data.name === "" || isPlayerName(data.name))){
            players.push({ name: data.name, kit: cleanKit(data.kit) ?? {} });
        }
    }
    if (players.length === 0){
        throw new Error("Invalid player code or file.");
    }
    return players;
}
