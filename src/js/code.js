import { ITEM_ICONS } from "./items.js";

const PREFIX = "NB1";
const ROOM = "R";
const PLAYER = "P";
const SLASH = "/";
const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const DIGIT_VALUES = new Map([...DIGITS].map((digit, i) => [digit, BigInt(i)]));
const BASE = BigInt(DIGITS.length);
const NAME_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789_ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER_NAME = 37;
const CAPITALS = 26;
const TEXT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 _";
const LOWER_CHARS = "abcdefghijklmnopqrstuvwxyz ,.'-";
const SLOT_IDS = [
    ...Array.from({ length: 9 }, (_, i) => `hotbar.${i}`),
    ...Array.from({ length: 27 }, (_, i) => `inventory.${i}`),
    "armor.head", "armor.chest", "armor.legs", "armor.feet", "weapon.offhand",
];
const HOTBAR = SLOT_IDS.slice(0, 9);
const ORDERS = 362880;
const ITEM_IDS = Object.keys(ITEM_ICONS);
const UNKNOWN_ITEM = 1023;
const COMMON_ITEMS = [
    "iron_pickaxe", "iron_axe", "iron_shovel", "iron_sword", "oak_boat", "soul_sand", "gravel", "obsidian",
    "crying_obsidian", "ender_pearl", "ender_eye", "bread", "golden_carrot", "cooked_porkchop", "golden_helmet", "golden_chestplate",
    "golden_leggings", "golden_boots", "fire_charge", "flint_and_steel", "white_bed", "bow", "arrow", "glowstone",
    "lava_bucket", "water_bucket", "potion", "nether_bricks", "oak_planks", "stick", "respawn_anchor", "cobblestone",
];
const ENCHANTMENTS = [
    "protection", "fire_protection", "feather_falling", "blast_protection", "projectile_protection", "respiration",
    "aqua_affinity", "thorns", "depth_strider", "frost_walker", "binding_curse", "soul_speed", "sharpness", "smite",
    "bane_of_arthropods", "knockback", "fire_aspect", "looting", "sweeping", "efficiency", "silk_touch", "unbreaking",
    "fortune", "power", "punch", "flame", "infinity", "luck_of_the_sea", "lure", "loyalty", "impaling", "riptide",
    "channeling", "multishot", "quick_charge", "piercing", "mending", "vanishing_curse",
];
const POTIONS = [
    "empty", "water", "mundane", "thick", "awkward", "night_vision", "long_night_vision", "invisibility",
    "long_invisibility", "leaping", "long_leaping", "strong_leaping", "fire_resistance", "long_fire_resistance",
    "swiftness", "long_swiftness", "strong_swiftness", "slowness", "long_slowness", "strong_slowness", "turtle_master",
    "long_turtle_master", "strong_turtle_master", "water_breathing", "long_water_breathing", "healing", "strong_healing",
    "harming", "strong_harming", "poison", "long_poison", "strong_poison", "regeneration", "long_regeneration",
    "strong_regeneration", "strength", "long_strength", "strong_strength", "weakness", "long_weakness", "luck",
    "slow_falling", "long_slow_falling",
];
const BASES = [
    {},
    {
        "hotbar.0": { id: "iron_pickaxe", count: 1 },
        "hotbar.1": { id: "soul_sand", count: 64 },
        "hotbar.2": { id: "gravel", count: 64 },
        "hotbar.3": { id: "ender_eye", count: 12 },
        "weapon.offhand": { id: "bread", count: 12 },
    },
    {
        "hotbar.0": { id: "iron_axe", count: 1 },
        "hotbar.1": { id: "iron_pickaxe", count: 1 },
        "hotbar.2": { id: "iron_shovel", count: 1 },
        "hotbar.3": { id: "oak_boat", count: 1 },
        "hotbar.4": { id: "soul_sand", count: 64 },
        "hotbar.5": { id: "gravel", count: 44 },
        "hotbar.6": { id: "obsidian", count: 3 },
        "hotbar.7": { id: "ender_pearl", count: 16 },
        "hotbar.8": { id: "ender_eye", count: 12 },
        "weapon.offhand": { id: "bread", count: 4 },
        "armor.head": { id: "golden_helmet", count: 1 },
        "armor.chest": { id: "golden_chestplate", count: 1 },
        "armor.feet": { id: "golden_boots", count: 1, nbt: '{Enchantments:[{id:"soul_speed",lvl:3}]}' },
        "inventory.0": { id: "fire_charge", count: 23 },
        "inventory.1": { id: "white_bed", count: 1 },
        "inventory.2": { id: "white_bed", count: 1 },
        "inventory.3": { id: "white_bed", count: 1 },
        "inventory.4": { id: "white_bed", count: 1 },
        "inventory.5": { id: "white_bed", count: 1 },
        "inventory.6": { id: "white_bed", count: 1 },
        "inventory.7": { id: "bow", count: 1 },
        "inventory.8": { id: "glowstone", count: 3 },
        "inventory.9": { id: "arrow", count: 43 },
        "inventory.10": { id: "lava_bucket", count: 1 },
        "inventory.11": { id: "nether_bricks", count: 38 },
        "inventory.12": { id: "gravel", count: 45 },
        "inventory.13": { id: "oak_planks", count: 7 },
        "inventory.14": { id: "crying_obsidian", count: 6 },
        "inventory.15": { id: "soul_sand", count: 52 },
        "inventory.16": { id: "stick", count: 4 },
        "inventory.17": { id: "respawn_anchor", count: 2 },
    },
];

