const links = document.querySelectorAll(".site-nav a");

// Marks the link for the page as the selected one
function markCurrentPage(){
    const hash = location.hash || "#rooms";
    for (const link of links){
        if (link.hash === hash){
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    }
}

export function setupNav(){
    markCurrentPage();
    window.addEventListener("hashchange", markCurrentPage);
}
