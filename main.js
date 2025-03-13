import * as THREE from 'three';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 5;

const canvas = document.querySelector( '#c' );
const renderer = new THREE.WebGLRenderer( { antialias: true, canvas } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );


// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth rotation
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 2;
controls.maxDistance = 10;
controls.maxPolarAngle = Math.PI; // Prevent flipping

const color = 0xFFFFFF;
const intensity = 3;
const light = new THREE.DirectionalLight(color, intensity);
light.position.set(-1, 2, 4);
scene.add(light);

// const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// const material = new THREE.MeshPhongMaterial( { color: 0x00ff00 } );
// const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );

const radius = 0.1
const positions = [
	[0, 1, 0],
	[0.5, 1.2365, 0],
	[1, 1, 0],
	[1.138, 0.5, 0],
	[1, 0, 0],
	[0.745, -0.3725, 0],
	[-0.3577, -0.7153, 0],
	[0, -1, 0],
	[0, 0.7829, 0.5],
	[0.5, 0.8578, 0.5],
	[0.7845, 0.5, 0.5],
	[0.6189, -0.068, 0.5],
	[0, -0.5588, 0.5],
	[0, 0.4829, 0.63],
	[0.3858, 0.0912, 0.63],
	[0, -0.2215, 0.63],
	[0, 0.1365, 0.67286]
];

const positions_left = positions.map(p => [-p[0], p[1], p[2]])
positions_left.forEach(p => {
	if (p[0] !== 0) {
		positions.push(p)
	}
})

const positions_back = positions.map(p => [p[0], p[1], -p[2]])
positions_back.forEach(p => {
	if (p[2] !== 0) {
		positions.push(p)
	}
})
positions.forEach((p, i, arr) => {
	arr[i] = new THREE.Vector3(...p);
})
  
// Reuse the same geometry and material for performance
const sphereGeometry = new THREE.SphereGeometry(radius, 32, 16);
const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });

const balls = [];
const tubes = [];
const ends = [];

// Loop through each position and create a sphere
positions.forEach((p) => {
	const sphere = new THREE.Mesh(sphereGeometry, material);
	sphere.position.copy(p);
	scene.add(sphere);
	balls.push(sphere);
});

positions.forEach((p1, i) => {
	positions.forEach((p2, j) => {
		const d = p1.distanceTo(p2)
		if (i !== j && d < 0.7) {
			const cylinderGeometry = new THREE.CylinderGeometry(radius/5, radius/5, d, 32);
			const tube = new THREE.Mesh(cylinderGeometry, material);
			const direction = p2.clone().sub(p1);
			tube.position.copy(p1).addScaledVector(direction, 0.5); // Position in the middle
			tube.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()); // Rotate
			scene.add(tube);
			tubes.push(tube);
			ends.push([i, j]);
		}
	})
});



function resizeRendererToDisplaySize(renderer) {
	const width = window.innerWidth;
	const height = window.innerHeight;
	const needResize = renderer.domElement.width !== width || renderer.domElement.height !== height;

	if (needResize) {
		renderer.setSize(width, height, true); // Ensure full resizing
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
	}
}

let t = 0;
let d = 0;
const t1 = 0.1;
const t2 = 0.15;
const t3 = 0.25;
const dt = 0.01;
const v1 = 0.4;
const d1 = v1 * t1;
const d2 = d1 + v1 * (t3 - t2);
const v2 = - d2 / (1 - t3);
function animate() {
	if ( resizeRendererToDisplaySize( renderer ) ) {
		const canvas = renderer.domElement;
		camera.aspect = canvas.clientWidth / canvas.clientHeight;
		camera.updateProjectionMatrix();
	}
	t += dt;
	if (t < t1) d = t * v1;
	else if (t < t2) d = d1;
	else if (t < t3) d = d1 + (t - t2) * v1;
	else if (t < 1) d = d2 + (t - t3) * v2;
	else t = 0;
	positions.forEach((p, i) => {
		balls[i].position.copy(p.clone().add(p.clone().normalize().multiplyScalar(d)));
	})
	ends.forEach(([id1, id2], i) => {
		const p1 = balls[id1].position;
		const p2 = balls[id2].position;
		const distance = p1.distanceTo(p2);

		// Update existing geometry
		tubes[i].scale.set(1, distance / tubes[i].geometry.parameters.height, 1);

		// Reposition the tube
		const direction = p2.clone().sub(p1).normalize();
		tubes[i].position.copy(p1).addScaledVector(direction, distance / 2);
		tubes[i].quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
	});

	renderer.render( scene, camera );

}