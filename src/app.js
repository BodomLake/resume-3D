import * as THREE from "three";
import { WEBGL } from "./WebGL";
import * as Ammo from "./builds/ammo";
import {
	billboardTextures,
	boxTexture,
	inputText,
	URL,
	stoneTexture,
	woodTexture,
} from "./resources/textures";

import {
	setupEventHandlers,
	moveDirection,
	isTouchscreenDevice,
	touchEvent,
	createJoystick,
} from "./resources/eventHandlers";

import {
	preloadDivs,
	preloadOpacity,
	postloadDivs,
	startScreenDivs,
	startButton,
	noWebGL,
	fadeOutDivs,
} from "./resources/preload";

import {
	clock,
	scene,
	camera,
	renderer,
	stats,
	manager,
	createWorld,
	lensFlareObject,
	createLensFlare,
	particleGroup,
	particleAttributes,
	particleSystemObject,
	glowingParticles,
	addParticles,
	moveParticles,
	generateGalaxy,
	galaxyMaterial,
	galaxyClock,
	galaxyPoints,
} from "./resources/world";

import {
	simpleText,
	floatingLabel,
	allSkillsSection,
	createTextOnPlane,
} from "./resources/surfaces";

import {
	pickPosition,
	launchClickPosition,
	getCanvasRelativePosition,
	rotateCamera,
	launchHover,
} from "./resources/utils";
// 鼠标悬停有个性化设置的物体的数组
export let cursorHoverObjects = [];

