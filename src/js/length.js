import { COMMAND_LIMIT, buildCommand, commandParts, roomFor } from "./command.js";
import { copyFromButton } from "./copy.js";

const section = document.querySelector("#command");
const lengthValue = document.querySelector("#command-length");
const percentValue = document.querySelector("#command-percent");
const countValue = document.querySelector("#command-count");
const roomValue = document.querySelector("#command-room");
const meter = document.querySelector("#command-meter");
const legend = document.querySelector("#command-legend");
const errorLine = document.querySelector("#command-error");
const copyButton = document.querySelector("#copy-command");
const showButton = document.querySelector("#show-command");
const commandText = document.querySelector("#command-text");

const PLAYER_COLORS = 7;

let shown = null;
let drawn = null;
let drawnWidth = 0;

function number(n){
    return n.toLocaleString("en-US");
}

// Character count
function size(lines){
    return lines.reduce((total, line) => total + line.length + 1, 0);
}

function pieces(parts, total, room, limit){
    const own = new Map(room.players.filter(player => player.kit).map(player => [player.name, 0]));
    let shared = 0;
    for (const { line, names } of parts.players){
        if (names.length === 1){
            own.set(names[0], own.get(names[0]) + line.length + 1);
        } else {
            shared += line.length + 1;
        }
    }
    const players = [...own].filter(([, chars]) => chars > 0);
    const list = [
        { label: "Setup", size: 0, color: "var(--text-dimmed)" },
        { label: "Default inventory", size: size(parts.defaultLines), color: "var(--series-1)" },
    ];
    const named = Math.min(limit, players.length > PLAYER_COLORS ? PLAYER_COLORS - 1 : PLAYER_COLORS);
    players.slice(0, named).forEach(([name, chars], i) => {
        list.push({ label: name, size: chars, color: `var(--series-${i + 2})` });
    });
    const rest = players.slice(named);
    if (rest.length > 0){
        list.push({ label: `${rest.length} more players`, size: rest.reduce((sum, [, chars]) => sum + chars, 0), color: `var(--series-${PLAYER_COLORS + 1})` });
    }
    if (shared > 0){
        list.push({ label: "Shared by players", size: shared, color: "var(--border)" });
    }
    // Setup is everything else, so the pieces add up to the whole command
    list[0].size = total - list.slice(1).reduce((sum, piece) => sum + piece.size, 0);
    return list;
}

function buildSegment(piece){
    const segment = document.createElement("span");
    segment.style.flexGrow = piece.size;
    segment.style.backgroundColor = piece.color;
    segment.title = `${piece.label}: ${number(piece.size)} characters`;
    return segment;
}

function buildLegendItem(piece){
    const item = document.createElement("li");
    const swatch = document.createElement("span");
    swatch.className = "command-swatch";
    swatch.style.backgroundColor = piece.color;
    const value = document.createElement("span");
    value.className = "command-legend-value";
    value.textContent = number(piece.size);
    item.append(swatch, `${piece.label} `, value);
    return item;
}

function drawPieces(){
    const { parts, total, room } = drawn;
    const free = COMMAND_LIMIT - total;
    for (let limit = PLAYER_COLORS; limit >= 0; limit--){
        const list = pieces(parts, total, room, limit);
        const segments = list.map(buildSegment);
        const items = list.map(buildLegendItem);
        if (free > 0){
            const left = { label: "Free", size: free, color: "var(--border-muted)" };
            segments.push(buildSegment(left));
            items.push(buildLegendItem(left));
        } else {
            const line = document.createElement("div");
            line.className = "command-limit";
            line.style.left = `${COMMAND_LIMIT / total * 100}%`;
            line.title = `Ranked's limit: ${number(COMMAND_LIMIT)} characters`;
            segments.push(line);
        }
        meter.replaceChildren(...segments);
        legend.replaceChildren(...items);
        if (new Set(items.map(item => item.offsetTop)).size <= 2){
            break;
        }
    }
    drawnWidth = legend.clientWidth;
}

export function renderLength(room, commands){
    section.hidden = !room || !commands;
    if (section.hidden){
        shown = null;
        drawn = null;
        return;
    }
    shown = { room, commands };
    const parts = commandParts(commands, room);
    const command = buildCommand(commands, room);
    const free = COMMAND_LIMIT - command.length;

    lengthValue.textContent = number(command.length);
    lengthValue.classList.toggle("over", free < 0);
    percentValue.textContent = `${(command.length / COMMAND_LIMIT * 100).toFixed(1)}%`;
    percentValue.classList.toggle("over", free < 0);
    countValue.textContent = number(parts.before.length + parts.defaultLines.length + parts.players.length + parts.after.length);

    roomValue.textContent = free > 0 ? `~${number(roomFor(commands, room))}` : "0";

    drawn = { parts, total: command.length, room };
    drawPieces();

    errorLine.textContent = free < 0 ? `${number(-free)} characters over the limit` : "";
    copyButton.disabled = free < 0;
    if (free < 0){
        copyButton.title = "Code too long";
    } else {
        copyButton.removeAttribute("title");
    }
    commandText.value = command;
}

export function setupLength(){
    new ResizeObserver(() => {
        if (drawn && legend.clientWidth !== drawnWidth){
            drawPieces();
        }
    }).observe(legend);
    showButton.addEventListener("click", () => {
        const open = showButton.getAttribute("aria-expanded") !== "true";
        showButton.setAttribute("aria-expanded", open);
        commandText.hidden = !open;
    });
    copyButton.addEventListener("click", () => {
        if (shown){
            copyFromButton(copyButton, buildCommand(shown.commands, shown.room));
        }
    });
}
