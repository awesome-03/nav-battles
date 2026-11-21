let dialog = null;

export async function askConfirm(message, yesLabel, noLabel = "Cancel", options = {}){
    return await askChoice(message, yesLabel, noLabel, options) === "yes";
}

export function askChoice(message, yesLabel, noLabel, { danger = false, note = "", closeButton = false } = {}){
    dialog ??= buildDialog();
    const yes = dialog.querySelector(".confirm-yes");
    const noteLine = dialog.querySelector(".confirm-note");
    dialog.querySelector(".confirm-close").hidden = !closeButton;
    dialog.querySelector(".confirm-message").textContent = message;
    noteLine.textContent = note;
    noteLine.hidden = !note;
    yes.textContent = yesLabel;
    dialog.querySelector(".confirm-no").textContent = noLabel;
    yes.classList.toggle("confirm-danger", danger);
    yes.classList.toggle("button-primary", !danger);
    dialog.returnValue = "";
    dialog.showModal();
    dialog.querySelector(".confirm-no").focus();

    return new Promise(resolve => {
        dialog.addEventListener("close", () => resolve(dialog.returnValue), { once: true });
    });
}

function buildDialog(){
    const element = document.createElement("dialog");
    element.className = "confirm-dialog";
    element.innerHTML = `
        <form class="confirm-box" method="dialog">
            <div class="modal-header">
                <div>
                    <p class="confirm-message"></p>
                    <p class="confirm-note"></p>
                </div>
                <button class="confirm-close icon-button" value="" aria-label="Close" title="Close">
                    <span class="icon icon-cross" aria-hidden="true"></span>
                </button>
            </div>
            <div class="confirm-buttons">
                <button class="confirm-no button button-outline" value="no"></button>
                <button class="confirm-yes button button-primary" value="yes"></button>
            </div>
        </form>`;
    element.addEventListener("click", event => {
        if (event.target === element){
            element.close();
        }
    });
    document.body.append(element);
    return element;
}
