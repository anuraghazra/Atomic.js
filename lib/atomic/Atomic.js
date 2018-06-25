/**
 * Atomic.js
 * @description Simple 2D Collision Detection Library
 * @version v0.0.1
 * @author Anurag Hazra (hazru.anurag@gmail.com)
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
  this.constraintIterations = simIteration;  

  const that = this;

  this.bodies = [];
  this.vertices = [];
  this.constraints = [];

  this.collision = null;

  // init drag
  this.dragVertex = null;
  this.pointer = { x: 0, y: 0, isDown: false }
  this.canvas.addEventListener('mousedown', function (e) {
    that.pointer.isDown = true;
  })
  this.canvas.addEventListener('mouseup', function (e) {
    that.pointer.isDown = false;
  })
  this.canvas.addEventListener('mousemove', function (e) {
    that.pointer.x = e.offsetX;
    that.pointer.y = e.offsetY;
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
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {object} opt
     */
    box: function (x, y, w, h, opt) {
      var b = new that.Body({
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
      }, that);
      that.bodies.push(b);
      return b;
    },
    /**
     * Create A Triangle
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {object} opt
     */
    triangle: function (x, y, w, h, opt) {
      w /= 2;
      h /= 2;
      var b = new that.Body({
        x: x,
        y: y,
        mass: opt.mass,
        static: (opt.static || false),
        render: opt.render,
        vertices: {
          n0: { x: x - w, y: y + h },
          n1: { x: x, y: y - h },
          n2: { x: x + w, y: y + h }
        },
        constraints: [["n0", "n1", true], ["n1", "n2", true], ["n2", "n0", true]]
      }, that);
      that.bodies.push(b);
      return b;
    },
    /**
     * Create A Cricle
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

      var b = new that.Body({
        x: x,
        y: y,
        mass: opt.mass,
        static: (opt.static || false),
        render: opt.render,
        vertices: tmpV,
        constraints: tmpC
      });
      that.bodies.push(b);
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
  this.Render = {
    /**
     * @method Render.dots
     * @param {number} radius
     * @param {string} color
     */
    dots: function (radius, color) {
      let PI2 = Math.PI * 2;
      let rad = radius || 4;
      for (let i = 0, j = that.vertices.length; i < j; i++) {
        let p = that.vertices[i].position;
        if (!p.hidden) {
          let fill = (p.color || color || 'black');
          that.ctx.beginPath();
          that.ctx.fillStyle = fill;
          that.ctx.arc(p.x, p.y, rad, 0, PI2);
          that.ctx.fill();
          that.ctx.closePath();
        }
      }
    },

    /**
     * @method Render.pointIndex
     * @param {string} font
     * @param {stirng} color
     */
    pointIndex: function (font, color) {
      that.ctx.font = font || '10px Arial';
      that.ctx.fillStyle = color || 'black';
      for (let i = 0; i < that.vertices.length; i++) {
        let p = that.vertices[i].position;
        that.ctx.fillText(i, (p.x - 5), (p.y - 5));
      }
      that.ctx.fill();
    },

    /**
     * @method Render.lines
     * @param {number} linewidth
     * @param {string} color
     * @param {boolean} showHidden
     */
    lines: function (linewidth, color, showHidden) {
      if (!showHidden) { showHidden = false; }
      if (that.constraints.length > 0) {
        that.ctx.beginPath();
        that.ctx.strokeStyle = (color || 'black');
        that.ctx.lineWidth = linewidth || 1;
        for (let i = 0; i < that.constraints.length; i++) {
          let c = that.constraints[i];
          if (!c.hidden) {
            that.ctx.moveTo(c.p0.x, c.p0.y);
            that.ctx.lineTo(c.p1.x, c.p1.y);
          }
          if (showHidden === true) {
            if (c.hidden) {
              that.ctx.moveTo(c.p0.x, c.p0.y);
              that.ctx.lineTo(c.p1.x, c.p1.y);
            }
          }
        }
        that.ctx.stroke();
        that.ctx.closePath();
      }
    },

    /**
     * @method indexOfBodies
     * @param {string} font
     * @param {string} color
     */
    indexOfBodies: function (font, color) {
      that.ctx.save();
      that.ctx.font = font || '10px Arial';
      that.ctx.fillStyle = color || 'black';
      for (let i = 0; i < that.bodies.length; i++) {
        let p = that.bodies[i];
        for (let j = 0; j < p.vertices.length; j++) {
          let v = p.vertices[j].position;
          that.ctx.fillText(i + '.' + j, (v.x - 10), (v.y - 10));
        }
      }
      that.ctx.fill();
      that.ctx.restore();
    },

    /**
     * @method Render.renderCenterOfMass
     * @param {string} color
     */
    centerOfMass: function (color) {
      that.ctx.fillStyle = color || 'black';
      that.ctx.beginPath();
      for (let i = 0; i < that.bodies.length; i++) {
        let b = that.bodies[i];
        that.ctx.fillRect(b.center.x - 2.5, b.center.y - 2.5, 5, 5);
      }
      that.ctx.fill();
      that.ctx.closePath();
    },

    /**
     * @method boundingBox
     * @param {string} color
     */
    boundingBox: function (color) {
      that.ctx.fillStyle = color || 'rgba(0,0,0,0.2)';
      that.ctx.beginPath();
      // !(0 > Math.abs(B1.center.x - B0.center.x) - (B1.halfEx.x + B0.halfEx.x) &&
      //   0 > Math.abs(B1.center.y - B0.center.y) - (B1.halfEx.y + B0.halfEx.y))
      for (let i = 0; i < that.bodies.length; i++) {
        let b = that.bodies[i];
        that.ctx.fillRect(b.center.x - b.halfEx.x, b.center.y - b.halfEx.y, b.halfEx.x + b.halfEx.x, b.halfEx.y + b.halfEx.y);
      }
      that.ctx.fill();
      that.ctx.closePath();
    },

    information: function () {
      let stat = 'Objects : ' + that.bodies.length;
      let stat2 = 'Vertices : ' + that.vertices.length;
      let stat3 = 'Constraints : ' + that.constraints.length;
      that.ctx.fillStyle = 'black';
      that.ctx.font = '14px Arial'
      that.ctx.fillText(stat, 10, 20);
      that.ctx.fillText(stat2, 10, 40);
      that.ctx.fillText(stat3, 10, 60);
    }
  }










  /**
   * Body
   * @constructor Body
   * @param {object} opt 
   */
  this.Body = function (opt) {
    this.vCount = 0;
    this.eCount = 0;
    this.vertices = [];
    this.positions = [];
    this.edges = [];
    this.min = 0;
    this.max = 0;
    this.center = new Vector(0, 0);
    this.halfEx = new Vector(0, 0);
    this.bound = {};

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
      let vertex = new that.Vertex(this, opt.vertices[n], this.static);
      opt.vertices[n].compiled = vertex;
      this.vertices.push(vertex);
      this.positions.push(vertex.position);
      that.vertices.push(vertex);
      this.vCount++;
    }

    // CONSTRAINTS
    // loop through opt.constraints and add them to array
    for (let i = 0; i < opt.constraints.length; i++) {
      let cons = opt.constraints[i];

      let constraint = new that.Constraint(
        this, //parent
        opt.vertices[cons[0]].compiled, // v0
        opt.vertices[cons[1]].compiled, // v1
        (cons[2] || false)
      );

      if (constraint.edge) {
        this.edges.push(constraint);
        this.eCount++;
      }

      // Engine's Total Constrains
      that.constraints.push(constraint);
    }

    if (this.angle !== 0) {
      // this.vertices.push(vertex);
      // this.positions.push(vertex.position);
      // that.vertices.push(vertex);
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
   * @method Body.calculateCenter
   * calculateCenter and bounding box
   */
  this.Body.prototype.calculateCenter = function () {
    var minX = 99999.0, minY = 99999.0, maxX = -99999.0, maxY = -99999.0;

    for (var i = 0; i < this.vCount; i++) {
      var p = this.positions[i];

      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
    }

    // center
    this.center.set((minX + maxX) * 0.5, (minY + maxY) * 0.5);

    // half extents
    this.halfEx.set((maxX - minX) * 0.5, (maxY - minY) * 0.5);

    this.bound = { minX, minY, maxX, maxY };
  };

  /**
   * get the vector projection on to normal (n)
   * @method Body.Project
   * @param {vector} n
   */
  this.Body.prototype.project = function (n) {
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
  this.Body.prototype.draw = function () {
    that.ctx.beginPath();
    var p = this.edges[0].p0;

    for (let i in this.render) {
      if (this.render.hasOwnProperty(i)) {
        that.ctx[i] = this.render[i];
      }
    }

    that.ctx.fillStyle = this.render.fillStyle;

    that.ctx.moveTo(p.x, p.y);
    for (var i = 1; i < this.edges.length; i++) {
      p = this.edges[i].p0;
      that.ctx.lineTo(p.x, p.y);
    }

    if (this.render.strokeStyle) { that.ctx.stroke() };
    that.ctx.fill();
    that.ctx.closePath();
  };

  /**
   * @method Body.drag()
   */
  this.Body.prototype.drag = function () {
    // drag
    if (that.pointer.isDown && !that.dragVertex) {
      if (that.ctx.isPointInPath(that.pointer.x, that.pointer.y)) {
        let minDistance = 99999;

        for (let i = 0; i < that.vertices.length; i++) {
          let dist = that.vertices[i].position.squareDist(that.pointer);

          if (dist < minDistance) {
            that.dragVertex = that.vertices[i];
            minDistance = dist;
          }
        }
      }
    }
    if (that.pointer.isDown === false) {
      that.dragVertex = null;
    }
  }










  /**
   * @constructor Vertex
   * @param {*} parent 
   * @param {*} vertex 
   * @param {*} pinned 
   */
  this.Vertex = function (parent, vertex, pinned) {
    this.parent = parent;
    this.position = new Vector(vertex.x, vertex.y);
    this.oldPosition = new Vector(vertex.x, vertex.y);
    this.pinned = pinned;
  };

  /**
   * @method Vertex.integrate();
   * Loop and update physics
   */
  this.Vertex.prototype.integrate = function () {
    if (!this.pinned) {
      let current = this.position;
      let old = this.oldPosition;
      let x = current.x;
      let y = current.y;

      current.x += (current.x - old.x) * that.friction;
      current.y += (current.y - old.y) * that.friction + that.gravity;
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
    } else if (current.y > that.canvas.height) {
      current.x -= (current.y - that.canvas.height) * vx * that.groundFriction;
      current.y = that.canvas.height;
    }

    // X
    if (current.x < 0) {
      current.x = 0
    } else if (current.x > that.canvas.width) {
      current.x = that.canvas.width
    };
  }










  /**
   * @constructor Constraint
   * @param {*} parent 
   * @param {*} v0 
   * @param {*} v1 
   * @param {*} edge 
   */
  this.Constraint = function (parent, v0, v1, edge) {
    this.parent = parent;
    this.v0 = v0;
    this.v1 = v1;
    this.p0 = v0.position;
    this.p1 = v1.position;
    this.dist = Math.sqrt(this.p0.squareDist(this.p1));
    this.edge = edge;
  };


  /**
   * @method solve
   * Solve Constrints
   */
  this.Constraint.prototype.solve = function () {
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










  /**
   * @class Collision
   * Collision Detection Class
   */
  this.Collision = function () {
    this.testAxis = new Vector(0, 0);
    this.axis = new Vector(0, 0);
    this.center = new Vector(0, 0);
    this.line = new Vector(0, 0);
    this.response = new Vector(0, 0);
    this.depth = 0;
    this.edge = null;
    this.vertex = null;
    this.relTanVel = new Vector(0, 0);
    this.relVel = new Vector(0, 0)
    this.tangent = new Vector(0, 0)
  }

  /**
   * SAT Collision Detection
   * @method Collision.SAT
   * @param {} B0
   * @param {} B1
   */
  this.Collision.prototype.SAT = function (B0, B1) {
    // no aabb overlap
    if (
      !(0 > Math.abs(B1.center.x - B0.center.x) - (B1.halfEx.x + B0.halfEx.x) &&
        0 > Math.abs(B1.center.y - B0.center.y) - (B1.halfEx.y + B0.halfEx.y))
    ) {
      return false;
    }
    let minDistance = Number.MAX_SAFE_INTEGER,
      n0 = B0.eCount,
      n1 = B1.eCount;

    // Iterate through all of the edges of both bodies
    for (let i = 0, n = n0 + n1; i < n; i++) {
      // get edge
      let edge = i < n0 ? B0.edges[i] : B1.edges[i - n0];

      // if(edge.edge == undefined) {
      //   console.log(edge.edge)
      //   // continue;
      // }

      // Calculate the perpendicular to this edge and normalize it
      this.testAxis.normal(edge.p0, edge.p1);

      // Project both bodies onto the normal
      B0.project(this.testAxis);
      B1.project(this.testAxis);

      //Calculate the distance between the two intervals
      let dist = B0.min < B1.min ? B1.min - B0.max : B0.min - B1.max;

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
      let t = B1;
      B1 = B0;
      B0 = t;
    }

    // Make sure that the collision normal is pointing at B1
    // let n = this.center.sub2(B0.center, B1.center).dot(this.axis);
    let xx = B0.center.x - B1.center.x;
    let yy = B0.center.y - B1.center.y;
    let n = this.axis.x * xx + this.axis.y * yy;


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

  /**
   * @method Collision.resolve
   * Resolve Collision based on SAT Given Collision Information
   */
  this.Collision.prototype.resolve = function () {
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
    vo.x += rt.x * that.friction * m1;
    vo.y += rt.y * that.friction * m1;

    o0.x -= rt.x * (1 - t) * that.friction * lambda * m0;
    o0.y -= rt.y * (1 - t) * that.friction * lambda * m0;
    o1.x -= rt.x * t * that.friction * lambda * m0;
    o1.y -= rt.y * t * that.friction * lambda * m0;
  }

  this.Collision.prototype.aabb = function (B0, B1) {
    return (B0.bound.minX <= B1.bound.maxX) && (B0.bound.minY <= B1.bound.maxY) && (B0.bound.maxX >= B1.bound.minX) && (B1.bound.maxY >= B0.bound.minY);
  }

  this.collision = new this.Collision();
}










/****************************/
/***** ATOMIC PROTOTYPES ****/
/****************************/

/**
 * requestAnimationFrame
 * @method Atomic.frame
 * @param {*} func 
 * @param {*} color 
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
 * @method Atomic.clear
 * @param {string} color 
 */
Atomic.prototype.clear = function (color) {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  if (color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
};

Atomic.prototype.createPoly = function (vert, cons, opt) {
  if (opt === undefined) opt = {};

  console.log(opt)
  let b = new this.Body({
    mass: (arguments.length === 2) ? cons.mass : opt.mass,
    render: (arguments.length === 2) ? cons.render : opt.render,
    vertices: vert,
    constraints: (cons || [])
  }, this);

  if (arguments.length === 2) {
    // join outer vertex
    for (let i = 0; i < b.vertices.length; i++) {
      let bvert = b.vertices;
      let cons = new this.Constraint(b, b.vertices[i], b.vertices[(i + 1) % bvert.length], true);
      b.edges.push(cons);
      b.eCount++;
      this.constraints.push(cons);
    }

    // add center vertex
    b.calculateCenter();
    let centerVertex = new this.Vertex(b, b.center);
    b.vertices.push(centerVertex);
    this.vertices.push(centerVertex);
    // b.vCount++;


    // join to center vertex
    for (let i = 0; i < b.vertices.length - 1; i++) {
      let cons = new this.Constraint(b, b.vertices[i], b.vertices[b.vertices.length - 1], false);
      b.edges.push(cons);
      b.eCount++;
      this.constraints.push(cons)
    }
  }

  this.bodies.push(b);
  return b;
}

/**
 * @method Atomic.addConstraint()
 * @param {number} i
 * @param {number} j
 * @param {boolean} edge
 */
Atomic.prototype.addConstraint = function (i, j, edge) {
  let cons = new this.Constraint(this, this.vertices[i], this.vertices[j], edge);
  console.log(cons)
  this.constraints.push(cons);
}
/**
 * @method Atomic.addVertex()
 * @param {number} x
 * @param {number} y
 * @param {boolean} edge
 */
Atomic.prototype.addVertex = function (x, y, pinned) {
  let vertex = new this.Vertex(this, { x: x, y: y }, pinned);
  this.vertices.push(vertex);
}

/**
 * @method Atomic.integrate
 * updates vertices
 */
Atomic.prototype.integrate = function () {
  for (let i = 0; i < this.vertices.length; i++) {
    this.vertices[i].integrate();
  }
}

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
        this.collision.SAT(b0, b1) && this.collision.resolve();
      }
    }
  }
}