function bitWidth(n){
    let width = 0;
    while (n >= 2 ** width){
        width++;
    }
    return width;
}

function writer(){
    const bits = [];
    const out = {
        bits,
        write(value, width){
            for (let i = width - 1; i >= 0; i--){
                bits.push(Math.floor(value / 2 ** i) % 2);
            }
        },
        big(value, width){
            for (const char of value.toString(2).padStart(width, "0")){
                bits.push(Number(char));
            }
        },
        // 0 is "1", 1-2 are "01x", 3-6 are "001xx" and so on
        number(n){
            const width = bitWidth(n + 1);
            out.write(0, width - 1);
            out.write(n + 1, width);
        },
    };
    return out;
}

function reader(bits){
    let at = 0;
    const bit = () => {
        if (at >= bits.length){
            throw new Error("The code ends too early.");
        }
        return bits[at++];
    };
    const input = {
        read(width){
            let value = 0;
            for (let i = 0; i < width; i++){
                value = value * 2 + bit();
            }
            return value;
        },
        big(width){
            let value = 0n;
            for (let i = 0; i < width; i++){
                value = value * 2n + BigInt(bit());
            }
            return value;
        },
        number(){
            let width = 1;
            while (bit() === 0){
                width++;
                if (width > 32){
                    throw new Error("Invalid code.");
                }
            }
            return 2 ** (width - 1) + input.read(width - 1) - 1;
        },
        done: () => at === bits.length,
    };
    return input;
}

function shortest(tries){
    return tries.reduce((best, bits) => bits.length < best.length ? bits : best);
}

function packedLimit(radices){
    return radices.reduce((product, radix) => product * BigInt(radix), 1n);
}

function writePacked(out, values, radices){
    out.big(values.reduce((n, value, i) => n * BigInt(radices[i]) + BigInt(value), 0n), (packedLimit(radices) - 1n).toString(2).length);
}

function readPacked(input, radices){
    let n = input.big((packedLimit(radices) - 1n).toString(2).length);
    if (n >= packedLimit(radices)){
        throw new Error("Invalid code.");
    }
    const values = [];
    for (let i = radices.length - 1; i >= 0; i--){
        values.unshift(Number(n % BigInt(radices[i])));
        n /= BigInt(radices[i]);
    }
    return values;
}

function sameItem(a, b){
    return a?.id === b?.id && a?.count === b?.count && (a?.nbt ?? "") === (b?.nbt ?? "");
}

function writeText(out, text){
    const chars = [...text];
    const ascii = chars.every(char => char.codePointAt(0) < 128);
    const tries = [];
    const attempt = (mode, width, length, write) => {
        const trial = writer();
        trial.write(mode, width);
        trial.number(length);
        write(trial);
        tries.push(trial.bits);
    };
    if (chars.every(char => TEXT_CHARS.includes(char))){
        attempt(0b0, 1, chars.length, trial => chars.forEach(char => trial.write(TEXT_CHARS.indexOf(char), 6)));
    }
    if (ascii){
        attempt(0b10, 2, chars.length, trial => chars.forEach(char => trial.write(char.codePointAt(0), 7)));
        attempt(0b110, 3, chars.length, trial => chars.forEach(char => {
            const index = LOWER_CHARS.indexOf(char);
            trial.write(index === -1 ? LOWER_CHARS.length : index, 5);
            if (index === -1){
                trial.write(char.codePointAt(0), 7);
            }
        }));
    }
    const bytes = new TextEncoder().encode(text);
    attempt(0b111, 3, bytes.length, trial => bytes.forEach(byte => trial.write(byte, 8)));
    out.bits.push(...shortest(tries));
}

