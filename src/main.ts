import { Forest } from "./forest"

let canvas = <HTMLCanvasElement> document.getElementById("glcanvas");
let scene = new Forest(canvas);
scene.setup();
scene.generate();

let then = Date.now();
const interval = 1000/60;
function draw() {
    requestAnimationFrame(draw);
    let now = Date.now();
    let delta = now-then;
    if (delta > interval) {
        scene.update(delta);
        scene.draw();
        then = now - (delta % interval);
    }
}
draw()