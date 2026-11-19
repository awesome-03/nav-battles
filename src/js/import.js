import { setupModal } from "./modal.js";
import { readRooms } from "./rooms.js";

const modal = document.querySelector("#import-modal");
const form = document.querySelector("#import-form");
const codeField = document.querySelector("#import-text");
const errorLine = document.querySelector("#import-error");
const fileInput = document.querySelector("#import-file");

// Read the file text
export function setupImport(state, addRooms){
    async function importText(text){
        let added;
        try {
            added = await readRooms(text, state.rooms);
        } catch (err){
            errorLine.textContent = err.message;
            return;
        }
        // Closed first, so the new room is focused
        modal.close();
        addRooms(added);
    }

    setupModal(modal);
    document.querySelector("#import-rooms").addEventListener("click", () => {
        form.reset();
        errorLine.textContent = "";
        modal.showModal();
    });
    document.querySelector("#import-close").addEventListener("click", () => modal.close());
    document.querySelector("#import-choose-file").addEventListener("click", () => fileInput.click());

    form.addEventListener("submit", event => {
        event.preventDefault();
        importText(codeField.value);
    });
    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        fileInput.value = "";
        if (file){
            importText(await file.text());
        }
    });
}
