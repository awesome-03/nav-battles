import { setupModal } from "./modal.js";
import { askChoice, askConfirm } from "./confirm.js";
import { copyFromButton } from "./copy.js";
import { ITEM_GROUPS } from "./items.js";
import { SLOTS, SLOT_ORDER, buildInventory, buildIcon, fillSlot, fitsSlot, itemLabel, itemName, nbtExample, nbtProblem, potionName, potionVariants, stackSize } from "./kit.js";

const modal = document.querySelector("#kit-modal");
const form = document.querySelector("#kit-form");
const roomLine = document.querySelector("#kit-room");
const defaultTitle = document.querySelector("#kit-default");
const nameField = document.querySelector("#kit-name");
const note = document.querySelector("#kit-note");
const grid = document.querySelector("#kit-grid");
const errorLine = document.querySelector("#kit-error");
const copyButton = document.querySelector("#kit-copy");
const resetButton = document.querySelector("#kit-reset");
const deleteButton = document.querySelector("#kit-delete");

const picker = document.querySelector("#picker-modal");
const pickerForm = document.querySelector("#picker-form");
const pickerTitle = document.querySelector("#picker-title");
const search = document.querySelector("#picker-search");
const countField = document.querySelector("#picker-count");
const countUp = document.querySelector("#count-up");
const countDown = document.querySelector("#count-down");
const itemList = document.querySelector("#picker-items");
const pickerTab = document.querySelector("#picker-tab");
const nbtField = document.querySelector("#picker-nbt");
const nbtToggle = document.querySelector("#picker-nbt-toggle");
const pickerError = document.querySelector("#picker-error");

let editing = null;
let savedState = "";
let pickedSlot = null;
let selectedId = null;
let selectedNbt = "";
let itemButtons = [];
let nbtOn = false;
let armedButton = null;
let drag = null;
let suppressClick = false;

function slotLabel(slot){
    return SLOTS.find(entry => entry.slot === slot).label;
}

function orderedKit(){
    const kit = {};
    for (const slot of SLOT_ORDER){
        if (editing.kit[slot]){
            kit[slot] = editing.kit[slot];
        }
    }
    return kit;
}

function snapshot(){
    return JSON.stringify([editing.name === null ? null : nameField.value.trim(), orderedKit()]);
}

function setSlot(slot, item){
    if (item){
        editing.kit[slot] = item;
    } else {
        delete editing.kit[slot];
    }
}

function slotElement(slot){
    return grid.querySelector(`[data-slot="${slot}"]`);
}

function makeSlotButton(slot, label){
    const button = document.createElement("button");
    button.type = "button";
    const item = editing.kit[slot];
    button.setAttribute("aria-label", item ? `${label}: ${itemLabel(item)}` : `${label}: empty`);
    button.title = item ? itemLabel(item) : label;
    button.addEventListener("click", () => {
        if (!suppressClick){
            openPicker(slot);
        }
    });
    if (item){
        button.addEventListener("pointerdown", event => pressSlot(event, slot, button));
    }
    return button;
}

function renderGrid(){
    grid.replaceChildren(buildInventory(editing.kit, makeSlotButton));
}

function canSwap(from, to){
    const moving = editing.kit[from];
    const displaced = editing.kit[to];
    return fitsSlot(moving.id, to) && (!displaced || fitsSlot(displaced.id, from));
}

function slotAt(x, y){
    return document.elementFromPoint(x, y)?.closest("#kit-grid .slot") ?? null;
}

function overTrash(x, y){
    return deleteButton.contains(document.elementFromPoint(x, y));
}

function center(rect){
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function pressSlot(event, slot, button){
    if (event.button !== 0){
        return;
    }
    drag = { slot, button, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, ghost: null, over: null };
    button.setPointerCapture(event.pointerId);
    button.addEventListener("pointermove", moveDrag);
    button.addEventListener("pointerup", dropDrag);
    button.addEventListener("pointercancel", cancelDrag);
}

function startDrag(){
    const rect = drag.button.getBoundingClientRect();
    drag.grabX = drag.startX - rect.left;
    drag.grabY = drag.startY - rect.top;
    drag.ghost = document.createElement("div");
    drag.ghost.className = "drag-ghost";
    drag.ghost.style.width = `${rect.width}px`;
    drag.ghost.style.height = `${rect.height}px`;
    fillSlot(drag.ghost, editing.kit[drag.slot]);
    modal.append(drag.ghost);

    grid.classList.add("dragging");
    drag.button.classList.add("drag-source");
    for (const element of grid.querySelectorAll(".slot")){
        if (element !== drag.button && !canSwap(drag.slot, element.dataset.slot)){
            element.classList.add("drop-blocked");
        }
    }
    drag.trashWasHidden = deleteButton.hidden;
    deleteButton.hidden = false;
    deleteButton.classList.add("trash-target");
}

function moveGhost(x, y){
    drag.ghost.style.transform = `translate(${x - drag.grabX}px, ${y - drag.grabY}px) scale(1.1)`;
}

function moveDrag(event){
    if (event.pointerId !== drag?.pointerId){
        return;
    }
    if (!drag.ghost){
        if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5){
            return;
        }
        startDrag();
    }
    moveGhost(event.clientX, event.clientY);
    deleteButton.classList.toggle("trash-over", overTrash(event.clientX, event.clientY));
    const target = slotAt(event.clientX, event.clientY);
    if (target !== drag.over){
        drag.over?.classList.remove("drag-over");
        drag.over = target !== drag.button && !target?.classList.contains("drop-blocked") ? target : null;
        drag.over?.classList.add("drag-over");
    }
}

