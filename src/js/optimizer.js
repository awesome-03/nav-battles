import { fullParts } from "./command.js";

self.addEventListener("message", ({ data }) => {
    self.postMessage(fullParts(data.commands, data.room));
});
