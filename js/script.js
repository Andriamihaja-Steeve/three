

const earthText = document.getElementById('earth-text');
const sunText = document.getElementById('sun-text');
const galaxyButton = document.getElementById('galaxy-button');
const saturnDescription = document.getElementById('saturn-description');
const titanDescription = document.getElementById('titan-description');
const returnButton = document.getElementById("return-button");
let originalCameraPosition = new THREE.Vector3();
let originalCameraQuaternion = new THREE.Quaternion();
let isOnSaturn = false;
let isTitanClicked = false;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Activer les ombres dans le renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const earthGeometry = new THREE.SphereGeometry(5, 32, 32);
const earthTexture = new THREE.TextureLoader().load('img/earth.jpg');
const earthMaterial = new THREE.MeshLambertMaterial({ map: earthTexture });
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.castShadow = true;
scene.add(earth);
const shadowPlaneGeometry = new THREE.PlaneGeometry(20, 20);
const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
const shadowPlane = new THREE.Mesh(shadowPlaneGeometry, shadowMaterial);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -5.1;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

// Création du Soleil
const sunGeometry = new THREE.SphereGeometry(30, 32, 32);
const sunTexture = new THREE.TextureLoader().load('img/sun.jpg');
const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Position initiale du Soleil à droite de la Terre
sun.position.set(80, 0, 0);

// Ajout d'une lumière directionnelle simulant le Soleil
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(sun.position.x, sun.position.y, sun.position.z);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

// Ajout d'une lumière ambiante douce
const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
scene.add(ambientLight);

// Position initiale de la caméra
camera.position.z = 15;

// Gestion du redimensionnement de la fenêtre
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// Variables pour la révolution
let earthOrbitAngle = 0; 
let revolutionStarted = false;
let initialEarthOffset
let lastScrollY = 0;
let textState = 'earth';
//gestion de saturne

const saturnTexture = new THREE.TextureLoader().load('img/saturn.jpg');  
const ringTexture = new THREE.TextureLoader().load('img/saturn-ring.png'); 
const titanTexture = new THREE.TextureLoader().load('img/titan.jpg'); 

const saturnGeometry = new THREE.SphereGeometry(10, 32, 32); 
const saturnMaterial = new THREE.MeshBasicMaterial({ map: saturnTexture });
const saturn = new THREE.Mesh(saturnGeometry, saturnMaterial);
saturn.position.set(350, 0, 0);
scene.add(saturn);

const ringGeometry = new THREE.RingGeometry(12, 20, 64);
const ringMaterial = new THREE.MeshBasicMaterial({ 
  map: ringTexture, 
  side: THREE.DoubleSide, 
  opacity: 0.7,
  transparent: true ,
});  
const rings = new THREE.Mesh(ringGeometry, ringMaterial);
rings.rotation.x = Math.PI / 2 ;
rings.position.set(350, 0, 0);
scene.add(rings);

const titanGeometry = new THREE.SphereGeometry(1.5, 16, 16);
const titanMaterial = new THREE.MeshBasicMaterial({ map: titanTexture });
const titan = new THREE.Mesh(titanGeometry, titanMaterial);

const titanOrbitRadius = 30;
titan.position.set(350 + titanOrbitRadius, 0, 0);

scene.add(titan);

function travelToSaturn() {
  const travelDuration = 5000;
  const startPosition = camera.position.clone();
  const startZoom = camera.zoom;
  const startTime = performance.now();

  // Points pour la courbe Bezier
  const controlPoint1 = new THREE.Vector3(100, 50, 0);
  const controlPoint2 = new THREE.Vector3(200, -50, 0);
  const targetPosition = new THREE.Vector3(250, 0, 0);
  const targetLookAt = saturn.position.clone();
  const initialQuaternion = camera.quaternion.clone();
  const targetQuaternion = new THREE.Quaternion();
  const upVector = new THREE.Vector3(0, 1, 0); 
  targetQuaternion.setFromRotationMatrix(
    new THREE.Matrix4().lookAt(targetPosition, targetLookAt, upVector)
  );

  function animateTravel() {
    const elapsedTime = performance.now() - startTime;
    const progress = Math.min(elapsedTime / travelDuration, 1);
    const currentPosition = new THREE.Vector3();
    currentPosition.copy(startPosition)
      .multiplyScalar(Math.pow(1 - progress, 3))
      .add(controlPoint1.clone().multiplyScalar(3 * progress * Math.pow(1 - progress, 2)))
      .add(controlPoint2.clone().multiplyScalar(3 * Math.pow(progress, 2) * (1 - progress)))
      .add(targetPosition.clone().multiplyScalar(Math.pow(progress, 3)));

    camera.position.copy(currentPosition);
    THREE.Quaternion.slerp(initialQuaternion, targetQuaternion, camera.quaternion, progress);

    // Zoom fluide
    camera.zoom = THREE.Math.lerp(startZoom, 5.2, progress);

    camera.updateProjectionMatrix();

    if (progress < 1) {
      requestAnimationFrame(animateTravel); 
    } else {
      camera.position.copy(targetPosition);
      camera.lookAt(targetLookAt);
      camera.zoom = 5.2;
      camera.updateProjectionMatrix();
    }
  }

  animateTravel();
}

