import { ITEM_ICONS } from "./items.js";
import { SLOTS } from "./kit.js";

const ITEM_IDS = Object.keys(ITEM_ICONS);
const SLOT_NAMES = SLOTS.map(({ slot }) => slot);
const HAS_COUNT = 0x40;
const HAS_NBT = 0x80;
const ROOM = 0;
const PLAYER = 1;

function writer(){
    const bytes = [];
    const varint = n => {
        while (n >= 128){
            bytes.push(n % 128 + 128);
            n = Math.floor(n / 128);
        }
        bytes.push(n);
    };
    return {
        bytes,
        varint,
        byte: b => bytes.push(b),
        text(s){
            const encoded = new TextEncoder().encode(s);
            varint(encoded.length);
            bytes.push(...encoded);
        },
    };
}

function reader(bytes){
    let at = 0;
    const byte = () => {
        if (at >= bytes.length){
            throw new Error("The code ends too early.");
        }
        return bytes[at++];
    };
    const varint = () => {
        let n = 0;
        for (let scale = 1; ; scale *= 128){
            const b = byte();
            n += (b % 128) * scale;
            if (b < 128){
                return n;
            }
        }
    };
    return {
        byte,
        varint,
        text(){
            const length = varint();
            if (at + length > bytes.length){
                throw new Error("The code ends too early.");
            }
            at += length;
            return new TextDecoder().decode(bytes.slice(at - length, at));
        },
    };
}

function writeKit(out, kit){
    const entries = Object.entries(kit);
    out.varint(entries.length);
    for (const [slot, item] of entries){
        out.byte(SLOT_NAMES.indexOf(slot) | (item.count !== 1 ? HAS_COUNT : 0) | (item.nbt ? HAS_NBT : 0));
        const number = ITEM_ICONS[item.id];
        if (number === undefined){
            out.varint(ITEM_IDS.length);
            out.text(item.id);
        } else {
            out.varint(number);
        }
        if (item.count !== 1){
            out.byte(item.count);
        }
        if (item.nbt){
            out.text(item.nbt);
        }
    }
}

function readKit(input){
    const kit = {};
    const entries = input.varint();
    for (let i = 0; i < entries; i++){
        const head = input.byte();
        const number = input.varint();
        const id = number === ITEM_IDS.length ? input.text() : ITEM_IDS[number];
        const item = { id, count: head & HAS_COUNT ? input.byte() : 1 };
        if (head & HAS_NBT){
            item.nbt = input.text();
        }
        const slot = SLOT_NAMES[head & 0x3f];
        if (slot && id){
            kit[slot] = item;
        }
    }
    return kit;
}

function writeOptionalKit(out, kit){
    out.byte(kit ? 1 : 0);
    if (kit){
        writeKit(out, kit);
    }
}

function toBase64(bytes){
    let binary = "";
    for (const byte of bytes){
        binary += String.fromCharCode(byte);
    }
    return btoa(binary).replace(/=+$/, "");
}

async function squeeze(bytes, format){
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream(format));
    return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function unsqueeze(bytes){
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
}

// data: { type: "room", name, description, kit, players } or { type: "player", name, kit }
export async function encodeCode(data){
    const out = writer();
    if (data.type === "room"){
        out.byte(ROOM);
        out.text(data.name);
        out.text(data.description);
        writeOptionalKit(out, data.kit);
        out.varint(data.players.length);
        for (const player of data.players){
            out.text(player.name);
            writeOptionalKit(out, player.kit);
        }
    } else {
        out.byte(PLAYER);
        out.text(data.name);
        writeKit(out, data.kit);
    }
    const raw = new Uint8Array(out.bytes);
    let packed = null;
    try {
        packed = await squeeze(raw, "deflate-raw");
    } catch {
        // no compression in this browser
    }
    const payload = packed && packed.length < raw.length ? [1, ...packed] : [0, ...raw];
    return `NB1-${toBase64(payload)}`;
}

function decodeBinary(bytes){
    const input = reader(bytes);
    const type = input.byte();
    if (type === ROOM){
        const room = { nb: 1, type: "room", name: input.text(), description: input.text() };
        room.kit = input.byte() ? readKit(input) : null;
        room.players = [];
        const count = input.varint();
        for (let i = 0; i < count; i++){
            const name = input.text();
            room.players.push({ name, kit: input.byte() ? readKit(input) : null });
        }
        return room;
    }
    if (type === PLAYER){
        return { nb: 1, type: "player", name: input.text(), kit: readKit(input) };
    }
    throw new Error("Unknown code type.");
}

// Multiple codes at once
export function findCodes(text){
    return text.match(/NB1-(?:(?!NB1-)[A-Za-z0-9+/])+/g) ?? [];
}

export async function readCode(text){
    if (!text.startsWith("NB1-")){
        return null;
    }
    try {
        const bytes = Uint8Array.from(atob(text.slice(4)), char => char.charCodeAt(0));
        return decodeBinary(bytes[0] === 1 ? await unsqueeze(bytes.slice(1)) : bytes.slice(1));
    } catch {
        return null;
    }
}