function stopListening(){
    drag.button.removeEventListener("pointermove", moveDrag);
    drag.button.removeEventListener("pointerup", dropDrag);
    drag.button.removeEventListener("pointercancel", cancelDrag);
}

function clearDragLook(finished){
    grid.classList.remove("dragging");
    for (const element of grid.querySelectorAll(".drag-source, .drop-blocked, .drag-over")){
        element.classList.remove("drag-source", "drop-blocked", "drag-over");
    }
    deleteButton.hidden = finished.trashWasHidden;
    deleteButton.classList.remove("trash-target", "trash-over");
}

function dropDrag(event){
    if (event.pointerId !== drag?.pointerId){
        return;
    }
    stopListening();
    const finished = drag;
    drag = null;
    if (!finished.ghost){
        return;
    }
    suppressClick = true;
    setTimeout(() => {
        suppressClick = false;
    });
    const target = slotAt(event.clientX, event.clientY);
    const to = target?.dataset.slot;
    if (overTrash(event.clientX, event.clientY)){
        trashItem(finished);
    } else if (to && to !== finished.slot && canSwap(finished.slot, to)){
        swapSlots(finished, target);
    } else {
        sendBack(finished);
    }
}

function cancelDrag(){
    if (!drag){
        return;
    }
    stopListening();
    const finished = drag;
    drag = null;
    if (finished.ghost){
        sendBack(finished);
    }
}

// Makes the item follow the cursor
function flyGhost(finished, transform, then, fade = false){
    finished.ghost.style.transition = "transform 0.15s ease-out, opacity 0.15s ease-out";
    finished.ghost.style.transform = transform;
    if (fade){
        finished.ghost.style.opacity = "0";
    }
    setTimeout(() => {
        finished.ghost.remove();
        clearDragLook(finished);
        then?.();
    }, 160);
}

// Item dropped somewhere invalid
function sendBack(finished){
    const home = finished.button.getBoundingClientRect();
    flyGhost(finished, `translate(${home.left}px, ${home.top}px)`);
}

// Item dropped on delete
function trashItem(finished){
    const trash = center(deleteButton.getBoundingClientRect());
    const size = finished.ghost.getBoundingClientRect().width / 1.1;
    flyGhost(finished, `translate(${trash.x - size / 2}px, ${trash.y - size / 2}px) scale(0.3)`, () => {
        setSlot(finished.slot, null);
        renderGrid();
    }, true);
}

function slideIn(element, fromRect, scale){
    const from = center(fromRect);
    const to = center(element.getBoundingClientRect());
    element.classList.add("moving");
    for (const child of element.children){
        child.style.transform = `translate(${from.x - to.x}px, ${from.y - to.y}px) scale(${scale})`;
    }
    element.getBoundingClientRect();
    for (const child of element.children){
        child.style.transition = "transform 0.16s cubic-bezier(0.2, 0, 0.2, 1)";
        child.style.transform = "";
    }
    setTimeout(() => element.classList.remove("moving"), 200);
}

function swapSlots(finished, target){
    const from = finished.slot;
    const to = target.dataset.slot;
    const dropRect = finished.ghost.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const displaced = editing.kit[to];
    setSlot(to, editing.kit[from]);
    setSlot(from, displaced);
    finished.ghost.remove();
    clearDragLook(finished);
    renderGrid();
    slideIn(slotElement(to), dropRect, 1.1);
    if (displaced){
        slideIn(slotElement(from), targetRect, 1);
    }
}

function save(){
    const error = editing.save(nameField.value.trim(), orderedKit());
    if (error){
        errorLine.textContent = error;
        return;
    }
    modal.close();
}

async function requestClose(){
    if (snapshot() === savedState || await askConfirm("You have unsaved changes", "Discard", "Keep Editing", { danger: true })){
        modal.close();
    }
}

async function backdropClose(){
    if (snapshot() === savedState){
        modal.close();
        return;
    }
    const answer = await askChoice("You have unsaved changes", "Save", "Don't Save", { closeButton: true });
    if (answer === "yes"){
        save();
    } else if (answer === "no"){
        modal.close();
    }
}

