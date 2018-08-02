# Atomic.js
### Greatly Simple 2D Physics Engine

![Atomic.js](/logo/logo.png)

## Getting Started

```javascript

// AtomicJS Setup
const atomic = new Atomic('#c', window.innerWidth, 450, 1, 1, 50);

// setup init
function init() {
  for (let i = 0; i < 100; i++) {
    let randCol = 'hsl(' + Math.random() * 360 + 'deg, 50%,50%)';
    atomic.Poly.box(200, Math.random() * 200, 30, 30, {
      render: { fillStyle: randCol }
    });
  }

  atomic.Poly.triangle(atomic.canvas.width - 550, 300, 100, 100, {
    static: true,
    render: {
      fillStyle: 'green',
    }
  });
  atomic.Poly.triangle(atomic.canvas.width - 400, 300, 100, 100, {
    static: true,
    render: {
      fillStyle: 'red'
    }
  });

  atomic.Poly.box(300, 200, 200, 20, {
    static: true,
    render: { fillStyle: 'tomato' }
  });
}
init();

// animate loop
function animate() {
  atomic.frame(animate);

  atomic.update();

  atomic.render();

  // atomic.Render.dots();
  // atomic.Render.pointIndex();
  // atomic.Render.lines();
  // atomic.Render.indexOfBodies();
  // atomic.Render.centerOfMass();
  // atomic.Render.boundingBox();
  atomic.Render.information();
  atomic.showFps({x:atomic.canvas.width-100});

  atomic.drag();
}
animate();
```