function readText(input){
    if (input.read(1) === 0){
        return Array.from({ length: input.number() }, () => TEXT_CHARS[input.read(6)]).join("");
    }
    if (input.read(1) === 0){
        return Array.from({ length: input.number() }, () => String.fromCharCode(input.read(7))).join("");
    }
    if (input.read(1) === 0){
        return Array.from({ length: input.number() }, () => {
            const index = input.read(5);
            return index < LOWER_CHARS.length ? LOWER_CHARS[index] : String.fromCharCode(input.read(7));
        }).join("");
    }
    return new TextDecoder().decode(Uint8Array.from({ length: input.number() }, () => input.read(8)));
}

function writeName(out, name){
    if (!/^[A-Za-z0-9_]{1,16}$/.test(name)){
        throw new Error("Invalid username");
    }
    const values = [...name].map(char => NAME_CHARS.indexOf(char));
    const lowerAfter = values.slice(1).every(value => value < LOWER_NAME);
    let radices = values.map(() => NAME_CHARS.length);
    if (lowerAfter && values[0] < LOWER_NAME){
        out.write(0, 1);
        radices = values.map(() => LOWER_NAME);
    } else if (lowerAfter){
        out.write(0b10, 2);
        values[0] -= LOWER_NAME;
        radices = [CAPITALS, ...values.slice(1).map(() => LOWER_NAME)];
    } else {
        out.write(0b11, 2);
    }
    out.write(name.length - 1, 4);
    writePacked(out, values, radices);
}

function readName(input){
    const mode = input.read(1) === 0 ? 0 : input.read(1) + 1;
    const length = input.read(4) + 1;
    const lower = Array.from({ length }, () => LOWER_NAME);
    const radices = mode === 0 ? lower : mode === 1 ? [CAPITALS, ...lower.slice(1)] : lower.map(() => NAME_CHARS.length);
    const values = readPacked(input, radices);
    if (mode === 1){
        values[0] += LOWER_NAME;
    }
    return values.map(value => NAME_CHARS[value]).join("");
}

function enchantmentsOf(nbt){
    const match = nbt.match(/^\{(Stored)?Enchantments:\[(.*)\]\}$/);
    if (!match){
        return null;
    }
    const list = match[2].split("},{").map(part => part.replace(/^\{|\}$/g, "").match(/^id:"([a-z_]+)",lvl:([1-9]\d*)$/));
    if (list.some(part => !part || !ENCHANTMENTS.includes(part[1]))){
        return null;
    }
    const enchantments = { stored: Boolean(match[1]), list: list.map(([, id, level]) => ({ id, level: Number(level) })) };
    return enchantmentsText(enchantments) === nbt ? enchantments : null;
}

function enchantmentsText({ stored, list }){
    return `{${stored ? "Stored" : ""}Enchantments:[${list.map(({ id, level }) => `{id:"${id}",lvl:${level}}`).join(",")}]}`;
}

function writeNbt(out, nbt){
    if (nbt === ""){
        out.write(0, 1);
        return;
    }
    out.write(1, 1);
    const potion = nbt.match(/^\{Potion:"([a-z_]+)"\}$/)?.[1];
    const enchantments = enchantmentsOf(nbt);
    if (POTIONS.includes(potion)){
        out.write(0, 1);
        out.write(POTIONS.indexOf(potion), 6);
    } else if (enchantments){
        out.write(0b10, 2);
        out.write(enchantments.stored ? 1 : 0, 1);
        out.number(enchantments.list.length - 1);
        for (const { id, level } of enchantments.list){
            out.write(ENCHANTMENTS.indexOf(id), 6);
            out.number(level - 1);
        }
    } else {
        out.write(0b11, 2);
        writeText(out, nbt);
    }
}

function readNbt(input){
    const known = (list, index) => {
        if (list[index] === undefined){
            throw new Error("Invalid code.");
        }
        return list[index];
    };
    if (input.read(1) === 0){
        return "";
    }
    if (input.read(1) === 0){
        return `{Potion:"${known(POTIONS, input.read(6))}"}`;
    }
    if (input.read(1) === 0){
        const stored = input.read(1) === 1;
        const list = Array.from({ length: input.number() + 1 }, () => ({ id: known(ENCHANTMENTS, input.read(6)), level: input.number() + 1 }));
        return enchantmentsText({ stored, list });
    }
    return readText(input);
}

