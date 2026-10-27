window.current_selection = undefined;
current_moving = true;

class SymbolClass {
  constructor(width, height, image) {
    this.width = width;
    this.height = height;
    this.pos = { x: 0, y: 0};
    this.symbol = image
    this.base = poopengine.create_object({
      width: width,
      height: height,
      x: 0,
      y: 0,
      image: image,
      tint: window.res_json["pallet"][0]
    });

    this.first_place = true;

    const base_update = this.base.update;
    this.base.update = () => {
      base_update.apply(this);

      if (this.first_place) {
        this.pos.x = poopengine.input.mouse_pos.x - this.base.width / 2
        this.pos.y = poopengine.input.mouse_pos.y - this.base.height / 2

        if (poopengine.input.click) {
          this.first_place = false;
        }
      } else {
        if (poopengine.input.hovering(this.base) && poopengine.input.click && this.border === undefined) {
          this.border = poopengine.create_object({
            width: this.width,
            height: this.height,
            x: this.pos.x,
            y: this.pos.y,
            stroke: 4
          });
          window.current_selection = this;
        } else if (poopengine.input.click && this.border !== undefined) {
          if (window.current_selection == this) {
            window.current_selection = poopengine.input.object_at(poopengine.input.mouse_pos.x, poopengine.input.mouse_pos.y)
          }
          this.border.destroy();
          this.border = undefined;
        }

        if (this.border !== undefined && poopengine.input.hovering(this.border) && poopengine.input.mousedown) {
          this.pos.x = poopengine.input.mouse_pos.x - this.base.width / 2
          this.pos.y = poopengine.input.mouse_pos.y - this.base.height / 2
        }
      }

      this.base.x = this.pos.x
      this.base.y = this.pos.y
      if (this.border !== undefined) {
        this.border.x = this.pos.x;
        this.border.y = this.pos.y;
      }
    }

    this.destroy = () => {
      this.base.destroy();
      if (this.border !== undefined) {
        this.border.destroy();
      }
    }
  }
}

window.symbol_selected = (symbol_path) => {
  if (window.current_selection !== undefined && window.current_selection.first_place) {
    window.current_selection.destroy();
  }
  window.current_selection = new SymbolClass(
    256,
    256,
    symbol_path
  )
}

window.colour_selected = (colour) => {
  console.log(colour)
  if (window.current_selection != undefined) {
    window.current_selection.base.tint = colour
  }
}

const originalStart = poopengine.start;
poopengine.start = function () {
  originalStart.apply(this);
}

const originalUpdate = poopengine.update;
poopengine.update = function () {
  originalUpdate.apply(this);
}

poopengine.resize = function () {
  // Code goes here:
}

poopengine.start();