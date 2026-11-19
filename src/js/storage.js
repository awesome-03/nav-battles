const ROOMS_KEY = "nav-battles:rooms";

// null on the first visit
export function loadRooms(){
    try {
        const saved = JSON.parse(localStorage.getItem(ROOMS_KEY));
        if (saved && Array.isArray(saved.rooms)){
            return { rooms: saved.rooms, currentId: saved.currentId ?? null };
        }
    } catch {
        // if storage is blocked or the saved rooms are broken
    }
    return null;
}

export function saveRooms(state){
    try {
        localStorage.setItem(ROOMS_KEY, JSON.stringify({ nb: 1, rooms: state.rooms, currentId: state.currentId }));
    } catch {
        // if storage is blocked, the rooms only stays until the page closes
    }
}
