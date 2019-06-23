const Vector = require('./Vector');

/**
 * @class Vertex
 * @param {*} parent
 * @param {*} vertex
 * @param {*} pinned
 */
class Vertex {
  constructor(parent, vertex, pinned, opt) {
    console.log(opt)
    this.opt = opt;
    this.parent = parent;
    this.position = new Vector(vertex.x, vertex.y);
    this.oldPosition = new Vector(vertex.x, vertex.y);
    this.pinned = pinned;
  }
  /**
   * @method Vertex.integrate()
   * Loop and update physics
   */
  integrate() {
    if (!this.pinned) {
      let pos = this.position;
      let oldpos = this.oldPosition;
      let x = pos.x;
      let y = pos.y;
      pos.x += (pos.x - oldpos.x) * this.opt.friction;
      pos.y += (pos.y - oldpos.y) * this.opt.friction + this.opt.engine.gravity;
      oldpos.set(x, y);
    }
  }
  /**
   * @method Vertex.boundary()
   * Handle Boundry Collision
   */
  boundary() {
    let pos = this.position, old = this.oldPosition;
    let vx = (pos.x - old.x);
    let vy = (pos.y - old.y);
    // Y
    if (pos.y < 0) {
      pos.y = 0;
    }
    else if (pos.y > this.opt.canvas.height) {
      pos.x -= (pos.y - this.opt.canvas.height) * vx * this.opt.groundFriction;
      pos.y = this.opt.canvas.height;
    }
    // X
    if (pos.x < 0) {
      pos.x = 0;
    }
    else if (pos.x > this.opt.canvas.width) {
      pos.x = this.opt.canvas.width;
    }
    ;
  }
}
;



module.exports = Vertex;
