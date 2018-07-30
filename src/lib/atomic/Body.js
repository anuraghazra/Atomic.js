const Vector = require('./Vector');
const Constraint = require('./Constraint');
const Vertex = require('./Vertex');

/**
 * @class Body
 * @constructor Body
 * @param {object} opt 
 */
function Body(opt, engine) {
  this.vCount = 0;
  this.eCount = 0;
  this.min = 0;
  this.max = 0;
  this.vertices = [];
  this.positions = [];
  this.edges = [];
  this.bound = {};
  this.center = new Vector(0, 0);
  this.halfEx = new Vector(0, 0);
  this.engine = engine;

  this.render = opt.render || { fillStyle: 'black' };
  this.mass = (opt.mass == undefined) ? 1 : opt.mass;
  this.static = (opt.static || false);
  this.angle = opt.angle || 0;

  if (this.static) {
    this.mass = Number.MAX_SAFE_INTEGER;
  }

  // SVG POLYGON
  // loop through opt.vertices and add them to array
  if (typeof opt.vertices === 'string') {
    let arr = opt.vertices.split(' ');
    let svgVertices = {};
    for (let i = 0; i < arr.length; i++) {
      // console.log(arr[i].split(','))
      svgVertices[i] = { x: Number(arr[i].split(',')[0]), y: Number(arr[i].split(',')[1]) }
    }
    // opt.svgVertices = arr;
    opt.vertices = svgVertices;
  }


  // VERTICES
  for (let n in opt.vertices) {
    let vertex = new Vertex(this, opt.vertices[n], this.static, {
      friction: this.engine.friction,
      gravity: this.engine.gravity,
      canvas: this.engine.canvas,
      groundFriction : this.engine.groundFriction
    });
    opt.vertices[n].compiled = vertex;
    this.vertices.push(vertex);
    this.positions.push(vertex.position);
    this.engine.vertices.push(vertex);
    this.vCount++;
  }

  // CONSTRAINTS
  // loop through opt.constraints and add them to array
  for (let i = 0; i < opt.constraints.length; i++) {
    let cons = opt.constraints[i];

    let constraint = new Constraint(
      this, //parent
      opt.vertices[cons[0]].compiled, // v0
      opt.vertices[cons[1]].compiled, // v1
      (cons[2] || false)
    );

    if (constraint.edge) {
      this.edges.push(constraint);
      this.eCount++;
    }
    this.engine.constraints.push(constraint);
  }

  if (this.angle !== 0) {
    // this.vertices.push(vertex);
    // this.positions.push(vertex.position);
    // this.engine.vertices.push(vertex);
    // this.vCount++;
    for (let i = 0; i < this.vertices.length; i++) {
      let angle = this.angle / 180 * Math.PI;
      this.calculateCenter();
      this.vertices[i].position.x = (this.vertices[i].position.x * Math.cos(angle)) - (this.vertices[i].position.y * Math.sin(angle));
      this.vertices[i].position.y = (this.vertices[i].position.x * Math.sin(angle)) + (this.vertices[i].position.y * Math.cos(angle));
      this.vertices[i].oldPosition.x = this.vertices[i].position.x;
      this.vertices[i].oldPosition.y = this.vertices[i].position.y;
    }
  }

}


/**
 * @method Body.calculateCenter()
 * calculateCenter and bounding box
 */
Body.prototype.calculateCenter = function () {
  let minX = 99999.0,
      minY = 99999.0,
      maxX = -99999.0,
      maxY = -99999.0;

  for (let i = 0; i < this.vertices.length; i++) {
    let p = this.positions[i];

    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
  }

  // center
  this.center.set( (minX + maxX) * 0.5, (minY + maxY) * 0.5 );

  // half extents
  this.halfEx.set((maxX - minX) * 0.5, (maxY - minY) * 0.5);

  this.bound = { minX, minY, maxX, maxY };
};

/**
 * get the vector projection on to normal (n)
 * @method Body.Project()
 * @param {vector} n
 */
Body.prototype.project = function (n) {
  function dot(a, b) {
    return a.x * b.x + a.y * b.y;
  }
  // setup a starting value
  let proj = dot(this.vertices[0].position, n);
  let min = max = proj;

  for (let i = 0; i < this.vertices.length; i++) {
    let p = this.vertices[i].position;
    //project onto each axis
    proj = dot(p, n);
    if (proj < min) { min = proj }
    if (proj > max) { max = proj }
  }
  this.min = min;
  this.max = max
};

/**
 * draw body
 * @method Body.draw()
 * @param {*} ctx 
 */
Body.prototype.draw = function () {
  this.engine.ctx.beginPath();
  let p = this.edges[0].p0;

  for (let i in this.render) {
    if (this.render.hasOwnProperty(i)) {
      this.engine.ctx[i] = this.render[i];
    }
  }

  this.engine.ctx.fillStyle = this.render.fillStyle;

  this.engine.ctx.moveTo(p.x, p.y);
  for (let i = 1; i < this.edges.length; i++) {
    p = this.edges[i].p0;
    this.engine.ctx.lineTo(p.x, p.y);
  }

  if (this.render.strokeStyle) { this.engine.ctx.stroke() };
  this.engine.ctx.fill();
  this.engine.ctx.closePath();
};

/**
 * @method Body.drag()
 */
Body.prototype.drag = function () {
  // drag
  if (this.engine.pointer.isDown && !this.engine.dragVertex) {
    if (this.engine.ctx.isPointInPath(this.engine.pointer.x, this.engine.pointer.y)) {
      let minDistance = 99999;

      for (let i = 0; i < this.engine.vertices.length; i++) {
        let dist = this.engine.vertices[i].position.squareDist(this.engine.pointer);

        if (dist < minDistance) {
          this.engine.dragVertex = this.engine.vertices[i];
          minDistance = dist;
        }
      }
    }
  }
  if (this.engine.pointer.isDown === false) {
    this.engine.dragVertex = null;
  }
}

module.exports = Body;