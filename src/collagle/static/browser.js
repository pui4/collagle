const frames = [
    "/static/frames/0.png",
    "/static/frames/1.png",
    "/static/frames/2.png",
    "/static/frames/3.png",
    "/static/frames/4.png"
];

const d = new Date()
const today = d.toLocaleDateString("en-GB")
const parts = today.split("/")
window.date = `${parts[2]}-${parts[1]}-${parts[0]}`

window.before = -1;;

window.loading = false;

if (window.post_id) show_post(window.post_id)

gen_images();

function gen_images() {
    show_own_post();

    if (window.loading) return;
    window.loading = true;

    fetch(`/api/get_content?date=${window.date}&before=${window.before}`).then((resp) => {
        if (resp.status == 200) {
            resp.json().then(async (todays) => {
                for (let i = 0; i < todays["content"].length; i++) {
                    const container = document.getElementById("pictures");
                    test_show_img(todays["content"][i], container, todays["symbols"], true).then(() => {
                        window.before = todays["id"];
                        window.day = todays["day"];
                        const date_selector = document.getElementById("date");
                        date_selector.value = todays["day"]

                        window.loading = false;
                    })
                }
            });
        } else if (resp.status == 204) {
            const container = document.getElementById("pictures");

            if (container.innerHTML == "") {
                setTimeout(() => {
                    window.before = -1;
                    window.loading = false;
                    gen_images();
                }, 5000);
            } else {
                window.before = -1;
                window.loading = false;
                gen_images();
            }
        } else {
            setTimeout(() => {
                window.loading = false;
                gen_images();
            }, 1500);
        }
    })
}

