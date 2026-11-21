import { setupModal } from "./modal.js";

const modal = document.querySelector("#import-modal");
const title = document.querySelector("#import-title");
const message = document.querySelector("#import-message");
const errorLine = document.querySelector("#import-error");
const fileInput = document.querySelector("#import-file");

export const ROOM_IMPORT = { title: title.textContent, message: message.textContent };

let current = null;

export function openImport({ title: titleText, message: messageText, read, done }){
    current = { read, done };
    title.textContent = titleText;
    message.textContent = messageText;
    errorLine.textContent = "";
    modal.showModal();
    getSelection()?.collapse(modal, 0);
}

async function importText(text){
    let result;
    try {
        result = await current.read(text);
    } catch (err){
        errorLine.textContent = err.message;
        return;
    }
    modal.close();
    current.done(result);
}

async function pasteFromClipboard(){
    let text;
    try {
        text = await navigator.clipboard.readText();
    } catch {
        errorLine.textContent = "The browser didn't let this page read your clipboard. Press Ctrl+V instead, or upload a file.";
        return;
    }
    importText(text);
}

// Read the file text
export function setupImport(){
    setupModal(modal);
    document.querySelector("#import-close").addEventListener("click", () => modal.close());
    document.querySelector("#import-paste").addEventListener("click", pasteFromClipboard);
    document.querySelector("#import-choose-file").addEventListener("click", () => fileInput.click());
    document.addEventListener("paste", event => {
        if (!modal.open){
            return;
        }
        event.preventDefault();
        importText(event.clipboardData.getData("text"));
    });
    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        fileInput.value = "";
        if (file){
            importText(await file.text());
        }
    });
}
