const MAX_SIZE = 128;

var current_symbol = undefined;
const art_history = [];
var index = -1;
let next_uid = 1;

const frames = [
    "/static/frames/0.png",
    "/static/frames/1.png",
    "/static/frames/2.png",
    "/static/frames/3.png",
    "/static/frames/4.png"
];

fetch("/api/get_today").then(res => res.json().then((res_json) => {
    console.log(res_json);
    window.res_json = res_json

    const pallet_ctn = document.getElementById("pallet");
    for (let i = 0; i < res_json["pallet"].length; i++) {
        const li = document.createElement("li");
        const icon = document.createElement("div");
        icon.classList.add("col_icon");
        icon.style = `background-color: ${res_json["pallet"][i]}`
        icon.onclick = () => on_col_click(i);
        li.appendChild(icon)
        pallet_ctn.appendChild(li);
    }

    const symbol_ctn = document.getElementById("symbols");
    for (let i = 0; i < res_json["symbols"].length; i++) {
        const li = document.createElement("li");
        const div = document.createElement("div");
        div.classList.add("symb_ctn");
        const amount = document.createElement("p");
        amount.classList.add("sums");
        amount.innerText = res_json["symbols"][i][1];
        const icon = document.createElement("img");
        icon.src = res_json["symbols"][i][0];
        icon.onclick = () => on_symbol_click(i);
        icon.classList.add("symb_icon");
        div.appendChild(icon)
        div.appendChild(amount)
        li.appendChild(div);
        symbol_ctn.appendChild(li);
    }
}));

