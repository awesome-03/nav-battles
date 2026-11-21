import { openKit } from "./inventory.js";
import { openImport } from "./import.js";
import { askConfirm } from "./confirm.js";
import { isPlayerName, readPlayers, encodePlayer } from "./rooms.js";

function sameKit(a, b){
    const items = kit => JSON.stringify(Object.entries(kit).sort(([x], [y]) => x.localeCompare(y)));
    return items(a) === items(b);
}

function nameError(room, name, player = null){
    if (name === ""){
        return "Username field cannot be empty";
    }
    if (!isPlayerName(name)){
        return "Invalid username";
    }
    if (room.players.some(other => other !== player && other.name.toLowerCase() === name.toLowerCase())){
        return `${name} is already in this room.`;
    }
    return null;
}

export function setupPlayers(getRoom, mcfunctionKit, changed){
    function playerKit(kit, roomKit){
        return sameKit(kit, roomKit) ? null : kit;
    }

    function openDefault(room){
        const base = mcfunctionKit();
        openKit({
            room: room.name,
            name: null,
            kit: room.kit ?? base,
            note: "Default inventory for players who aren't configured",
            save(_, kit){
                room.kit = sameKit(kit, base) ? null : kit;
                changed();
            },
            copyPlayer(_, kit){
                return encodePlayer({ name: "", kit });
            },
        });
    }

    function openPlayer(index){
        const room = getRoom();
        if (index === -1){
            openDefault(room);
            return;
        }
        const player = room.players[index];
        const roomKit = room.kit ?? mcfunctionKit();
        openKit({
            room: room.name,
            name: player.name,
            kit: player.kit ?? roomKit,
            resetKit: roomKit,
            save(name, kit){
                const error = nameError(room, name, player);
                if (error){
                    return error;
                }
                player.name = name;
                player.kit = playerKit(kit, roomKit);
                changed();
            },
            copyPlayer(name, kit){
                return encodePlayer({ name, kit });
            },
            async deletePlayer(closeKit){
                if (await askConfirm(`Delete ${player.name}'s inventory?`, "Delete", "Cancel", { danger: true, note: "This action cannot be taken back" })){
                    room.players.splice(room.players.indexOf(player), 1);
                    closeKit();
                    changed();
                }
            },
        });
    }

    function newPlayer(){
        const room = getRoom();
        const roomKit = room.kit ?? mcfunctionKit();
        openKit({
            room: room.name,
            name: "",
            kit: roomKit,
            resetKit: roomKit,
            save(name, kit){
                const error = nameError(room, name);
                if (error){
                    return error;
                }
                room.players.push({ name, kit: playerKit(kit, roomKit) });
                changed();
            },
        });
    }

    function importPlayer(){
        const room = getRoom();
        openImport({
            title: "Import Player",
            message: "Paste a player code (Ctrl + V), or select a txt file",
            read: readPlayers,
            done(players){
                for (const player of players){
                    if (player.name === ""){
                        room.kit = sameKit(player.kit, mcfunctionKit()) ? null : player.kit;
                        continue;
                    }
                    const kit = playerKit(player.kit, room.kit ?? mcfunctionKit());
                    const existing = room.players.find(other => other.name.toLowerCase() === player.name.toLowerCase());
                    if (existing){
                        existing.kit = kit;
                    } else {
                        room.players.push({ name: player.name, kit });
                    }
                }
                changed();
            },
        });
    }

    return { openPlayer, newPlayer, importPlayer };
}
