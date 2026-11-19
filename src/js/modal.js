// Clicking the backdrop closes a modal, but not when a text selection only ends there
export function setupModal(modal){
    let pressedBackdrop = false;
    modal.addEventListener("pointerdown", event => {
        pressedBackdrop = event.target === modal;
    });
    modal.addEventListener("click", event => {
        if (pressedBackdrop && event.target === modal){
            modal.close();
        }
    });
}