let saturnTravelStarted = false;
let returnToSunStarted = false; 

function travelToSun() {
  const targetPosition = new THREE.Vector3(0, 0, 20); 
  const travelDuration = 2000;
  const targetZoom = 1;
  const startPosition = camera.position.clone(); 
  const startZoom = camera.zoom;
  const startTime = performance.now();

  // Fonction d'animation
  function animateTravel() {
    const elapsedTime = performance.now() - startTime;
    const progress = Math.min(elapsedTime / travelDuration, 1)
    camera.position.lerpVectors(startPosition, targetPosition, progress);
    camera.zoom = THREE.Math.lerp(startZoom, targetZoom, progress);
    const currentLookAt = new THREE.Vector3().lerpVectors(saturn.position, sun.position, progress);
    camera.lookAt(currentLookAt);

    camera.updateProjectionMatrix();

    if (progress < 1) {
      requestAnimationFrame(animateTravel);
    } else {
      saturnTravelStarted = false;
      returnToSunStarted = false; 
      camera.lookAt(sun.position);
      camera.updateProjectionMatrix();
      saturnTravelStarted = false;
      returnToSunStarted = false; 
    }
  }

  animateTravel();
}

galaxyButton.querySelector('button').addEventListener('click', () => {
  if (!saturnTravelStarted) {
    travelToSaturn();
    saturnTravelStarted = true;
  }
  const targetScrollY = (0.61 * (document.body.scrollHeight - window.innerHeight)) + 1;
  document.documentElement.scrollTop = targetScrollY;
  saturnDescription.classList.remove('hidden');
  galaxyButton.classList.add('hidden');
});

let lastMousePosition = { x: 0, y: 0 };

const rotationSpeedFactor = 0.001;

window.addEventListener('mousemove', (event) => {
  if (isOnSaturn&&!isTitanClicked) {
    const deltaX = (event.clientX - lastMousePosition.x) * rotationSpeedFactor;
    const deltaY = (event.clientY - lastMousePosition.y) * rotationSpeedFactor;
    saturn.rotation.y += deltaX;
    saturn.rotation.x += deltaY;
    saturn.rotation.z += deltaX;
    rings.rotation.y += deltaX;
    rings.rotation.x += deltaY;
    titan.rotation.y += deltaX;
    const revolutionSpeed = 0.01;
    titan.position.x = Math.cos(Date.now() * revolutionSpeed) * 10;
    titan.position.z = Math.sin(Date.now() * revolutionSpeed) * 10; 

    lastMousePosition.x = event.clientX;
    lastMousePosition.y = event.clientY;
  }
});

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const scrollFraction = scrollY / maxScroll;
  isOnSaturn = scrollFraction > 0.6;
  if (isTitanClicked) return;
  if (isOnSaturn) {
    lastMousePosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }
  earth.rotation.y += 0.05;
  earth.rotation.x += 0.001;
  if (scrollFraction <= 0.4) {
    const earthScale = 1 - scrollFraction * 1;
    earth.scale.set(earthScale, earthScale, earthScale);
    camera.position.z = 15 + scrollFraction * 100;
  }

  if (scrollFraction > 0.2 && scrollY > lastScrollY && scrollFraction <=4) {
    console.log("en bas")
    const progressToCenterSun = (scrollFraction - 0.2) * 10;
    camera.position.x = THREE.Math.lerp(camera.position.x, sun.position.x, progressToCenterSun * 0.02);
    camera.position.y = THREE.Math.lerp(camera.position.y, sun.position.y, progressToCenterSun * 0.02);
  }

  if (scrollFraction <= 0.2 && scrollY < lastScrollY) {
    console.log("en haut")
    const progressToCenterEarth = (0.2 - scrollFraction) * 10;
    camera.position.x = THREE.Math.lerp(camera.position.x, earth.position.x, progressToCenterEarth * 0.02);
    camera.position.y = THREE.Math.lerp(camera.position.y, earth.position.y, progressToCenterEarth * 0.02);
    camera.position.z = THREE.Math.lerp(camera.position.z, 15, progressToCenterEarth * 0.01);
  }

  if (scrollFraction > 0.4 && scrollFraction <= 0.6) {
    if (!revolutionStarted) {
      initialEarthOffset = earth.position.clone().sub(sun.position);
      revolutionStarted = true;
    }
    const deltaAngle = 0.03;
    const direction = scrollY > lastScrollY ? 1 : -1;
    earthOrbitAngle += deltaAngle * direction;
    const cosAngle = Math.cos(earthOrbitAngle);
    const sinAngle = Math.sin(earthOrbitAngle);

    earth.position.x = sun.position.x + initialEarthOffset.x * cosAngle - initialEarthOffset.z * sinAngle;
    earth.position.z = sun.position.z + initialEarthOffset.x * sinAngle + initialEarthOffset.z * cosAngle;
    earth.position.y = sun.position.y;
  } else if (revolutionStarted) {
    const progressToInitial = (0.4 - scrollFraction) / 0.2;
    earth.position.x = THREE.Math.lerp(earth.position.x, initialEarthOffset.x + sun.position.x, progressToInitial);
    earth.position.z = THREE.Math.lerp(earth.position.z, initialEarthOffset.z + sun.position.z, progressToInitial);
    earth.position.y = sun.position.y;

    if (scrollFraction <= 0.4) {
      revolutionStarted = false;
      earthOrbitAngle = 0;
    }
  }

  if (scrollFraction <= 0.2 && textState === 'earth') {
    sunText.classList.add('hidden');
    galaxyButton.classList.add('hidden');
  } else if (scrollFraction > 0.2 && scrollFraction <= 0.4 && textState === 'earth') {
    earthText.classList.add('hidden');
    sunText.classList.remove('hidden');
    textState = 'sun';
  } else if (scrollFraction > 0.4 && textState === 'sun') {
    sunText.classList.add('hidden');
    galaxyButton.classList.remove('hidden'); 
    textState = 'galaxy'; 
  } else if (scrollFraction < 0.2 && textState === 'sun') {
    earthText.classList.remove('hidden'); 
    textState = 'earth';
  } else if (scrollFraction <= 0.4 && textState === 'galaxy') {
    galaxyButton.classList.add('hidden');
    sunText.classList.remove('hidden');
    textState = 'sun';
  }

  lastScrollY = scrollY;
  if (scrollFraction > 0.6 && !saturnTravelStarted) {
    travelToSaturn();
    saturnDescription.classList.remove('hidden');
    galaxyButton.classList.add('hidden');
    saturnTravelStarted = true;
  }

  if (scrollFraction >= 0.4 && scrollFraction <= 0.6 && saturnTravelStarted && !returnToSunStarted) {
    travelToSun();
    returnToSunStarted = true;
    saturnDescription.classList.add('hidden');
    galaxyButton.classList.remove('hidden');
  }
});
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isTitanHovered = false;

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});
function checkMouseHover() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(titan);
  isTitanHovered = intersects.length > 0;
}