async function resetKit(){
    if (!await askConfirm("Reset to the default kit?", "Reset", "Cancel", { note: "This action cannot be taken back" })){
        return;
    }
    editing.kit = structuredClone(editing.resetKit);
    renderGrid();
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches){
        resetButton.querySelector(".icon-reset").animate(
            [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
            { duration: 350, easing: "ease" },
        );
    }
}

export function openKit(options){
    editing = { ...options, kit: structuredClone(options.kit) };
    const isDefault = options.name === null;

    roomLine.textContent = options.room;
    defaultTitle.hidden = !isDefault;
    nameField.hidden = isDefault;
    nameField.value = options.name ?? "";
    note.textContent = options.note ?? "";
    note.hidden = !options.note;
    errorLine.textContent = "";
    resetButton.hidden = !options.resetKit;
    copyButton.hidden = !options.copyPlayer;
    copyButton.classList.remove("copied", "failed");
    deleteButton.hidden = !options.deletePlayer;
    renderGrid();
    savedState = snapshot();
    modal.showModal();
    if (options.name === ""){
        nameField.focus();
    } else {
        modal.focus();
    }
}

function buildPickerItem(id, nbt = ""){
    const item = nbt ? { id, nbt } : { id };
    const name = potionName(item) ?? itemName(id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "picker-item";
    button.dataset.id = id;
    button.dataset.nbt = nbt;
    button.dataset.name = name.toLowerCase();
    button.title = name;
    button.setAttribute("role", "option");
    button.setAttribute("aria-label", name);
    button.append(buildIcon(item));
    button.addEventListener("click", event => {
        if (event.detail === 1){
            armedButton = button;
        }
        selectItem(id, nbt);
    });
    button.addEventListener("dblclick", () => {
        if (armedButton === button){
            savePick();
        }
    });
    return button;
}

function buildPickerEntries(id){
    const variants = potionVariants(id);
    return variants.length > 0 ? variants.map(nbt => buildPickerItem(id, nbt)) : [buildPickerItem(id)];
}

function buildPickerItems(){
    const groups = ITEM_GROUPS.map(({ name, items }, i) => {
        const group = document.createElement("div");
        group.className = "picker-group";
        group.setAttribute("role", "group");
        group.setAttribute("aria-labelledby", `picker-group-${i}`);
        const heading = document.createElement("p");
        heading.className = "picker-group-name";
        heading.id = `picker-group-${i}`;
        heading.textContent = name;
        const list = document.createElement("div");
        list.className = "picker-group-items";
        list.append(...items.flatMap(buildPickerEntries));
        group.append(heading, list);
        return group;
    });
    itemList.replaceChildren(...groups);
    itemButtons = [...itemList.querySelectorAll(".picker-item")];
}

// The up and down arrows dimmer
function updateStepper(){
    const count = Number(countField.value) || 1;
    countUp.disabled = count >= Number(countField.max);
    countDown.disabled = count <= 1;
}

function setCountLimit(id){
    countField.max = id ? stackSize(id) : 64;
    countField.value = Math.max(1, Math.min(Math.floor(Number(countField.value)) || 1, countField.max));
    updateStepper();
}

function setNbt(on){
    nbtOn = on;
    nbtToggle.setAttribute("aria-pressed", on);
    nbtField.hidden = !on;
}

function selectItem(id, nbt = ""){
    const filledIn = selectedNbt || (selectedId ? nbtExample(selectedId) : "");
    if (!nbtOn || nbtField.value === filledIn){
        nbtField.value = nbt || (id ? nbtExample(id) : "");
    }
    selectedId = id;
    selectedNbt = nbt;
    for (const button of itemButtons){
        button.setAttribute("aria-selected", button.dataset.id === id && button.dataset.nbt === nbt);
    }
    setCountLimit(id);
}

function filterItems(){
    const words = search.value.trim().toLowerCase().split(/\s+/);
    for (const button of itemButtons){
        button.hidden = !fitsSlot(button.dataset.id, pickedSlot) || !words.every(word => button.dataset.name.includes(word));
    }
    for (const group of itemList.children){
        group.hidden = !group.querySelector(".picker-item:not([hidden])");
    }
    const first = [...itemList.children].find(group => !group.hidden);
    for (const group of itemList.children){
        group.querySelector(".picker-group-name").hidden = group === first;
    }
    updateTab();
}

function updateTab(){
    const top = itemList.getBoundingClientRect().top + 1;
    let current = null;
    for (const group of itemList.children){
        if (!group.hidden && (!current || group.querySelector(".picker-group-name").getBoundingClientRect().bottom <= top)){
            current = group;
        }
    }
    pickerTab.textContent = current?.querySelector(".picker-group-name").textContent ?? "";
}

function searchEnter(event){
    if (event.key !== "Enter"){
        return;
    }
    event.preventDefault();
    const selected = itemList.querySelector(".picker-item[aria-selected='true']");
    if (selected && !selected.hidden){
        savePick();
        return;
    }
    const first = itemList.querySelector(".picker-item:not([hidden])");
    if (first){
        selectItem(first.dataset.id, first.dataset.nbt);
        first.scrollIntoView({ block: "nearest" });
    }
}

function entryNbt(item){
    return item?.nbt && potionVariants(item.id).includes(item.nbt) ? item.nbt : "";
}

function openPicker(slot){
    const item = editing.kit[slot];
    pickedSlot = slot;
    armedButton = null;
    pickerTitle.textContent = slotLabel(slot);
    search.value = "";
    pickerError.textContent = "";
    countField.value = item?.count ?? 1;
    selectedId = null;
    selectedNbt = "";
    setNbt(Boolean(item?.nbt) && item.nbt !== entryNbt(item));
    nbtField.value = item?.nbt ?? "";
    selectItem(item?.id ?? null, entryNbt(item));
    filterItems();
    picker.showModal();
    itemList.scrollTop = 0;
    itemList.querySelector("[aria-selected='true']")?.scrollIntoView({ block: "center" });
    updateTab();
}

function closePicker(){
    picker.close();
    renderGrid();
    slotElement(pickedSlot).focus();
}

function savePick(){
    const typed = nbtOn ? nbtField.value.trim() : selectedNbt;
    const nbt = typed === "{}" ? "" : typed;
    const problem = nbtProblem(nbt);
    if (problem){
        pickerError.textContent = problem;
        nbtField.focus();
        return;
    }
    if (selectedId){
        setCountLimit(selectedId);
        const item = { id: selectedId, count: Number(countField.value) };
        setSlot(pickedSlot, nbt ? { ...item, nbt } : item);
    }
    closePicker();
}

function stepCount(step){
    const before = Number(countField.value) || 1;
    countField.value = Math.max(1, Math.min(before + step, Number(countField.max)));
    updateStepper();
    return Number(countField.value) !== before;
}

function setupHold(button, step){
    let timer = null;
    const stop = () => clearTimeout(timer);
    button.addEventListener("pointerdown", event => {
        event.preventDefault();
        if (button.disabled || !stepCount(step)){
            return;
        }
        const started = Date.now();
        const repeat = () => {
            if (stepCount(step)){
                timer = setTimeout(repeat, Date.now() - started > 1500 ? 25 : 70);
            }
        };
        timer = setTimeout(repeat, 400);
    });
    for (const type of ["pointerup", "pointerleave", "pointercancel"]){
        button.addEventListener(type, stop);
    }
    // Clicks without a pointer (screen reader)
    button.addEventListener("click", event => {
        if (event.detail === 0){
            stepCount(step);
        }
    });
}

export function setupInventory(){
    setupModal(modal, backdropClose);
    setupModal(picker, savePick);
    buildPickerItems();

    document.querySelector("#kit-close").addEventListener("click", requestClose);
    modal.addEventListener("cancel", event => {
        event.preventDefault();
        if (drag){
            cancelDrag();
        } else {
            requestClose();
        }
    });
    modal.addEventListener("keydown", event => {
        if (event.key === "s" && (event.ctrlKey || event.metaKey)){
            event.preventDefault();
            save();
        }
    });
    form.addEventListener("submit", event => {
        event.preventDefault();
        save();
    });
    resetButton.addEventListener("click", resetKit);
    copyButton.addEventListener("click", async () => {
        copyFromButton(copyButton, await editing.copyPlayer(nameField.value.trim(), orderedKit()));
    });
    deleteButton.addEventListener("click", () => editing.deletePlayer(() => modal.close()));

    document.querySelector("#picker-close").addEventListener("click", closePicker);
    picker.addEventListener("cancel", event => {
        event.preventDefault();
        closePicker();
    });
    setupHold(countUp, 1);
    setupHold(countDown, -1);
    // Typing can't go past or below the item stack size
    countField.addEventListener("input", () => {
        if (countField.value !== ""){
            countField.value = Math.max(1, Math.min(Math.floor(Number(countField.value)) || 1, Number(countField.max)));
        }
        updateStepper();
    });
    search.addEventListener("input", filterItems);
    itemList.addEventListener("scroll", updateTab);
    search.addEventListener("keydown", searchEnter);
    nbtToggle.addEventListener("click", () => {
        setNbt(!nbtOn);
        pickerError.textContent = "";
        if (nbtOn){
            nbtField.focus();
        }
    });
    pickerForm.addEventListener("submit", event => {
        event.preventDefault();
        savePick();
    });
    document.querySelector("#picker-empty").addEventListener("click", () => {
        setSlot(pickedSlot, null);
        closePicker();
    });
}
