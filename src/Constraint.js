/**
 * @class Constraint
 * @param {*} parent
 * @param {*} v0
 * @param {*} v1
 * @param {*} edge
 */
class Constraint {
  constructor(parent, v0, v1, edge) {
    this.parent = parent;
    this.v0 = v0;
    this.v1 = v1;
    this.p0 = v0.position;
    this.p1 = v1.position;
    this.edge = edge;
    this.dist = Math.sqrt(this.p0.squareDist(this.p1));
  }
  /**
   * @method Constraint.solve()
   * Solve Constrints
   */
  solve() {
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
}
;



module.exports = Constraint;