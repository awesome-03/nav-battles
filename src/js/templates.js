// Default kits

const SIMPLE_KIT = {
    "hotbar.0": { id: "iron_pickaxe", count: 1 },
    "hotbar.1": { id: "soul_sand", count: 64 },
    "hotbar.2": { id: "ender_eye", count: 12 },
    "weapon.offhand": { id: "bread", count: 12 },
};

const FULL_KIT = {
    "hotbar.0": { id: "iron_axe", count: 1 },
    "hotbar.1": { id: "iron_pickaxe", count: 1 },
    "hotbar.2": { id: "iron_shovel", count: 1 },
    "hotbar.3": { id: "oak_boat", count: 1 },
    "hotbar.4": { id: "soul_sand", count: 33 },
    "hotbar.5": { id: "gravel", count: 44 },
    "hotbar.6": { id: "obsidian", count: 3 },
    "hotbar.7": { id: "ender_pearl", count: 13 },
    "hotbar.8": { id: "ender_eye", count: 12 },
    "weapon.offhand": { id: "bread", count: 4 },
    "armor.head": { id: "golden_helmet", count: 1 },
    "armor.chest": { id: "golden_chestplate", count: 1 },
    "armor.legs": { id: "golden_leggings", count: 1 },
    "armor.feet": { id: "golden_boots", count: 1 },
    "inventory.0": { id: "fire_charge", count: 23 },
    "inventory.1": { id: "white_bed", count: 1 },
    "inventory.2": { id: "white_bed", count: 1 },
    "inventory.3": { id: "white_bed", count: 1 },
    "inventory.4": { id: "white_bed", count: 1 },
    "inventory.5": { id: "white_bed", count: 1 },
    "inventory.6": { id: "white_bed", count: 1 },
    "inventory.7": { id: "ender_pearl", count: 16 },
    "inventory.8": { id: "bow", count: 1 },
    "inventory.9": { id: "arrow", count: 6 },
    "inventory.10": { id: "lava_bucket", count: 1 },
    "inventory.11": { id: "nether_bricks", count: 26 },
    "inventory.12": { id: "gravel", count: 45 },
    "inventory.13": { id: "oak_planks", count: 4 },
    "inventory.14": { id: "crying_obsidian", count: 6 },
    "inventory.15": { id: "soul_sand", count: 64 },
    "inventory.16": { id: "stick", count: 2 },
};

export const STARTING_ROOMS = [
    {
        name: "Simple",
        description: "Pickaxe, blocks, eyes and food",
        kit: SIMPLE_KIT,
    },
    {
        name: "Full",
        description: "A realistic inventory for a full endgame",
        kit: FULL_KIT,
    },
];
