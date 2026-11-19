import { STARTING_ROOMS } from "./templates.js";

// A room: { id, name, description, kit, players: [{ name, kit }] }
// A kit: { slot: { id, count } }, or null to keep the mcfunction's own kit

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

const SLOT = /^(hotbar\.[0-8]|inventory\.(1?[0-9]|2[0-6])|armor\.(head|chest|legs|feet)|weapon\.offhand)$/;

// Only plain item ids and counts get through, since a kit goes straight into the command
function cleanKit(raw){
    if (!raw || typeof raw !== "object"){
        return null;
    }
    const kit = {};
    for (const [slot, item] of Object.entries(raw)){
        const count = item?.count ?? 1;
        if (SLOT.test(slot) && typeof item?.id === "string" && /^[a-z0-9_]+$/.test(item.id)
            && Number.isInteger(count) && count >= 1 && count <= 64){
            kit[slot] = { id: item.id, count };
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
            .filter(player => player && typeof player.name === "string")
            .map(player => ({ name: player.name, kit: cleanKit(player.kit) })),
    };
}

// Codes: "NB1-" + plain base64 of the deflated JSON
async function decodeCode(code){
    const bytes = Uint8Array.from(atob(code.slice(4)), char => char.charCodeAt(0));
    if (code.startsWith("NB0-")){
        return new TextDecoder().decode(bytes);
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Response(stream).text();
}

// Takes a room code or a room file's text
// { "nb": 1, "type": "room", ... } for one room, { "nb": 1, "type": "rooms", "rooms": [...] } for a backup
export async function readRooms(text, rooms){
    text = text.trim();
    if (text === ""){
        throw new Error("Paste a room code, or choose a file first.");
    }
    let data;
    try {
        data = JSON.parse(/^NB[01]-/.test(text) ? await decodeCode(text) : text);
    } catch {
        // broken base64, compression or JSON
        data = null;
    }
    const list = data?.type === "rooms" ? data.rooms : data?.type === "room" ? [data] : null;
    if (data?.nb !== 1 || !Array.isArray(list)){
        throw new Error("Invalid room code or file.");
    }

    const added = [];
    for (const raw of list){
        const room = cleanRoom(raw, [...rooms, ...added]);
        if (room){
            added.push(room);
        }
    }
    if (added.length === 0){
        throw new Error("There are no rooms in that.");
    }
    return added;
}
