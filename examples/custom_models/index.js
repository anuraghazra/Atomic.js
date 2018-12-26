const atomic = new Atomic('#c', window.innerWidth, 350, 1, 1, 20);

atomic.createPoly('100,100 200,100 200,200 100,250 50,200', {
  mass: 1,
  render: { fillStyle: 'green' }
});

atomic.Poly.triangle(350, 100, 100, 100, {
  render: { fillStyle: 'red' }
});


function animate() {
  atomic.frame(animate);

  atomic.update();
  atomic.render();

  atomic.Render.dots();
  atomic.Render.lines();
  // atomic.Render.indexOfBodies();
  atomic.Render.pointIndex();

  atomic.drag();

}
animate();