current_selection = undefined;
current_moving = true;

window.symbol_selected = (symbol_path) => {
    current_selection = poopengine.create_object({
        width: 64,
        height: 64,
        x: 0,
        y: 0,
        image: symbol_path,
        tint: window.res_json["pallet"][0]
    })
}

window.colour_selected = (colour) => {
    console.log(colour)
    if (current_selection != undefined) {
        current_selection.tint = colour
    }
}

const originalStart = poopengine.start;
poopengine.start = function () {
  originalStart.apply(this);
}

const originalUpdate = poopengine.update;
poopengine.update = function () {
  originalUpdate.apply(this);
  
  if (current_selection != undefined && current_moving) {
    current_selection.x = poopengine.input.mouse_pos.x - current_selection.width / 2
    current_selection.y = poopengine.input.mouse_pos.y - current_selection.height / 2

    if (poopengine.input.click) {
        current_selection = undefined;
    }
  }
}

poopengine.resize = function () {
  // Code goes here:
}

poopengine.start();