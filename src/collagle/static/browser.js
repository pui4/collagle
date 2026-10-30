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

gen_images();

function gen_images() {
    if (window.loading) return;
    window.loading = true;

    fetch(`/api/get_content?date=${window.date}&before=${window.before}`).then((resp) => {
        if (resp.status == 200) {
            resp.json().then(async (todays) => {
                for (let i = 0; i < todays["content"].length; i++) {
                    const stage = Konva.Node.create(todays["content"][i]["data"], 'renderer');
                    const images = stage.find("Image");
                    console.log(images);

                    await Promise.all(images.map((image) => new Promise((resolve, reject) => {
                        const target_img = new Image()
                        target_img.src = todays["symbols"][image.getAttr("id")][0]
                        target_img.onload = () => {
                            image.image(target_img);
                            image.draggable(false);
                            tint(image)
                            resolve();
                        }
                        target_img.onerror = reject;
                    })));

                    const target_frame = frames[Math.floor(Math.random() * frames.length)];

                    const container = document.getElementById("pictures");
                    const li = document.createElement("li")

                    const frame_ctn = document.createElement("div")
                    frame_ctn.classList.add("frame");
                    li.appendChild(frame_ctn);
                    container.appendChild(li);

                    const render = stage.toDataURL();
                    const render_img = new Image()
                    render_img.src = render;
                    render_img.onload = () => {
                        const frame_img = new Image();
                        frame_img.src = target_frame;
                        frame_img.onload = () => {
                            const frame_w = Math.floor(frame_img.naturalWidth * 0.862068966);
                            const frame_h = Math.floor(frame_img.naturalHeight * 0.862068966);

                            frame_ctn.style.width = `${frame_w}px`;
                            frame_ctn.style.height = `${frame_h}px`;
                            frame_ctn.style.rotate = `${Math.floor(Math.random() * 3) ** 2 * (Math.floor(Math.random() * 2) * 2 - 1)}deg`

                            const art_img_ele = document.createElement("img");
                            art_img_ele.setAttribute("src", render);
                            art_img_ele.classList.add("render_frame");

                            const frame_img_ele = document.createElement("img");
                            frame_img_ele.setAttribute("src", target_frame);
                            frame_img_ele.style.width = `${Math.floor(frame_img.naturalWidth * 0.862068966)}px`;
                            frame_img_ele.style.height = `${Math.floor(frame_img.naturalHeight * 0.862068966)}px`;
                            frame_img_ele.classList.add("frame_image")

                            frame_ctn.appendChild(frame_img_ele);
                            frame_ctn.appendChild(art_img_ele);

                            const subtitle = document.createElement("p");
                            subtitle.innerText = `"${todays["content"][i]["subtitle"]}"`;
                            subtitle.classList.add("subtitle")
                            li.appendChild(subtitle);
                        }
                    }
                    stage.destroy();

                    window.before = todays["id"];
                    window.day = todays["day"];
                    const date_selector = document.getElementById("date");
                    date_selector.value = todays["day"]

                    window.loading = false;
                }
            });
        } else if (resp.status == 204) {
            window.before = -1;
            window.loading = false;
            gen_images();
        } else {
            setTimeout(() => {
                window.loading = false;
                gen_images();
            }, 1500);
        }
    })
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
        gen_images();
    }
})

const date_selector = document.getElementById("date");
date_selector.min = "2026-10-29";
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