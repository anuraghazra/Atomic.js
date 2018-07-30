// AtomicJS Setup
const atomic = new Atomic('#c', window.innerWidth, 500, 0, 1, 10);
let ctx = atomic.ctx;
console.log(atomic.canvas)

// setup init
function setup() {
  let gapX = 0;
  let loopI = 0;
  for (let i = 0; i < 5; i++) {
    let b = atomic.Poly.box(100 + gapX, 100, 60, 30, {
      render: { fillStyle: 'white' }
    });
    gapX += 100;
    atomic.vertices.push(
      new Vertex(b, { x: 80 + gapX, y: 115 }, false, {
        canvas: atomic.canvas,
        gravity: 1,
        friction: 1
      })
    );
  }
  atomic.vertices.pop();
}
setup();

// atomic.Poly.triangle(atomic.canvas.width - 550, 300, 100, 100, 5, { static: true });


// for (let i = 0; i < 50; i++) {
//   let randCol = 'hsl(' + Math.random() * 360 + 'deg, 50%,50%)';

//   atomic.Poly.box(200, Math.random() * 200, 25, 25, {
//     render: { fillStyle: 'white' }
//   });

// }
// animate loop
function animate() {
  atomic.frame(animate);

  atomic.update();
  atomic.render();

  atomic.Render.dots(2);
  atomic.Render.pointIndex();
  atomic.Render.lines();
  // atomic.Render.indexOfBodies();
  // atomic.Render.centerOfMass();
  // atomic.Render.boundingBox();
  atomic.drag();
}
animate();