const SOURCE = "src/mcfunction/nav_battles.mcfunction";

// The commands in the mcfunction without comments and empty lines
export async function loadCommands(){
    const response = await fetch(SOURCE);
    if (!response.ok){
        throw new Error(`Could not load ${SOURCE} (${response.status})`);
    }
    const text = await response.text();
    return text.split("\n")
        .map(line => line.trim())
        .filter(line => line !== "" && !line.startsWith("#"));
}

const KIT_LINE = "replaceitem entity @s ";

// One line for Run Command on World Join, Ranked splits it on ";"
// Kits replace the inventory lines
export function buildCommand(commands, kit){
    if (!kit){
        return commands.join(";");
    }
    const start = commands.findIndex(line => line.startsWith(KIT_LINE));
    const kept = commands.filter(line => !line.startsWith(KIT_LINE));
    const kitLines = Object.entries(kit).map(([slot, item]) => `${KIT_LINE}${slot} minecraft:${item.id} ${item.count}`);
    kept.splice(start === -1 ? kept.length : start, 0, ...kitLines);
    return kept.join(";");
}
