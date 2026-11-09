import * as THREE from 'three';

export function mountCubePreview(container: HTMLElement, color = 0xCAFFCA) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(400, 1, 0.1, 1000)
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshBasicMaterial({ color })
  const cube = new THREE.Mesh(geometry, material)

  scene.add(cube)
  camera.position.z = 5
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  const resize = () => {
    const { width, height } = container.getBoundingClientRect()
    camera.aspect = width / Math.max(height, 1)
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)
  resize()

  function animate(time: number) {
    cube.rotation.x = time / 8000
    cube.rotation.y = time / 4000
    renderer.render(scene, camera)
  }

  renderer.setAnimationLoop(animate)

  return () => {
    renderer.setAnimationLoop(null)
    resizeObserver.disconnect()
    geometry.dispose()
    material.dispose()
    renderer.dispose()
    renderer.domElement.remove()
  }
}
