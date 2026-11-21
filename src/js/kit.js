import { ITEM_ICONS, ICON_COLUMNS, ICON_GAP, ICON_SIZE, ITEM_NAMES, STACK_SIZES, GLINT_ITEMS, DARK_ITEMS } from "./items.js";

const ICON_ROWS = Math.ceil(Object.keys(ITEM_ICONS).length / ICON_COLUMNS);

export const SLOTS = [
    { slot: "armor.head", label: "Helmet", row: 1, column: 1 },
    { slot: "armor.chest", label: "Chestplate", row: 2, column: 1 },
    { slot: "armor.legs", label: "Leggings", row: 3, column: 1 },
    { slot: "armor.feet", label: "Boots", row: 5, column: 1 },
    { slot: "weapon.offhand", label: "Offhand", row: 5, column: 3 },
    ...Array.from({ length: 27 }, (_, i) => ({ slot: `inventory.${i}`, label: `Slot ${i + 1}`, row: 1 + Math.floor(i / 9), column: 5 + i % 9 })),
    ...Array.from({ length: 9 }, (_, i) => ({ slot: `hotbar.${i}`, label: `Hotbar ${i + 1}`, row: 5, column: 5 + i })),
];

export const SLOT_ORDER = [
    ...SLOTS.filter(({ slot }) => slot.startsWith("hotbar.")),
    ...SLOTS.filter(({ slot }) => slot === "weapon.offhand" || slot.startsWith("armor.")),
    ...SLOTS.filter(({ slot }) => slot.startsWith("inventory.")),
].map(({ slot }) => slot);

export function fitsSlot(id, slot){
    switch (slot){
        case "armor.head":
            return /_(helmet|head|skull)$/.test(id) || id === "carved_pumpkin";
        case "armor.chest":
            return id.endsWith("_chestplate") || id === "elytra";
        case "armor.legs":
            return id.endsWith("_leggings");
        case "armor.feet":
            return id.endsWith("_boots");
        default:
            return true;
    }
}

export function stackSize(id){
    return STACK_SIZES[id] ?? 64;
}

export function itemName(id){
    return ITEM_NAMES[id] ?? id.split("_").map(word => word[0].toUpperCase() + word.slice(1)).join(" ");
}

const POTIONS = [
    ["water", null, 0],
    ["mundane", null, 0],
    ["thick", null, 0],
    ["awkward", null, 0],
    ["night_vision", "Night Vision", 3600],
    ["long_night_vision", "Night Vision", 9600],
    ["invisibility", "Invisibility", 3600],
    ["long_invisibility", "Invisibility", 9600],
    ["leaping", "Leaping", 3600],
    ["long_leaping", "Leaping", 9600],
    ["strong_leaping", "Leaping", 1800],
    ["fire_resistance", "Fire Resistance", 3600],
    ["long_fire_resistance", "Fire Resistance", 9600],
    ["swiftness", "Swiftness", 3600],
    ["long_swiftness", "Swiftness", 9600],
    ["strong_swiftness", "Swiftness", 1800],
    ["slowness", "Slowness", 1800],
    ["long_slowness", "Slowness", 4800],
    ["strong_slowness", "Slowness", 400],
    ["turtle_master", "the Turtle Master", 400],
    ["long_turtle_master", "the Turtle Master", 800],
    ["strong_turtle_master", "the Turtle Master", 400],
    ["water_breathing", "Water Breathing", 3600],
    ["long_water_breathing", "Water Breathing", 9600],
    ["healing", "Healing", 0],
    ["strong_healing", "Healing", 0],
    ["harming", "Harming", 0],
    ["strong_harming", "Harming", 0],
    ["poison", "Poison", 900],
    ["long_poison", "Poison", 1800],
    ["strong_poison", "Poison", 432],
    ["regeneration", "Regeneration", 900],
    ["long_regeneration", "Regeneration", 1800],
    ["strong_regeneration", "Regeneration", 450],
    ["strength", "Strength", 3600],
    ["long_strength", "Strength", 9600],
    ["strong_strength", "Strength", 1800],
    ["weakness", "Weakness", 1800],
    ["long_weakness", "Weakness", 4800],
    ["luck", "Luck", 6000],
    ["slow_falling", "Slow Falling", 1800],
    ["long_slow_falling", "Slow Falling", 4800],
];

