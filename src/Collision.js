const Vector = require('./Vector');

/**
 * @class Collision
 * Collision Detection Class
 */
class Collision {
  constructor() {
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
  SAT(B0, B1) {
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
      }
      else if (Math.abs(dist) < minDistance) {
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
      this.axis.negative();
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
  checkAABB(B1, B0) {
    if (!(0 > Math.abs(B1.center.x - B0.center.x) - (B1.halfEx.x + B0.halfEx.x) &&
      0 > Math.abs(B1.center.y - B0.center.y) - (B1.halfEx.y + B0.halfEx.y))) {
      return false;
    }
  }
  /**
   * Resolve Collision based on SAT Given Collision Information
   * @method Collision.resolve()
   * @param {float} friction
   */
  resolve(friction) {
    // cache vertices positions
    let p0 = this.edge.p0, p1 = this.edge.p1, o0 = this.edge.v0.oldPosition, o1 = this.edge.v1.oldPosition, vp = this.vertex.position, vo = this.vertex.oldPosition, rs = this.response;
    this.response.scale(this.axis, this.depth);
    // calculate where on the edge the collision vertex lies
    let t = Math.abs(p0.x - p1.x) > Math.abs(p0.y - p1.y)
      ? (vp.x - rs.x - p0.x) / (p1.x - p0.x)
      : (vp.y - rs.y - p0.y) / (p1.y - p0.y);
    // lambda math
    let lambda = 1 / (t * t + (1 - t) * (1 - t));
    // calculate mass
    let m0 = this.vertex.parent.mass, m1 = this.edge.parent.mass, tm = m0 + m1;
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
    this.relVel.set(vp.x - vo.x - (p0.x + p1.x - o0.x - o1.x) * 0.5, vp.y - vo.y - (p0.y + p1.y - o0.y - o1.y) * 0.5);
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
  aabb(B0, B1) {
    return (B0.bound.minX <= B1.bound.maxX) &&
      (B0.bound.minY <= B1.bound.maxY) &&
      (B0.bound.maxX >= B1.bound.minX) &&
      (B1.bound.maxY >= B0.bound.minY);
  }
}

module.exports = Collision;