function load_img(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function test_show_img(data, container, symbols, click) {
    if (symbols === undefined) {
        symbols = data["symbols"];
    }

    const stage = Konva.Node.create(data["content"], 'renderer');
    const images = stage.find("Image");

    await Promise.all(images.map(async (image) => {
        const target_img = await load_img(symbols[image.getAttr("id")][0]);
        image.image(target_img);
        image.draggable(false);
        tint(image);
    }));

    const target_frame = frames[Math.floor(Math.random() * frames.length)];
    const render = stage.toDataURL();

    const [frame_img] = await Promise.all([
        load_img(target_frame),
        load_img(render)
    ]);

    const frame_w = Math.floor(frame_img.naturalWidth * 0.862068966);
    const frame_h = Math.floor(frame_img.naturalHeight * 0.862068966);

    const li = document.createElement("li");

    const main_ctn = document.createElement("div");
    main_ctn.classList.add("main_frame_ctn");
    if (click) {
        main_ctn.onclick = () => post_clicked(data["id"], main_ctn);
        main_ctn.style.cursor = "pointer";
    }

    const frame_ctn = document.createElement("div");
    frame_ctn.classList.add("frame");
    frame_ctn.style.width = `${frame_w}px`;
    frame_ctn.style.height = `${frame_h}px`;

    const angle = Math.floor(Math.random() * 3) ** 2 * (Math.floor(Math.random() * 2) * 2 - 1);
    frame_ctn.style.rotate = `${angle}deg`;
    frame_ctn.style.transform = `rotate(${angle}deg)`;

    const art_img_ele = document.createElement("img");
    art_img_ele.setAttribute("src", render);
    art_img_ele.classList.add("render_frame");

    const frame_img_ele = document.createElement("img");
    frame_img_ele.setAttribute("src", target_frame);
    frame_img_ele.style.width = `${frame_w}px`;
    frame_img_ele.style.height = `${frame_h}px`;
    frame_img_ele.classList.add("frame_image");

    frame_ctn.appendChild(frame_img_ele);
    frame_ctn.appendChild(art_img_ele);

    const subtitle = document.createElement("p");
    subtitle.classList.add("subtitle");
    subtitle.innerText = `"${data["subtitle"]}"`;

    main_ctn.appendChild(frame_ctn);
    main_ctn.appendChild(subtitle);
    li.appendChild(main_ctn);
    container.appendChild(li);

    stage.destroy();
    return main_ctn;
}

function tint(object) {
    const { r, g, b } = Konva.Util.getRGB(object.getAttr("current_tint"));
    object.cache();
    object.filters([Konva.Filters.Brighten, Konva.Filters.RGB]);
    object.brightness(1);
    object.red(r);
    object.green(g);
    object.blue(b);
}

const scroll_offset = 100;
window.addEventListener('scroll', () => {
    if (window.scrollY + window.innerHeight >= document.body.scrollHeight - scroll_offset) {
        const img_ctn = document.getElementById("pictures")
        if (img_ctn.innerHTML == "") {
            window.loading = true;
            setTimeout(() => {
                gen_images();
            }, 5000);
        } else {
            gen_images();
        }
    }
})

const date_selector = document.getElementById("date");
date_selector.min = "2026-11-01";
date_selector.max = window.date;
date_selector.onchange = () => {
    console.log(date_selector.value)
    
    if (date_selector.value == "") {
        date_selector.value = window.date;
    }

    const container = document.getElementById("pictures");
    container.innerHTML = "";

    window.before = -1;
    window.date = date_selector.value;
    gen_images();
}

function post_clicked(id, target_post) {
    lock_scroll();
    const modal = document.getElementById("post_modal");

    const img_ctn = document.getElementById("share_img_ctn");
    img_ctn.innerHTML = "";

    html2canvas(target_post, {
        backgroundColor: null
    }).then((canvas) => {
        canvas.style.width = `${canvas.width / 1.5}px`;
        canvas.style.height = `${canvas.height / 1.5}px`;
        img_ctn.appendChild(canvas);

        const url = document.createElement("p");
        url.innerText = `collagle.net/p/${id}`;
        url.classList.add("url");
        img_ctn.appendChild(url)
    })

    modal.style.display = "flex";
}

function close_share() {
    unlock_scroll();
    const modal = document.getElementById("post_modal");
    modal.style.display = "none";
}

function unlock_scroll() {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
}

function lock_scroll() {
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = `${scrollbar}px`;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
}

function share_clicked() {
    const img_ctn = document.getElementById("share_img_ctn");

    html2canvas(img_ctn).then((canvas) => canvas.toBlob((blob) => {
        navigator.clipboard.write([
            new ClipboardItem({
                'image/png': blob
            })
        ]);

        const confirm_modal = document.getElementById("coppied_modal")
        confirm_modal.style.display = "flex";

        setTimeout(() => {
            confirm_modal.style.display = "none";
        }, 1000)
    }));
}

function show_own_post() {
    const button = document.getElementById("own_post");

    if (Cookies.get(window.date) !== undefined) {
        button.style.display = "block";
    } else {
        button.style.display = "none";
    }
}

function own_post_click() {
    show_post(Cookies.get(window.date));
}

function show_post(id) {
    lock_scroll();
    const modal = document.getElementById("post_modal");

    const img_ctn = document.getElementById("share_img_ctn");
    img_ctn.innerHTML = "";

    fetch(`/api/get_post?id=${id}`).then((resp) => {
        if (resp.status != 200) return;
        resp.json().then(async (resp_json) => {
            const invis_holder = document.getElementById("invis_holder");
            invis_holder.innerHTML = ""

            const container = document.createElement("div");
            container.classList.add("invis_pic")

            invis_holder.appendChild(container);

            test_show_img(resp_json, container).then((main_ctn) => {
                html2canvas(main_ctn, {
                    backgroundColor: null
                }).then((canvas) => {
                    canvas.style.width = `${canvas.width / 1.5}px`;
                    canvas.style.height = `${canvas.height / 1.5}px`;
                    img_ctn.appendChild(canvas);

                    const url = document.createElement("p");
                    url.innerText = `collagle.net/p/${id}`;
                    url.classList.add("url");
                    img_ctn.appendChild(url)
                });
            });
        });
    })

    modal.style.display = "flex";
}