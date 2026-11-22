const links = document.querySelectorAll(".site-nav a");
const pages = document.querySelectorAll("main[data-page]");

function showPage(){
    const names = [...pages].map(page => `#${page.dataset.page}`);
    const hash = names.includes(location.hash) ? location.hash : "#rooms";
    for (const page of pages){
        page.hidden = `#${page.dataset.page}` !== hash;
    }
    for (const link of links){
        if (link.hash === hash){
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    }
}

export function setupNav(){
    showPage();
    window.addEventListener("hashchange", showPage);
}