let titanAngle = 0;
function animateTitan() {
  checkMouseHover();
  if (!isTitanHovered&&!isTitanClicked) {
    document.body.style.cursor = 'auto';
    const revolutionSpeed = 0.005;
    titan.position.x = 350 + titanOrbitRadius * Math.cos(titanAngle); 
    titan.position.z = titanOrbitRadius * Math.sin(titanAngle);
    titanAngle += revolutionSpeed; 
  }else{
    document.body.style.cursor = 'pointer';
  }
  requestAnimationFrame(animateTitan);
}
animateTitan();

function smoothZoom(targetPosition, duration = 1.5, lookAtTarget = null) {
  const startPosition = new THREE.Vector3().copy(camera.position);
  const startTime = performance.now();

  function animateZoom() {
    const elapsedTime = (performance.now() - startTime) / 1000;
    const t = Math.min(elapsedTime / duration, 1);
    camera.position.lerpVectors(startPosition, targetPosition, t);

    // Si un objectif est passé pour le zoom, la caméra doit toujours regarder cet objectif
    if (lookAtTarget) {
      camera.lookAt(lookAtTarget);
    }

    renderer.render(scene, camera);

    if (t < 1) {
      requestAnimationFrame(animateZoom);
    }
  }

  animateZoom();
}

window.addEventListener("click", (event) => {
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(titan);
  if (intersects.length > 0) {
    originalCameraPosition = camera.position.clone();
    originalCameraQuaternion = camera.quaternion.clone();

    const directionToSaturn = new THREE.Vector3().subVectors(
      saturn.position,
      titan.position
    ).normalize();

    const distanceFromTitan = 20;
    const verticalOffset = 3;
    const horizontalOffset = 8;
    const targetPosition = new THREE.Vector3().addVectors(
      titan.position,
      directionToSaturn.multiplyScalar(-distanceFromTitan)
    );
    targetPosition.y += verticalOffset;
    targetPosition.x += horizontalOffset;

    smoothZoom(targetPosition, 1.2, titan.position); // Zoom et centrage sur Titan
    isTitanClicked = true;
    const returnButton = document.getElementById("return-button");
    returnButton.classList.remove("hidden");
    titanDescription.classList.remove('hidden');
    saturnDescription.classList.add('hidden');
  }
});

function returnToSaturn() {
  if (!isTitanClicked) return;
  // Effectuer le zoom inverse pour revenir à la position de départ
  smoothZoom(originalCameraPosition, 1.5, saturn.position); // Centrer sur Saturne après le zoom inverse
  camera.quaternion.copy(originalCameraQuaternion);

  // Afficher les bonnes descriptions et boutons
  titanDescription.classList.add("hidden");
  returnButton.classList.add("hidden");
  saturnDescription.classList.remove("hidden");

  // Réinitialiser l'état
  isTitanClicked = false;
}

returnButton.addEventListener("click", returnToSaturn);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    returnToSaturn();
  }
});

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
