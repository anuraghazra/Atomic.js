/**
 * @class Vertex
 * @param {*} parent 
 * @param {*} vertex 
 * @param {*} pinned 
 */
function Vertex(parent, vertex, pinned, opt) {
  this.opt = opt;
  this.parent = parent;
  this.position = new Vector(vertex.x, vertex.y);
  this.oldPosition = new Vector(vertex.x, vertex.y);
  this.pinned = pinned;
};

/**
 * @method Vertex.integrate()
 * Loop and update physics
 */
Vertex.prototype.integrate = function () {
  if (!this.pinned) {
    let current = this.position;
    let old = this.oldPosition;
    let x = current.x;
    let y = current.y;

    current.x += (current.x - old.x) * this.opt.friction;
    current.y += (current.y - old.y) * this.opt.friction + this.opt.gravity;
    old.set(x, y);
  }
};

/**
 * @method Vertex.boundary()
 * Handle Boundry Collision
 */
this.Vertex.prototype.boundary = function () {
  let current = this.position,
      old = this.oldPosition;
  let vx = (current.x - old.x);
  let vy = (current.y - old.y);

  // Y
  if (current.y < 0) {
    current.y = 0;
  } else if (current.y > this.opt.canvas.height) {
    current.x -= (current.y - this.opt.canvas.height) * vx * this.opt.groundFriction;
    current.y = this.opt.canvas.height;
  }

  // X
  if (current.x < 0) {
    current.x = 0
  } else if (current.x > this.opt.canvas.width) {
    current.x = this.opt.canvas.width
  };
}
