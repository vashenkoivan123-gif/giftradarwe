var tg = window.Telegram && window.Telegram.WebApp;
if (tg) { tg.ready(); tg.expand(); }
var allGifts = [];
var currentSort = "popular";

function initTheme() {
    var saved = localStorage.getItem("theme") || "dark";
    document.body.setAttribute("data-theme", saved);
    document.getElementById("theme-toggle").textContent = saved === "dark" ? "🌙" : "☀️";
}

document.getElementById("theme-toggle").addEventListener("click", function() {
    var cur = document.body.getAttribute("data-theme") || "dark";
    var next = cur === "dark" ? "light" : "dark";
    document.body.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    document.getElementById("theme-toggle").textContent = next === "dark" ? "🌙" : "☀️";
});

function loadGifts() {
    fetch("/api/gifts?limit=50")
        .then(function(r) { return r.json(); })
        .then(function(d) { allGifts = d.gifts || []; renderGifts(); })
        .catch(function() {
            document.getElementById("gifts").innerHTML = '<div class="error">Ошибка загрузки</div>';
        });
}

function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
}

function renderGifts() {
    var c = document.getElementById("gifts");
    var list = allGifts.slice();
    var s = document.getElementById("search").value.toLowerCase();
    if (s) list = list.filter(function(g) { return g.name.toLowerCase().indexOf(s) !== -1; });
    if (currentSort === "cheap") list.sort(function(a, b) { return (a.price_ton || 0) - (b.price_ton || 0); });
    else if (currentSort === "expensive") list.sort(function(a, b) { return (b.price_ton || 0) - (a.price_ton || 0); });

    if (!list.length) {
        c.innerHTML = '<div class="empty">Ничего не найдено 🔍</div>';
        return;
    }

    var html = "";
    for (var i = 0; i < list.length; i++) {
        var g = list[i];
        var premiumCls = g.price_ton > 50 ? "premium" : "";
        var price = g.price_ton ? g.price_ton.toFixed(2) + " TON" : "—";
        var imgHtml = g.image
            ? '<img src="' + g.image + '" alt="" onerror="this.parentNode.innerHTML=\'<span class=&quot;fallback&quot;>🎁</span>\'">'
            : '<span class="fallback">🎁</span>';

        html += '<div class="gift-card ' + premiumCls + '" data-gift="' + escapeHtml(g.name) + '">';
        html += '<div class="verified-badge">✓</div>';
        html += '<div class="gift-image">' + imgHtml + '</div>';
        html += '<div class="gift-name">' + escapeHtml(g.name) + '</div>';
        html += '<div class="gift-price">' + price + '</div>';
        html += '</div>';
    }
    c.innerHTML = html;

    var cards = c.querySelectorAll(".gift-card");
    for (var j = 0; j < cards.length; j++) {
        cards[j].addEventListener("click", function(ev) {
            addGift(this.getAttribute("data-gift"), ev);
        });
    }
}

function addGift(name, e) {
    var flyer = document.getElementById("flying-gift");
    var r = e && e.target && e.target.getBoundingClientRect();
    if (r) {
        flyer.style.left = (r.left + r.width / 2 - 20) + "px";
        flyer.style.top = (r.top + r.height / 2 - 20) + "px";
    }
    flyer.classList.add("fly");
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");
    setTimeout(function() {
        flyer.style.transition = "all .5s";
        flyer.style.opacity = "0";
    }, 50);
    setTimeout(function() {
        flyer.classList.remove("fly");
        flyer.style.transition = "";
        flyer.style.opacity = "";
        flyer.style.left = "";
        flyer.style.top = "";
    }, 800);
    if (tg) tg.sendData(JSON.stringify({ action: "watch", gift: name }));
    showToast("✅ " + name + " добавлен");
}

function showToast(t) {
    var el = document.getElementById("toast");
    el.textContent = t;
    el.classList.add("show");
    setTimeout(function() { el.classList.remove("show"); }, 2000);
}

document.getElementById("search").addEventListener("input", renderGifts);
var filters = document.querySelectorAll(".filter");
for (var i = 0; i < filters.length; i++) {
    filters[i].addEventListener("click", function() {
        var all = document.querySelectorAll(".filter");
        for (var j = 0; j < all.length; j++) all[j].classList.remove("active");
        this.classList.add("active");
        currentSort = this.dataset.sort;
        renderGifts();
    });
}

initTheme();
loadGifts();