// start Ammo Engine
Ammo().then((Ammo) => {
	//Ammo.js variable declaration
	// 所有刚体对象的集合
	let rigidBodies = [],
		physicsWorld;

	//Ammo Dynamic bodies for ball
	// 物理引擎 控制的球体对象
	let ballObject = null;
	const STATE = { DISABLE_DEACTIVATION: 4 };

	//default transform object
	let tmpTrans = new Ammo.btTransform();

	// list of hyperlink objects 带有超链接的物体
	var objectsWithLinks = [];

	//function to create physics world with Ammo.js
	// 创建物理世界 bt= bullet
	function createPhysicsWorld() {
		// 完全碰撞检测的算法(配置)
		//algortihms for full (not broadphase) collision detection
		let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
			// dispatch calculations for overlapping pairs/ collisions.
			// 派发 重叠对，碰撞 的计算结果
			// 派发器
			dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
			//broad-phase collision detection list of all possible colliding pairs
			// 所有可能的碰撞对的 粗侧阶段 碰撞检测列表
			// 重叠对的缓存
			overlappingPairCache = new Ammo.btDbvtBroadphase(),
			//causes the objects to interact properly, like gravity, game logic forces, collisions
			// 使得物理可以合适地交互，比如说 重力，博弈逻辑力，碰撞
			// 一个约束处理器
			constraintSolver = new Ammo.btSequentialImpulseConstraintSolver();

		// see bullet physics docs for info
		// 构建出Ammo.js 秒速的物理世界 (Bullet-Physics 离散的动态世界)
		physicsWorld = new Ammo.btDiscreteDynamicsWorld(
			dispatcher,
			overlappingPairCache,
			constraintSolver,
			collisionConfiguration
		);

		// add gravity
		// 指定 重力大小和重力方向
		physicsWorld.setGravity(new Ammo.btVector3(0, -50, 0));
	}

	//generic function to add physics to Mesh with scale
	// TODO: toread
	function addRigidPhysics(item, itemScale) {
		let pos = { x: item.position.x, y: item.position.y, z: item.position.z };
		let scale = { x: itemScale.x, y: itemScale.y, z: itemScale.z };
		let quat = { x: 0, y: 0, z: 0, w: 1 };
		let mass = 0;
		var transform = new Ammo.btTransform();
		transform.setIdentity();
		// 刚体的位置，偏转力和 入参对应的物体一致
		transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
		transform.setRotation(
			new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
		);

		var localInertia = new Ammo.btVector3(0, 0, 0);
		var motionState = new Ammo.btDefaultMotionState(transform);
		// 碰撞的外形和 入参对应的物体一致
		let colShape = new Ammo.btBoxShape(
			new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5)
		);
		// Collision体之间，距离小于等于0.05就可以判定为碰撞了
		colShape.setMargin(0.05);
		colShape.calculateLocalInertia(mass, localInertia);
		let rbInfo = new Ammo.btRigidBodyConstructionInfo(
			mass,
			motionState,
			colShape,
			localInertia
		);
		let body = new Ammo.btRigidBody(rbInfo);
		body.setActivationState(STATE.DISABLE_DEACTIVATION);
		// 设置碰撞标志符
		body.setCollisionFlags(2);
		// 也要加入刚体列表
		physicsWorld.addRigidBody(body);
	}

	//create flat plane 创建一个平面
	function createGridPlane() {
		// block properties
		let pos = { x: 0, y: -0.25, z: 0 };
		let scale = { x: 175, y: 0.5, z: 175 };
		let quat = { x: 0, y: 0, z: 0, w: 1 };
		// 质量 0即为无穷大
		let mass = 0; //mass of zero = infinite mass

		//create grid overlay on plane 在平面上加一个网格
		var grid = new THREE.GridHelper(175, 20, 0xffffff, 0xffffff);
		grid.material.opacity = 0.5;
		grid.material.transparent = true;
		grid.position.y = 0.005;
		// 把网格加入到场景中
		scene.add(grid);

		//Create Threejs Plane
		// 创建 透明颜色的 平面
		let blockPlane = new THREE.Mesh(
			new THREE.BoxBufferGeometry(),
			new THREE.MeshPhongMaterial({
				color: 0xffffff,
				transparent: true,
				opacity: 0.25,
			})
		);

		blockPlane.position.set(pos.x, pos.y, pos.z);
		blockPlane.scale.set(scale.x, scale.y, scale.z);
		blockPlane.receiveShadow = true;
		// 加入平面几何体
		scene.add(blockPlane);

		//Ammo.js Physics transform对象将会作用于threejs创建的Mesh
		let transform = new Ammo.btTransform();
		//
		transform.setIdentity(); // sets safe default values
		// 原点的设置和threejs创建的几何体的初始位的设置是一样的
		transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
		// 物体旋转的设置
		transform.setRotation(
			new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
		);
		// 默认的运动状态
		let motionState = new Ammo.btDefaultMotionState(transform);

		//setup collision box 用Ammon创建一个 碰撞球
		let colShape = new Ammo.btBoxShape(
			new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5)
		);
		colShape.setMargin(0.05);

		// Ammo设置 惯性对象
		let localInertia = new Ammo.btVector3(0, 0, 0);
		colShape.calculateLocalInertia(mass, localInertia);

		//  provides information to create a rigid body
		// 构建刚体所需的信息
		let rigidBodyStruct = new Ammo.btRigidBodyConstructionInfo(
			mass,
			motionState,
			colShape,
			localInertia
		);
		let body = new Ammo.btRigidBody(rigidBodyStruct);
		// 滑动摩擦系数
		body.setFriction(10);
		// 滚动摩擦系数
		body.setRollingFriction(10);

		// add to world
		// 把这个刚体加入BT所构建的物理世界中
		physicsWorld.addRigidBody(body);
	}

	// create ball
	function createBall() {
		// 初始位置
		let pos = { x: 8.75, y: 0, z: 0 };
		// 圆球的半径
		let radius = 2;
		let quat = { x: 0, y: 0, z: 0, w: 1 };
		// 质量为3
		let mass = 3;

		// 加载一个地球图片的纹理
		var marble_loader = new THREE.TextureLoader(manager);
		var marbleTexture = marble_loader.load("./src/jsm/earth.jpg");
		marbleTexture.wrapS = marbleTexture.wrapT = THREE.RepeatWrapping;
		marbleTexture.repeat.set(1, 1);
		marbleTexture.anisotropy = 1;
		marbleTexture.encoding = THREE.sRGBEncoding;

		//threeJS Section 用threejs创建三维球体，并且用的是 地球图片作为外部纹理
		let ball = (ballObject = new THREE.Mesh(
			new THREE.SphereGeometry(radius, 32, 32),
			new THREE.MeshLambertMaterial({ map: marbleTexture })
		));

		ball.geometry.computeBoundingSphere();
		ball.geometry.computeBoundingBox();

		ball.position.set(pos.x, pos.y, pos.z);

		// 可以投射阴影，和呈现阴影
		ball.castShadow = true;
		ball.receiveShadow = true;

		scene.add(ball);

		// Ammojs Section
		let transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
		transform.setRotation(
			new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
		);
		let motionState = new Ammo.btDefaultMotionState(transform);

		let colShape = new Ammo.btSphereShape(radius);
		colShape.setMargin(0.05);

		let localInertia = new Ammo.btVector3(0, 0, 0);
		colShape.calculateLocalInertia(mass, localInertia);

		let rbInfo = new Ammo.btRigidBodyConstructionInfo(
			mass,
			motionState,
			colShape,
			localInertia
		);
		let body = new Ammo.btRigidBody(rbInfo);
		//body.setFriction(4);
		// 仅仅设置滚动摩擦
		body.setRollingFriction(10);

		//set ball friction

		//once state is set to disable, dynamic interaction no longer calculated
		// 一旦状态被设置为无效，动态的交互就不会被js计算了
		body.setActivationState(STATE.DISABLE_DEACTIVATION);
		// 物理世界加入刚体
		physicsWorld.addRigidBody(
			body //collisionGroupRedBall, collisionGroupGreenBall | collisionGroupPlane
		);
		// 球体自带数据， physicsBody = body
		ball.userData.physicsBody = body;
		ballObject.userData.physicsBody = body;

		rigidBodies.push(ball);
		rigidBodies.push(ballObject);
	}

	//create beach ball Mesh 创建一个沙滩球
	function createBeachBall() {
		let pos = { x: 20, y: 30, z: 0 };
		let radius = 2;
		let quat = { x: 0, y: 0, z: 0, w: 1 };
		let mass = 20;

		//import beach ball texture 加载沙滩球的纹理（五颜六色的）
		var texture_loader = new THREE.TextureLoader(manager);
		var beachTexture = texture_loader.load("./src/jsm/BeachBallColor.jpg");
		beachTexture.wrapS = beachTexture.wrapT = THREE.RepeatWrapping;
		beachTexture.repeat.set(1, 1);
		beachTexture.anisotropy = 1;
		beachTexture.encoding = THREE.sRGBEncoding;

		//threeJS Section
		let ball = new THREE.Mesh(
			new THREE.SphereGeometry(radius, 32, 32),
			new THREE.MeshLambertMaterial({ map: beachTexture })
		);

		ball.position.set(pos.x, pos.y, pos.z);
		ball.castShadow = true;
		ball.receiveShadow = true;
		scene.add(ball);

		//Ammojs Section
		let transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
		transform.setRotation(
			new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
		);
		let motionState = new Ammo.btDefaultMotionState(transform);

		let colShape = new Ammo.btSphereShape(radius);
		colShape.setMargin(0.05);

		let localInertia = new Ammo.btVector3(0, 0, 0);
		colShape.calculateLocalInertia(mass, localInertia);

		let rbInfo = new Ammo.btRigidBodyConstructionInfo(
			mass,
			motionState,
			colShape,
			localInertia
		);
		let body = new Ammo.btRigidBody(rbInfo);

		body.setRollingFriction(1);
		// 沙滩球 也加入物理世界中
		physicsWorld.addRigidBody(body);

		ball.userData.physicsBody = body;
		rigidBodies.push(ball);
	}

	//create link boxes 创建带可跳转链接的方块
	function createBox(
		x,
		y,
		z,
		scaleX,
		scaleY,
		scaleZ,
		boxTexture,
		URLLink,
		color = 0x000000,
		transparent = true
	) {
		const boxScale = { x: scaleX, y: scaleY, z: scaleZ };
		let quat = { x: 0, y: 0, z: 0, w: 1 };
		let mass = 0; //mass of zero = infinite mass

		//load link logo 加载logo的纹理
		const loader = new THREE.TextureLoader(manager);
		const texture = loader.load(boxTexture);
		texture.magFilter = THREE.LinearFilter;
		texture.minFilter = THREE.LinearFilter;
		texture.encoding = THREE.sRGBEncoding;
		const loadedTexture = new THREE.MeshBasicMaterial({
			map: texture,
			transparent: transparent,
			color: 0xffffff,
		});

		var borderMaterial = new THREE.MeshBasicMaterial({
			color: color,
		});
		borderMaterial.color.convertSRGBToLinear();

		// 只留一面，上图像纹理
		var materials = [
			borderMaterial, // Left side
			borderMaterial, // Right side
			borderMaterial, // Top side   ---> THIS IS THE FRONT
			borderMaterial, // Bottom side --> THIS IS THE BACK
			loadedTexture, // Front side
			borderMaterial, // Back side
		];

		const linkBox = new THREE.Mesh(
			new THREE.BoxBufferGeometry(boxScale.x, boxScale.y, boxScale.z),
			materials
		);

		linkBox.position.set(x, y, z);
		linkBox.renderOrder = 1;
		linkBox.castShadow = true;
		linkBox.receiveShadow = true;
		// 添加自定义的数据
		linkBox.userData = { URL: URLLink, email: URLLink };
		scene.add(linkBox);

		objectsWithLinks.push(linkBox.uuid);
		// 转化为物理世界的刚体
		addRigidPhysics(linkBox, boxScale);
		//
		cursorHoverObjects.push(linkBox);
	}

	//create Ammo.js body to add solid mass to "Ryan Floyd Software Engineer"
	function ryanFloydWords(x, y, z) {
		const boxScale = { x: 46, y: 3, z: 2 };
		let quat = { x: 0, y: 0, z: 0, w: 1 };
		let mass = 0; //mass of zero = infinite mass

		const linkBox = new THREE.Mesh(
			new THREE.BoxBufferGeometry(boxScale.x, boxScale.y, boxScale.z),
			new THREE.MeshPhongMaterial({
				color: 0xff6600,
			})
		);

		linkBox.position.set(x, y, z);
		linkBox.castShadow = true;
		linkBox.receiveShadow = true;
		objectsWithLinks.push(linkBox.uuid);

		addRigidPhysics(linkBox, boxScale);
	}

	//loads text for Text Mesh
	function loadAuthorText(char) {
		var text_loader = new THREE.FontLoader();

		text_loader.load("./src/jsm/FZYaoTi_Regular.json", function (font) {
			var xMid, text;

			var color = 0xfffc00;

			var textMaterials = [
				new THREE.MeshBasicMaterial({ color: color }), // front
				new THREE.MeshPhongMaterial({ color: color }), // side
			];

			var geometry = new THREE.TextGeometry(char, {
				font: font,
				size: 3,
				height: 0.5,
				curveSegments: 12,
				bevelEnabled: true,
				bevelThickness: 0.1,
				bevelSize: 0.11,
				bevelOffset: 0,
				bevelSegments: 1,
			});

			geometry.computeBoundingBox();
			geometry.computeVertexNormals();

			xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);

			geometry.translate(xMid, 0, 0);

			var textGeo = new THREE.BufferGeometry().fromGeometry(geometry);

			text = new THREE.Mesh(geometry, textMaterials);
			text.position.z = -20;
			text.position.y = 0.1;
			text.receiveShadow = true;
			text.castShadow = true;
			scene.add(text);
		});
	}

	function loadJobText(char) {
		// 加载字体
		var text_loader = new THREE.FontLoader();

		text_loader.load("./src/jsm/FZYaoTi_Regular.json", function (font) {
			var xMid, text;

			var color = 0x00ff08;

			var textMaterials = [
				new THREE.MeshBasicMaterial({ color: color }), // front
				new THREE.MeshPhongMaterial({ color: color }), // side
			];

			var geometry = new THREE.TextGeometry(char, {
				font: font,
				size: 1.5,
				height: 0.5,
				curveSegments: 20,
				bevelEnabled: true,
				bevelThickness: 0.25,
				bevelSize: 0.1,
			});

			geometry.computeBoundingBox();
			geometry.computeVertexNormals();

			xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);

			geometry.translate(xMid, 0, 0);

			var textGeo = new THREE.BufferGeometry().fromGeometry(geometry);

			text = new THREE.Mesh(textGeo, textMaterials);
			text.position.z = -20;
			text.position.y = 0.1;
			text.position.x = 24;
			text.receiveShadow = true;
			text.castShadow = true;
			scene.add(text);
		});
	}

	//function to create billboard
	function createBillboard(
		x,
		y,
		z,
		textureImage = billboardTextures.grassImage,
		urlLink,
		rotation = 0
	) {
		const billboardPoleScale = { x: 1, y: 5, z: 1 };
		const billboardSignScale = { x: 30, y: 15, z: 1 };

		/* default texture loading */
		const loader = new THREE.TextureLoader(manager);

		const billboardPole = new THREE.Mesh(
			new THREE.BoxBufferGeometry(
				billboardPoleScale.x,
				billboardPoleScale.y,
				billboardPoleScale.z
			),
			new THREE.MeshStandardMaterial({
				map: loader.load(woodTexture),
			})
		);

		const texture = loader.load(textureImage);
		texture.magFilter = THREE.LinearFilter;
		texture.minFilter = THREE.LinearFilter;
		texture.encoding = THREE.sRGBEncoding;
		var borderMaterial = new THREE.MeshBasicMaterial({
			color: 0x000000,
		});
		const loadedTexture = new THREE.MeshBasicMaterial({
			map: texture,
		});

		var materials = [
			borderMaterial, // Left side
			borderMaterial, // Right side
			borderMaterial, // Top side   ---> THIS IS THE FRONT
			borderMaterial, // Bottom side --> THIS IS THE BACK
			loadedTexture, // Front side
			borderMaterial, // Back side
		];
		// order to add materials: x+,x-,y+,y-,z+,z-
		const billboardSign = new THREE.Mesh(
			new THREE.BoxGeometry(
				billboardSignScale.x,
				billboardSignScale.y,
				billboardSignScale.z
			),
			materials
		);

		billboardPole.position.x = x;
		billboardPole.position.y = y;
		billboardPole.position.z = z;

		billboardSign.position.x = x;
		billboardSign.position.y = y + 10;
		billboardSign.position.z = z;

		/* Rotate Billboard */
		billboardPole.rotation.y = rotation;
		billboardSign.rotation.y = rotation;

		billboardPole.castShadow = true;
		billboardPole.receiveShadow = true;

		billboardSign.castShadow = true;
		billboardSign.receiveShadow = true;

		billboardSign.userData = { URL: urlLink };

		scene.add(billboardPole);
		scene.add(billboardSign);
		addRigidPhysics(billboardPole, billboardPoleScale);

		cursorHoverObjects.push(billboardSign);
	}

	//create vertical billboard 翻转了板子，竖起来
	function createBillboardRotated(
		x,
		y,
		z,
		textureImage = billboardTextures.grassImage,
		urlLink,
		rotation = 0
	) {
		const billboardPoleScale = { x: 1, y: 2.5, z: 1 };
		const billboardSignScale = { x: 15, y: 20, z: 1 };

		/* default texture loading */
		const loader = new THREE.TextureLoader(manager);
		const billboardPole = new THREE.Mesh(
			new THREE.BoxBufferGeometry(
				billboardPoleScale.x,
				billboardPoleScale.y,
				billboardPoleScale.z
			),
			new THREE.MeshStandardMaterial({
				map: loader.load(woodTexture),
			})
		);
		const texture = loader.load(textureImage);
		texture.magFilter = THREE.LinearFilter;
		texture.minFilter = THREE.LinearFilter;
		texture.encoding = THREE.sRGBEncoding;
		var borderMaterial = new THREE.MeshBasicMaterial({
			color: 0x000000,
		});
		const loadedTexture = new THREE.MeshBasicMaterial({
			map: texture,
		});

		var materials = [
			borderMaterial, // Left side
			borderMaterial, // Right side
			borderMaterial, // Top side   ---> THIS IS THE FRONT
			borderMaterial, // Bottom side --> THIS IS THE BACK
			loadedTexture, // Front side
			borderMaterial, // Back side
		];
		// order to add materials: x+,x-,y+,y-,z+,z-
		const billboardSign = new THREE.Mesh(
			new THREE.BoxGeometry(
				billboardSignScale.x,
				billboardSignScale.y,
				billboardSignScale.z
			),
			materials
		);

		billboardPole.position.x = x;
		billboardPole.position.y = y;
		billboardPole.position.z = z;

		billboardSign.position.x = x;
		billboardSign.position.y = y + 11.25;
		billboardSign.position.z = z;

		/* Rotate Billboard */
		billboardPole.rotation.y = rotation;
		billboardSign.rotation.y = rotation;

		billboardPole.castShadow = true;
		billboardPole.receiveShadow = true;

		billboardSign.castShadow = true;
		billboardSign.receiveShadow = true;

		billboardSign.userData = { URL: urlLink };

		scene.add(billboardPole);
		scene.add(billboardSign);
		addRigidPhysics(billboardPole, billboardPoleScale);
		addRigidPhysics(billboardSign, billboardSignScale);

		cursorHoverObjects.push(billboardSign);
	}

	//create X axis wall around entire plane X轴墙
	function createWallX(x, y, z) {
		const wallScale = { x: 0.125, y: 4, z: 175 };

		const wall = new THREE.Mesh(
			new THREE.BoxBufferGeometry(wallScale.x, wallScale.y, wallScale.z),
			new THREE.MeshStandardMaterial({
				color: 0xffffff,
				opacity: 0.75,
				transparent: true,
			})
		);

		wall.position.x = x;
		wall.position.y = y;
		wall.position.z = z;

		wall.receiveShadow = true;

		scene.add(wall);

		addRigidPhysics(wall, wallScale);
	}

	//create Z axis wall around entire plane z轴墙
	function createWallZ(x, y, z) {
		const wallScale = { x: 175, y: 4, z: 0.125 };

		const wall = new THREE.Mesh(
			new THREE.BoxBufferGeometry(wallScale.x, wallScale.y, wallScale.z),
			new THREE.MeshStandardMaterial({
				color: 0xffffff,
				opacity: 0.75,
				transparent: true,
			})
		);

		wall.position.x = x;
		wall.position.y = y;
		wall.position.z = z;

		wall.receiveShadow = true;

		scene.add(wall);

		addRigidPhysics(wall, wallScale);
	}

	//create brick wall 砖墙
	function wallOfBricks() {
		const loader = new THREE.TextureLoader(manager);
		var pos = new THREE.Vector3();
		var quat = new THREE.Quaternion();
		var brickMass = 0.1;
		var brickLength = 3;
		var brickDepth = 3;
		var brickHeight = 1.5;
		var numberOfBricksAcross = 6;
		var numberOfRowsHigh = 6;

		pos.set(70, brickHeight * 0.5, -60);
		quat.set(0, 0, 0, 1);

		for (var j = 0; j < numberOfRowsHigh; j++) {
			var oddRow = j % 2 == 1;

			pos.x = 60;

			if (oddRow) {
				pos.x += 0.25 * brickLength;
			}

			var currentRow = oddRow ? numberOfBricksAcross + 1 : numberOfBricksAcross;
			for (let i = 0; i < currentRow; i++) {
				var brickLengthCurrent = brickLength;
				var brickMassCurrent = brickMass;
				if (oddRow && (i == 0 || i == currentRow - 1)) {
					//first or last brick
					brickLengthCurrent *= 0.5;
					brickMassCurrent *= 0.5;
				}
				var brick = createBrick(
					brickLengthCurrent,
					brickHeight,
					brickDepth,
					brickMassCurrent,
					pos,
					quat,
					new THREE.MeshStandardMaterial({
						map: loader.load(stoneTexture),
					})
				);
				brick.castShadow = true;
				brick.receiveShadow = true;

				if (oddRow && (i == 0 || i == currentRow - 2)) {
					//first or last brick
					pos.x += brickLength * 0.25;
				} else {
					pos.x += brickLength;
				}
				pos.z += 0.0001;
			}
			pos.y += brickHeight;
		}
	}

	//helper function to create individual brick mesh
	function createBrick(sx, sy, sz, mass, pos, quat, material) {
		var threeObject = new THREE.Mesh(
			new THREE.BoxBufferGeometry(sx, sy, sz, 1, 1, 1),
			material
		);
		var shape = new Ammo.btBoxShape(
			new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5)
		);
		shape.setMargin(0.05);

		createBrickBody(threeObject, shape, mass, pos, quat);

		return threeObject;
	}

	//add physics to brick body 创建物理砖体
	function createBrickBody(threeObject, physicsShape, mass, pos, quat) {
		threeObject.position.copy(pos);
		threeObject.quaternion.copy(quat);

		var transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
		transform.setRotation(
			new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
		);
		var motionState = new Ammo.btDefaultMotionState(transform);

		var localInertia = new Ammo.btVector3(0, 0, 0);
		physicsShape.calculateLocalInertia(mass, localInertia);

		var rbInfo = new Ammo.btRigidBodyConstructionInfo(
			mass,
			motionState,
			physicsShape,
			localInertia
		);
		var body = new Ammo.btRigidBody(rbInfo);

		threeObject.userData.physicsBody = body;

		scene.add(threeObject);

		if (mass > 0) {
			rigidBodies.push(threeObject);

			// Disable deactivation
			body.setActivationState(4);
		}

		physicsWorld.addRigidBody(body);
	}

	// 三角形，作地标，黏在网格平面上
	function createTriangle(x, z) {
		var geom = new THREE.Geometry();
		var v1 = new THREE.Vector3(4, 0, 0);
		var v2 = new THREE.Vector3(5, 0, 0);
		var v3 = new THREE.Vector3(4.5, 1, 0);

		geom.vertices.push(v1);
		geom.vertices.push(v2);
		geom.vertices.push(v3);

		geom.faces.push(new THREE.Face3(0, 1, 2));
		geom.computeFaceNormals();

		var mesh = new THREE.Mesh(
			geom,
			new THREE.MeshBasicMaterial({ color: 0xffffff })
		);
		mesh.rotation.x = -Math.PI * 0.5;
		//mesh.rotation.z = -90;
		mesh.position.y = 0.01;
		mesh.position.x = x;
		mesh.position.z = z;
		scene.add(mesh);
	}

	// 移动球体
	function moveBall() {
		let scalingFactor = 20;
		let moveX = moveDirection.right - moveDirection.left;
		let moveZ = moveDirection.back - moveDirection.forward;
		let moveY = 0;

		if (ballObject.position.y < 2.01) {
			moveX = moveDirection.right - moveDirection.left;
			moveZ = moveDirection.back - moveDirection.forward;
			moveY = 0;
		} else {
			moveX = moveDirection.right - moveDirection.left;
			moveZ = moveDirection.back - moveDirection.forward;
			moveY = -0.25;
		}

		// no movement
		if (moveX == 0 && moveY == 0 && moveZ == 0) return;

		let resultantImpulse = new Ammo.btVector3(moveX, moveY, moveZ);
		resultantImpulse.op_mul(scalingFactor);
		let physicsBody = ballObject.userData.physicsBody;
		physicsBody.setLinearVelocity(resultantImpulse);
	}

	function renderFrame() {
		// FPS stats module
		stats.begin();
		// 流逝的时间
		const elapsedTime = galaxyClock.getElapsedTime() + 150;

		let deltaTime = clock.getDelta();
		// 不是移动设备
		if (!isTouchscreenDevice())
			if (document.hasFocus()) {
				moveBall();
			} else {
				moveDirection.forward = 0;
				moveDirection.back = 0;
				moveDirection.left = 0;
				moveDirection.right = 0;
			}
		else {
			moveBall();
		}

		// 跟进物理世界
		updatePhysics(deltaTime);
		// 让所有的粒子运动起来
		moveParticles();

		renderer.render(scene, camera);
		stats.end();

		galaxyMaterial.uniforms.uTime.value = elapsedTime * 5;
		//galaxyPoints.position.set(-50, -50, 0);

		// tells browser theres animation, update before the next repaint
		requestAnimationFrame(renderFrame);
	}

	//loading page section
	function startButtonEventListener() {
		// 追加fade-out类，相当于开启了新的动画帧
		for (let i = 0; i < fadeOutDivs.length; i++) {
			fadeOutDivs[i].classList.add("fade-out");
		}
		// 750ms之后移除 预加载动画的DIV
		setTimeout(() => {
			document.getElementById("preload-overlay").style.display = "none";
		}, 750);

		startButton.removeEventListener("click", startButtonEventListener);
		document.addEventListener("click", launchClickPosition);
		// 这里就开始了创建沙滩球
		createBeachBall();

		setTimeout(() => {
			document.addEventListener("mousemove", launchHover);
		}, 1000);
	}

	function updatePhysics(deltaTime) {
		// Step world 10ms更新一次物理世界的变化
		physicsWorld.stepSimulation(deltaTime, 10);

		// Update rigid bodies 更新我们收录的每一个刚体
		for (let i = 0; i < rigidBodies.length; i++) {
			let objThree = rigidBodies[i];
			let objAmmo = objThree.userData.physicsBody;
			let ms = objAmmo.getMotionState();
			if (ms) {
				ms.getWorldTransform(tmpTrans);
				let p = tmpTrans.getOrigin();
				let q = tmpTrans.getRotation();
				// 随着重心的改变二位移
				objThree.position.set(p.x(), p.y(), p.z());
				// 随着扭矩力的改变而旋转
				objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
			}
		}

		//check to see if ball escaped the plane
		// 球要是掉入-50之下的Y坐标，就毁掉重新创建一个球
		if (ballObject.position.y < -50) {
			scene.remove(ballObject);
			createBall();
		}

		//check to see if ball is on text to rotate camera
		rotateCamera(ballObject);
	}

	//document loading
	manager.onStart = function (item, loaded, total) {
		//console.log("Loading started");
	};

	manager.onLoad = function () {
		var readyStateCheckInterval = setInterval(function () {
			if (document.readyState === "complete") {
				clearInterval(readyStateCheckInterval);
				for (let i = 0; i < preloadDivs.length; i++) {
					preloadDivs[i].style.visibility = "hidden"; // or
					preloadDivs[i].style.display = "none";
				}
				for (let i = 0; i < postloadDivs.length; i++) {
					postloadDivs[i].style.visibility = "visible"; // or
					postloadDivs[i].style.display = "block";
				}
			}
		}, 1000);
		//console.log("Loading complete");
	};

	manager.onError = function (url) {
		//console.log("Error loading");
	};

	startButton.addEventListener("click", startButtonEventListener);

	if (isTouchscreenDevice()) {
		document.getElementById("appDirections").innerHTML =
			"请用左下方的操作杆来移动小球，请竖立使用设备!";
		createJoystick(document.getElementById("joystick-wrapper"));
		document.getElementById("joystick-wrapper").style.visibility = "visible";
		document.getElementById("joystick").style.visibility = "visible";
	}

	//initialize world and begin
	function start() {
		createWorld();
		createPhysicsWorld();

		// 红线是X轴，绿线是Y轴，蓝线是Z轴
		var axesHelper = new THREE.AxesHelper(50);
		scene.add(axesHelper);

		createGridPlane();
		createBall();

		//  在平面上创建4堵墙
		createWallX(87.5, 1.75, 0);
		createWallX(-87.5, 1.75, 0);
		createWallZ(0, 1.75, 87.5);
		createWallZ(0, 1.75, -87.5);

		createBillboard(
			-80,
			2.5,
			-70,
			billboardTextures.terpSolutionsTexture,
			URL.terpsolutions,
			Math.PI * 0.22
		);

		createBillboard(
			-45,
			2.5,
			-78,
			billboardTextures.bagHolderBetsTexture,
			URL.githubBagholder,
			Math.PI * 0.17
		);

		createBillboardRotated(
			-17,
			1.25,
			-75,
			billboardTextures.homeSweetHomeTexture,
			URL.githubHomeSweetHome,
			Math.PI * 0.15
		);

		ryanFloydWords(11.2, 1, -20);
		createTextOnPlane(-70, 0.01, -48, inputText.terpSolutionsText, 20, 40);
		createTextOnPlane(-42, 0.01, -53, inputText.bagholderBetsText, 20, 40);
		createTextOnPlane(-14, 0.01, -49, inputText.homeSweetHomeText, 20, 40);

		createBox(
			12,
			2,
			-70,
			4,
			4,
			1,
			boxTexture.Github,
			URL.gitHub,
			0x000000,
			true
		);

		// createBox(
		//   4,
		//   2,
		//   -70,
		//   4,
		//   4,
		//   1,
		//   boxTexture.weibo,
		//   URL.weibo,
		//   0xffffff,
		//   true
		// );

		createBox(
			19,
			2,
			-70,
			4,
			4,
			1,
			boxTexture.cnBlog,
			URL.cnBlog,
			0x0077b5,
			true
		);
		// createBox(
		//   35,
		//   2,
		//   -70,
		//   4,
		//   4,
		//   1,
		//   boxTexture.globe,
		//   URL.nouxs,
		//   0xffffff,
		//   false
		// );

		createBox(
			27,
			2,
			-70,
			4,
			4,
			1,
			boxTexture.mail,
			"792294021@qq.com",
			0x000000,
			false
		);

		// createBox(
		//   44,
		//   2,
		//   -70,
		//   4,
		//   4,
		//   1,
		//   boxTexture.writing,
		//   URL.devTo,
		//   0x000000,
		//   false
		// );

		createBox(
			35,
			2,
			-70,
			4,
			4,
			1,
			boxTexture.writing,
			URL.devTo,
			0x000000,
			false
		);

		// floatingLabel(3.875, 4.5, -70, 'weibo');
		floatingLabel(11.875, 4.5, -70, "Github");
		floatingLabel(19.125, 4.5, -70, "cnBlogs");
		floatingLabel(26.875, 4.5, -70, "Email");
		// floatingLabel(35, 6.5, -70, '  Static \nWebsite');
		floatingLabel(35, 6.5, -70, "   我是怎么做的");
		// floatingLabel(44, 6.5, -70, '   How I \nmade this');

		allSkillsSection(-50, 0.025, 20, 40, 40, boxTexture.allSkills);
		allSkillsSection(61, 0.025, 13, 30, 60, inputText.activities);
		// allSkillsSection(8.5, 0.025, 54, 7, 3.5, boxTexture.skrillex);
		// allSkillsSection(9, 0.01, 45, 15, 15, boxTexture.edmText);
		// allSkillsSection(9, 0.01, 20, 21, 10.5, inputText.staticPortfolio);

		//lensflare
		createLensFlare(50, -50, -800, 200, 200, boxTexture.lensFlareMain);

		loadAuthorText("BodomLake");
		loadJobText("Web前端工程师");

		let touchText, instructionsText;
		//  移动端
		if (isTouchscreenDevice()) {
			// Touch boxes with your \nfinger to open links
			touchText = "用你的手指触碰方块打开链接";
			instructionsText = "使用屏幕底部或者左侧的操纵杆来移动球";
			// ("   Use the joystick in the bottom \nleft of the screen to move the ball.");
		} else {
			// PC端
			// Click on boxes with \nthe mouse to open links
			touchText = "用鼠标点击方块打开链接";
			instructionsText = "使用键盘上的方向键移动球";
			// "Use the arrow keys on your \n keyboard to move the ball.";
		}

		simpleText(9, 0.01, 5, instructionsText, 1.5);

		simpleText(23, 0.01, -60, touchText, 1.5);
		simpleText(-50, 0.01, -5, "掌握技能", 3);
		simpleText(-42, 0.01, -30, "实战项目", 3);
		simpleText(61, 0.01, -15, "就职公司", 3);

		wallOfBricks();
		createTriangle(63, -55);
		createTriangle(63, -51);
		createTriangle(63, -47);
		createTriangle(63, -43);

		// 生成一个星星群，分布在世界的周围
		addParticles();
		// 生成一个粒子群
		glowingParticles();
		// 生成一个宇宙
		generateGalaxy();

		setupEventHandlers();
		// window.addEventListener('mousemove', onDocumentMouseMove, false);
		// 在该函数中，addParticles()创建的粒子会做出运动moveParticles()
		renderFrame();
	}

	//check if user's browser has WebGL capabilities
	if (WEBGL.isWebGLAvailable()) {
		start();
	} else {
		noWebGL();
	}
});
