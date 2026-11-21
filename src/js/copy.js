const resetTimers = new WeakMap();

export async function copyToClipboard(text){
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err){
        console.warn(`Clipboard blocked: ${err}`);
        return false;
    }
}

export async function copyFromButton(button, text){
    const copied = await copyToClipboard(text);
    const state = copied ? "copied" : "failed";

    clearTimeout(resetTimers.get(button));
    button.classList.remove("copied", "failed");
    button.classList.add(state);
    resetTimers.set(button, setTimeout(() => button.classList.remove(state), 1500));
}
