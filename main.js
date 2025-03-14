import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@latest/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from "https://unpkg.com/three@latest/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "https://unpkg.com/three@latest/examples/jsm/geometries/TextGeometry.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 10;


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
controls.maxDistance = 50;
controls.maxPolarAngle = Math.PI; // Prevent flipping

const color = 0xFFFFFF;
const intensity = 3;
const light = new THREE.DirectionalLight(color, intensity);
light.position.set(-1, 2, 4);
scene.add(light);


// Load the font (ensure you have a JSON font file)
let textMesh;
const loader = new FontLoader();
loader.load("./Bonbon_Regular.json", function (font) {
    const textGeometry = new TextGeometry("Looks like you've found the hidden button!\nWell, I presented you my heart.\nNow it's yours.\nIt's all yours!", {
        font: font,
        size: 0.2, // Text size
        height: 0.05, // Thickness
        curveSegments: 12, // Smoothness
        bevelEnabled: false,
        bevelThickness: 0.03,
        bevelSize: 0.01,
        bevelOffset: 0,
        bevelSegments: 3,
    });

	textGeometry.computeBoundingBox();
	const centerOffsetX = (textGeometry.boundingBox.max.x + textGeometry.boundingBox.min.x) / 2;

    const textMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    textMesh = new THREE.Mesh(textGeometry, textMaterial);

	textMesh.scale.set(1, 1, 0.0001);

    textMesh.position.set(-centerOffsetX, 2.3, 0);
	textMesh.visible = false
    scene.add(textMesh);
});

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

const center = balls[16];

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

// Create button geometry 
// Define the "I" shape
const shapeI = new THREE.Shape();
const thickness = 0.3;
const height = 1;
const widthI = 0.5;
const widthU = 0.7;

shapeI.moveTo(-widthI, height);
shapeI.lineTo(widthI, height);
shapeI.lineTo(widthI, height - thickness);
shapeI.lineTo(thickness / 2, height - thickness);
shapeI.lineTo(thickness / 2, thickness - height);
shapeI.lineTo(widthI, thickness - height);
shapeI.lineTo(widthI, -height);
shapeI.lineTo(-widthI, -height);
shapeI.lineTo(-widthI, thickness - height);
shapeI.lineTo(-thickness / 2, thickness - height);
shapeI.lineTo(-thickness / 2, height - thickness);
shapeI.lineTo(-widthI, height - thickness);
shapeI.lineTo(-widthI, height);

// Define the "U" shape
const shapeU = new THREE.Shape();
shapeU.moveTo(-widthU, height);  // Top-left
shapeU.lineTo(-widthU, -height + widthU);  // Left vertical line
shapeU.absarc(0, -height + widthU, widthU, Math.PI, 0, false);  // Perfect semicircle
shapeU.lineTo(widthU, height);  // Right vertical line
shapeU.lineTo(widthU - thickness, height);  // Inner top-right
shapeU.lineTo(widthU - thickness, -height + widthU);  // Right inner vertical
shapeU.absarc(0, -height + widthU, widthU - thickness, 0, Math.PI, true);  // Inner curved arc
shapeU.lineTo(-widthU + thickness, height);  // Inner top-left
shapeU.lineTo(-widthU, height);  // Close path

// Extrude settings (same for both buttons)
const extrudeSettings = { depth: 0.3, bevelEnabled: false };

// Create "I" button
const geoI = new THREE.ExtrudeGeometry(shapeI, extrudeSettings);
const matI = new THREE.MeshBasicMaterial({ color: 0x3498db });
const buttonI = new THREE.Mesh(geoI, matI);
buttonI.position.set(-3, 0, 0);
scene.add(buttonI);

// Create "U" button
const geoU = new THREE.ExtrudeGeometry(shapeU, extrudeSettings);
const matU = new THREE.MeshBasicMaterial({ color: 0xe74c3c });
const buttonU = new THREE.Mesh(geoU, matU);
buttonU.position.set(3, 0, 0);
scene.add(buttonU);

// Raycaster for mouse interactions
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let colorful = false;


function handleMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// Attach event listener ONCE to update the mouse position
document.addEventListener("mousemove", handleMouseMove);

// Handle mouse click
window.addEventListener('click', () => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([buttonI, buttonU]);

    if (intersects.length > 0) {
        intersects[0].object.material.color.set(0x00ff00); // Green on click
		if (intersects[0].object === buttonI) colorful = !colorful ;
		else {
			m *= 1.5;
			if (m > 20) m = 1;
		}
        setTimeout(() => intersects[0].object.material.color.set(intersects[0].object === buttonI ? 0x3498db : 0xe74c3c), 300);
    }

	const intersects_center = raycaster.intersectObjects([center]);
	if (intersects_center.length > 0) {
		textMesh.visible = !textMesh.visible
	}

});

function getRainbowColor(t) {
    const frequency = 2 * Math.PI;
    return new THREE.Color(
        Math.sin(frequency * t + 0) * 0.5 + 0.5,
        Math.sin(frequency * t + 2) * 0.5 + 0.5,
        Math.sin(frequency * t + 4) * 0.5 + 0.5
    );
}

function getFlashColor(t) {
    const frequency = 12 * Math.PI;
    return new THREE.Color(
        Math.sin(frequency * t + 0) * 0.5 + 0.5,
        0,
        0
    );
}

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
let m = 1
function animate() {
	if ( resizeRendererToDisplaySize( renderer ) ) {
		const canvas = renderer.domElement;
		camera.aspect = canvas.clientWidth / canvas.clientHeight;
		camera.updateProjectionMatrix();
	}
	t += dt;
	if (t < t1/m) d = t * v1* m;
	else if (t < t2/m) d = d1;
	else if (t < t3/m) d = d1 + (t - t2) * v1 * m;
	else if (t < 1/m) d = d2 + (t - t3) * v2 * m;
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
		if (colorful) tubes[i].material.color.copy(getRainbowColor(t));
		else tubes[i].material.color.set(0xff0000);
	});

	// Raycast every frame to check intersection
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([buttonI, buttonU]);

    if (intersects.length > 0) {
        intersects[0].object.material.color.copy(intersects[0].object === buttonI? getRainbowColor(t) : getFlashColor(t));
    } else {
        buttonI.material.color.set(0x3498db);
        buttonU.material.color.set(0xe74c3c);
    }

	renderer.render( scene, camera );

}