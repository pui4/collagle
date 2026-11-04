const MAX_SIZE = 128;

var current_symbol = undefined;

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

const stage = new Konva.Stage({
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

function tint() {
    const { r, g, b } = Konva.Util.getRGB(current_symbol.getAttr("current_tint"));
    current_symbol.cache();
    current_symbol.filters([Konva.Filters.Brighten, Konva.Filters.RGB]);
    current_symbol.brightness(1);
    current_symbol.red(r);
    current_symbol.green(g);
    current_symbol.blue(b);

    current_symbol.drawHitFromCache(0.5);
}

on_symbol_click = (id) => {
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
                
                current_symbol.scale({
                    x: current_symbol.scaleX() < 0 ? -1 : 1,
                    y: current_symbol.scaleY() < 0 ? -1 : 1
                });

                tint();
                tr.forceUpdate();
            });

            current_symbol.on("dragend", () => {
                const box = current_symbol.getClientRect();
                const offScreen =  (
                    box.x + box.width  < 0 ||
                    box.y + box.height < 0 ||
                    box.x > stage.width() ||
                    box.y > stage.height()
                );

                if (offScreen) {
                    remove();
                }
            });
        }
        sym_img.crossOrigin = 'Anonymous';
        sym_img.src = window.res_json["symbols"][id][0];
    }
}

on_col_click = (id) => {
    current_symbol.setAttr("current_tint", window.res_json["pallet"][id])
    tint()
}

stage.on("mousedown tap", (e) => {
    if (e.target === stage) {
        current_symbol = undefined;
        tr.nodes([]);
        return;
    }

    if (e.target.hasName("selectable")) {
        current_symbol = e.target;
        tr.nodes([e.target]);
        tr.moveToTop();
    }
});

function move_down() {
    if (current_symbol !== undefined) {
        current_symbol.moveDown();
        layer.batchDraw();
    }
}

function move_up() {
    if (current_symbol !== undefined) {
        current_symbol.moveUp();
        layer.batchDraw();
    }
}

function remove() {
    if (current_symbol !== undefined) {
        tr.nodes([]);

        const id = current_symbol.getAttr("id");

        current_symbol.destroy();
        current_symbol = undefined;

        const amount = document.getElementsByClassName("sums")[id]
        
        if (amount.innerText == 0) {
            const image = document.getElementsByClassName("symb_icon")[id];
            image.classList.remove("disabled");
        }

        amount.innerText = parseInt(amount.innerText) + 1;
    }
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
}

window.addEventListener("beforeunload", (e) => {
    if (window.edited) {
        var message = "Are you sure you want to leave as your art will be lost?";
        (e || window.event).returnValue = message;
        return message;
    }
})