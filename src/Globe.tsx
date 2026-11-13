import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { cities, type City } from "./model";
export default function Globe({
  selected,
  onSelect,
  reduced,
  onFailure,
}: {
  selected: City | null;
  onSelect: (c: City) => void;
  reduced: boolean;
  onFailure: () => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    choose = useRef(onSelect),
    target = useRef<City | null>(selected);
  choose.current = onSelect;
  target.current = selected;
  useEffect(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
      });
    } catch {
      onFailure();
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-label", "Interactive Earth");
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.35, 7.1);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.autoRotate = !reduced;
    controls.autoRotateSpeed = 0.25;
    controls.minPolarAngle = 0.45;
    controls.maxPolarAngle = Math.PI - 0.45;
    const earth = new THREE.Group();
    scene.add(earth);
    const texture = new THREE.TextureLoader().load(import.meta.env.BASE_URL + "media/earth-texture.jpg");
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.86,
      metalness: 0.15,
      color: 0x999999,
    });
    material.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        "#include <map_fragment>\n float gray=dot(diffuseColor.rgb,vec3(0.299,0.587,0.114));diffuseColor.rgb=vec3(gray);",
      );
    };
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.05, 64, 48),
      material,
    );
    earth.add(sphere);
    scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    const light = new THREE.DirectionalLight(0xffffff, 4);
    light.position.set(-4, 3, 5);
    scene.add(light);
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.085, 48, 32),
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        uniforms: {},
        vertexShader:
          "varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}",
        fragmentShader:
          "varying vec3 n;varying vec3 v;void main(){float a=pow(1.-abs(dot(n,v)),3.)*.35;gl_FragColor=vec4(.8,.84,.89,a);}",
      }),
    );
    earth.add(atmosphere);
    const point = (lat: number, lng: number, r = 2.08) => {
      const phi = ((90 - lat) * Math.PI) / 180,
        theta = ((lng + 180) * Math.PI) / 180;
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      );
    };
    const markers = cities.map((c) => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.026, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      );
      m.position.copy(point(c.lat, c.lng));
      m.userData.city = c.name;
      earth.add(m);
      return m;
    });
    const stars = new Float32Array(450 * 3);
    for (let i = 0; i < 450; i++) {
      const a = i * 2.399963,
        b = Math.acos(1 - (2 * (i + 0.5)) / 450),
        r = 20;
      stars[i * 3] = r * Math.sin(b) * Math.cos(a);
      stars[i * 3 + 1] = r * Math.cos(b);
      stars[i * 3 + 2] = r * Math.sin(b) * Math.sin(a);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(stars, 3));
    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0xadb5c1,
        size: 0.025,
        transparent: true,
        opacity: 0.45,
      }),
    );
    scene.add(points);
    const ray = new THREE.Raycaster(),
      mouse = new THREE.Vector2();
    let down = { x: 0, y: 0 };
    const pointerdown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const hit = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      mouse.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      ray.setFromCamera(mouse, camera);
      return ray.intersectObjects([sphere, ...markers])[0];
    };
    const pointerup = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
      const h = hit(e);
      if (h?.object.userData.city) choose.current(h.object.userData.city);
    };
    const move = (e: PointerEvent) => {
      const h = hit(e);
      renderer.domElement.title = h?.object.userData.city || "";
      renderer.domElement.style.cursor = h?.object.userData.city
        ? "pointer"
        : "grab";
    };
    renderer.domElement.addEventListener("pointerdown", pointerdown);
    renderer.domElement.addEventListener("pointerup", pointerup);
    renderer.domElement.addEventListener("pointermove", move);
    const loss = (e: Event) => {
      e.preventDefault();
      onFailure();
    };
    renderer.domElement.addEventListener("webglcontextlost", loss);
    const resize = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    });
    resize.observe(el);
    let frame = 0,
      lastCity: City | null = null,
      destination: THREE.Vector3 | null = null,
      visible = true;
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    });
    observer.observe(el);
    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      if (target.current !== lastCity) {
        lastCity = target.current;
        const c = cities.find((c) => c.name === lastCity);
        destination = c ? point(c.lat, c.lng, 5.6) : null;
        controls.autoRotate = !reduced && !c;
      }
      if (destination) {
        camera.position.lerp(destination, reduced ? 1 : 0.045);
        if (camera.position.distanceTo(destination) < 0.02) destination = null;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    loop();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
          o.geometry.dispose();
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => m.dispose());
        }
      });
      texture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [reduced]);
  return <div className="globe-canvas" ref={host} />;
}
