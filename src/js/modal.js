export function setupModal(modal, onBackdrop = () => modal.close()){
    let pressedBackdrop = false;
    modal.addEventListener("pointerdown", event => {
        pressedBackdrop = event.target === modal;
    });
    modal.addEventListener("click", event => {
        if (pressedBackdrop && event.target === modal){
            onBackdrop();
        }
    });
}
