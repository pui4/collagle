class poopengine_class {
  constructor(canvas, shadowRoot) {
    this.is_fullscreen = false;
    this.canvas = canvas;
    this.display = { width: 300, height: 200 };
    this.context = null;
    this.objects = [];
    this.input = new class input {
      constructor() {
        this.keydown = null;
        this.keypressed = null;
        this.keyup = null;
        this.click = null;
        this.mousedown = null;
        this.mouseup = null;
        this.mouse_pos = { x: null, y: null };
        this.mouse_over = false;
        this.hovering = (object) => {
          if (this.mouse_pos.x != null) {
            const index = this.objects.indexOf(object);
            const array = this.objects.slice(index + 1);

            for (let i = 0; i < array.length; i++) {
              if (
                this.mouse_pos.x >= array[i].x &&
                this.mouse_pos.x <= array[i].x + array[i].width &&
                this.mouse_pos.y >= array[i].y &&
                this.mouse_pos.y <= array[i].y + array[i].height
              ) {
                return false;
              }
            }

            if (
              this.mouse_pos.x >= object.x &&
              this.mouse_pos.x <= object.x + object.width &&
              this.mouse_pos.y >= object.y &&
              this.mouse_pos.y <= object.y + object.height
            ) {
              return true;
            } else {
              return false;
            }
          }
        }
      }
    }
    this.fps = 0;
    this.deltaTime = 1;
    this.times = [];

    this.start = () => {
      if (!this.canvas) {
        console.error("Canvas is not initialized yet.");
        return;
      }

      this.canvas.click();
      if (this.is_fullscreen) {
        this.canvas.width = this.display.width = document.body.clientWidth;
        this.canvas.height = this.display.height = window.innerHeight;
      } else {
        this.canvas.width = this.display.width;
        this.canvas.height = this.display.height;
      }
      this.context = this.canvas.getContext("2d");

      // Event listeners
      window.onresize = () => {
        if (this.is_fullscreen) {
          this.canvas.width = this.display.width = document.body.clientWidth;
          this.canvas.height = this.display.height = window.innerHeight;
        }

        this.resize();
      };

      this.canvas.addEventListener("mouseenter", () => {
        this.input.mouse_over = true;
      });
      
      this.canvas.addEventListener("mouseleave", () => {
        this.input.mouse_over = false;
      });

      // Mouse input
      window.addEventListener("mousedown", () => {
        if (this.input.mouse_over) {
          this.input.mousedown = true;
        }
      });
      window.addEventListener("click", () => {
        if (this.input.mouse_over) {
          if (this.input.click == null) {
            this.input.click = true;

            setTimeout(() => {
              this.input.click = null;
            }, 10);
          }
        }
      });
      window.addEventListener("mouseup", () => {
        if (this.input.mouse_over) {
          this.input.mouseup = true;
          this.input.mousedown = null;

          setTimeout(() => {
            this.input.mouseup = null;
          }, 10);
        }
      });

      this.canvas.addEventListener("mousemove", (event) => {
        if (this.input.mouse_over) {
          const rect = this.canvas.getBoundingClientRect();
          const scaleX = this.canvas.width / rect.width;
          const scaleY = this.canvas.height / rect.height;
          this.input.mouse_pos = {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
          };
        }
      });

      // Input
      window.addEventListener("keydown", (event) => {
        if (this.input.mouse_over) {
          this.input.keydown = event.key;
        }
      });
      window.addEventListener("keypress", (event) => {
        if (this.input.mouse_over) {
          if (this.input.keypressed == null) {
            this.input.keypressed = event.key;

            setTimeout(() => {
              this.input.keypressed = null;
            }, 10);
          }
        }
      });
      window.addEventListener("keyup", (event) => {
        if (this.input.mouse_over) {
          this.input.keyup = event.key;
          this.input.keydown = null;

          setTimeout(() => {
            this.input.keyup = null;
          }, 10);
        }
      });

      window.requestAnimationFrame(() => this.update());
    };

    this.update = () => {
      this.context.reset()
      window.requestAnimationFrame(() => this.update());
      this.context.clearRect(0, 0, this.display.width, this.display.height);

      // Fps and delta calculation
      const now = performance.now();

      if (this.times.length > 0) {
        this.deltaTime = now - this.times[this.times.length - 1];
      }

      while (this.times.length > 0 && this.times[0] <= now - 1000) {
        this.times.shift();
      }
      this.times.push(now);
      this.fps = this.times.length;

      // Update object drawing
      for (let i = 0; i < this.objects.length; i++) {
        this.objects[i].update();
      }
    };
    
    class object_class {
      constructor({
        poopengine,
        width,
        height,
        x,
        y,
        colour,
        image,
        tint,
        tile,
        image_alpha,
        text,
        text_size,
        font,
        word_wrap,
        line_height,
        text_align,
      }) {
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.colour = colour;

        let ctx = poopengine.context;

        // Image logic
        if (image != undefined) {
          this.image = new Image();
          this.image.src = image;
          this.image_alpha = image_alpha;
          this.tint = tint
          this.prev_tint = tint
          this.image.onload = () => {
            if (this.image_alpha != undefined) {
              ctx.globalAlpha = this.image_alpha;
            }
            if (tile != undefined && tile != false) {
              this.pattern = ctx.createPattern(this.image, "repeat");
              ctx.fillStyle = this.pattern;
              ctx.fillRect(this.x, this.y, this.width, this.height);
            } else if (tint != undefined && tint != false) {
              this.orig_img = this.image
              const off = document.createElement("canvas");
              off.width = this.width;
              off.height = this.height;
              const octx = off.getContext("2d");

              octx.drawImage(this.image, 0, 0, off.width, off.height);
              octx.globalCompositeOperation = "source-in";
              octx.fillStyle = tint
              octx.fillRect(0, 0, off.width, off.height);

              this.image = off;
              ctx.drawImage(off, this.x, this.y, this.width, this.height)
            } else {
              ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            }
          }
        }
        // Text logic
        else if (text != undefined) {
          ctx.fillStyle = this.colour;
          this.text = text;
          this.text_size = text_size;
          if (font != undefined) {
            this.font = font;
            ctx.font = String(text_size + "px " + font);
          } else {
            ctx.font = String(text_size + "px Arial");
          }

          if (text_align != undefined) {
            ctx.textAlign = text_align;
          }

          ctx.fillText(this.text, this.x, this.text_size + this.y, this.width);
        }
        // Box logic
        else {
          ctx.fillStyle = this.colour;
          ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        this.update = () => {
          // Image logic
          if (image != undefined) {
            if (this.image_alpha != undefined) {
              ctx.globalAlpha = this.image_alpha;
            }
            if (tile != undefined && tile != false) {
              this.pattern = ctx.createPattern(this.image, "repeat");
              ctx.fillStyle = this.pattern;
              ctx.fillRect(this.x, this.y, this.width, this.height);
            } else if (this.tint != this.prev_tint) {
              const off = document.createElement("canvas");
              off.width = this.width;
              off.height = this.height;
              const octx = off.getContext("2d");

              octx.drawImage(this.orig_img, 0, 0, off.width, off.height);
              octx.globalCompositeOperation = "source-in";
              octx.fillStyle = this.tint;
              octx.fillRect(0, 0, off.width, off.height);

              this.image = off;
              ctx.drawImage(off, this.x, this.y, this.width, this.height)
              this.prev_tint = this.tint;
            } else {
              ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            }
          }
          // Text logic
          else if (text != undefined) {
            ctx.fillStyle = this.colour;
            if (this.font != undefined) {
              ctx.font = String(this.text_size + "px " + this.font);
            } else {
              ctx.font = String(this.text_size + "px Arial");
            }

            if (word_wrap == true) {
              this.line_height = line_height;

              const words = this.text.split(" ");
              let currentLine = words[0];
              let lineCount = 0;

              for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const width = ctx.measureText(currentLine + " " + word).width;

                if (width < this.width) {
                  currentLine += " " + word;
                } else {
                  ctx.fillText(
                    currentLine,
                    this.x,
                    this.y + this.line_height * lineCount++ + this.text_size
                  );
                  currentLine = word;
                }
              }

              ctx.fillText(
                currentLine,
                this.x,
                this.y + this.line_height * lineCount + this.text_size
              );
            } else {
              ctx.fillText(this.text, this.x, this.y + this.text_size, this.width);
            }
          }
          // Box logic
          else {
            ctx.fillStyle = this.colour;
            ctx.fillRect(this.x, this.y, this.width, this.height);
          }
        };

        this.destroy = () => {
          const index = poopengine.objects.indexOf(this);

          poopengine.objects.splice(index, 1);
        };

        poopengine.objects.push(this);
        this.index = poopengine.objects.indexOf(this);
        ctx.reset();
      }
    };
    this.create_object = (params = {
      width,
      height,
      x,
      y,
      colour,
      image,
      tint,
      tile,
      image_alpha,
      text,
      text_size,
      font,
      word_wrap,
      line_height,
      text_align,
    }) => {
      params.poopengine = this;
      return new object_class(params);
    }

    this.audio = (src) => {
      this.sound = document.createElement("audio");
      this.sound.src = src;
      this.sound.setAttribute("preload", "auto");
      this.sound.setAttribute("controls", "none");
      this.sound.style.display = "none";
      shadowRoot.appendChild(this.sound);
      this.play = () => {
        this.sound.play();
      };
      this.stop = () => {
        this.sound.pause();
        this.sound.currentTime = 0;
      };
      this.pause = () => {
        this.sound.pause();
      };
      this.loop = (option) => {
        this.sound.loop = option;
      };
    },

    // Z index logic
    this.move_to_top = (object) => {
      const index = this.objects.indexOf(object);
      if (index !== -1) {
        this.objects.splice(index, 1);
      }

      this.objects.push(object);
    };

    this.send_to_back_bg = (object) => {
      const index = this.objects.indexOf(object);

      if (index !== -1) {
        this.objects.splice(index, 1);
        this.objects.splice(1, 0, object);
      }
    };

    this.send_to_back = (object) => {
      const index = this.objects.indexOf(object);
      if (index !== -1) {
        this.objects.splice(index, 1);
      }

      this.objects.unshift(object);
    };

    this.change_index = (object, change) => {
      const index = this.objects.indexOf(object);
      const new_index = index + change;

      if (index !== -1) {
        this.objects.splice(index, 1);
        this.objects.splice(new_index, 0, object);
      }
    };

    this.set_index = (object, new_index) => {
      const index = this.objects.indexOf(object);

      if (index !== -1) {
        this.objects.splice(index, new_index);
        this.objects.splice(new_index, 0, object);
      }
    };

    this.revert_index = (object) => {
      const currentIndex = this.objects.indexOf(object);

      if (currentIndex !== -1 && typeof object.index === "number") {
        this.objects.splice(currentIndex, 1);

        this.objects.splice(object.index, 0, object);
      }
    };

    this.resize = () => {};

    // Animation
    this.animating_vals = []
    this.animate_value = (id, val, increase, speed, until, callback, finish) => {
      let isBigger;
      if (val < until) {
        isBigger = true;
      } else {
        isBigger = false;
      }
      if (!this.animating_vals.includes(id)) {
        this.animating_vals.push(id);
        const inter = setInterval(() => {
          val += increase;
          if (val >= until && isBigger) {
            if (finish != undefined) {
              finsish()
            }
            clearInterval(inter);
            val = until;
          } else if (val <= until && !isBigger) {
            if (finish != undefined) {
              finsish()
            }
            clearInterval(inter);
            val = until;
          }
          callback(val);
        }, speed);
      }
    }
  }
}

class poopengine_component extends HTMLElement {
  static observedAttributes = ['script', 'width', 'height', 'fullscreen', 'style'];

  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: 'open' });
    this.canvas = document.createElement('canvas');
    shadowRoot.append(this.canvas);
    this.poopengine = new poopengine_class(this.canvas, shadowRoot);
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    switch (name) {
      case "script":
        fetch(newValue).then(res => res.text().then(scr => {
          const scopedFunction = new Function("poopengine", scr)
          scopedFunction(this.poopengine);
        }));
        break;
      case "width":
        try {
          let wid = parseInt(newValue)
          this.poopengine.display.width = wid;
        } catch {
          console.error("Width sould be a numeric value.")
        }
        break;
      case "height":
        try {
          let wid = parseInt(newValue)
          this.poopengine.display.height = wid;
        } catch {
          console.error("Height sould be a numeric value.")
        }
        break;
      case "fullscreen":
        this.poopengine.is_fullscreen = true;
        break;
      case "style":
        this.canvas.style = newValue;
        break;
    }
  }
}

customElements.define("poopengine-window", poopengine_component);