import { setupModal } from "./modal.js";
import { copyFromButton } from "./copy.js";

const modal = document.querySelector("#export-modal");
const title = document.querySelector("#export-title");
const message = document.querySelector("#export-message");
const copyButton = document.querySelector("#export-copy");
const downloadButton = document.querySelector("#export-download");

let code = "";
let fileName = "";
let downloadTimer = null;

// Arrow drop animation
function download(){
    const file = new Blob([code], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = `${fileName.replace(/[\\/:*?"<>|]/g, "")}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href));
    clearTimeout(downloadTimer);
    downloadButton.classList.remove("downloaded");
    downloadButton.offsetWidth; // restarts the animation when clicked again
    downloadButton.classList.add("downloaded");
    downloadTimer = setTimeout(() => downloadButton.classList.remove("downloaded"), 600);
}

export function openExport({ title: titleText, message: messageText, code: exportedCode, name }){
    title.textContent = titleText;
    message.textContent = messageText;
    code = exportedCode;
    fileName = name;
    copyButton.classList.remove("copied", "failed");
    modal.showModal();
}

export function setupExport(){
    setupModal(modal);
    document.querySelector("#export-close").addEventListener("click", () => modal.close());
    downloadButton.addEventListener("click", download);
    copyButton.addEventListener("click", () => copyFromButton(copyButton, code));
}
