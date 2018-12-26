const atomic = new Atomic('#c', window.innerWidth, 350, 1, 0.95, 100);


atomic.Poly.box(350, 50, 50, 50, {
  render: { fillStyle: 'crimson' }
});
atomic.Poly.box(350, 100, 50, 50, {
  render: { fillStyle: 'deepskyblue' }
});
atomic.Poly.box(350, 150, 50, 50, {
  render: { fillStyle: 'yellowgreen' }
});
atomic.Poly.box(350, 200, 50, 50, {
  render: { fillStyle: 'yellowgreen' }
});
atomic.Poly.box(350, 250, 50, 50, {
  render: { fillStyle: 'yellowgreen' }
});

let down = false;
window.addEventListener('mousedown', function(e) {
  down = true;
});
window.addEventListener('mouseup', function(e) {
  down = false;
});
window.addEventListener('mousemove', function(e) {
  if (!down) return;
  let b = atomic.bodies[atomic.bodies.length-1];
  for (let i = 0; i < b.positions.length; i++) {
    if(e.offsetX > window.innerWidth/2) {
      b.positions[i].x += 1;
    } else {
      b.positions[i].x -= 1;
    }
  }
});


function animate() {
  atomic.frame(animate);

  atomic.update();
  atomic.render();

  atomic.Render.lines();
  // atomic.Render.dots();
  // atomic.Render.indexOfBodies();
  // atomic.Render.pointIndex();

  atomic.drag();

}
animate();