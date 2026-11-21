import { ITEM_ICONS } from "./items.js";
import { SLOT_ORDER, stackSize } from "./kit.js";

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
const CLEAR_LINE = "execute as @s run clear @s";

export const COMMAND_LIMIT = 32500;
const HARD_FROM = COMMAND_LIMIT * 0.8;

function mainIndex(slot){
    if (slot.startsWith("hotbar.")){
        return Number(slot.slice(7));
    }
    if (slot.startsWith("inventory.")){
        return 9 + Number(slot.slice(10));
    }
    return null;
}

function slotAt(index){
    return index < 9 ? `hotbar.${index}` : `inventory.${index - 9}`;
}

function itemText(item){
    return `${item.id}${item.nbt ?? ""}${item.count > 1 ? ` ${item.count}` : ""}`;
}

function sameItem(a, b){
    return a?.id === b?.id && a?.count === b?.count && a?.nbt === b?.nbt;
}

function kind(item){
    return `${item.id}${item.nbt ?? ""}`;
}

const DUMMIES = ["bow", "cake", "shears", "saddle"];
const SEARCH_LIMIT = 1000;
const PLAYER_SEARCH_LIMIT = 300;
const SHARED_SEARCH_LIMIT = 200;
const COUNT_SPREAD = 5;

const found = new Map();

function inventoryLines(from, to, prefix = 0, { discount = new Map(), give = true } = {}){
    const id = `${prefix} ${give} ${kitKey(from)} ${kitKey(to)} ${JSON.stringify([...discount])}`;
    if (!found.has(id)){
        if (found.size > 5000){
            found.clear();
        }
        found.set(id, searchLines(from, to, prefix, discount, give));
    }
    return found.get(id);
}

function setLine(slot, item){
    return `${KIT_LINE}${slot} ${item ? itemText(item) : "air"}`;
}

