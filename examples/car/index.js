const atomic = new Atomic('#c', window.innerWidth, 600, 1, 1, 80);

atomic.Poly.box(100, 30, 150, 50, {
  mass : 10,
  render: { fillStyle: 'white' }
});
atomic.Poly.circle(310, 50, 50, 24, {
  mass: 5,
  render: { fillStyle: 'white' }
});
atomic.Poly.circle(40, 50, 50, 24, {
  mass: 5,
  render: { fillStyle: 'white' }
});

atomic.addConstraint(2, 28, false);
atomic.addConstraint(1, 28, false);
atomic.addConstraint(3, 53, false);
atomic.addConstraint(0, 53, false);


// box
atomic.Poly.box(150, 420, 500, 30, {
  static: true,
  angle: 18,
  render: { fillStyle: 'white' }
});

function applyThrust(value) {
  for (let i = 0; i < atomic.bodies[1].positions.length; i++) {
    atomic.bodies[1].positions[i].x += value;
  }
}
window.addEventListener('keydown', function (e) {
  if (e.key === 'd') {
    applyThrust(5);
  } else if (e.key === 'a') {
    applyThrust(-5);
  }
})


atomic.canvas.onmousedown = function (e) {
  if (e.button == 0) {
    atomic.Poly.box(e.offsetX, e.offsetY, 30, 30, {
      render: { fillStyle: 'white' }
    });
  }
  if (e.button == 1) {
    atomic.Poly.circle(e.offsetX, e.offsetY, 30, 8, {
      mass : 5,
      render: { fillStyle: 'white' }
    });
  }
}
window.addEventListener('contextmenu', (e) => e.preventDefault())


function animate() {
  atomic.frame(animate);

  atomic.update();
  atomic.render();

  // atomic.Render.dots();
  atomic.Render.lines();
  // atomic.Render.indexOfBodies();
  // atomic.Render.pointIndex();
  // atomic.Render.centerOfMass();
  // atomic.Render.boundingBox();

  atomic.showFps();
  atomic.drag();

}
animate();