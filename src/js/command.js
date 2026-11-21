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

export function kitFromCommands(commands){
    const kit = {};
    for (const line of commands){
        const match = line.match(/^replaceitem entity @s (\S+) minecraft:([a-z0-9_]+)(\{.*\})?(?: (\d+))?$/);
        if (match){
            kit[match[1]] = match[3] ? { id: match[2], count: Number(match[4] ?? 1), nbt: match[3] } : { id: match[2], count: Number(match[4] ?? 1) };
        }
    }
    return kit;
}

function kitLines(kit, prefix = ""){
    return Object.entries(kit).map(([slot, item]) => `${prefix}${KIT_LINE}${slot} minecraft:${item.id}${item.nbt ?? ""} ${item.count}`);
}

// One line for Run Command on World Join, split with ";"
export function buildCommand(commands, room){
    const isKitLine = line => line.startsWith(KIT_LINE);
    const start = commands.findIndex(isKitLine);
    const defaultLines = room.kit ? kitLines(room.kit) : commands.filter(isKitLine);
    const playerLines = room.players.filter(player => player.kit).flatMap(player => {
        const onlyThem = `execute if entity @s[name=${player.name}] run `;
        return [`${onlyThem}clear @s`, ...kitLines(player.kit, onlyThem)];
    });
    const kept = commands.filter(line => !isKitLine(line));
    kept.splice(start === -1 ? kept.length : start, 0, ...defaultLines, ...playerLines);
    return kept.join(";");
}