function searchLines(from, to, prefix, discount, give){
    if (!give){
        return { pre: SLOT_ORDER.filter(slot => !sameItem(from[slot], to[slot])).map(slot => setLine(slot, to[slot])), gives: [], post: [] };
    }
    const lineCost = (phase, line) => phase === "pre" && discount.has(line) ? discount.get(line) : line.length + 1 + prefix;
    const addLine = (state, phase, line, cost = lineCost(phase, line)) => ({ ...state, cost: state.cost + cost, trail: { prev: state.trail, phase, line } });

    const counts = new Map();
    for (const kit of [from, to]){
        for (const [slot, item] of Object.entries(kit)){
            if (mainIndex(slot) !== null || slot === "weapon.offhand"){
                counts.set(item.id, (counts.get(item.id) ?? 0) + 1);
            }
        }
    }
    const tracked = new Map([...counts.keys()].filter(id => stackSize(id) > 1 && counts.get(id) > 1).map((id, i) => [id, i]));
    const used = new Set(Object.values(to).map(item => item.id));
    const dummy = DUMMIES.find(id => !used.has(id));

    const markOf = (state, id) => state.marks[tracked.get(id)];
    const mark = (state, id, value) => {
        const i = tracked.get(id);
        return { ...state, marks: state.marks.slice(0, i) + value + state.marks.slice(i + 1) };
    };
    const occupy = (state, item) => {
        if (!item || !tracked.has(item.id) || item.count >= stackSize(item.id)){
            return state;
        }
        const value = markOf(state, item.id);
        return value === "o" || value === "c" ? null : mark(state, item.id, "s");
    };

    const finish = state => {
        if (!state.run){
            return [state];
        }
        const { item, text, max, chunks, last } = state.run;
        const want = to[slotAt(last)];
        const options = [];
        if (!item){
            options.push({ count: 1, fix: want !== undefined });
        } else if (want && kind(want) === text && want.count <= max){
            options.push({ count: want.count, fix: false });
            if (want.count < max){
                options.push({ count: max, fix: true });
            }
        } else {
            options.push({ count: max, fix: true }, { count: 1, fix: true });
        }
        return options.map(({ count, fix }) => {
            const total = (chunks - 1) * max + count;
            const suffix = total > 1 ? ` ${total}` : "";
            let next = { ...addLine(state, "gives", `give @s ${text}${suffix}`, suffix.length), run: null };
            if (fix){
                next = addLine(next, "post", setLine(slotAt(last), want));
            }
            return item && tracked.has(item.id) ? mark(next, item.id, count < max ? "c" : "o") : next;
        });
    };

    const extend = (state, i) => {
        const { item, text, max, chunks, last } = state.run;
        const want = to[slotAt(last)];
        const exact = item ? want !== undefined && kind(want) === text && want.count === max : want === undefined;
        const next = exact ? state : addLine(state, "post", setLine(slotAt(last), want));
        return { ...next, run: { item, text, max, chunks: chunks + 1, last: i } };
    };

    const start = (ends, i, item) => ends.flatMap(next => {
        if (item && tracked.has(item.id)){
            const value = markOf(next, item.id);
            if (value === "s" || value === "c"){
                return [];
            }
            next = mark(next, item.id, "o");
        }
        const text = item ? kind(item) : dummy;
        const cost = "give @s ".length + text.length + 1 + prefix + (!item && !next.dummy ? "clear @s ".length + dummy.length + 1 + prefix : 0);
        return [{ ...next, cost: next.cost + cost, dummy: next.dummy || !item, run: { item, text, max: item ? stackSize(item.id) : 1, chunks: 1, last: i } }];
    });

    const empty = (state, i) => {
        const want = to[slotAt(i)];
        if (state.ended){
            return want ? [] : [state];
        }
        const out = state.run ? [extend(state, i)] : [];
        const ends = finish(state);
        if (!want){
            out.push(...ends.map(next => ({ ...next, ended: true })));
        }
        if (give && want && ITEM_ICONS[want.id] !== undefined){
            out.push(...start(ends, i, want));
        }
        if (give && dummy !== undefined){
            out.push(...start(ends, i, null));
        }
        return out;
    };

    const step = (state, i) => {
        const slot = slotAt(i);
        const had = from[slot];
        const want = to[slot];
        if (sameItem(had, want)){
            return had ? [occupy(state, had)] : empty(state, i);
        }
        const out = [];
        if (want){
            out.push(occupy(addLine(state, "pre", setLine(slot, want)), want));
        } else {
            out.push(...empty(addLine(state, "pre", setLine(slot, want)), i));
        }
        if (had){
            out.push(occupy(addLine(state, "post", setLine(slot, want)), had));
        } else if (want){
            out.push(...empty(state, i));
        }
        return out;
    };

    let start0 = { cost: 0, ended: false, run: null, marks: "-".repeat(tracked.size), dummy: false, trail: null };
    for (const slot of SLOT_ORDER.filter(slot => slot.startsWith("armor.") && !sameItem(from[slot], to[slot]))){
        start0 = addLine(start0, "pre", setLine(slot, to[slot]));
    }
    const hand = "weapon.offhand";
    let layer = (sameItem(from[hand], to[hand])
        ? [occupy(start0, from[hand])]
        : [occupy(addLine(start0, "pre", setLine(hand, to[hand])), to[hand]), occupy(addLine(start0, "post", setLine(hand, to[hand])), from[hand])]).filter(Boolean);
    const key = state => `${state.ended ? "e" : ""}${state.dummy ? "d" : ""} ${state.marks} ${state.run ? `${state.run.item ? state.run.text : ""} ${state.run.last}` : ""}`;
    for (let i = 0; i < 36; i++){
        const best = new Map();
        const beats = (a, b) => a.cost + COUNT_SPREAD <= b.cost || (a.run?.chunks === b.run?.chunks && a.cost <= b.cost);
        for (const state of layer){
            for (const next of step(state, i)){
                if (!next){
                    continue;
                }
                const id = key(next);
                const kept = best.get(id);
                if (kept === undefined){
                    best.set(id, [next]);
                } else if (!kept.some(other => beats(other, next))){
                    best.set(id, [...kept.filter(other => !beats(next, other)), next]);
                }
            }
        }
        layer = [...best.values()].flat();
        const limit = discount.size > 0 ? SHARED_SEARCH_LIMIT : prefix > 0 ? PLAYER_SEARCH_LIMIT : SEARCH_LIMIT;
        if (layer.length > limit){
            layer = layer.sort((a, b) => a.cost - b.cost).slice(0, limit);
        }
    }

    let result = { trail: null };
    for (const slot of SLOT_ORDER.filter(slot => !sameItem(from[slot], to[slot]))){
        result = addLine({ cost: 0, ...result }, "pre", setLine(slot, to[slot]));
    }
    for (const state of layer){
        for (let end of finish(state)){
            if (end.dummy){
                end = addLine(end, "gives", `clear @s ${dummy}`, 0);
            }
            if (end.cost < result.cost){
                result = end;
            }
        }
    }
    const lines = { pre: [], gives: [], post: [] };
    for (let node = result.trail; node; node = node.prev){
        lines[node.phase].unshift(node.line);
    }
    return lines;
}

