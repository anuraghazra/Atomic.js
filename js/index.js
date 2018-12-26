// AtomicJS Setup
const atomic = new Atomic('#c', window.innerWidth, 450, 1, 1, 50);
let ctx = atomic.ctx;

// setup init
function init() {

  for (let i = 0; i < 100; i++) {
    let randCol = 'hsl(' + Math.random() * 360 + 'deg, 50%,50%)';

    atomic.Poly.box(Math.random() * window.innerWidth, Math.random() * window.innerHeight, 30, 30, {
      render: { fillStyle: randCol }
    });

  }

  // atomic.Poly.circle(Math.random() * atomic.width, 300, 40, 24, 1);
  atomic.Poly.triangle(atomic.canvas.width - 550, 300, 100, 100, {
    static: true,
    render: {
      fillStyle: 'green',
      // strokeStyle : 'blue',
      // lineWidth : 4
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

// Click To Add Box
atomic.canvas.addEventListener('click', function (e) {
  let randCol = 'hsl(' + Math.random() * 360 + 'deg, 50%,50%)';
  // for (let i = 0; i < 1; i++) {
    atomic.Poly.box(e.offsetX - 15, e.offsetY - 15, 30, 30, {
      mass : 1,
      render: {
        fillStyle: randCol
      }
    })
  // }
});



let tmpVDraw = {};
function drawPoly() {
  let tmpV = {};
  let index = 0;
  let interval = 0;
  let isDragging = false;
  let isShift = false;

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Shift') {
      isShift = true;
    }
  })
  window.addEventListener('keyup', function (e) {
    if (e.key === 'Shift') {
      isShift = false;
    }
  })
  // set isDragging flag
  atomic.canvas.addEventListener('mousedown', function (e) {
    isDragging = true;
  })

  // save {x,y} at certain intervals and render it
  atomic.canvas.addEventListener('mousemove', function (e) {
    interval++;
    if (isDragging && isShift) {
      if (interval >= 5) {
        let x = e.offsetX;
        let y = e.offsetY;
        tmpV[index] = { x: x, y: y };
        tmpVDraw[index] = { x: x, y: y };
        tmpVDraw[index + 1] = tmpVDraw[0];
        index++;
        interval = 0;
      }
    }

  })

  // reset all variables
  atomic.canvas.addEventListener('mouseup', function (e) {
    if (index > 2) {
      atomic.createPoly(tmpV, {
        // mass : 1,
        render: { fillStyle: 'deepskyblue' }
      });
    }
    tmpV = {};
    tmpVDraw = {};
    index = 0;
    interval = 0;
    isDragging = false;
  })

}
drawPoly();

function showDrawing() {
  if (tmpVDraw[0]) {
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.moveTo(tmpVDraw[0].x, tmpVDraw[0].y)
    for (const i in tmpVDraw) {
      ctx.lineTo(tmpVDraw[i].x, tmpVDraw[i].y)
    }
    ctx.stroke();
    ctx.closePath();
  }
}


// atomic.simluationConfig({
//   iterations : 10,
//   velocityIteration : 5,
//   constraintsIteration : 5
// })

// animate loop
function animate() {
  atomic.frame(animate);

  atomic.update();

  atomic.render();

  showDrawing();

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