function writeItem(out, item){
    const common = COMMON_ITEMS.indexOf(item.id);
    if (common !== -1){
        out.write(1, 1);
        out.write(common, 5);
    } else {
        out.write(0, 1);
        out.write(ITEM_ICONS[item.id] ?? UNKNOWN_ITEM, 10);
        if (ITEM_ICONS[item.id] === undefined){
            writeText(out, item.id);
        }
    }
    if (item.count === 1){
        out.write(0, 1);
    } else if (item.count === 64){
        out.write(0b10, 2);
    } else if (item.count === 16){
        out.write(0b110, 3);
    } else {
        out.write(0b111, 3);
        out.write(item.count - 1, 6);
    }
    writeNbt(out, item.nbt ?? "");
}


function readItem(input){
    let id = input.read(1) === 1 ? COMMON_ITEMS[input.read(5)] : input.read(10);
    if (typeof id === "number"){
        id = id === UNKNOWN_ITEM ? readText(input) : ITEM_IDS[id];
    }
    let count = 1;
    if (input.read(1) === 1){
        count = input.read(1) === 0 ? 64 : input.read(1) === 0 ? 16 : input.read(6) + 1;
    }
    const nbt = readNbt(input);
    if (!id){
        throw new Error("Unknown item.");
    }
    return nbt ? { id, count, nbt } : { id, count };
}

function writeChanges(out, kit, base){
    const baseSlots = SLOT_IDS.filter(slot => base[slot]);
    const width = bitWidth(baseSlots.length - 1);
    const changed = SLOT_IDS.filter(slot => !sameItem(kit[slot], base[slot]));
    out.number(changed.length);
    let last = -1;
    for (const slot of changed){
        const index = SLOT_IDS.indexOf(slot);
        out.number(index - last - 1);
        last = index;
        const item = kit[slot];
        const from = item ? baseSlots.findIndex(other => sameItem(base[other], item)) : -1;
        if (baseSlots.length === 0){
            writeItem(out, item);
        } else if (from !== -1){
            out.write(0, 1);
            out.write(from, width);
        } else if (item){
            out.write(0b10, 2);
            writeItem(out, item);
        } else {
            out.write(0b11, 2);
        }
    }
}

function readChanges(input, base){
    const kit = { ...base };
    const baseSlots = SLOT_IDS.filter(slot => base[slot]);
    const width = bitWidth(baseSlots.length - 1);
    let index = -1;
    for (let changes = input.number(); changes > 0; changes--){
        index += input.number() + 1;
        const slot = SLOT_IDS[index];
        if (!slot){
            throw new Error("Invalid slot.");
        }
        if (baseSlots.length === 0 || input.read(1) === 1){
            if (baseSlots.length === 0 || input.read(1) === 0){
                kit[slot] = readItem(input);
            } else {
                delete kit[slot];
            }
        } else {
            const from = baseSlots[input.read(width)];
            if (!from){
                throw new Error("Invalid slot.");
            }
            kit[slot] = base[from];
        }
    }
    return kit;
}

function reorder(base, order){
    const kit = { ...base };
    HOTBAR.forEach((slot, i) => {
        const item = base[HOTBAR[order[i]]];
        if (item){
            kit[slot] = item;
        } else {
            delete kit[slot];
        }
    });
    return kit;
}

function hotbarOrder(kit, base){
    const order = HOTBAR.map((slot, i) => sameItem(kit[slot], base[slot]) ? i : -1);
    const free = HOTBAR.map((_, i) => i).filter(i => !order.includes(i));
    HOTBAR.forEach((slot, i) => {
        const j = order[i] === -1 ? free.find(other => sameItem(kit[slot], base[HOTBAR[other]])) : undefined;
        if (j !== undefined){
            order[i] = j;
            free.splice(free.indexOf(j), 1);
        }
    });
    return order.map(j => j === -1 ? free.shift() : j);
}

function orderNumber(order){
    const left = HOTBAR.map((_, i) => i);
    return order.reduce((n, j, i) => {
        const k = left.indexOf(j);
        left.splice(k, 1);
        return n * (HOTBAR.length - i) + k;
    }, 0);
}

function numberOrder(n){
    const picks = [];
    for (let radix = 1; radix <= HOTBAR.length; radix++){
        picks.unshift(n % radix);
        n = Math.floor(n / radix);
    }
    const left = HOTBAR.map((_, i) => i);
    return picks.map(k => left.splice(k, 1)[0]);
}