function namePrefix(name){
    return `execute as ${name} run `;
}

function tagPrefix(tag){
    return `execute as @s[tag=${tag}] run `;
}

function size(lines){
    return lines.reduce((total, line) => total + line.length + 1, 0);
}

function playerPlans(defaultKit, kit, prefix, options){
    return [
        { clear: [], ...inventoryLines(defaultKit, kit, prefix, options) },
        { clear: ["clear @s"], ...inventoryLines({}, kit, prefix, options) },
    ];
}

function neededLines(defaultKit, kit){
    return new Set([defaultKit, {}].flatMap(from => SLOT_ORDER.filter(slot => kit[slot] && !sameItem(from[slot], kit[slot])).map(slot => setLine(slot, kit[slot]))));
}

function planLines(plan){
    return [...plan.clear, ...plan.pre, ...plan.gives, ...plan.post];
}

function likelyPlayer(defaultKit, k){
    const hotbar = Array.from({ length: 9 }, (_, i) => `hotbar.${i}`);
    const order = [...hotbar];
    let seed = 1000 + k;
    for (let i = order.length - 1; i > 0; i--){
        seed = (seed * 1103515245 + 12345) % 2147483648;
        const j = Math.floor(seed / 2147483648 * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
    }
    const kit = { ...defaultKit };
    hotbar.forEach((slot, i) => {
        if (defaultKit[order[i]]){
            kit[slot] = defaultKit[order[i]];
        } else {
            delete kit[slot];
        }
    });
    if (kitKey(kit) === kitKey(defaultKit)){
        kit["inventory.26"] = { id: "stone", count: 1 + k % 64 };
    }
    return { name: `${"#".repeat(12)}${String(k).padStart(4, "0")}`, kit };
}

function giveSaving(kit){
    let saved = 0;
    let previous = null;
    for (let i = 0; i < 36; i++){
        const item = kit[slotAt(i)];
        if (item && previous && kind(previous) === kind(item) && stackSize(item.id) === 1){
            saved += setLine(slotAt(i), item).length + 1;
        } else if (item){
            saved += setLine(slotAt(i), item).length - `give @s ${itemText(item)}`.length;
        }
        previous = item ?? null;
    }
    return saved;
}

const guesses = new Map();

export function roomFor(commands, room){
    const id = JSON.stringify([room.kit ?? null, room.players]);
    if (!guesses.has(id)){
        if (guesses.size > 50){
            guesses.clear();
        }
        const defaultKit = room.kit ?? {};
        const players = roomPlayers(room);
        const own = inventoryLines({}, defaultKit, 0, { give: false });
        const fixed = size(commands) + size([...own.pre, ...own.gives, ...own.post]) - 1 - giveSaving(defaultKit);
        const fits = n => fixed + size(playerSection(defaultKit, [...players, ...Array.from({ length: n }, (_, k) => likelyPlayer(defaultKit, k))], false)
            .map(({ line }) => line)) <= COMMAND_LIMIT;
        let low = 0;
        let high = 1;
        while (high <= 2048 && fits(high)){
            low = high;
            high *= 2;
        }
        while (high - low > 1){
            const middle = Math.floor((low + high) / 2);
            if (fits(middle)){
                low = middle;
            } else {
                high = middle;
            }
        }
        guesses.set(id, low);
    }
    return guesses.get(id);
}

function kitKey(kit){
    return JSON.stringify(SLOT_ORDER.filter(slot => kit[slot]).map(slot => [slot, kit[slot].id, kit[slot].count, kit[slot].nbt ?? ""]));
}

const PHASES = ["clear", "pre", "gives", "post"];

function sectionLines(groups, choice){
    const bundles = new Map();
    const bundle = names => {
        const key = names.join(" ");
        if (!bundles.has(key)){
            bundles.set(key, { names, clear: [], pre: [], gives: [], post: [] });
        }
        return bundles.get(key);
    };
    const shared = { clear: new Map(), pre: new Map(), gives: new Map(), post: new Map() };
    const share = (phase, line, names) => shared[phase].set(line, [...(shared[phase].get(line) ?? []), ...names]);
    groups.forEach((group, g) => {
        const plan = group.plans[choice[g]];
        for (const phase of ["clear", "pre", "post"]){
            plan[phase].forEach(line => share(phase, line, group.names));
        }
        if (plan.gives.length > 0){
            share("gives", plan.gives.join("\n"), group.names);
        }
    });
    for (const phase of PHASES){
        for (const [line, names] of shared[phase]){
            bundle(names.sort())[phase].push(...line.split("\n"));
        }
    }

    let tags = 0;
    for (const b of bundles.values()){
        const lines = PHASES.flatMap(phase => b[phase]);
        const tag = String(tags);
        const byName = b.names.reduce((total, name) => total + size(lines.map(line => namePrefix(name) + line)), 0);
        const byTag = size(b.names.map(name => `${namePrefix(name)}tag @s add ${tag}`)) + size(lines.map(line => tagPrefix(tag) + line));
        if (byTag < byName){
            b.tag = tag;
            tags++;
        }
    }

    const out = [];
    for (const b of bundles.values()){
        if (b.tag !== undefined){
            out.push(...b.names.map(name => ({ line: `${namePrefix(name)}tag @s add ${b.tag}`, names: [name] })));
        }
    }
    for (const phase of PHASES){
        for (const b of bundles.values()){
            for (const line of b[phase]){
                if (b.tag !== undefined){
                    out.push({ line: tagPrefix(b.tag) + line, names: b.names });
                } else {
                    out.push(...b.names.map(name => ({ line: namePrefix(name) + line, names: [name] })));
                }
            }
        }
    }
    return out;
}

function sectionCost(groups){
    const tag = String(groups.length);
    const TAG_LINE = `tag @s add ${tag}`.length + 1;
    const users = new Map();
    const bundles = new Map();
    const state = { total: 0 };
    const cost = bundle => {
        if (bundle.count === 0){
            return 0;
        }
        const byName = bundle.size * bundle.names + bundle.count * bundle.prefixes;
        const byTag = bundle.prefixes + bundle.names * TAG_LINE + bundle.count * tagPrefix(tag).length + bundle.size;
        return Math.min(byName, byTag);
    };
    const change = (set, length, count) => {
        if (set.size === 0){
            return;
        }
        const id = [...set].sort((a, b) => a - b).join();
        if (!bundles.has(id)){
            bundles.set(id, {
                size: 0,
                count: 0,
                names: [...set].reduce((sum, g) => sum + groups[g].names.length, 0),
                prefixes: [...set].reduce((sum, g) => sum + groups[g].names.reduce((total, name) => total + namePrefix(name).length, 0), 0),
            });
        }
        const bundle = bundles.get(id);
        state.total -= cost(bundle);
        bundle.size += length;
        bundle.count += count;
        state.total += cost(bundle);
    };
    const move = (g, plan, adding) => {
        const entries = ["clear", "pre", "post"].flatMap(phase => plan[phase].map(line => [`${phase} ${line}`, line.length + 1, 1]));
        if (plan.gives.length > 0){
            entries.push([`gives ${plan.gives.join("\n")}`, size(plan.gives), plan.gives.length]);
        }
        for (const [key, length, count] of entries){
            const before = users.get(key) ?? new Set();
            const after = new Set(before);
            if (adding){
                after.add(g);
            } else {
                after.delete(g);
            }
            change(before, -length, -count);
            change(after, length, count);
            users.set(key, after);
        }
    };
    return {
        add: (g, plan) => move(g, plan, true),
        remove: (g, plan) => move(g, plan, false),
        get total(){
            return state.total;
        },
    };
}

function playerSection(defaultKit, players, give){
    const groups = new Map();
    for (const player of players){
        const key = kitKey(player.kit);
        if (!groups.has(key)){
            groups.set(key, { kit: player.kit, names: [] });
        }
        groups.get(key).names.push(player.name);
    }
    const list = [...groups.values()];
    const sharing = new Map();
    for (const group of list){
        group.names.sort();
        group.prefix = group.names.length > 1 ? tagPrefix("0").length : namePrefix(group.names[0]).length;
        group.needed = neededLines(defaultKit, group.kit);
        group.needed.forEach(line => sharing.set(line, (sharing.get(line) ?? 0) + group.names.length));
    }
    for (const group of list){
        const discount = new Map([...group.needed].filter(line => sharing.get(line) > 1)
            .map(line => [line, (tagPrefix("0").length + line.length + 1) / Math.min(sharing.get(line), 4)]));
        group.plans = [
            ...(give ? playerPlans(defaultKit, group.kit, group.prefix) : []),
            ...(give ? playerPlans(defaultKit, group.kit, group.prefix, { discount }) : []),
            ...playerPlans(defaultKit, group.kit, group.prefix, { give: false }),
        ];
        group.sizes = group.plans.map(plan => size(planLines(plan)) + planLines(plan).length * group.prefix);
    }

    const total = choice => size(sectionLines(list, choice).map(({ line }) => line));
    let result = null;
    for (const kinds of give ? [[0, 1], [2, 3], [4, 5]] : [[0, 1]]){
        const choice = list.map(group => group.sizes[kinds[1]] < group.sizes[kinds[0]] ? kinds[1] : kinds[0]);
        const cost = sectionCost(list);
        list.forEach((group, g) => cost.add(g, group.plans[choice[g]]));
        for (let improved = true; improved;){
            improved = false;
            for (let g = 0; g < list.length; g++){
                for (let p = 0; p < list[g].plans.length; p++){
                    if (p === choice[g]){
                        continue;
                    }
                    const before = cost.total;
                    cost.remove(g, list[g].plans[choice[g]]);
                    cost.add(g, list[g].plans[p]);
                    if (cost.total < before){
                        choice[g] = p;
                        improved = true;
                    } else {
                        cost.remove(g, list[g].plans[p]);
                        cost.add(g, list[g].plans[choice[g]]);
                    }
                }
            }
        }
        const best = total(choice);
        if (!result || best < result.best){
            result = { best, choice };
        }
    }
    return sectionLines(list, result.choice);
}

const builtRooms = new WeakMap();

export function commandParts(commands, room){
    if (!builtRooms.has(commands)){
        builtRooms.set(commands, new Map());
    }
    const built = builtRooms.get(commands);
    const id = JSON.stringify([room.kit ?? null, room.players]);
    if (!built.has(id)){
        if (built.size > 200){
            built.clear();
        }
        built.set(id, buildParts(commands, room));
    }
    return built.get(id);
}

function joined(parts){
    return [...parts.before, ...parts.defaultLines, ...parts.players.map(({ line }) => line), ...parts.after].join(";");
}

function roomPlayers(room){
    const last = new Map(room.players.map(player => [player.name.toLowerCase(), player]));
    return room.players.filter(player => last.get(player.name.toLowerCase()) === player && player.kit);
}

function buildParts(commands, room){
    const at = commands.indexOf(CLEAR_LINE) + 1;
    const defaultKit = room.kit ?? {};
    const players = roomPlayers(room);
    const parts = give => {
        const own = inventoryLines({}, defaultKit, 0, { give });
        return {
            before: commands.slice(0, at),
            defaultLines: [...own.pre, ...own.gives, ...own.post],
            players: playerSection(defaultKit, players, give),
            after: commands.slice(at),
        };
    };
    const fast = parts(false);
    if (joined(fast).length <= HARD_FROM){
        return fast;
    }
    const hard = parts(true);
    return joined(hard).length < joined(fast).length ? hard : fast;
}

export function buildCommand(commands, room){
    return joined(commandParts(commands, room));
}
