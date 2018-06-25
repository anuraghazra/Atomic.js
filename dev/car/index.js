const atomic = new Atomic('#c', window.innerWidth, 350, 1, 1, 20);

atomic.Poly.box(100, 130, 150, 40, {
  mass : 10,
  render: { fillStyle: 'white' }
});
atomic.Poly.circle(310, 150, 50, 24, {
  mass: 5,
  render: { fillStyle: 'white' }
});
atomic.Poly.circle(40, 150, 50, 24, {
  mass: 5,
  render: { fillStyle: 'white' }
});

atomic.addConstraint(2, 28, false);
atomic.addConstraint(1, 28, false);
atomic.addConstraint(3, 53, false);
atomic.addConstraint(0, 53, false);

console.log(atomic.constraints)

function applyThrust(value) {
  for (let i = 0; i < atomic.bodies[1].positions.length; i++) {
    atomic.bodies[1].positions[i].x += value;
    // atomic.bodies[1].positions[i].x += value;
    // atomic.bodies[0].positions[i].y += value;
  }
}
window.addEventListener('keydown', function (e) {
  if (e.key === 'd') {
    applyThrust(5);
  } else if (e.key === 'a') {
    applyThrust(-5);
  }
})

atomic.Poly.box(80,150, 500, 30, {
  static: true,
  angle: 20,
  render: { fillStyle: 'white' }
});
atomic.canvas.onclick = function (e) {
  // atomic.Poly.box(e.offsetX, e.offsetY, 20, 20, {
  //   render: { fillStyle: 'white' }
  // });
  atomic.Poly.box(e.offsetX, e.offsetY, 30, 30, {
    render: { fillStyle: 'white' }
  });
  // atomic.Poly.circle(e.offsetX, e.offsetY, 30, 8, {
  //   mass : 5,
  //   render: { fillStyle: 'white' }
  // });
}


function animate() {
  atomic.frame(animate);

  atomic.update();
  atomic.render();

  // atomic.Render.dots();
  atomic.Render.lines();
  // atomic.Render.indexOfBodies();
  // atomic.Render.pointIndex();

  atomic.dragVertex && atomic.drag();

}
animate();