const POPULAR_GIFTS = [
    "Artisan Brick", "Toy Bear", "Delicious Cake", "Homemade Cake",
    "Lol Pop", "Durov's Cap", "Signet Ring", "Bunny Muffin",
    "Fresh Socks", "Diamond Ring", "Plush Pepe", "Ice Cream",
    "Berry Box", "Heart Locket", "Eternal Rose", "Gold Star",
    "Cupid Charm", "Whip Cupcake", "Spiced Wine", "Christmas Tree",
    "Skull", "Statue of Liberty", "Santa Hat", "Snow Globe",
    "Jester Hat", "Top Hat", "Cowboy Hat", "Bunny",
    "Horse", "Bear", "Cat", "Dog", "Crown", "Sword", "Shield", "Torch",
];

function slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/g, "").replace(/^-+/g, "");
}

export default async function handler(req, res) {
    const { search = "", limit = 30 } = req.query;

    let names = POPULAR_GIFTS;
    if (search) {
        names = names.filter(n => n.toLowerCase().includes(String(search).toLowerCase()));
    }
    names = names.slice(0, Number(limit));

    const results = await Promise.all(names.map(async (name) => {
        const slug = slugify(name);
        try {
            const resp = await fetch(`https://fragment.com/gift/${slug}`, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept-Language": "en-US,en;q=0.9",
                },
            });
            if (!resp.ok) {
                return { name, slug, price_ton: null, image: null, verified: true };
            }
            const html = await resp.text();
            let price = null;
            let image = null;

            const m1 = html.match(/"price"\s*:\s*([0-9.]+)/);
            if (m1) price = parseFloat(m1[1]);
            if (price === null) {
                const m2 = html.match(/class="tm-value[^"]*icon-ton[^"]*"[^>]*>([0-9.,]+)/);
                if (m2) price = parseFloat(m2[1].replace(/,/g, ""));
            }

            const mImg = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
            if (mImg) image = mImg[1];

            return {
                name,
                slug,
                price_ton: price,
                image: image,
                verified: true,
                url: `https://fragment.com/gift/${slug}`,
            };
        } catch (e) {
            return { name, slug, price_ton: null, image: null, verified: true };
        }
    }));

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json({ gifts: results });
}
