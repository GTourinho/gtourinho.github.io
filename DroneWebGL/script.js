import * as THREE from './resources/three.js/r126/build/three.module.js';
import {
  GLTFLoader
} from './resources/three.js/r126/examples/jsm/loaders/GLTFLoader.js';

import { OrbitControls }	from './resources/three.js/r126/examples/jsm/controls/OrbitControls.js';

// Variáveis do programa
var action;
var scene = null;
var renderer = null;
var camera = null;
var farPlane = 200.0;
var camDummy
var nearPlane = 0.1;
var drone;
var city;
var keys;
var mixer;
var clock = new THREE.Clock();
var rotatex = 0;
var rotatez = 0;
var cityBox, droneBox;

scene = new THREE.Scene();
renderer = new THREE.WebGLRenderer();

renderer.setClearColor(new THREE.Color(0.0, 0.0, 0.0));
renderer.setSize(window.innerWidth * 0.7, window.innerHeight * 0.7);

document.getElementById("WebGL-output").appendChild(renderer.domElement);

camera = new THREE.PerspectiveCamera(45.0, window.innerWidth / window.innerHeight, nearPlane, farPlane);

// Visão de cima enquanto carrega o drone
camera.position.set(-4,8,0);
camera.lookAt(2, 0, 0);
camDummy = new THREE.Object3D();

// Carrega as meshs

const gltfLoader = new GLTFLoader();

gltfLoader.load('./resources/models/animated_drone/scene.gltf', function(loadedMesh) {

  loadedMesh.name = "drone";
  loadedMesh.scene.position.set(0,5,0);
  loadedMesh.scene.scale.set(1,1,1);
  mixer = new THREE.AnimationMixer( loadedMesh.scene );
	action = mixer.clipAction( loadedMesh.animations[ 0 ] );
  action.play();
  action.timeScale = 1.5;
  scene.add(loadedMesh.scene);
  drone = loadedMesh.scene;
  // Acoplar a câmera ao drone
  drone.add(camDummy);
  droneBox = new THREE.Box3().setFromObject(drone);
  
});

gltfLoader.load('./resources/models/city/scene.gltf', function(loadedMesh) {

  loadedMesh.name = "city";
  scene.add(loadedMesh.scene);
  const light = new THREE.AmbientLight(0xffffff); // soft white light
  scene.add(light);
  const pLight = new THREE.PointLight(0x000099); // point blue light
  scene.add(pLight);
  city = loadedMesh.scene;
  cityBox = new THREE.Box3().setFromObject(city);

});

// Hash para guardar estado atual dos botões
keys = {
    w: false,
    s: false,
    a: false,
    d: false,
    shiftleft: false,
    space: false,
    enter: false
  };

// Funções para atualizar estado dos botões com input do teclado
document.body.appendChild( renderer.domElement );

document.body.addEventListener( 'keydown', function(e) {

  const key = e.code.replace('Key', '').toLowerCase();
  if(keys[key] !== undefined){
    if(key == 'enter'){
      keys[key] = !keys[key];
    }
    else{
      keys[key] = true;
    }
    
  }

});

document.body.addEventListener( 'keyup', function(e) {
  
  const key = e.code.replace('Key', '').toLowerCase();
  
  if ( keys[ key ] !== undefined ){
    if(key != 'enter'){
      keys[ key ] = false;
    }
  }
  
});

function render() {
  var delta = clock.getDelta();
  if ( mixer ) mixer.update( delta );

  if(drone !== undefined){

    // Movimento do drone, velocidades
    var speedY = (action.timeScale - 1.5)/80
    if(drone.position.y + speedY >= 0.5){
      drone.position.y += speedY;
    }
    var speedXZ = (action.timeScale)/60;  
    var speedX = speedXZ * drone.rotation.z;
    var speedZ = speedXZ * drone.rotation.x;
    // Drone não pode sair dos limites da cidade
    if(drone.position.x + droneBox.min.x - speedX >= cityBox.min.x && drone.position.x + droneBox.max.x - speedX <= cityBox.max.x){
      drone.position.x -= speedX;
    }
    if(drone.position.z + droneBox.min.z + speedZ >= cityBox.min.z && drone.position.z + droneBox.max.z + speedZ <= cityBox.max.z){
      drone.position.z += speedZ;
    }
    
    // Atualização da câmera, seguindo o drone
    camera.position.setFromMatrixPosition( camDummy.matrixWorld );
    camera.position.y += 0.5;
    camera.position.z -= 0.5;
    camera.lookAt(drone.position.x, drone.position.y, drone.position.z);
    //Botões de rotação do drone nos eixos
    
    if(keys.w){
      rotatex += action.timeScale/80;     
      if(rotatex <= 0.8)
      {
        drone.rotation.x = rotatex;
      }
      else{
        rotatex = 0.8;
      }
    }
    else if(keys.s){
      rotatex -= action.timeScale/80;
      if(rotatex >= -0.8)
      {
        drone.rotation.x = rotatex;
      }
      else{
        rotatex = -0.8;
      }
    }
    //Ajuste automático para o centro X
    else if(rotatex > 0 && keys.enter == false){
      rotatex -= action.timeScale/80;
      if(rotatex < 0){
        rotatex = 0;
      }
      drone.rotation.x = rotatex;
    }
    else if(rotatex < 0 && keys.enter == false){
      rotatex += action.timeScale/80;
      if(rotatex > 0){
        rotatex = 0;
      }
      drone.rotation.x = rotatex;
    }
    if(keys.d){
      rotatez += action.timeScale/80;     
      if(rotatez <= 0.8)
      {
        drone.rotation.z = rotatez;
      }
      else{
        rotatez = 0.8;
      }
    }
    else if(keys.a){
      rotatez -= action.timeScale/80;     
      if(rotatez >= -0.8)
      {
        drone.rotation.z = rotatez;
      }
      else{
        rotatez = -0.8;
      }
    }
    //Ajuste automático para o centro Z
    else if(rotatez > 0 && keys.enter == false){
      rotatez -= action.timeScale/80;
      if(rotatez < 0){
        rotatez = 0;
      }
      drone.rotation.z = rotatez;
    }
    else if(rotatez < 0 && keys.enter == false){
      rotatez += action.timeScale/80;
      if(rotatez > 0){
        rotatez = 0;
      }
      drone.rotation.z = rotatez;
    }

    //Botões de mudança de velocidade das hélices
    if(keys.shiftleft){
      action.timeScale += 0.01;
      if(action.timeScale >= 3){
        action.timeScale = 3;
      }
    }
    else if(keys.space){
      action.timeScale -= 0.01;
      if(action.timeScale <= 0){
        action.timeScale = 0;
      }
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(render);

}

renderer.clear();
render();