var stage = new Konva.Stage({
    container: 'container',
    width: 700,
    height: 500
});
const layer = new Konva.Layer();
stage.add(layer);
const tr = new Konva.Transformer({
    flipEnabled: false,

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
serialise();

function tint(node = current_symbol) {
    const tintColour = node.getAttr("current_tint") || window.res_json["pallet"][0];
    const { r, g, b } = Konva.Util.getRGB(tintColour);

    node.cache();
    node.filters([Konva.Filters.Brighten, Konva.Filters.RGB]);
    node.brightness(1);
    node.red(r);
    node.green(g);
    node.blue(b);

    node.drawHitFromCache(0.5);
}

on_symbol_click = (id) => {
    create_symbol(id)
}

function create_symbol(id) {
    window.edited = true;
    console.log(window.res_json["symbols"][id][0]);

    const amount = document.getElementsByClassName("sums")[id];
    
    if (amount.innerText > 0) {
        amount.innerText -= 1;

        if (amount.innerText == 0) {
            const image = document.getElementsByClassName("symb_icon")[id];
            image.classList.add("disabled");
        }

        const sym_img = new Image()
        sym_img.onload = () => {
            let nw = sym_img.naturalWidth;
            let nh = sym_img.naturalHeight;

            if (!nw || !nh) {
                nw = sym_img.width || 1;
                nh = sym_img.height || 1;
            }

            const k = MAX_SIZE / Math.max(nw, nh);
            const width = nw * k;
            const height = nh * k;


            current_symbol = new Konva.Image({
                x: stage.width() / 2 - width / 2,
                y: stage.height() / 2 - height / 2,
                image: sym_img,
                width: width,
                height: height,
                draggable: true,
                name: "selectable",
                id: id,
                uid: next_uid++,
            });
            layer.add(current_symbol);
            tr.nodes([current_symbol]);
            tr.moveToTop();

            current_symbol.setAttr("current_tint", window.res_json["pallet"][0])
            tint();

            handlers(current_symbol);
            serialise();
        }
        sym_img.crossOrigin = 'Anonymous';
        sym_img.src = window.res_json["symbols"][id][0];
    }
}

on_col_click = (id) => {
    current_symbol.setAttr("current_tint", window.res_json["pallet"][id])
    tint()
    serialise();
}

stage.on("mousedown tap", (e) => {
    if (e.target === stage) {
        current_symbol = undefined;
        tr.nodes([]);
        serialise();
        return;
    }

    if (e.target.hasName("selectable")) {
        current_symbol = e.target;
        tr.nodes([e.target]);
        tr.moveToTop();
        serialise();
    }
});

function move_down() {
    if (current_symbol !== undefined) {
        current_symbol.moveDown();
        layer.batchDraw();
        serialise();
    }
}

function move_up() {
    if (current_symbol !== undefined) {
        current_symbol.moveUp();
        layer.batchDraw();
        serialise();
    }
}

function remove() {
    if (current_symbol !== undefined) {
        remove_symbol(current_symbol);
        current_symbol = undefined;
        serialise();
    }
}

function remove_symbol(node) {
    tr.nodes([]);

    const id = node.getAttr("id");

    node.destroy();

    const amount = document.getElementsByClassName("sums")[id]
    
    if (amount.innerText == 0) {
        const image = document.getElementsByClassName("symb_icon")[id];
        image.classList.remove("disabled");
    }

    amount.innerText = Number(amount.innerText) + 1;
}

function submit() {
    const modal = document.getElementById("modal");
    modal.style = "display: flex;"

    const frame_ctn = document.getElementById("frame");
    frame_ctn.innerHTML = "";

    const target_frame = frames[Math.floor(Math.random() * frames.length)];

    tr.nodes([])
    const export_frame = stage.toDataURL();
    const art_img = new Image();
    art_img.src = export_frame;
    art_img.crossOrigin = 'Anonymous';
    art_img.onload = () => {
        const frame_img = new Image();
        frame_img.crossOrigin = 'Anonymous';
        frame_img.src = target_frame;
        frame_img.onload = () => {
            const frame_w = Math.floor(frame_img.naturalWidth * 0.862068966);
            const frame_h = Math.floor(frame_img.naturalHeight * 0.862068966);

            frame_ctn.style.width = `${frame_w}px`;
            frame_ctn.style.height = `${frame_h}px`;

            const art_img_ele = document.createElement("img");
            art_img_ele.setAttribute("src", export_frame);
            art_img_ele.classList.add("render_frame");

            const frame_img_ele = document.createElement("img");
            frame_img_ele.setAttribute("src", target_frame);
            frame_img_ele.style.width = `${Math.floor(frame_img.naturalWidth * 0.862068966)}px`;
            frame_img_ele.style.height = `${Math.floor(frame_img.naturalHeight * 0.862068966)}px`;
            frame_img_ele.classList.add("frame_image")

            frame_ctn.appendChild(frame_img_ele);
            frame_ctn.appendChild(art_img_ele);
        }
    };
    
}

function modal_cancel() {
    const modal = document.getElementById("modal");
    modal.style = "display: none;"
}

function modal_submit() {
    const subtitle = document.getElementById("subtitle").value
    stage.setAttr("subtitle", subtitle);

    tr.destroy();
    const json = stage.toJSON();
    console.log(json);

    fetch("/api/submit", {
        method: "post",
        headers: {
            "Content-Type": "application/json"
        },
        body: json
    }).then((resp) => {
        window.edited = false;
        window.location.reload();
    })
}

function flip_vert() {
    flip("y");
}

function flip_hori() {
    flip("x");
}

function flip(axis) {
    if (current_symbol === undefined) return;

    const centre = { x: current_symbol.width() / 2, y: current_symbol.height() / 2 }
    const before = current_symbol.getAbsoluteTransform().point(centre)

    if (axis === "x") {
        current_symbol.scaleX(-current_symbol.scaleX());
    } else {
        current_symbol.scaleY(-current_symbol.scaleY());
    }

    const after = current_symbol.getAbsoluteTransform().point(centre);

    current_symbol.x(current_symbol.x() + (before.x - after.x));
    current_symbol.y(current_symbol.y() + (before.y - after.y));
    serialise();
}

window.addEventListener("beforeunload", (e) => {
    if (window.edited) {
        var message = "Are you sure you want to leave as your art will be lost?";
        (e || window.event).returnValue = message;
        return message;
    }
})

function handlers(node) {
    node.on("transformend", () => {
        node.clearCache();

        node.width(node.width() * Math.abs(node.scaleX()));
        node.height(node.height() * Math.abs(node.scaleY()));
        
        node.scale({
            x: node.scaleX() < 0 ? -1 : 1,
            y: node.scaleY() < 0 ? -1 : 1
        });

        tint(node);
        tr.forceUpdate();
        serialise();
    });

    node.on("dragend", () => {
        const box = node.getClientRect();
        const offScreen =  (
            box.x + box.width  < 0 ||
            box.y + box.height < 0 ||
            box.x > stage.width() ||
            box.y > stage.height()
        );

        if (offScreen) {
            remove_symbol(current_symbol);
            current_symbol = undefined;
        }

        serialise();
    });
}

function collect_symbols(node, out = []) {
    if (node.className === "Image" && node.attrs.name === "selectable") {
        out.push(node.attrs);
    }
    (node.children || []).forEach(child => collect_symbols(child, out));
    return out;
}

function recount() {
    const used = {};
    layer.find(".selectable").forEach(n => {
        const id = n.getAttr("id");
        used[id] = (used[id] || 0) + 1;
    });

    const sums = document.getElementsByClassName("sums");
    const icons = document.getElementsByClassName("symb_icon");
    window.res_json["symbols"].forEach(([src, total], i) => {
        const left = Number(total) - (used[i] || 0);
        sums[i].innerText = left;
        icons[i].classList.toggle("disabled", left <= 0);
    });
}

async function undo() {
    console.log(index);
    console.log(art_history.length);
    if (index <= 0) return
    const prev = art_history[index - 1];
    
    tr.nodes([]);
    current_symbol = undefined;
    layer.find(".selectable").forEach(n => remove_symbol(n));

    const restored = JSON.parse(prev[0]);
    const saved = collect_symbols(restored)

    const loaded = await Promise.all(saved.map(async attrs => ({
        attrs,
        img: await load_img(window.res_json["symbols"][attrs["id"]][0])
    })));
    loaded.forEach(({ attrs, img }) => {
        const node = new Konva.Image({ ...attrs, image: img, draggable: true });
        layer.add(node);
        handlers(node);
        tint(node);
    });

    if (prev[1] !== undefined) {
        const match = layer.find(".selectable").find(n => n.getAttr("uid") === prev[1]);
        if (match) {
            current_symbol = match;
            tr.nodes([match]);
        }
    }

    recount();

    tr.moveToTop();
    layer.batchDraw();

    index--;

    update_buttons();
}

async function redo() {
    console.log(index);
    console.log(art_history.length);
    if (index >= art_history.length - 1) return;
    const prev = art_history[index + 1];
    
    tr.nodes([]);
    current_symbol = undefined;
    layer.find(".selectable").forEach(n => remove_symbol(n));

    const restored = JSON.parse(prev[0]);
    const saved = collect_symbols(restored)

    const loaded = await Promise.all(saved.map(async attrs => ({
        attrs,
        img: await load_img(window.res_json["symbols"][attrs["id"]][0])
    })));
    loaded.forEach(({ attrs, img }) => {
        const node = new Konva.Image({ ...attrs, image: img, draggable: true });
        layer.add(node);
        handlers(node);
        tint(node);
    });

    if (prev[1] !== undefined) {
        const match = layer.find(".selectable").find(n => n.getAttr("uid") === prev[1]);
        if (match) {
            current_symbol = match;
            tr.nodes([match]);
        }
    }

    recount();

    tr.moveToTop();
    layer.batchDraw();

    index++;

    update_buttons();
}

function serialise() {
    const json = stage.toJSON();
    const uid = current_symbol?.getAttr("uid");

    const cur = art_history[index];
    if (cur && cur[0] === json && cur[1] === uid) return;

    art_history.length = index + 1;
    art_history.push([json, uid]);
    index = art_history.length - 1;

    update_buttons();
}

function load_img(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.crossOrigin = 'Anonymous';
        img.onerror = reject;
        img.src = src;
    });
}

function update_buttons() {
    const undo_button = document.getElementById("undo");
    undo_button.classList.toggle("disabled", index <= 0);

    const redo_button = document.getElementById("redo");
    redo_button.classList.toggle("disabled", index >= art_history.length - 1)
}