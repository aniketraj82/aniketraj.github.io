(function () {
  "use strict";

  var canvas = document.getElementById("hero-3d");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setupTiltCards() {
    var cards = document.querySelectorAll(".tilt-card, .resume-wrap, .contact-section .box");

    cards.forEach(function (card) {
      card.addEventListener("mousemove", function (event) {
        var rect = card.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width - 0.5;
        var y = (event.clientY - rect.top) / rect.height - 0.5;

        card.style.transform = "perspective(900px) rotateX(" + (-y * 7).toFixed(2) + "deg) rotateY(" + (x * 9).toFixed(2) + "deg) translateY(-8px)";
      });

      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  function drawFallbackScene() {
    if (!canvas || !canvas.getContext) return;

    var context = canvas.getContext("2d");
    var width = canvas.clientWidth || 720;
    var height = canvas.clientHeight || 620;
    var scale = window.devicePixelRatio || 1;
    canvas.width = width * scale;
    canvas.height = height * scale;
    context.scale(scale, scale);
    context.clearRect(0, 0, width, height);

    var gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "rgba(255, 189, 57, 0.7)");
    gradient.addColorStop(1, "rgba(45, 212, 191, 0.7)");
    context.strokeStyle = gradient;
    context.lineWidth = 2;

    for (var i = 0; i < 8; i++) {
      var x = width * 0.22 + i * width * 0.075;
      var barHeight = 80 + Math.sin(i * 0.85) * 42 + i * 15;
      context.fillStyle = i % 2 ? "rgba(45, 212, 191, 0.22)" : "rgba(255, 189, 57, 0.22)";
      context.fillRect(x, height * 0.58 - barHeight, width * 0.045, barHeight);
      context.strokeRect(x, height * 0.58 - barHeight, width * 0.045, barHeight);
    }

    context.beginPath();
    for (var point = 0; point < 9; point++) {
      var px = width * 0.17 + point * width * 0.083;
      var py = height * 0.34 + Math.cos(point * 0.9) * 54;
      if (point === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    }
    context.stroke();
  }

  function setupThreeScene() {
    if (!canvas || typeof THREE === "undefined") {
      drawFallbackScene();
      return;
    }

    var scene = new THREE.Scene();
    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 1.6, 8.2);

    var group = new THREE.Group();
    scene.add(group);

    var gold = new THREE.MeshStandardMaterial({
      color: 0xffbd39,
      metalness: 0.52,
      roughness: 0.28,
      emissive: 0x241400,
      emissiveIntensity: 0.3
    });
    var teal = new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      metalness: 0.35,
      roughness: 0.22,
      emissive: 0x082d2a,
      emissiveIntensity: 0.42
    });
    var pink = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      metalness: 0.28,
      roughness: 0.28,
      emissive: 0x250716,
      emissiveIntensity: 0.38
    });
    var glass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.1,
      transparent: true,
      opacity: 0.12,
      transmission: 0.4
    });

    var base = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.2, 0.28, 64), glass);
    base.position.y = -1.7;
    group.add(base);

    var bars = [];
    var barGeometry = new THREE.BoxGeometry(0.38, 1, 0.38);
    var barValues = [1.25, 2.1, 1.55, 2.8, 1.9, 3.2, 2.45];

    barValues.forEach(function (value, index) {
      var material = index % 3 === 0 ? gold : index % 3 === 1 ? teal : pink;
      var bar = new THREE.Mesh(barGeometry, material);
      bar.scale.y = value;
      bar.position.set((index - 3) * 0.62, -1.58 + value / 2, 0);
      bar.castShadow = true;
      bars.push(bar);
      group.add(bar);
    });

    var lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.72 });
    var linePoints = barValues.map(function (value, index) {
      return new THREE.Vector3((index - 3) * 0.62, -0.9 + value, 0.44);
    });
    var line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(linePoints), lineMaterial);
    group.add(line);

    var nodeGeometry = new THREE.SphereGeometry(0.1, 24, 24);
    linePoints.forEach(function (point, index) {
      var node = new THREE.Mesh(nodeGeometry, index % 2 ? teal : gold);
      node.position.copy(point);
      group.add(node);
    });

    var ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.1, 0.018, 16, 120),
      new THREE.MeshBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.48 })
    );
    ring.rotation.x = Math.PI / 2.4;
    ring.position.y = 0.2;
    group.add(ring);

    var particleGeometry = new THREE.BufferGeometry();
    var particleCount = 140;
    var particlePositions = new Float32Array(particleCount * 3);
    for (var i = 0; i < particleCount; i++) {
      var radius = 2.2 + Math.random() * 2.4;
      var angle = Math.random() * Math.PI * 2;
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = -1.6 + Math.random() * 4.4;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    var particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({ color: 0xffbd39, size: 0.035, transparent: true, opacity: 0.62 })
    );
    group.add(particles);

    scene.add(new THREE.AmbientLight(0xffffff, 0.72));
    var keyLight = new THREE.PointLight(0xffbd39, 1.7, 16);
    keyLight.position.set(-3, 4, 4);
    scene.add(keyLight);
    var sideLight = new THREE.PointLight(0x2dd4bf, 1.45, 18);
    sideLight.position.set(4, 1.5, 5);
    scene.add(sideLight);

    var mouse = { x: 0, y: 0 };
    window.addEventListener("mousemove", function (event) {
      mouse.x = (event.clientX / window.innerWidth - 0.5) * 0.7;
      mouse.y = (event.clientY / window.innerHeight - 0.5) * 0.5;
    });

    function resize() {
      var width = canvas.clientWidth || 720;
      var height = canvas.clientHeight || 620;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function animate(time) {
      var tick = time * 0.001;
      group.rotation.y = Math.sin(tick * 0.35) * 0.17 + mouse.x;
      group.rotation.x = -0.08 + mouse.y;
      ring.rotation.z = tick * 0.18;
      particles.rotation.y = tick * 0.055;

      bars.forEach(function (bar, index) {
        bar.position.y += Math.sin(tick * 1.4 + index) * 0.0018;
      });

      renderer.render(scene, camera);
      if (!reduceMotion) window.requestAnimationFrame(animate);
    }

    resize();
    window.addEventListener("resize", resize);
    window.requestAnimationFrame(animate);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setupTiltCards();
      setupThreeScene();
    });
  } else {
    setupTiltCards();
    setupThreeScene();
  }
})();
