/**
 * Three.js 渲染器：GDL 形状列表 → 3D 场景组。
 * 坐标映射：GDL(x, y, z↑) → three(x, z, -y)，保持右手系。
 * 视觉：数字蓝图风——哑光蓝材质 + 描边线框（CAD 感）。
 */
import * as THREE from 'three'
import type { Shape } from './types'

/** GDL→three 坐标变换矩阵（列主序） */
const COORD_C = new THREE.Matrix4().set(
  1, 0, 0, 0,
  0, 0, 1, 0,
  0, -1, 0, 0,
  0, 0, 0, 1
)

const gdlToThree = (m: number[]): THREE.Matrix4 =>
  new THREE.Matrix4().multiplyMatrices(COORD_C, new THREE.Matrix4().fromArray(m))

/**
 * 几何体一律先按 **GDL 本地坐标**（x/y 水平、z 向上）构造，
 * 再统一乘以 COORD_C × M_gdl 映射到 three 视图坐标。
 * 切勿在构造时预先交换轴，否则会被映射两次导致姿态错乱。
 */
function geometryFor(s: Shape): THREE.BufferGeometry {
  switch (s.type) {
    case 'block': {
      // GDL 局部：x∈[0,a], y∈[0,b], z∈[0,c]
      const g = new THREE.BoxGeometry(s.a, s.b, s.c)
      g.translate(s.a / 2, s.b / 2, s.c / 2)
      return g
    }
    case 'cylind': {
      // three 圆柱轴向为 +y，绕 X 转 90° 对齐 GDL 的 +z
      const g = new THREE.CylinderGeometry(s.r, s.r, s.h, 32, 1, false)
      g.rotateX(Math.PI / 2)
      g.translate(0, 0, s.h / 2)
      return g
    }
    case 'sphere': {
      // 球心在 GDL 原点
      return new THREE.SphereGeometry(s.r, 32, 24)
    }
    case 'cone': {
      // GDL CONE h, r1(底 z=0), r2(顶 z=h)
      // 旋转后：原 +y(radiusTop) → +z，故 radiusTop = r2
      const g = new THREE.CylinderGeometry(s.r2, s.r1, s.h, 32, 1, false)
      g.rotateX(Math.PI / 2)
      g.translate(0, 0, s.h / 2)
      return g
    }
  }
}

export interface BuildResult {
  group: THREE.Group
  /** 包围盒（three 世界坐标），供相机自动取景 */
  bbox: THREE.Box3
}

/** 形状列表 → 场景组（每形状一网格 + 边线） */
export function buildGroup(shapes: Shape[]): BuildResult {
  const group = new THREE.Group()
  const bbox = new THREE.Box3()

  const isDark = document.documentElement.classList.contains('dark')
  const mat = new THREE.MeshStandardMaterial({
    color: isDark ? 0x2e6da8 : 0x5b93cf,
    roughness: 0.55,
    metalness: 0.1,
    transparent: true,
    opacity: 0.92
  })
  const edgeMat = new THREE.LineBasicMaterial({
    color: isDark ? 0x9fd0f0 : 0x042c53
  })

  for (const s of shapes) {
    const geo = geometryFor(s)
    if (!geo) continue
    const mesh = new THREE.Mesh(geo, mat)
    mesh.applyMatrix4(gdlToThree(s.matrix))

    // 边线（CAD 描边感）
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), edgeMat)
    edges.applyMatrix4(gdlToThree(s.matrix))

    group.add(mesh)
    group.add(edges)
    geo.computeBoundingBox()
    if (geo.boundingBox) bbox.union(geo.boundingBox.clone().applyMatrix4(gdlToThree(s.matrix)))
  }
  return { group, bbox }
}

/** 自动取景：根据包围盒放置相机 */
export function frameCamera(camera: THREE.PerspectiveCamera, bbox: THREE.Box3): void {
  if (bbox.isEmpty()) {
    camera.position.set(3, 2.5, -3)
    camera.lookAt(0, 0, 0)
    return
  }
  const center = bbox.getCenter(new THREE.Vector3())
  const size = bbox.getSize(new THREE.Vector3())
  const radius = Math.max(size.x, size.y, size.z) * 0.5 || 1
  const dist = radius * 2.9
  camera.position.set(center.x + dist * 0.7, center.y + dist * 0.6, center.z - dist * 0.7)
  camera.near = Math.max(radius / 100, 0.01)
  camera.far = dist * 100
  camera.updateProjectionMatrix()
  camera.lookAt(center)
}
