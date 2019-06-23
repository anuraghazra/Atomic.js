const Renderer = require('./Renderer');
const Body = require('./Body');
const Collision = require('./Collision');
const Constraint = require('./Constraint');
const Vertex = require('./Vertex');


/**
 * Atomic.js
 * @description Greatly Simple 2D Physics Engine
 * @version v1.2.0
 * @author Anurag Hazra <hazru.anurag@gmail.com>
 * @constructor new Atomic()
 * @param {*} id
 * @param {*} width
 * @param {*} height
 * @param {*} gravity
 * @param {*} friction
 * @param {*} simIteration
 */
class Atomic {

  constructor(id, width, height, gravity, friction, simIteration) {
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

    // init drag
    this.dragVertex = null;
    this.pointer = { x: 0, y: 0, isDown: false };
    this.canvas.addEventListener('mousedown', () => this.pointer.isDown = true);
    this.canvas.addEventListener('mouseup', () => this.pointer.isDown = false);
    this.canvas.addEventListener('mousemove', (e) => {
      this.pointer.x = e.offsetX;
      this.pointer.y = e.offsetY;
    });

    
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
      box: (x, y, w, h, opt) => {
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
        }, this);
        this.bodies.push(b);
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
      triangle: (x, y, w, h, opt) => {
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
        }, this);
        this.bodies.push(b);
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
      circle: (x, y, r, segs, opt) => {
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
          };
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
          ]);
        }
        var b = new Body({
          x: x,
          y: y,
          mass: opt.mass,
          static: (opt.static || false),
          render: opt.render,
          vertices: tmpV,
          constraints: tmpC
        }, this);
        this.bodies.push(b);
        return b;
      }
    };
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
  
  /**
   * @method Atomic.addVertex()
   * @param {number} x
   * @param {number} y
   * @param {boolean} pinned
   */
  addVertex(x, y, pinned) {
    let vertex = new Atomic.Vertex(this, { x: x, y: y }, pinned, {
      friction: this.friction,
      gravity: this.gravity,
      canvas: this.canvas,
      engine: this
    });
    this.vertices.push(vertex);
  }
  
  /**
   * @method Atomic.addConstraint()
   * @param {number} i
   * @param {number} j
   * @param {boolean} edge
   */
  addConstraint(i, j, edge) {
    let cons = new Atomic.Constraint(this, this.vertices[i], this.vertices[j], edge);
    this.constraints.push(cons);
  }
  
  /**
   * requestAnimationFrame
   * @method Atomic.frame()
   * @param {function} func
   * @param {string} color
   */
  frame(func, color) {
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
  clear(color) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (color) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * @method Atomic.createPoly()
   * Creates a polygon
   * @param {array|string} vert
   * @param {array} cons optional (calculates cneter point)
   * @param {object} opt
   */
  createPoly(vert, cons, opt) {
    if (opt === undefined)
      opt = {};
    let b = new Atomic.Body({
      mass: (arguments.length === 2) ? cons.mass : opt.mass,
      render: (arguments.length === 2) ? cons.render : opt.render,
      vertices: vert,
      constraints: (cons || [])
    }, this);
    if (arguments.length === 2) {
      // join outer vertex
      for (let i = 0; i < b.vertices.length; i++) {
        let bvert = b.vertices;
        let cons = new Atomic.Constraint(b, b.vertices[i], b.vertices[(i + 1) % bvert.length], true);
        b.edges.push(cons);
        this.constraints.push(cons);
        b.eCount++;
      }
      // add center vertex
      b.calculateCenter();
      let centerVertex = new Atomic.Vertex(b, b.center, false, {
        friction: this.friction,
        canvas: this.canvas,
        groundFriction: this.groundFriction,
        engine: this
      });
      b.vertices.push(centerVertex);
      b.positions.push(centerVertex.position);
      this.vertices.push(centerVertex);
      b.vCount++;
      // join to center vertex
      for (let i = 0; i < b.vertices.length - 1; i++) {
        let cons = new Atomic.Constraint(b, b.vertices[i], b.vertices[b.vertices.length - 1], false);
        b.edges.push(cons);
        b.eCount++;
        this.constraints.push(cons);
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
  integrate() {
    for (let i = 0; i < this.vertices.length; i++) {
      this.vertices[i].integrate();
    }
  }

  /**
   * @method Atomic.updateConstraints()
   * solves all verlet physics
   */
  updateConstraints() {
    // solve constrains
    for (let i = 0; i < this.constraints.length; i++) {
      this.constraints[i].solve();
    }
  }

  /**
   * @method Atomic.updateBoundary()
   * handles all bodies boundary collisions
   */
  updateBoundary() {
    for (let i = 0; i < this.vertices.length; i++) {
      this.vertices[i].boundary();
    }
  }

  /**
   * @method Atomic.updateCollision()
   * Batch Update Collisions
   */
  updateCollision() {
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
  update() {
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
  render() {
    for (let i = 0; i < this.bodies.length; i++) {
      this.bodies[i].draw();
      this.bodies[i].drag();
    }
  }


  // Utils
  /**
   * @method Atomic.drag()
   * drag Poly Objects
   */
  drag() {
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
  }
  showFps(option) {
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
    if (this.fpsScope.fps < 40) {
      color = 'orange';
    }
    if (this.fpsScope.fps < 20) {
      color = 'red';
    }
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
}


Atomic.Body = Body;
Atomic.Vertex = Vertex;
Atomic.Constraint = Constraint;

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

module.exports = Atomic;