window.addEventListener('load', () => {
  const scrollY = window.scrollY;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const scrollFraction = scrollY / maxScroll;

  if (scrollFraction > 0.6) {
    earthText.classList.add('hidden');
  }
});
// Initialisation de la scène, de la caméra et du rendu

const earthText = document.getElementById('earth-text');
const sunText = document.getElementById('sun-text');
const galaxyButton = document.getElementById('galaxy-button');
const saturnDescription = document.getElementById('saturn-description');
const titanDescription = document.getElementById('titan-description');
let isTitanHovered = false;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Activer les ombres dans le renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Création de la Terre avec un matériau cartoon
const earthGeometry = new THREE.SphereGeometry(5, 32, 32);
const earthTexture = new THREE.TextureLoader().load('img/earth.jpg'); // Texture de la Terre
const earthMaterial = new THREE.MeshLambertMaterial({ map: earthTexture });
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.castShadow = true;
scene.add(earth);

// Ajout d'une ombre projetée au sol pour un style cartoon
const shadowPlaneGeometry = new THREE.PlaneGeometry(20, 20);
const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
const shadowPlane = new THREE.Mesh(shadowPlaneGeometry, shadowMaterial);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -5.1;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

// Création du Soleil
const sunGeometry = new THREE.SphereGeometry(20, 32, 32);
const sunTexture = new THREE.TextureLoader().load('img/sun.jpg');
const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Position initiale du Soleil à droite de la Terre
sun.position.set(60, 0, 0);

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

const saturnTexture = new THREE.TextureLoader().load('img/saturn.jpg');  // Texture de Saturne
const ringTexture = new THREE.TextureLoader().load('img/saturn-ring.png');  // Texture des anneaux

// Création de Saturne avec la texture
const saturnGeometry = new THREE.SphereGeometry(10, 32, 32);  // Taille de Saturne
const saturnMaterial = new THREE.MeshBasicMaterial({ map: saturnTexture });  // Appliquer la texture à Saturne
const saturn = new THREE.Mesh(saturnGeometry, saturnMaterial);
saturn.position.set(250, 0, 0);  // Position de Saturne à 250 unités du Soleil
scene.add(saturn);

const ringGeometry = new THREE.RingGeometry(12, 20, 64);  // Anneaux de Saturne (taille ajustée)
const ringMaterial = new THREE.MeshBasicMaterial({ 
  map: ringTexture, 
  side: THREE.DoubleSide, 
  opacity: 0.7,  // Augmenter l'opacité pour mieux les voir
  transparent: true ,
});  
const rings = new THREE.Mesh(ringGeometry, ringMaterial);
rings.rotation.x = Math.PI / 2 + Math.PI / 36;
rings.rotation.y = Math.PI / 8;
rings.position.set(250, 0, 0);  // Positionner les anneaux autour de Saturne
scene.add(rings);

// Création de Titan (la lune de Saturne)
const titanGeometry = new THREE.SphereGeometry(1.5, 16, 16);  // Taille de Titan
const titanMaterial = new THREE.MeshBasicMaterial({ color: 0xAAAAAA });  // Couleur grise
const titan = new THREE.Mesh(titanGeometry, titanMaterial);

// Position initiale de Titan
const titanOrbitRadius = 30;  // Distance entre Saturne et Titan
titan.position.set(250 + titanOrbitRadius, 0, 0);  // Positionner Titan à côté de Saturne

scene.add(titan);


// Fonction pour le voyage vers Saturne avec un zoom progressif
function travelToSaturn() {
  const targetPosition = new THREE.Vector3(150, 0, 0);  // Position cible près de Saturne
  const travelDuration = 7000;  // Durée de l'animation (7 secondes)
  const targetZoom = 5.2;  // Zoom final de la caméra

  // Initialiser les paramètres de départ
  const startPosition = camera.position.clone();  // Position actuelle de la caméra (sans décalage)
  const startZoom = camera.zoom;
  const startTime = performance.now();

  // Définir la position du Soleil
  const sunPosition = new THREE.Vector3(0, 0, 0);

  // Fonction d'animation
  function animateTravel() {
    const elapsedTime = performance.now() - startTime;
    const progress = Math.min(elapsedTime / travelDuration, 1);  // Progression du voyage

    // Interpolation de la position de la caméra pour se déplacer du Soleil vers Saturne
    camera.position.lerpVectors(startPosition, targetPosition, progress);

    // Interpolation du zoom
    camera.zoom = THREE.Math.lerp(startZoom, targetZoom, progress);

    // Calcul de l'angle vers lequel la caméra doit regarder
    const currentLookAt = new THREE.Vector3().lerpVectors(sunPosition, saturn.position, progress);
    camera.lookAt(currentLookAt);  // Regarder progressivement Saturne au fur et à mesure du voyage

    // Mettre à jour la projection de la caméra pour appliquer le zoom
    camera.updateProjectionMatrix();

    // Répéter jusqu'à ce que la caméra arrive
    if (progress < 1) {
      requestAnimationFrame(animateTravel);
    }
  }

  // Lancer l'animation vers Saturne uniquement après le clic
  animateTravel();
}

