var current_symbol = undefined;

fetch("/api/get_today").then(res => res.json().then((res_json) => {
    console.log(res_json);
    window.res_json = res_json

    const pallet_ctn = document.getElementById("pallet");
    for (let i = 0; i < res_json["pallet"].length; i++) {
        const icon = document.createElement("div");
        icon.classList.add("col_icon");
        icon.style = `background-color: ${res_json["pallet"][i]}`
        icon.onclick = () => on_col_click(i);
        pallet_ctn.appendChild(icon);
    }

    const symbol_ctn = document.getElementById("symbols");
    for (let i = 0; i < res_json["symbols"].length; i++) {
        const icon = document.createElement("img");
        icon.src = res_json["symbols"][i][0];
        icon.onclick = () => on_symbol_click(i);
        icon.classList.add("symb_icon");
        symbol_ctn.appendChild(icon);
    }
}));

const stage = new Konva.Stage({
    container: 'container',
    width: 700,
    height: 500
});
const layer = new Konva.Layer();
stage.add(layer);
const tr = new Konva.Transformer({
    enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
    borderStroke: "#205",
    borderStrokeWidth: 3,

    anchorFill: "#fffa",
    anchorStroke: "#205",
    anchorStrokeWidth: 2,
    anchorSize: 20,
    anchorCornerRadius: 6,

    anchorStyleFunc: (anchor) => {
        if (anchor.hasName("top-left")) {
            anchor.fill("#f55a");
        }
        if (anchor.hasName("top-right")) {
            anchor.fill("#55fa");
        }
        if (anchor.hasName("bottom-right")) {
            anchor.fill("#5f5a");
        }
        if (anchor.hasName("bottom-left")) {
            anchor.fill("#002a");
        }
    }
});
layer.add(tr);

function tint(hex) {
    const { r, g, b } = Konva.Util.getRGB(current_symbol.getAttr("current_tint"));
    current_symbol.cache();
    current_symbol.filters([Konva.Filters.Brighten, Konva.Filters.RGB]);
    current_symbol.brightness(1);
    current_symbol.red(r);
    current_symbol.green(g);
    current_symbol.blue(b);
}

on_symbol_click = (id) => {
    console.log(window.res_json["symbols"][id][0]);
    
    const sym_img = new Image()
    sym_img.onload = () => {
        current_symbol = new Konva.Image({
            x: 0,
            y: 0,
            image: sym_img,
            width: 64,
            height: 64,
            draggable: true,
            name: "selectable"
        });
        layer.add(current_symbol);
        tr.nodes([current_symbol]);
        tr.moveToTop();

        current_symbol.setAttr("current_tint", window.res_json["pallet"][0])
        tint();

        current_symbol.on("transformend", () => {
            current_symbol.clearCache();

            current_symbol.width(current_symbol.width() * Math.abs(current_symbol.scaleX()));
            current_symbol.height(current_symbol.height() * Math.abs(current_symbol.scaleY()));
            current_symbol.scale({ x: 1, y: 1});

            tint();
            tr.forceUpdate();
        });
    }
    sym_img.src = window.res_json["symbols"][id][0];
}

on_col_click = (id) => {
    current_symbol.setAttr("current_tint", window.res_json["pallet"][id])
    tint()
}

stage.on("mousedown tap", (e) => {
    if (e.target === stage) {
        tr.nodes([]);
        return;
    }

    if (e.target.hasName("selectable")) {
        tr.nodes([e.target]);
        tr.moveToTop();
    }
});