function writeKit(out, kit, base){
    const plain = writer();
    plain.write(0, 1);
    writeChanges(plain, kit, base);
    const tries = [plain.bits];
    const order = hotbarOrder(kit, base);
    if (order.some((j, i) => j !== i)){
        const moved = writer();
        moved.write(1, 1);
        moved.write(orderNumber(order), 19);
        writeChanges(moved, kit, reorder(base, order));
        tries.push(moved.bits);
    }
    out.bits.push(...shortest(tries));
}

function readKit(input, base){
    if (input.read(1) === 1){
        const n = input.read(19);
        if (n >= ORDERS){
            throw new Error("Invalid code.");
        }
        base = reorder(base, numberOrder(n));
    }
    return readChanges(input, base);
}

function writeOwnKit(out, kit){
    const tries = BASES.map((base, index) => {
        const trial = writer();
        trial.write(index, 2);
        writeKit(trial, kit, base);
        return trial.bits;
    });
    out.bits.push(...shortest(tries));
}

function readOwnKit(input){
    const base = BASES[input.read(2)];
    if (!base){
        throw new Error("Invalid code.");
    }
    return readKit(input, base);
}

function toDigits(bits){
    // a leading 1 keeps leading zeros
    let n = BigInt(`0b1${bits.join("")}`);
    const digits = [];
    while (n > 0n){
        digits.push(DIGITS[Number(n % BASE)]);
        n /= BASE;
    }
    return digits.reverse().join("");
}

function fromDigits(text){
    let n = 0n;
    for (const char of text){
        const value = DIGIT_VALUES.get(char);
        if (value === undefined){
            throw new Error("Invalid code.");
        }
        n = n * BASE + value;
    }
    return [...n.toString(2).slice(1)].map(Number);
}

export async function encodeCode(data){
    const out = writer();
    if (data.type === "room"){
        const kit = data.kit ?? {};
        writeText(out, data.name);
        writeText(out, data.description);
        writeOwnKit(out, kit);
        out.number(data.players.length);
        data.players.forEach((player, i) => {
            writeName(out, player.name);
            if (!player.kit){
                out.write(0, 1);
                return;
            }
            const bases = [kit, ...data.players.slice(0, i).map(other => other.kit ?? kit)];
            const tries = bases.map((base, j) => {
                const trial = writer();
                trial.write(j === 0 ? 0b10 : 0b11, 2);
                if (j > 0){
                    trial.write(j - 1, bitWidth(i - 1));
                }
                writeKit(trial, player.kit, base);
                return trial.bits;
            });
            out.bits.push(...shortest(tries));
        });
    } else if (data.name === ""){
        out.write(1, 1);
        writeOwnKit(out, data.kit);
    } else {
        out.write(0, 1);
        writeName(out, data.name);
        writeOwnKit(out, data.kit);
    }
    return PREFIX + (data.type === "room" ? ROOM : PLAYER) + SLASH + toDigits(out.bits);
}

function decode(code){
    const type = code.slice(PREFIX.length, PREFIX.length + 1);
    const start = PREFIX.length + 1 + SLASH.length;
    if (!code.startsWith(PREFIX) || ![ROOM, PLAYER].includes(type) || code.slice(start - SLASH.length, start) !== SLASH || code.length === start){
        return null;
    }
    try {
        const input = reader(fromDigits(code.slice(start)));
        let data;
        if (type === ROOM){
            data = { nb: 1, type: "room", name: readText(input), description: readText(input), kit: readOwnKit(input), players: [] };
            for (let count = input.number(); count > 0; count--){
                const name = readName(input);
                let kit = null;
                if (input.read(1) === 1){
                    const i = data.players.length;
                    const other = input.read(1) === 1 ? data.players[input.read(bitWidth(i - 1))] : { kit: data.kit };
                    if (!other){
                        throw new Error("Invalid code.");
                    }
                    kit = readKit(input, other.kit ?? data.kit);
                }
                data.players.push({ name, kit });
            }
        } else if (input.read(1) === 1){
            data = { nb: 1, type: "player", name: "", kit: readOwnKit(input) };
        } else {
            data = { nb: 1, type: "player", name: readName(input), kit: readOwnKit(input) };
        }
        // anything left over means it isn't a whole code
        return input.done() ? data : null;
    } catch {
        // not a code
        return null;
    }
}

export function findCodes(text){
    const start = `${PREFIX}[${ROOM}${PLAYER}]${SLASH}`;
    return text.match(new RegExp(`${start}(?:(?!${start})[0-9A-Za-z])+`, "g")) ?? [];
}

export async function readCode(text){
    return decode(text);
}