const POTION_ITEMS = {
    potion: { row: 0, prefix: "Potion", share: 1 },
    splash_potion: { row: 1, prefix: "Splash Potion", share: 1 },
    lingering_potion: { row: 2, prefix: "Lingering Potion", share: 1 / 4 },
    tipped_arrow: { row: 3, prefix: "Arrow", share: 1 / 8 },
};

function potionOf(item){
    if (!POTION_ITEMS[item.id]){
        return null;
    }
    const key = (item.nbt ?? "").match(/(?:^|[{,\s])Potion\s*:\s*["']?(?:minecraft:)?([a-z_]+)/)?.[1];
    const column = POTIONS.findIndex(([name]) => name === key);
    if (column === -1){
        return null;
    }
    const [, effect, ticks] = POTIONS[column];
    return { key, effect, ticks, column };
}

export function potionVariants(id){
    if (!POTION_ITEMS[id]){
        return [];
    }
    return POTIONS
        .filter(([, effect]) => effect || id !== "tipped_arrow")
        .map(([key]) => `{Potion:"${key}"}`);
}

export function potionName(item, short = false){
    const potion = potionOf(item);
    if (!potion){
        return null;
    }
    const { prefix, share } = POTION_ITEMS[item.id];
    if (!potion.effect){
        if (item.id === "tipped_arrow"){
            return potion.key === "water" ? "Arrow of Splashing" : itemName(item.id);
        }
        // "Water Bottle", "Splash Water Bottle", "Mundane Potion", "Mundane Splash Potion"
        return potion.key === "water" ? prefix.replace("Potion", "Water Bottle") : `${potion.key[0].toUpperCase()}${potion.key.slice(1)} ${prefix}`;
    }
    const effect = `${potion.effect}${potion.key.startsWith("strong_") ? " II" : ""}`;
    if (short){
        const bare = effect.replace(/^the /, "");
        return item.id === "potion" ? bare : item.id === "tipped_arrow" ? `Arrow of ${effect}` : `${prefix.replace(" Potion", "")} ${bare}`;
    }
    if (potion.ticks === 0){
        return `${prefix} of ${effect}`;
    }
    const seconds = Math.floor(Math.max(Math.floor(potion.ticks * share), 1) / 20);
    return `${prefix} of ${effect} (${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")})`;
}

export function itemLabel(item){
    const base = potionName(item) ?? itemName(item.id);
    const name = item.count > 1 ? `${base} ×${item.count}` : base;
    return item.nbt ? `${name}\n${item.nbt}` : name;
}

export function isShiny(item){
    return GLINT_ITEMS.includes(item.id) || /Enchantments\s*:\s*\[\s*\{/.test(item.nbt ?? "")
        || (item.id !== "tipped_arrow" && Boolean(potionOf(item)?.effect));
}

export function nbtProblem(nbt){
    if (nbt === ""){
        return null;
    }
    // A ; would cut the command in two, since Ranked splits it there
    if (!nbt.startsWith("{") || !nbt.endsWith("}") || /[;\n\r]/.test(nbt)){
        return "Invalid NBT";
    }
    const open = [];
    let quote = null;
    for (let i = 0; i < nbt.length; i++){
        const char = nbt[i];
        if (quote){
            if (char === "\\"){
                i++;
            } else if (char === quote){
                quote = null;
            }
        } else if (char === '"' || char === "'"){
            quote = char;
        } else if (char === "{" || char === "["){
            open.push(char === "{" ? "}" : "]");
        } else if (char === "}" || char === "]"){
            if (open.pop() !== char || (open.length === 0 && i < nbt.length - 1)){
                return "Invalid NBT";
            }
        }
    }
    return quote || open.length > 0 ? "Invalid NBT" : null;
}

export function nbtExample(id){
    const enchant = (name, level) => `{Enchantments:[{id:"${name}",lvl:${level}}]}`;
    if (id.endsWith("_boots")){
        return enchant("soul_speed", 3);
    }
    if (/_(helmet|chestplate|leggings)$/.test(id)){
        return enchant("protection", 4);
    }
    if (/_(pickaxe|shovel|axe|hoe)$/.test(id) || id === "shears"){
        return enchant("efficiency", 5);
    }
    if (id.endsWith("_sword")){
        return enchant("looting", 3);
    }
    const examples = {
        bow: enchant("power", 5),
        crossbow: enchant("quick_charge", 3),
        trident: enchant("loyalty", 3),
        fishing_rod: enchant("lure", 3),
        carrot_on_a_stick: enchant("unbreaking", 3),
        warped_fungus_on_a_stick: enchant("unbreaking", 3),
        elytra: enchant("unbreaking", 3),
        shield: enchant("unbreaking", 3),
        flint_and_steel: enchant("unbreaking", 3),
        potion: '{Potion:"fire_resistance"}',
        splash_potion: '{Potion:"fire_resistance"}',
        lingering_potion: '{Potion:"fire_resistance"}',
        tipped_arrow: '{Potion:"slowness"}',
        enchanted_book: '{StoredEnchantments:[{id:"soul_speed",lvl:3}]}',
    };
    return examples[id] ?? "{}";
}

function stackKey(item){
    return `${item.id}${item.nbt ?? ""}`;
}

export function stackedItems(kit){
    const totals = new Map();
    for (const slot of [...SLOT_ORDER.filter(slot => !slot.startsWith("armor.")), ...SLOT_ORDER.filter(slot => slot.startsWith("armor."))]){
        const item = kit[slot];
        if (item){
            const key = stackKey(item);
            totals.set(key, { ...item, count: (totals.get(key)?.count ?? 0) + item.count });
        }
    }
    return [...totals.values()];
}

export function kitChanges(kit, base){
    const mine = new Map(stackedItems(kit).map(item => [stackKey(item), item]));
    const theirs = new Map(stackedItems(base).map(item => [stackKey(item), item]));
    const changes = [];
    for (const key of new Set([...theirs.keys(), ...mine.keys()])){
        const item = mine.get(key) ?? theirs.get(key);
        const difference = (mine.get(key)?.count ?? 0) - (theirs.get(key)?.count ?? 0);
        if (difference !== 0){
            changes.push({ id: item.id, nbt: item.nbt, difference });
        }
    }
    const moved = changes.length === 0 && SLOT_ORDER.some(slot => stackKey(kit[slot] ?? {}) !== stackKey(base[slot] ?? {})
        || kit[slot]?.count !== base[slot]?.count);
    return { changes, moved };
}

export function buildIcon(item){
    const icon = document.createElement("span");
    icon.className = "item";
    icon.classList.toggle("glint", isShiny(item));
    icon.classList.toggle("dark", DARK_ITEMS.includes(item.id));
    const potion = potionOf(item);
    if (potion){
        icon.classList.add("potion");
        icon.style.setProperty("--icon-position", iconPosition(potion.column, POTION_ITEMS[item.id].row, POTIONS.length, Object.keys(POTION_ITEMS).length));
        return icon;
    }
    const index = ITEM_ICONS[item.id];
    if (index !== undefined){
        icon.style.setProperty("--icon-position", iconPosition(index % ICON_COLUMNS, Math.floor(index / ICON_COLUMNS), ICON_COLUMNS, ICON_ROWS));
    }
    return icon;
}

// The icons have a gap around them to fix visual artifacts
function iconPosition(column, row, columns, rows){
    const pitch = ICON_SIZE + 2 * ICON_GAP;
    const x = (column * pitch + ICON_GAP) / (columns * pitch - ICON_SIZE) * 100;
    const y = (row * pitch + ICON_GAP) / (rows * pitch - ICON_SIZE) * 100;
    return `${x}% ${y}%`;
}

// Puts an item's icon and count into a slot
export function fillSlot(slot, item){
    slot.replaceChildren();
    if (!item){
        return;
    }
    slot.append(buildIcon(item));
    if (item.count > 1){
        const count = document.createElement("span");
        count.className = "item-count";
        count.textContent = item.count;
        slot.append(count);
    }
}

// The whole inventory grid
export function buildInventory(kit, makeSlot = () => document.createElement("span")){
    const inventory = document.createElement("div");
    inventory.className = "inventory";
    for (const { slot, label, row, column } of SLOTS){
        const element = makeSlot(slot, label);
        element.classList.add("slot");
        element.dataset.slot = slot;
        element.style.gridArea = `${row} / ${column}`;
        fillSlot(element, kit[slot]);
        if (element.tagName === "SPAN" && kit[slot]){
            element.title = itemLabel(kit[slot]);
        }
        inventory.append(element);
    }
    return inventory;
}