Atomic.prototype.updateConstraints = function () {
  // solve constrains
  for (let i = 0; i < this.constraints.length; i++) {
    this.constraints[i].solve();
  }
}

Atomic.prototype.updateBoundary = function () {
  for (let i = 0; i < this.vertices.length; i++) {
    this.vertices[i].boundary();
  }
}

/**
 * @method Atomic.update
 * Solve All Collision And Update
 */
Atomic.prototype.update = function () {
  this.integrate();

  for (let n = 0; n < this.simIteration; n++) {
    for (let ci = 0; ci < this.constraintIterations; ci++) {
      this.updateBoundary();
      this.updateConstraints();
    }
    this.updateCollision();
  }
};

/**
 * @method Atomic.render
 * draw all bodies
 * @param {*} ctx 
 */
Atomic.prototype.render = function () {
  for (let i = 0; i < this.bodies.length; i++) {
    this.bodies[i].draw();
    this.bodies[i].drag();
  }
};

/**
 * @method Atomic.drag
 * drag Poly Objects
 */
Atomic.prototype.drag = function () {
  // draw mouse link
  this.ctx.beginPath();
  this.ctx.moveTo(this.dragVertex.position.x, this.dragVertex.position.y);
  this.ctx.lineTo(this.pointer.x, this.pointer.y);
  this.ctx.strokeStyle = "#000";
  this.ctx.stroke();

  // correct position
  var s = this.dragVertex.parent.mass * 5;
  this.dragVertex.position.x += (this.pointer.x - this.dragVertex.position.x) / s;
  this.dragVertex.position.y += (this.pointer.y - this.dragVertex.position.y) / s;
};



/**
 * shows current framerate 
 * @method showFps
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
  let color = 'green';
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
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x - 5, y - 5, 100, 60);
    ctx.stroke();

    //fps
    ctx.fillStyle = '#555';
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