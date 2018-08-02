(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const Atomic = require('./src/lib/atomic/Atomic');

window.Atomic = Atomic;
},{"./src/lib/atomic/Atomic":2}],2:[function(require,module,exports){
const Body = require('./Body');
const Vertex = require('./Vertex');
const Constraint = require('./Constraint');
const Collision = require('./Collision');
const Renderer = require('./Renderer');

/**
 * Atomic.js
 * @description Greatly Simple 2D Physics Engine
 * @version v1.1.0
 * @author Anurag Hazra <hazru.anurag@gmail.com>
 * @constructor new Atomic()
 */
function Atomic(id, width, height, gravity, friction, simIteration) {
  this.canvas = document.querySelector(id);
  this.width = width || 200;
  this.height = height || 200;
  this.canvas.width = this.width;
  this.canvas.height = this.height;
  this.ctx = this.canvas.getContext('2d');

  this.gravity = (gravity === undefined) ? 1 : gravity;
  this.friction = (friction === undefined) ? 0.1 : friction;
  this.groundFriction = 0.1;

  this.simIteration = (simIteration || 10);
  this.constraintIterations = 1;
  this.collisionIteration = this.simIteration / 2;

  this.bodies = [];
  this.vertices = [];
  this.constraints = [];

  this.collision = new Collision();

  const self = this;

  // init drag
  this.dragVertex = null;
  this.pointer = { x: 0, y: 0, isDown: false };
  this.canvas.addEventListener('mousedown', () => self.pointer.isDown = true)
  this.canvas.addEventListener('mouseup', () => self.pointer.isDown = false)
  this.canvas.addEventListener('mousemove', function (e) {
    self.pointer.x = e.offsetX;
    self.pointer.y = e.offsetY;
  })


  // Poly Primitives
  /**
   *  predifined methods for creating models 
   * 	functions => > box(),
   *               > triangle(),
   *               > circle()
   *  @method Poly
   *  @type object
   */
  this.Poly = {
    /**
     * Create A Box
     * @method Atomic.Poly.box()
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {object} opt
     */
    box: function (x, y, w, h, opt) {
      var b = new Body({
        mass: opt.mass,
        angle: opt.angle,
        static: (opt.static || false),
        render: opt.render,
        vertices: {
          n0: { x: x, y: y },
          n1: { x: x + w, y: y },
          n2: { x: x + w, y: y + h },
          n3: { x: x, y: y + h }
        },
        constraints: [
          ["n0", "n1", true],
          ["n1", "n2", true],
          ["n2", "n3", true],
          ["n3", "n0", true],
          ["n0", "n2"],
          ["n3", "n1"]
        ]
      }, self);
      self.bodies.push(b);
      return b;
    },
    /**
     * Create A Triangle
     * @method Atomic.Poly.triangle()
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {object} opt
     */
    triangle: function (x, y, w, h, opt) {
      w /= 2;
      h /= 2;
      var b = new Body({
        x: x,
        y: y,
        mass: opt.mass,
        static: (opt.static || false),
        render: opt.render,
        vertices: {
          0: { x: x - w, y: y + h },
          1: { x: x, y: y - h },
          2: { x: x + w, y: y + h }
        },
        constraints: [[0, 1, true], [1, 2, true], [2, 0, true]]
      }, self);
      self.bodies.push(b);
      return b;
    },
    /**
     * Create A Cricle
     * @method Atomic.Poly.circle()
     * @param {number} x
     * @param {number} y
     * @param {number} r
     * @param {number} segs
     * @param {object} opt
     */
    circle: function (x, y, r, segs, opt) {
      let tmpV = {};
      let tmpC = [];
      let angle = 0;
      let index = 0;
      for (let i = 0; i < segs; i++) {
        angle += Math.PI * 2 / segs;
        let outer = (Math.cos((angle)) * r);
        let inner = (Math.sin((angle)) * r);
        tmpV[i] = {
          x: outer + x, y: inner + y
        }
        tmpC.push([
          i, ((i + (segs - segs / 2 + 2)) % segs), true
        ]);
        tmpC.push([
          (i), ((i + segs - 1) % segs), false
        ]);
        index++;
      }

      tmpV[index] = { x: x, y: y };

      for (let i = 0; i < index; i++) {
        tmpC.push([
          i, index, false
        ])
      }

      var b = new Body({
        x: x,
        y: y,
        mass: opt.mass,
        static: (opt.static || false),
        render: opt.render,
        vertices: tmpV,
        constraints: tmpC
      }, self);
      self.bodies.push(b);
      return b;
    }
  }



  /**
   * Common Rendering Methods
   * @functions => > dots(),
   *               > pointIndex(),
   *               > lines(),
   *               > indexOfBodies(),
   *               > centerOfMass(),
   *               > boundingBox()
   * @type Object
   */
  this.Render = Renderer.create(this);
}



/****************************/
/***** ATOMIC PROTOTYPES ****/
/****************************/


/**
 * @method Atomic.addVertex()
 * @param {number} x
 * @param {number} y
 * @param {boolean} pinned
 */
Atomic.prototype.addVertex = function (x, y, pinned) {
  let vertex = new Vertex(this, { x: x, y: y }, pinned, {
    friction: this.friction,
    gravity: this.gravity,
    canvas: this.canvas,
  });
  this.vertices.push(vertex);
}

/**
 * @method Atomic.addConstraint()
 * @param {number} i
 * @param {number} j
 * @param {boolean} edge
 */
Atomic.prototype.addConstraint = function (i, j, edge) {
  let cons = new Constraint(this, this.vertices[i], this.vertices[j], edge);
  this.constraints.push(cons);
}


/**
 * requestAnimationFrame
 * @method Atomic.frame()
 * @param {function} func 
 * @param {string} color 
 */
Atomic.prototype.frame = function (func, color) {
  this.clear(color);
  let frame = window.requestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.msRequestAnimationFrame
    || window.mozRequestAnimationFrame;
  frame(func);
}


/**
 * Clear the canvas
 * @method Atomic.clear()
 * @param {string} color 
 */
Atomic.prototype.clear = function (color) {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  if (color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
};


/**
 * @method Atomic.createPoly()
 * Creates a polygon
 * @param {array|string} vert 
 * @param {array} cons optional (calculates cneter point) 
 * @param {object} opt 
 */
Atomic.prototype.createPoly = function (vert, cons, opt) {
  if (opt === undefined) opt = {};

  let b = new Body({
    mass: (arguments.length === 2) ? cons.mass : opt.mass,
    render: (arguments.length === 2) ? cons.render : opt.render,
    vertices: vert,
    constraints: (cons || [])
  }, this);

  if (arguments.length === 2) {
    // join outer vertex
    for (let i = 0; i < b.vertices.length; i++) {
      let bvert = b.vertices;
      let cons = new Constraint(b, b.vertices[i], b.vertices[(i + 1) % bvert.length], true);
      b.edges.push(cons);
      this.constraints.push(cons);
      b.eCount++;
    }

    // add center vertex
    b.calculateCenter();
    let centerVertex = new Vertex(b, b.center, false, {
      friction: this.friction,
      gravity: this.gravity,
      canvas: this.canvas,
      groundFriction: this.groundFriction
    });
    b.vertices.push(centerVertex);
    b.positions.push(centerVertex.position);
    this.vertices.push(centerVertex);
    b.vCount++;
    


    // join to center vertex
    for (let i = 0; i < b.vertices.length - 1; i++) {
      let cons = new Constraint(b, b.vertices[i], b.vertices[b.vertices.length - 1], false);
      b.edges.push(cons);
      b.eCount++;
      this.constraints.push(cons)
    }
  }

  this.bodies.push(b);
  return b;
}


/** Physics Simulation Update */

/**
 * @method Atomic.integrate()
 * updates vertices
 */
Atomic.prototype.integrate = function () {
  for (let i = 0; i < this.vertices.length; i++) {
    this.vertices[i].integrate();
  }
}


/**
 * @method Atomic.updateConstraints()
 * solves all verlet physics 
 */
Atomic.prototype.updateConstraints = function () {
  // solve constrains
  for (let i = 0; i < this.constraints.length; i++) {
    this.constraints[i].solve();
  }
}

/**
 * @method Atomic.updateBoundary()
 * handles all bodies boundary collisions
 */
Atomic.prototype.updateBoundary = function () {
  for (let i = 0; i < this.vertices.length; i++) {
    this.vertices[i].boundary();
  }
}

/**
 * @method Atomic.updateCollision()
 * Batch Update Collisions
 */
Atomic.prototype.updateCollision = function () {
  // Recalculate the bounding boxes
  for (let i = 0; i < this.bodies.length; i++) {
    this.bodies[i].calculateCenter();
  }

  // // collisions detection
  for (let i = 0; i < this.bodies.length - 1; i++) {
    let b0 = this.bodies[i];
    for (let j = i + 1; j < this.bodies.length; j++) {
      let b1 = this.bodies[j];
      if (this.collision.aabb(b0, b1)) {
        this.collision.SAT(b0, b1)
          && this.collision.resolve(this.friction);
      }
    }
  }
}

/**
 * @method Atomic.update()
 * Solve All Collision And Update
 */
Atomic.prototype.update = function () {
  this.integrate();

  for (let n = 0; n < this.simIteration; n++) {
    for (let j = 0; j < this.constraintIterations; j++) {
      this.updateBoundary();
      this.updateConstraints();
    }
    this.updateCollision();
  }
}




/**
 * draw all bodies
 * @method Atomic.render()
 */
Atomic.prototype.render = function () {
  for (let i = 0; i < this.bodies.length; i++) {
    this.bodies[i].draw();
    this.bodies[i].drag();
  }
};


// Utils

/**
 * @method Atomic.drag()
 * drag Poly Objects
 */
Atomic.prototype.drag = function () {
  if (this.dragVertex) {
    // draw mouse link
    this.ctx.beginPath();
    this.ctx.moveTo(this.dragVertex.position.x, this.dragVertex.position.y);
    this.ctx.lineTo(this.pointer.x, this.pointer.y);
    this.ctx.strokeStyle = "#000";
    this.ctx.stroke();

    // correct position
    var s = this.dragVertex.parent.mass * 1;
    this.dragVertex.position.x += (this.pointer.x - this.dragVertex.position.x) / s;
    this.dragVertex.position.y += (this.pointer.y - this.dragVertex.position.y) / s;
  }
};



/**
 * shows current framerate 
 * @method Atomic.showFps()
 * @param {object} option 
 */
Atomic.prototype.fpsScope = {
  fps: null,
  bar_vx: 0,
  lastframe: null,
  fpsBars: []
};
Atomic.prototype.showFps = function (option) {
  option = (!option) ? {} : option;

  let x = (option.x !== undefined) ? option.x : 10;
  let y = (option.y !== undefined) ? option.y : 10;
  let updateSpeed = (option.updateSpeed !== undefined) ? option.updateSpeed : 3;

  let date = new Date();
  if (!this.fpsScope.lastframe) {
    this.fpsScope.lastframe = date.valueOf();
    this.fpsScope.fps = 0;
    return;
  }

  let delta = (date.valueOf() - this.fpsScope.lastframe) / 1000;
  let frametime = (date.valueOf() - this.fpsScope.lastframe);
  this.fpsScope.lastframe = date.valueOf();


  //bar_vx variable for moving bars in x axis
  this.fpsScope.bar_vx++;
  if (this.fpsScope.bar_vx > updateSpeed) {
    this.fpsScope.bar_vx = 0;
  }

  //if bar_vx variable is equal to 1 then roundup the fps
  if (this.fpsScope.bar_vx === 0) {
    this.fpsScope.fps = (1 / delta).toFixed(1);
  }

  //render
  let color = option.barsColor || 'green';
  if (this.fpsScope.fps < 40) { color = 'orange' };
  if (this.fpsScope.fps < 20) { color = 'red'; };

  this.fpsScope.fpsBars.push({
    x: x + (this.fpsScope.bar_vx),
    y: this.fpsScope.fps / 2,
    color: color
  });

  if (this.fpsScope.fpsBars.length > 87) {
    this.fpsScope.fpsBars.shift();
  }


  let ctx = this.ctx;
  function drawFpsMeter() {
    ctx.beginPath();

    //bounds
    ctx.fillStyle = (option.background) || 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 0.5;
    ctx.fillRect(x - 5, y - 5, 100, 60);
    ctx.strokeRect(x - 5, y - 5, 100, 60);
    ctx.fill();
    ctx.stroke();

    //fps
    ctx.fillStyle = option.fontColor || '#555';
    ctx.font = option.font || '10px Arial';
    ctx.fillText('FPS : ' + this.fpsScope.fps, x, y + 10);

    //bars
    ctx.save();
    ctx.scale(1, -1); //rotate
    for (let i = 0; i < this.fpsScope.fpsBars.length; i++) {
      ctx.fillStyle = this.fpsScope.fpsBars[i].color;
      this.fpsScope.fpsBars[i].x += 1;
      ctx.fillRect(this.fpsScope.fpsBars[i].x - 2, -50 - y, 1.2, this.fpsScope.fpsBars[i].y);
    }
    ctx.restore();

    //60fps line
    ctx.strokeStyle = 'crimson';
    ctx.moveTo(x, y + 20);
    ctx.lineTo(x + 90, y + 20);
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.closePath();
  }
  drawFpsMeter.call(this, null);

  return this.fpsScope.fps;
}

Atomic.Constraint = Constraint;
Atomic.Vertex = Vertex;

module.exports = Atomic;
},{"./Body":3,"./Collision":4,"./Constraint":5,"./Renderer":6,"./Vertex":8}],3:[function(require,module,exports){
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
},{"./Constraint":5,"./Vector":7,"./Vertex":8}],4:[function(require,module,exports){
const Vector = require('./Vector');

/**
 * @class Collision
 * Collision Detection Class
 */
function Collision() {
  this.testAxis = new Vector(0, 0);
  this.response = new Vector(0, 0);
  this.relTanVel = new Vector(0, 0);
  this.tangent = new Vector(0, 0);
  this.relVel = new Vector(0, 0);
  this.center = new Vector(0, 0);
  this.axis = new Vector(0, 0);
  this.line = new Vector(0, 0);
  this.depth = 0;
  this.edge = null;
  this.vertex = null;
}

/**
 * SAT Collision Detection
 * @method Collision.SAT
 * @param {Body} B0
 * @param {Body} B1
 */
Collision.prototype.SAT = function (B0, B1) {
  // no aabb overlap performance optimization
  this.checkAABB(B1, B0);
  
  let minDistance = Number.MAX_SAFE_INTEGER;
  const n0 = B0.edges.length;
  const n1 = B1.edges.length;

  // Iterate through all of the edges of both bodies
  for (let i = 0, n = n0 + n1; i < n; i++) {
    // get edge
    let edge = i < n0 ? B0.edges[i] : B1.edges[i - n0];

    
    // Calculate the perpendicular to this edge and normalize it
    this.testAxis.normal(edge.p0, edge.p1);

    // Project both bodies onto the normal
    B0.project(this.testAxis);
    B1.project(this.testAxis);

    //Calculate the distance between the two intervals
    const dist = B0.min < B1.min ? B1.min - B0.max : B0.min - B1.max;

    // If the intervals don't overlap, return, since there is no collision
    if (dist > 0) {
      return false;
    } else if (Math.abs(dist) < minDistance) {
      // Save collision information
      minDistance = Math.abs(dist);
      this.axis.copy(this.testAxis);
      this.edge = edge;
    }
  }

  // save penetration depth
  this.depth = minDistance;

  // Ensure collision edge in B1 and collision vertex in B0
  // console.log(this.edge.parent)
  if (this.edge.parent != B1) {
    const t = B1;
    B1 = B0;
    B0 = t;
  }

  // Make sure that the collision normal is pointing at B1
  // let n = this.center.sub2(B0.center, B1.center).dot(this.axis);
  const xx = B0.center.x - B1.center.x;
  const yy = B0.center.y - B1.center.y;
  const n = this.axis.x * xx + this.axis.y * yy;


  // Revert the collision normal if it points away from B1
  if (n < 0) {
    this.axis.negative()
  }

  let smallestDist = Number.MAX_SAFE_INTEGER, v, dist;
  for (let i = 0; i < B0.vCount; i++) {
    // Measure the distance of the vertex from the line using the line equation
    v = B0.vertices[i];
    this.line.sub2(v.position, B1.center);
    dist = this.axis.dot(this.line);
    // Set the smallest distance and the collision vertex
    if (dist < smallestDist) {
      smallestDist = dist;
      this.vertex = v;
    }
  }

  // There is no separating axis. Report a collision!
  return true;
}

Collision.prototype.checkAABB = function(B1, B0) {
  if (
    !(0 > Math.abs(B1.center.x - B0.center.x) - (B1.halfEx.x + B0.halfEx.x) &&
      0 > Math.abs(B1.center.y - B0.center.y) - (B1.halfEx.y + B0.halfEx.y))
  ) {
    return false;
  }
}

/**
 * Resolve Collision based on SAT Given Collision Information
 * @method Collision.resolve()
 * @param {float} friction
 */
Collision.prototype.resolve = function (friction) {
  // cache vertices positions
  let p0 = this.edge.p0,
    p1 = this.edge.p1,
    o0 = this.edge.v0.oldPosition,
    o1 = this.edge.v1.oldPosition,
    vp = this.vertex.position,
    vo = this.vertex.oldPosition,
    rs = this.response;

  this.response.scale(this.axis, this.depth);


  // calculate where on the edge the collision vertex lies
  let t = Math.abs(p0.x - p1.x) > Math.abs(p0.y - p1.y)
    ? (vp.x - rs.x - p0.x) / (p1.x - p0.x)
    : (vp.y - rs.y - p0.y) / (p1.y - p0.y);
  // lambda math
  let lambda = 1 / (t * t + (1 - t) * (1 - t));

  // calculate mass
  let m0 = this.vertex.parent.mass,
      m1 = this.edge.parent.mass,
      tm = m0 + m1;

  m0 = m0 / tm;
  m1 = m1 / tm;

  // apply the collision response
  p0.x -= rs.x * (1 - t) * lambda * m0;
  p0.y -= rs.y * (1 - t) * lambda * m0;
  p1.x -= rs.x * t * lambda * m0;
  p1.y -= rs.y * t * lambda * m0;
  vp.x += rs.x * m1;
  vp.y += rs.y * m1;


  //
  // collision friction
  //

  // compute relative velocity
  this.relVel.set(
    vp.x - vo.x - (p0.x + p1.x - o0.x - o1.x) * 0.5,
    vp.y - vo.y - (p0.y + p1.y - o0.y - o1.y) * 0.5
  );

  // axis perpendicular
  this.tangent.perp(this.axis);

  // // project the relative velocity onto tangent
  let relTv = this.relVel.dot(this.tangent);
  let rt = this.relTanVel.set(this.tangent.x * relTv, this.tangent.y * relTv);

  // // apply tangent friction
  let groundf = 0.95;
  vo.x += rt.x * groundf * m1;
  vo.y += rt.y * groundf * m1;

  o0.x -= rt.x * (1 - t) * groundf * lambda * m0;
  o0.y -= rt.y * (1 - t) * groundf * lambda * m0;
  o1.x -= rt.x * t * groundf * lambda * m0;
  o1.y -= rt.y * t * groundf * lambda * m0;

}

Collision.prototype.aabb = function (B0, B1) {
  return (B0.bound.minX <= B1.bound.maxX) &&
         (B0.bound.minY <= B1.bound.maxY) && 
         (B0.bound.maxX >= B1.bound.minX) && 
         (B1.bound.maxY >= B0.bound.minY);
}

module.exports = Collision;

},{"./Vector":7}],5:[function(require,module,exports){
/**
 * @class Constraint
 * @param {*} parent 
 * @param {*} v0 
 * @param {*} v1 
 * @param {*} edge 
 */
function Constraint(parent, v0, v1, edge) {
  this.parent = parent;
  this.v0 = v0;
  this.v1 = v1;
  this.p0 = v0.position;
  this.p1 = v1.position;
  this.edge = edge;
  this.dist = Math.sqrt(this.p0.squareDist(this.p1));
};


/**
 * @method Constraint.solve()
 * Solve Constrints
 */
Constraint.prototype.solve = function () {
  let dx = this.p1.x - this.p0.x;
  let dy = this.p1.y - this.p0.y;
  let d = Math.sqrt(dx * dx + dy * dy);

  // using square root approximation

  // let delta = this.dist / (dx * dx + dy * dy + this.dist) - 0.5;
  // dx *= delta;
  // dy *= delta;
  // // console.log(this.v0)
  // if (!this.v0.pinned) {
  //   this.p0.x -= dx;
  //   this.p0.y -= dy;
  // }
  // if (!this.v1.pinned) {
  //   this.p1.x += dx;
  //   this.p1.y += dy;
  // }

  const diffrence = (d - this.dist) / d;
  const adjustX = (dx * 0.5 * diffrence) /*stfns*/;
  const adjustY = (dy * 0.5 * diffrence) /*stfns*/;

  this.p0.x += adjustX;
  this.p0.y += adjustY;
  this.p1.x -= adjustX;
  this.p1.y -= adjustY;
}

module.exports = Constraint;
},{}],6:[function(require,module,exports){
module.exports = {
  self: null,
  create: function (slf) {
    this.self = slf;
    return this;
  },
  /**
   * @method Atomic.Render.dots()
   * @param {number} radius
   * @param {string} color
   */
  dots: function (radius, color) {
    let PI2 = Math.PI * 2;
    let rad = radius || 4;
    for (let i = 0, j = this.self.vertices.length; i < j; i++) {
      let p = this.self.vertices[i].position;
      if (!p.hidden) {
        let fill = (p.color || color || 'black');
        this.self.ctx.beginPath();
        this.self.ctx.fillStyle = fill;
        this.self.ctx.arc(p.x, p.y, rad, 0, PI2);
        this.self.ctx.fill();
        this.self.ctx.closePath();
      }
    }
  },

  /**
   * @method Atomic.Render.pointIndex()
   * @param {string} font
   * @param {stirng} color
   */
  pointIndex: function (font, color) {
    this.self.ctx.font = font || '10px Arial';
    this.self.ctx.fillStyle = color || 'black';
    for (let i = 0; i < this.self.vertices.length; i++) {
      let p = this.self.vertices[i].position;
      this.self.ctx.fillText(i, (p.x - 5), (p.y - 5));
    }
    this.self.ctx.fill();
  },

  /**
   * @method Atomic.Render.lines()
   * @param {number} linewidth
   * @param {string} color
   * @param {boolean} showHidden
   */
  lines: function (linewidth, color, showHidden) {
    if (!showHidden) { showHidden = false; }
    if (this.self.constraints.length > 0) {
      this.self.ctx.beginPath();
      this.self.ctx.strokeStyle = (color || 'black');
      this.self.ctx.lineWidth = linewidth || 1;
      for (let i = 0; i < this.self.constraints.length; i++) {
        let c = this.self.constraints[i];
        if (!c.hidden) {
          this.self.ctx.moveTo(c.p0.x, c.p0.y);
          this.self.ctx.lineTo(c.p1.x, c.p1.y);
        }
        if (showHidden === true) {
          if (c.hidden) {
            this.self.ctx.moveTo(c.p0.x, c.p0.y);
            this.self.ctx.lineTo(c.p1.x, c.p1.y);
          }
        }
      }
      this.self.ctx.stroke();
      this.self.ctx.closePath();
    }
  },

  /**
   * @method Atomic.Render.indexOfBodies()
   * @param {string} font
   * @param {string} color
   */
  indexOfBodies: function (font, color) {
    this.self.ctx.save();
    this.self.ctx.font = font || '10px Arial';
    this.self.ctx.fillStyle = color || 'black';
    for (let i = 0; i < this.self.bodies.length; i++) {
      let p = this.self.bodies[i];
      for (let j = 0; j < p.vertices.length; j++) {
        let v = p.vertices[j].position;
        this.self.ctx.fillText(i + '.' + j, (v.x - 10), (v.y - 10));
      }
    }
    this.self.ctx.fill();
    this.self.ctx.restore();
  },

  /**
   * @method Atomic.Render.renderCenterOfMass()
   * @param {string} color
   */
  centerOfMass: function (color) {
    this.self.ctx.fillStyle = color || 'black';
    this.self.ctx.beginPath();
    for (let i = 0; i < this.self.bodies.length; i++) {
      let b = this.self.bodies[i];
      this.self.ctx.fillRect(b.center.x - 2.5, b.center.y - 2.5, 5, 5);
    }
    this.self.ctx.fill();
    this.self.ctx.closePath();
  },

  /**
   * @method Atomic.Render.boundingBox()
   * @param {string} color
   */
  boundingBox: function (color) {
    this.self.ctx.fillStyle = color || 'rgba(0,0,0,0.2)';
    this.self.ctx.beginPath();
    for (let i = 0; i < this.self.bodies.length; i++) {
      let b = this.self.bodies[i];
      this.self.ctx.fillRect(b.center.x - b.halfEx.x, b.center.y - b.halfEx.y,
        b.halfEx.x + b.halfEx.x, b.halfEx.y + b.halfEx.y);
    }
    this.self.ctx.fill();
    this.self.ctx.closePath();
  },

  /**
   * @method Atomic.Render.information()
   */
  information: function () {
    let stat = 'Objects : ' + this.self.bodies.length;
    let stat2 = 'Vertices : ' + this.self.vertices.length;
    let stat3 = 'Constraints : ' + this.self.constraints.length;
    this.self.ctx.fillStyle = 'black';
    this.self.ctx.font = '14px Arial'
    this.self.ctx.fillText(stat, 10, 20);
    this.self.ctx.fillText(stat2, 10, 40);
    this.self.ctx.fillText(stat3, 10, 60);
  }
}
},{}],7:[function(require,module,exports){
/**
 * Vector.js v1.0.0
 * @author Anurag Hazra
 * @borrows p5.Vector
 * @param {number} x 
 * @param {number} y 
 */
function Vector(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}

// Static Functions
Vector.dist = function (v1, v2) {
  return v1.dist(v2);
}
Vector.sub = function (v1, v2) {
  return new Vector(v1.x - v2.x, v1.y - v2.y);
};
Vector.add = function (v1, v2) {
  return new Vector(v1.x + v2.x, v1.y + v2.y);
};
Vector.fromAngle = function (angle) {
  let v = new Vector(0, 0);
  v.x = Math.cos(angle);
  v.y = Math.sin(angle);
  return v;
}
Vector.random2D = function (v) {
  return Vector.fromAngle(Math.random() * Math.PI * 180);
}

Vector.prototype = {
  set: function(x, y) {
    this.x = x;
    this.y = y;
    return this;
  },
  add: function (x, y) {
    if (arguments.length === 1) {
      this.x += x.x;
      this.y += x.y;
    } else if (arguments.length === 2) {
      this.x += x;
      this.y += y;
    }
    return this;
  },
  sub: function (x, y) {
    if (x instanceof Vector) {
      this.x -= x.x;
      this.y -= x.y;
    } else {
      this.x -= x;
      this.y -= y;
    }
    return this;
  },
  sub2 : function(v0, v1) {
    this.x = v0.x - v1.x;
    this.y = v0.y - v1.y;
    return this;
  },
  mult: function (v) {
    if (typeof v === 'number') {
      this.x *= v;
      this.y *= v;
    } else {
      this.x *= v.x;
      this.y *= v.y;
    }
    return this;
  },
  div: function (v) {
    if (typeof v === 'number') {
      this.x /= v;
      this.y /= v;
    } else {
      this.x /= v.x;
      this.y /= v.y;
    }
    return this;
  },
  mag: function () {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  },
  magSq: function () {
    return (this.x * this.x + this.y * this.y);
  },
  setMag: function (value) {
    this.normalize();
    this.mult(value);
    return this;
  },
  normalize: function () {
    let m = this.mag();
    if (m > 0) {
      this.div(m);
    }
    return this;
  },
  limit: function (max) {
    if (this.mag() > max) {
      this.normalize();
      this.mult(max);
    }
    return this;
  },
  heading: function () {
    return (-Math.atan2(-this.y, this.x));
  },
  dist: function (v) {
    let dx = this.x - v.x;
    let dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  },
  copy: function () {
    return new Vector(this.x, this.y);
  },
  negative: function () {
    this.x = -this.x;
    this.y = -this.y;
    return this;
  },
  array: function () {
    return [this.x, this.y];
  },
  toString: function () {
    return "[" + this.x + ", " + this.y + ", " + this.z + "]";
  },
  unit: function() {
    return this.div(this.mag());
  },
  subtract: function(v) {
    return new Vector(this.x - v, this.y - v);
  },
  dot: function(v) {
    return this.x * v.x + this.y * v.y;
  },
  scale: function(v, s) {
    this.x = v.x * s;
    this.y = v.y * s;
    return this;
  },
  normal: function(v0, v1) {
    // perpendicular
    var nx = v0.y - v1.y,
      ny = v1.x - v0.x;
    // normalize
    var len = 1.0 / Math.sqrt(nx * nx + ny * ny);
    this.x = nx * len;
    this.y = ny * len;
    return this;
  },
  copy: function(v) {
    this.x = v.x;
    this.y = v.y;
    return this;
  },
  squareDist: function(v) {
    var dx = this.x - v.x;
    var dy = this.y - v.y;
    return (dx * dx + dy * dy);
  },
  perp: function(v) {
    this.x = -v.y;
    this.y = v.x;
    return this;
  },
}

module.exports = Vector;
},{}],8:[function(require,module,exports){
const Vector = require('./Vector');

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
    let pos = this.position;
    let oldpos = this.oldPosition;
    let x = pos.x;
    let y = pos.y;

    pos.x += (pos.x - oldpos.x) * this.opt.friction;
    pos.y += (pos.y - oldpos.y) * this.opt.friction + this.opt.gravity;
    oldpos.set(x, y);
  }
};

/**
 * @method Vertex.boundary()
 * Handle Boundry Collision
 */
Vertex.prototype.boundary = function () {
  let pos = this.position,
      old = this.oldPosition;
  let vx = (pos.x - old.x);
  let vy = (pos.y - old.y);

  // Y
  if (pos.y < 0) {
    pos.y = 0;
  } else if (pos.y > this.opt.canvas.height) {
    pos.x -= (pos.y - this.opt.canvas.height) * vx * this.opt.groundFriction;
    pos.y = this.opt.canvas.height;
  }

  // X
  if (pos.x < 0) {
    pos.x = 0
  } else if (pos.x > this.opt.canvas.width) {
    pos.x = this.opt.canvas.width
  };
}

module.exports = Vertex;

},{"./Vector":7}]},{},[1]);