let saturnTravelStarted = false; // Indique si l'animation vers Saturne a commencé
let returnToSunStarted = false;  // Indique si l'animation retour vers le Soleil a commencé

function travelToSun() {
  console.log("Retour vers le Soleil lancé");

  const targetPosition = new THREE.Vector3(0, 0, 15); // Position cible près du Soleil
  const sunLookAt = new THREE.Vector3(0, 0, 0);       // Point à regarder (Soleil au centre)
  const travelDuration = 7000; // Durée de l'animation (7 secondes)
  const targetZoom = 1;        // Zoom final de la caméra

  // Initialiser les paramètres de départ
  const startPosition = camera.position.clone();
  const startLookAt = new THREE.Vector3().add(camera.getWorldDirection(new THREE.Vector3()));
  const startZoom = camera.zoom;
  const startTime = performance.now();

  // Fonction d'animation pour le retour
  function animateReturn() {
    const elapsedTime = performance.now() - startTime;
    const progress = Math.min(elapsedTime / travelDuration, 1); // Progression de 0 à 1 (limité)

    // Interpolation de la position et du zoom
    camera.position.lerpVectors(startPosition, targetPosition, progress);
    camera.zoom = THREE.Math.lerp(startZoom, targetZoom, progress);

    // Interpolation de l'orientation pour regarder le Soleil
    const currentLookAt = new THREE.Vector3().lerpVectors(startLookAt, sunLookAt, progress);
    camera.lookAt(currentLookAt);

    // Appliquer les modifications
    camera.updateProjectionMatrix();

    if (progress < 1) {
      requestAnimationFrame(animateReturn);
    } else {
      console.log("Retour terminé");
      returnToSunStarted = false; // Fin de l'animation
      saturnTravelStarted = false; // Réinitialiser l'état de voyage vers Saturne
    }
  }

  returnToSunStarted = true; // Lancer le retour
  animateReturn();
}

// Fonction pour gérer le clic sur le bouton
galaxyButton.querySelector('button').addEventListener('click', () => {
  if (!saturnTravelStarted) {
    // Déclencher l'animation vers Saturne
    travelToSaturn();
    saturnTravelStarted = true;
  }

  // Effectuer un défilement automatique vers 0.6
  const targetScrollY = 0.61 * (document.body.scrollHeight - window.innerHeight);
  window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
});

// Gestion des mouvements de la souris
let lastMousePosition = { x: 0, y: 0 }; // Dernière position connue de la souris
let isOnSaturn = false; // Indique si l'utilisateur est dans la zone de Saturne

// Facteur de réduction pour ralentir le mouvement
const rotationSpeedFactor = 0.005;

window.addEventListener('mousemove', (event) => {
  if (isOnSaturn) {
    // Calculer le delta de mouvement de la souris
    const deltaX = (event.clientX - lastMousePosition.x) * rotationSpeedFactor;
    const deltaY = (event.clientY - lastMousePosition.y) * rotationSpeedFactor;

    // Appliquer la rotation globale au système entier
    saturn.rotation.y += deltaX; // Rotation horizontale
    saturn.rotation.x += deltaY; // Rotation verticale

    rings.rotation.y += deltaX; // Synchroniser la rotation horizontale des anneaux
    rings.rotation.x += deltaY; // Synchroniser la rotation verticale des anneaux

    // Titan suit également la rotation du système
    titan.rotation.y += deltaX; // Ajuste la rotation propre de Titan

    // Titan reste en révolution autour de Saturne
    const revolutionSpeed = 0.01; // Vitesse de révolution naturelle
    titan.position.x = Math.cos(Date.now() * revolutionSpeed) * 10; // Rayon de révolution
    titan.position.z = Math.sin(Date.now() * revolutionSpeed) * 10; // Rayon de révolution

    // Mettre à jour la position de la souris
    lastMousePosition.x = event.clientX;
    lastMousePosition.y = event.clientY;
  }
});

