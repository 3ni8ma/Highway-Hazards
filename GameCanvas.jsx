import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

const LANE_WIDTH = 3;
const ROAD_WIDTH = LANE_WIDTH * 3;
const ROAD_LENGTH = 200;
const CAR_WIDTH = 1.8;
const CAR_LENGTH = 4;

const WORLD_THEMES = {
  night_city: {
    sky: 0x1c2951,
    fog: 0x1a1a2e,
    road: 0x333340,
    ground: 0x1a1a2e,
    ambient: 0x404060,
    ambientIntensity: 0.6,
    directionalIntensity: 0.8,
    laneMarkings: 0xffffff,
    edgeLines: 0xffff00,
  },
  desert: {
    sky: 0x87ceeb,
    fog: 0xf4d03f,
    road: 0x4a4a4a,
    ground: 0xd4a547,
    ambient: 0xffeebb,
    ambientIntensity: 1.0,
    directionalIntensity: 1.5,
    laneMarkings: 0xffffff,
    edgeLines: 0xff6600,
  }
};

export default function GameCanvas({ 
  gameState, 
  setGameState, 
  onScoreUpdate, 
  onHealthChange,
  onCoinCollect,
  onPowerUpCollect,
  activePowerUps,
  isPaused,
  world = 'night_city'
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const playerCarRef = useRef(null);
  const obstaclesRef = useRef([]);
  const powerUpsRef = useRef([]);
  const roadSegmentsRef = useRef([]);
  const animationRef = useRef(null);
  const keysRef = useRef({ left: false, right: false });
  const gameDataRef = useRef({
    speed: 0.5,
    distance: 0,
    targetLane: 1,
    currentLane: 1,
    lastObstacleZ: -50,
    lastPowerUpZ: -80,
    difficulty: 1,
    isSlipping: false,
    slipDirection: 0,
    weather: 'clear',
    timeOfDay: 0,
    shieldActive: false
  });

  const createCar = useCallback((color, isPlayer = false) => {
    const group = new THREE.Group();
    
    if (isPlayer) {
      // F1 Car design
      const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: color,
        shininess: 100,
        specular: 0x444444
      });
      const blackMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, shininess: 80 });
      
      // Main body (narrow, elongated)
      const bodyGeometry = new THREE.BoxGeometry(0.8, 0.3, CAR_LENGTH);
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.35;
      // optimized - no shadows
      group.add(body);
      
      // Nose cone
      const noseGeometry = new THREE.ConeGeometry(0.4, 1.5, 4);
      const nose = new THREE.Mesh(noseGeometry, bodyMaterial);
      nose.rotation.x = -Math.PI / 2;
      nose.rotation.y = Math.PI / 4;
      nose.position.set(0, 0.35, CAR_LENGTH / 2 + 0.6);
      group.add(nose);
      
      // Cockpit
      const cockpitGeometry = new THREE.SphereGeometry(0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const cockpitMaterial = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 120 });
      const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
      cockpit.position.set(0, 0.5, 0.3);
      cockpit.scale.set(1, 0.8, 1.5);
      group.add(cockpit);
      
      // Front wing
      const frontWingGeometry = new THREE.BoxGeometry(CAR_WIDTH + 0.4, 0.05, 0.4);
      const frontWing = new THREE.Mesh(frontWingGeometry, bodyMaterial);
      frontWing.position.set(0, 0.15, CAR_LENGTH / 2 + 0.8);
      group.add(frontWing);
      
      // Front wing endplates
      const endplateGeometry = new THREE.BoxGeometry(0.05, 0.25, 0.5);
      [-CAR_WIDTH / 2 - 0.2, CAR_WIDTH / 2 + 0.2].forEach(x => {
        const endplate = new THREE.Mesh(endplateGeometry, bodyMaterial);
        endplate.position.set(x, 0.2, CAR_LENGTH / 2 + 0.7);
        group.add(endplate);
      });
      
      // Rear wing
      const rearWingGeometry = new THREE.BoxGeometry(CAR_WIDTH, 0.05, 0.3);
      const rearWing = new THREE.Mesh(rearWingGeometry, bodyMaterial);
      rearWing.position.set(0, 0.9, -CAR_LENGTH / 2 + 0.2);
      group.add(rearWing);
      
      // Rear wing supports
      const supportGeometry = new THREE.BoxGeometry(0.05, 0.5, 0.05);
      [-0.4, 0.4].forEach(x => {
        const support = new THREE.Mesh(supportGeometry, blackMaterial);
        support.position.set(x, 0.65, -CAR_LENGTH / 2 + 0.2);
        group.add(support);
      });

      // Tail lights
      const tailLightGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.05);
      const tailLightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      [-0.35, 0.35].forEach(x => {
        const tailLight = new THREE.Mesh(tailLightGeometry, tailLightMaterial);
        tailLight.position.set(x, 0.3, -CAR_LENGTH / 2);
        group.add(tailLight);
      });
      
      // Side pods
      const sidePodGeometry = new THREE.BoxGeometry(0.5, 0.25, 1.5);
      [-0.6, 0.6].forEach(x => {
        const sidePod = new THREE.Mesh(sidePodGeometry, bodyMaterial);
        sidePod.position.set(x, 0.35, -0.3);
        group.add(sidePod);
      });
      
      // F1 Wheels (larger, exposed)
      const wheelGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
      const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
      const wheelPositions = [
        [-CAR_WIDTH / 2 - 0.3, 0.35, CAR_LENGTH / 3],
        [CAR_WIDTH / 2 + 0.3, 0.35, CAR_LENGTH / 3],
        [-CAR_WIDTH / 2 - 0.3, 0.35, -CAR_LENGTH / 3],
        [CAR_WIDTH / 2 + 0.3, 0.35, -CAR_LENGTH / 3]
      ];
      wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(...pos);
        group.add(wheel);
      });
      
    } else {
      // Regular car for obstacles
      const bodyGeometry = new THREE.BoxGeometry(CAR_WIDTH, 0.8, CAR_LENGTH);
      const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: color,
        shininess: 100,
        specular: 0x444444
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.5;
      // optimized - no shadows
      group.add(body);

      const roofGeometry = new THREE.BoxGeometry(CAR_WIDTH * 0.8, 0.6, CAR_LENGTH * 0.5);
      const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x333333, shininess: 80 });
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.set(0, 1.1, -0.3);
      // roof optimized - no shadows
      group.add(roof);

      const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
      const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
      const wheelPositions = [
        [-CAR_WIDTH / 2 - 0.1, 0.3, CAR_LENGTH / 3],
        [CAR_WIDTH / 2 + 0.1, 0.3, CAR_LENGTH / 3],
        [-CAR_WIDTH / 2 - 0.1, 0.3, -CAR_LENGTH / 3],
        [CAR_WIDTH / 2 + 0.1, 0.3, -CAR_LENGTH / 3]
      ];
      wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(...pos);
        group.add(wheel);
      });

      const tailLightGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.1);
      const tailLightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      [-0.6, 0.6].forEach(x => {
        const light = new THREE.Mesh(tailLightGeometry, tailLightMaterial);
        light.position.set(x, 0.4, -CAR_LENGTH / 2);
        group.add(light);
      });
    }

    return group;
  }, []);

  const createObstacle = useCallback((type, lane) => {
    const group = new THREE.Group();
    group.userData = { type, lane };

    switch(type) {
      case 'car':
        const carColors = [0xff4444, 0x4444ff, 0x44ff44, 0xffff44, 0xff44ff, 0x44ffff];
        const car = createCar(carColors[Math.floor(Math.random() * carColors.length)]);
        group.add(car);
        break;
      case 'roadblock':
        const blockGeometry = new THREE.BoxGeometry(2.5, 1.2, 0.5);
        const blockMaterial = new THREE.MeshPhongMaterial({ color: 0xff6600 });
        const block = new THREE.Mesh(blockGeometry, blockMaterial);
        block.position.y = 0.6;
        group.add(block);
        // Stripes
        for (let i = 0; i < 3; i++) {
          const stripeGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.55);
          const stripeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
          stripe.position.set(-0.8 + i * 0.8, 0.6, 0);
          group.add(stripe);
        }
        break;
      case 'oil':
        const oilGeometry = new THREE.CircleGeometry(1.5, 32);
        const oilMaterial = new THREE.MeshPhongMaterial({ 
          color: 0x2a2a2a, 
          shininess: 200,
          transparent: true,
          opacity: 0.8
        });
        const oil = new THREE.Mesh(oilGeometry, oilMaterial);
        oil.rotation.x = -Math.PI / 2;
        oil.position.y = 0.02;
        group.add(oil);
        break;
      case 'cone':
        const coneGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
        const coneMaterial = new THREE.MeshPhongMaterial({ color: 0xff6600 });
        for (let i = 0; i < 3; i++) {
          const cone = new THREE.Mesh(coneGeometry, coneMaterial);
          cone.position.set(-0.8 + i * 0.8, 0.4, 0);
          group.add(cone);
        }
        break;
      case 'debris':
        const debrisGeometry = new THREE.BoxGeometry(2, 0.5, 1.5);
        const debrisMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3728 });
        const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
        debris.position.y = 0.25;
        debris.rotation.y = Math.random() * 0.5;
        group.add(debris);
        break;
    }

    group.position.x = (lane - 1) * LANE_WIDTH;
    return group;
  }, [createCar]);

  const createPowerUp = useCallback((type, lane) => {
    const group = new THREE.Group();
    group.userData = { type, lane };

    const colors = {
      coin: 0xffd700,
      shield: 0x00ffff,
      speed: 0xff00ff,
      slowmo: 0x00ff00,
      repair: 0xff4444
    };

    if (type === 'coin') {
      const geometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 32);
      const material = new THREE.MeshPhongMaterial({ 
        color: colors[type],
        emissive: colors[type],
        emissiveIntensity: 0.5,
        shininess: 100
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = 1;
      mesh.rotation.x = Math.PI / 2;
      group.add(mesh);
    } else if (type === 'repair') {
      // Heart shape
      const heartShape = new THREE.Shape();
      const x = 0, y = 0;
      heartShape.moveTo(x, y + 0.25);
      heartShape.bezierCurveTo(x, y + 0.25, x - 0.25, y, x - 0.25, y);
      heartShape.bezierCurveTo(x - 0.25, y - 0.25, x, y - 0.35, x, y - 0.5);
      heartShape.bezierCurveTo(x, y - 0.35, x + 0.25, y - 0.25, x + 0.25, y);
      heartShape.bezierCurveTo(x + 0.25, y, x, y + 0.25, x, y + 0.25);
      
      const extrudeSettings = { depth: 0.15, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05 };
      const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
      const material = new THREE.MeshPhongMaterial({ 
        color: colors[type],
        emissive: colors[type],
        emissiveIntensity: 0.5,
        shininess: 100
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = 1;
      mesh.rotation.x = Math.PI;
      mesh.scale.set(1.5, 1.5, 1.5);
      group.add(mesh);
    } else if (type === 'speed') {
      // 3 arrows pointing forward
      const arrowMaterial = new THREE.MeshPhongMaterial({ 
        color: colors[type],
        emissive: colors[type],
        emissiveIntensity: 0.5,
        shininess: 100
      });
      for (let i = 0; i < 3; i++) {
        const arrowShape = new THREE.Shape();
        arrowShape.moveTo(0, 0.3);
        arrowShape.lineTo(0.2, 0);
        arrowShape.lineTo(0.1, 0);
        arrowShape.lineTo(0.1, -0.3);
        arrowShape.lineTo(-0.1, -0.3);
        arrowShape.lineTo(-0.1, 0);
        arrowShape.lineTo(-0.2, 0);
        arrowShape.lineTo(0, 0.3);
        
        const extrudeSettings = { depth: 0.1, bevelEnabled: false };
        const geometry = new THREE.ExtrudeGeometry(arrowShape, extrudeSettings);
        const arrow = new THREE.Mesh(geometry, arrowMaterial);
        arrow.position.set(-0.3 + i * 0.3, 1, 0);
        arrow.rotation.x = -Math.PI / 2;
        arrow.scale.set(0.8, 0.8, 0.8);
        group.add(arrow);
      }
    } else if (type === 'slowmo') {
      // Clock shape
      const clockMaterial = new THREE.MeshPhongMaterial({ 
        color: colors[type],
        emissive: colors[type],
        emissiveIntensity: 0.5,
        shininess: 100
      });
      // Clock face
      const faceGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 32);
      const face = new THREE.Mesh(faceGeometry, clockMaterial);
      face.position.y = 1;
      face.rotation.x = Math.PI / 2;
      group.add(face);
      
      // Clock hands
      const handMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      // Hour hand
      const hourGeometry = new THREE.BoxGeometry(0.05, 0.2, 0.05);
      const hourHand = new THREE.Mesh(hourGeometry, handMaterial);
      hourHand.position.set(0, 1, 0.08);
      hourHand.rotation.z = Math.PI / 4;
      group.add(hourHand);
      // Minute hand
      const minuteGeometry = new THREE.BoxGeometry(0.04, 0.3, 0.05);
      const minuteHand = new THREE.Mesh(minuteGeometry, handMaterial);
      minuteHand.position.set(0, 1, 0.08);
      minuteHand.rotation.z = -Math.PI / 6;
      group.add(minuteHand);
    } else {
      // Default sphere for shield
      const geometry = new THREE.SphereGeometry(0.5, 16, 16);
      const material = new THREE.MeshPhongMaterial({ 
        color: colors[type],
        emissive: colors[type],
        emissiveIntensity: 0.5,
        shininess: 100
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = 1;
      group.add(mesh);
    }

    // Glow
    const glowGeometry = new THREE.SphereGeometry(0.7, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: colors[type],
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = 1;
    group.add(glow);

    group.position.x = (lane - 1) * LANE_WIDTH;
    return group;
  }, []);

  const createRoadSegment = useCallback((z, theme) => {
    const group = new THREE.Group();
    group.position.z = z;

    // Road surface - larger segments with overlap to prevent gaps
    const roadGeometry = new THREE.PlaneGeometry(ROAD_WIDTH + 4, 52);
    const roadMaterial = new THREE.MeshPhongMaterial({ color: theme.road });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    // road optimized - no shadows
    group.add(road);

    // Lane markings - dashed lines between lanes (at -LANE_WIDTH/2 and +LANE_WIDTH/2)
    const markGeometry = new THREE.PlaneGeometry(0.15, 4);
    const markMaterial = new THREE.MeshBasicMaterial({ color: theme.laneMarkings });
    
    // Two lane dividers: between lane 0-1 and lane 1-2
    [-LANE_WIDTH / 2, LANE_WIDTH / 2].forEach(xPos => {
      for (let j = 0; j < 5; j++) {
        const mark = new THREE.Mesh(markGeometry, markMaterial);
        mark.rotation.x = -Math.PI / 2;
        mark.position.set(xPos, 0.01, -20 + j * 10);
        group.add(mark);
      }
    });

    // Edge lines - relative to group center
    [-ROAD_WIDTH/2, ROAD_WIDTH/2].forEach(x => {
      const edgeGeometry = new THREE.PlaneGeometry(0.2, 50);
      const edgeMaterial = new THREE.MeshBasicMaterial({ color: theme.edgeLines });
      const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(x, 0.01, 0);
      group.add(edge);
    });

    return group;
  }, []);

  const init = useCallback(() => {
    if (!containerRef.current) return;

    const theme = WORLD_THEMES[world] || WORLD_THEMES.night_city;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(theme.fog, 30, 150);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 8, 15);
    camera.lookAt(0, 0, -20);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = false;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(theme.ambient, theme.ambientIntensity);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, theme.directionalIntensity);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // Player car
    const playerCar = createCar(0x00ffff, true);
    playerCar.position.set(0, 0, 0);
    scene.add(playerCar);
    playerCarRef.current = playerCar;

    // Shield visual
    const shieldGeometry = new THREE.SphereGeometry(2.5, 32, 32);
    const shieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
    shield.visible = false;
    shield.name = 'shield';
    playerCar.add(shield);

    // Initial road - fewer segments for performance
    for (let i = 0; i < 10; i++) {
      const segment = createRoadSegment(-i * 50 + 100, theme);
      scene.add(segment);
      roadSegmentsRef.current.push(segment);
    }

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(200, 500);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: theme.ground });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.position.z = -100;
    scene.add(ground);

    // World-specific decorations
    if (world === 'night_city') {
      // Add streetlights along the road - reuse geometries and materials
      const poleGeometry = new THREE.CylinderGeometry(0.1, 0.15, 6, 6);
      const poleMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 });
      const armGeometry = new THREE.BoxGeometry(0.1, 0.1, 2);
      const fixtureGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.5);
      const fixtureMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
      const glowGeometry = new THREE.SphereGeometry(0.2, 8, 8);
      const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xffee88 });

      for (let i = 0; i < 20; i++) {
        const z = -i * 40;
        [-ROAD_WIDTH / 2 - 2, ROAD_WIDTH / 2 + 2].forEach(x => {
          const streetlightGroup = new THREE.Group();

          const pole = new THREE.Mesh(poleGeometry, poleMaterial);
          pole.position.y = 3;
          streetlightGroup.add(pole);

          const arm = new THREE.Mesh(armGeometry, poleMaterial);
          arm.position.set(x > 0 ? -1 : 1, 5.8, 0);
          streetlightGroup.add(arm);

          const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
          fixture.position.set(x > 0 ? -1.8 : 1.8, 5.7, 0);
          streetlightGroup.add(fixture);

          const glow = new THREE.Mesh(glowGeometry, glowMaterial);
          glow.position.set(x > 0 ? -1.8 : 1.8, 5.5, 0);
          streetlightGroup.add(glow);

          streetlightGroup.position.set(x, 0, z);
          scene.add(streetlightGroup);
        });
      }
    }

    if (world === 'desert') {
      // Add cacti and rocks - reuse materials
      const cactusMaterial = new THREE.MeshBasicMaterial({ color: 0x2d5a27 });
      const rockMaterial = new THREE.MeshBasicMaterial({ color: 0x8b7355 });
      const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 6);
      const armGeometry = new THREE.CylinderGeometry(0.2, 0.25, 1.5, 6);

      for (let i = 0; i < 12; i++) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (ROAD_WIDTH + 5 + Math.random() * 15);
        const z = -Math.random() * 300;

        if (Math.random() > 0.5) {
          const cactusGroup = new THREE.Group();
          const trunk = new THREE.Mesh(trunkGeometry, cactusMaterial);
          trunk.position.y = 1.5;
          cactusGroup.add(trunk);

          const arm1 = new THREE.Mesh(armGeometry, cactusMaterial);
          arm1.position.set(0.5, 2, 0);
          arm1.rotation.z = -Math.PI / 4;
          cactusGroup.add(arm1);

          cactusGroup.position.set(x, 0, z);
          scene.add(cactusGroup);
        } else {
          const rockGeometry = new THREE.DodecahedronGeometry(0.5 + Math.random() * 1, 0);
          const rock = new THREE.Mesh(rockGeometry, rockMaterial);
          rock.position.set(x, 0.3, z);
          scene.add(rock);
        }
      }
    } else if (world === 'night_city') {
      // Add buildings - simplified, no individual windows
      const buildingMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1a2e });

      for (let i = 0; i < 15; i++) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (ROAD_WIDTH + 8 + Math.random() * 20);
        const z = -Math.random() * 300;
        const height = 10 + Math.random() * 30;
        const width = 3 + Math.random() * 5;
        const depth = 3 + Math.random() * 5;

        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(x, height / 2, z);
        scene.add(building);
      }
      }

    // Sky gradient
    scene.background = new THREE.Color(theme.sky);

  }, [createCar, createRoadSegment, world]);

  const spawnObstacle = useCallback(() => {
    if (!sceneRef.current) return;
    
    const data = gameDataRef.current;
    const types = ['car', 'car', 'car', 'roadblock', 'oil', 'cone', 'debris'];
    const type = types[Math.floor(Math.random() * types.length)];
    const lane = Math.floor(Math.random() * 3);
    
    const obstacle = createObstacle(type, lane);
    obstacle.position.z = data.lastObstacleZ - 30 - Math.random() * 20;
    data.lastObstacleZ = obstacle.position.z;
    
    sceneRef.current.add(obstacle);
    obstaclesRef.current.push(obstacle);
  }, [createObstacle]);

  const spawnPowerUp = useCallback(() => {
    if (!sceneRef.current) return;
    
    const data = gameDataRef.current;
    const types = ['coin', 'coin', 'coin', 'coin', 'shield', 'speed', 'slowmo', 'repair'];
    const type = types[Math.floor(Math.random() * types.length)];
    const lane = Math.floor(Math.random() * 3);
    
    const powerUp = createPowerUp(type, lane);
    powerUp.position.z = data.lastPowerUpZ - 40 - Math.random() * 30;
    data.lastPowerUpZ = powerUp.position.z;
    
    sceneRef.current.add(powerUp);
    powerUpsRef.current.push(powerUp);
  }, [createPowerUp]);

  const checkCollision = useCallback((obj1Pos, obj2Pos, obj2Type) => {
    const dx = Math.abs(obj1Pos.x - obj2Pos.x);
    const dz = Math.abs(obj1Pos.z - obj2Pos.z);
    
    const collisionWidths = {
      car: 1.5,
      roadblock: 1.2,
      oil: 1.2,
      cone: 0.8,
      debris: 1.0
    };
    
    return dx < (collisionWidths[obj2Type] || 1) && dz < 2;
  }, []);

  const animate = useCallback(() => {
    if (!sceneRef.current || !playerCarRef.current || isPaused || gameState !== 'playing') {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const data = gameDataRef.current;
    const speedMultiplier = activePowerUps.slowmo ? 0.5 : (activePowerUps.speed ? 1.5 : 1);
    const currentSpeed = data.speed * speedMultiplier;

    // Update distance and score
    data.distance += currentSpeed;
    onScoreUpdate(Math.floor(data.distance));

    // Increase difficulty
    data.difficulty = 1 + data.distance / 500;
    data.speed = Math.min(0.5 + data.difficulty * 0.05, 1.5);

    // Handle input
    const keys = keysRef.current;
    if (keys.left && data.targetLane > 0) {
      data.targetLane = Math.max(0, data.targetLane - 1);
      keys.left = false;
    }
    if (keys.right && data.targetLane < 2) {
      data.targetLane = Math.min(2, data.targetLane + 1);
      keys.right = false;
    }

    // Smooth lane change
    const targetX = (data.targetLane - 1) * LANE_WIDTH;
    let moveX = (targetX - playerCarRef.current.position.x) * 0.15;
    
    // Oil slip effect
    if (data.isSlipping) {
      moveX += data.slipDirection * 0.3;
      data.slipDirection *= 0.95;
      if (Math.abs(data.slipDirection) < 0.01) {
        data.isSlipping = false;
      }
    }
    
    playerCarRef.current.position.x += moveX;
    playerCarRef.current.position.x = Math.max(-LANE_WIDTH, Math.min(LANE_WIDTH, playerCarRef.current.position.x));
    
    // Tilt car while turning
    playerCarRef.current.rotation.z = -moveX * 0.3;

    // Update shield visual
    const shieldMesh = playerCarRef.current.getObjectByName('shield');
    if (shieldMesh) {
      shieldMesh.visible = activePowerUps.shield || false;
      shieldMesh.rotation.y += 0.02;
    }

    // Move obstacles
    obstaclesRef.current.forEach((obstacle, index) => {
      obstacle.position.z += currentSpeed;

      // Check collision
      if (checkCollision(playerCarRef.current.position, obstacle.position, obstacle.userData.type)) {
        if (obstacle.userData.type === 'oil') {
          data.isSlipping = true;
          data.slipDirection = (Math.random() - 0.5) * 2;
        } else if (!activePowerUps.shield) {
          onHealthChange(-1);
          data.speed = Math.max(0.3, data.speed * 0.5); // Slow down on hit
          sceneRef.current.remove(obstacle);
          obstaclesRef.current.splice(index, 1);
        } else {
          // Shield blocks the hit
          sceneRef.current.remove(obstacle);
          obstaclesRef.current.splice(index, 1);
        }
      }

      // Remove if passed
      if (obstacle.position.z > 20) {
        sceneRef.current.remove(obstacle);
        obstaclesRef.current.splice(index, 1);
      }
    });

    // Move and collect power-ups
    powerUpsRef.current.forEach((powerUp, index) => {
      powerUp.position.z += currentSpeed;
      powerUp.children.forEach(child => {
        if (child.rotation) child.rotation.y += 0.05;
      });

      // Check collection
      const dx = Math.abs(playerCarRef.current.position.x - powerUp.position.x);
      const dz = Math.abs(playerCarRef.current.position.z - powerUp.position.z);
      
      if (dx < 1.5 && dz < 2) {
        if (powerUp.userData.type === 'coin') {
          onCoinCollect(1);
        } else {
          onPowerUpCollect(powerUp.userData.type);
        }
        sceneRef.current.remove(powerUp);
        powerUpsRef.current.splice(index, 1);
      }

      if (powerUp.position.z > 20) {
        sceneRef.current.remove(powerUp);
        powerUpsRef.current.splice(index, 1);
      }
    });

    // Update road segments - seamless looping
    roadSegmentsRef.current.forEach(segment => {
      segment.position.z += currentSpeed;
      // When segment passes behind camera, move it to the back of the queue
      if (segment.position.z > 100) {
        // Find the furthest segment and place this one behind it
        let minZ = Infinity;
        roadSegmentsRef.current.forEach(s => {
          if (s !== segment && s.position.z < minZ) minZ = s.position.z;
        });
        segment.position.z = minZ - 50;
      }
    });

    // Spawn new obstacles and power-ups
    if (Math.random() < 0.02 * data.difficulty) {
      spawnObstacle();
    }
    if (Math.random() < 0.015) {
      spawnPowerUp();
    }

    // Camera follow
    cameraRef.current.position.x = playerCarRef.current.position.x * 0.3;

    // Render
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationRef.current = requestAnimationFrame(animate);
  }, [gameState, isPaused, activePowerUps, checkCollision, onScoreUpdate, onHealthChange, onCoinCollect, onPowerUpCollect, spawnObstacle, spawnPowerUp]);

  // Initialize scene
  useEffect(() => {
    init();

    const handleResize = () => {
      if (containerRef.current && cameraRef.current && rendererRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [init]);

  // Start animation loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Touch controls
  const handleTouch = (side) => {
    if (side === 'left') {
      keysRef.current.left = true;
    } else {
      keysRef.current.right = true;
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Mobile touch controls */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 flex md:hidden">
        <button
          className="flex-1 bg-transparent active:bg-white/10 transition-colors"
          onTouchStart={() => handleTouch('left')}
        />
        <button
          className="flex-1 bg-transparent active:bg-white/10 transition-colors"
          onTouchStart={() => handleTouch('right')}
        />
      </div>
    </div>
  );
}