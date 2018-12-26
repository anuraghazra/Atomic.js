# Atomic.js
### Greatly Simple 2D Physics Engine

![Atomic.js](/logo/logo.png)

## Getting Started

## HTML
```html
<!DOCTYPE html>
<html>
<head>
  <title>Atomic.js</title>
</head>
<body>
  <canvas id="c"></canvas>

  <!-- Atomic.js -->
  <script src="./dist/atomic.build.js"></script>
  <!-- index.js -->
  <script src="./index.js"></script>
</body>
</html>
```

## javascript
```javascript

// AtomicJS Setup
// (canvasid, width, height, gravity, friction, simIteration)
const atomic = new Atomic('#c', 500, 500, 1, 1, 50);

// setup init
function init() {
  for (let i = 0; i < 50; i++) {
    let color = 'hsl(' + Math.random() * 360 + 'deg, 50%,50%)';
    atomic.Poly.box(200, 200, 30, 30, {
      render: { fillStyle: color }
    });
  }

  atomic.Poly.triangle(100, 300, 100, 100, {
    static: true,
    render: {
      fillStyle: 'green',
    }
  });
  atomic.Poly.triangle(250, 300, 100, 100, {
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

-----------

Made with :heart: And Javascript