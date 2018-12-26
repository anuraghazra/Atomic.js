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