// Fonction de défilement
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const scrollFraction = scrollY / maxScroll;
  isOnSaturn = scrollFraction > 0.6;

  // Mémoriser la position de la souris lorsque la fonctionnalité est activée
  if (isOnSaturn) {
    lastMousePosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }
  // Phase 1 : Réduction progressive de la Terre et zoom-out de la caméra
  earth.rotation.y += 0.05;
  earth.rotation.x += 0.001;
  if (scrollFraction <= 0.4) {
    const earthScale = 1 - scrollFraction * 1;
    earth.scale.set(earthScale, earthScale, earthScale);
    camera.position.z = 15 + scrollFraction * 100;
  }

  // Centrer la caméra sur le Soleil
  if (scrollFraction > 0.2 && scrollY > lastScrollY) {
    const progressToCenterSun = (scrollFraction - 0.2) * 10;
    camera.position.x = THREE.Math.lerp(camera.position.x, sun.position.x, progressToCenterSun * 0.02);
    camera.position.y = THREE.Math.lerp(camera.position.y, sun.position.y, progressToCenterSun * 0.02);
  }

  // Recentrer la caméra sur la Terre si on remonte
  if (scrollFraction <= 0.2 && scrollY < lastScrollY) {
    const progressToCenterEarth = (0.3 - scrollFraction) * 10;
    camera.position.x = THREE.Math.lerp(camera.position.x, earth.position.x, progressToCenterEarth * 0.02);
    camera.position.y = THREE.Math.lerp(camera.position.y, earth.position.y, progressToCenterEarth * 0.02);
    camera.position.z = THREE.Math.lerp(camera.position.z, 15, progressToCenterEarth * 0.02);
  }

  // Phase 3 : Révolution de la Terre autour du Soleil
  if (scrollFraction > 0.4 && scrollFraction <= 0.6) {
    if (!revolutionStarted) {
      // Initialiser la position relative Terre-Soleil pour la révolution
      initialEarthOffset = earth.position.clone().sub(sun.position);
      revolutionStarted = true;
    }

    // Calculer l'angle de révolution en fonction du sens du défilement
    const deltaAngle = 0.05; // Vitesse de révolution
    const direction = scrollY > lastScrollY ? 1 : -1; // Détecter le sens du défilement
    earthOrbitAngle += deltaAngle * direction;

    // Calculer la nouvelle position de la Terre
    const cosAngle = Math.cos(earthOrbitAngle);
    const sinAngle = Math.sin(earthOrbitAngle);

    earth.position.x = sun.position.x + initialEarthOffset.x * cosAngle - initialEarthOffset.z * sinAngle;
    earth.position.z = sun.position.z + initialEarthOffset.x * sinAngle + initialEarthOffset.z * cosAngle;
    earth.position.y = sun.position.y; // Garder la Terre sur le même plan horizontal
  } else if (revolutionStarted) {
    // Ramener la Terre à sa position initiale lors du défilement inverse
    const progressToInitial = (0.4 - scrollFraction) / 0.2; // Progression inverse
    earth.position.x = THREE.Math.lerp(earth.position.x, initialEarthOffset.x + sun.position.x, progressToInitial);
    earth.position.z = THREE.Math.lerp(earth.position.z, initialEarthOffset.z + sun.position.z, progressToInitial);
    earth.position.y = sun.position.y; // Garder la Terre sur le même plan horizontal

    if (scrollFraction <= 0.4) {
      revolutionStarted = false; // Réinitialiser la révolution
      earthOrbitAngle = 0; // Réinitialiser l'angle
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

  // Mémoriser la position du défilement pour détecter la direction
  lastScrollY = scrollY;
  if (scrollFraction > 0.6 && !saturnTravelStarted) {
    travelToSaturn();
    saturnDescription.classList.remove('hidden');
    galaxyButton.classList.add('hidden');
    saturnTravelStarted = true;
  }

  // Inversion de l'animation : retour de Saturne vers le Soleil
  if (scrollFraction >= 0.4 && scrollFraction <= 0.6 && saturnTravelStarted && !returnToSunStarted) {
    travelToSun();
    returnToSunStarted = true;
    saturnDescription.classList.add('hidden');
    galaxyButton.classList.remove('hidden');
  }
});

// Fonction pour gérer l'animation de Titan et sa révolution
let titanAngle = 0;
function animateTitan() {
  if (!isTitanHovered) {
    const revolutionSpeed = 0.005;
    titan.position.x = 250 + titanOrbitRadius * Math.cos(titanAngle); 
    titan.position.z = titanOrbitRadius * Math.sin(titanAngle);
    titanAngle += revolutionSpeed; // Vitesse de révolution autour de Saturne
  }
  requestAnimationFrame(animateTitan);
}
animateTitan();
// Animation continue
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
