/** todo: - keyframe 기능 - 글상자 수정 */
<script setup>
import { computed, ref, watch } from "vue";

import arrowUpImg from "./assets/arrow_up.png";
import arrowDownImg from "./assets/arrow_down.png";

const camX = ref(0);
const camY = ref(0);
const camRot = ref(0);
const camZoom = ref(1);

const camWorldX = ref(0);
const camWorldY = ref(0);
const prevCamX = ref(0);
const prevCamY = ref(0);

const sidebarOpen = ref(true);
const sidebarWidth = ref(316);
let isDragging = ref(false);
let dragStartX = ref(0);
let dragStartWidth = ref(0);

const scenesSidebarWidth = ref(260);
const isDraggingScenesSidebar = ref(false);
const scenesDragStartX = ref(0);
const scenesDragStartWidth = ref(0);
const contentScale = ref(1);
const showGrid = ref(true);
const clipToScreen = ref(false);

// 장면
const scenes = ref([]);
let sceneIdCounter = 0;
const activeSceneId = ref(null);
const isRestoringCamera = ref(false);

// 오브젝트 관련
const objects = ref([]);
let objectIdCounter = 0;
const selectedObjectId = ref(null);
let isDraggingObject = ref(false);
let isResizing = ref(false);
let isRotating = ref(false);
let objectDragStart = { x: 0, y: 0, objX: 0, objY: 0, axisLock: null };
let resizeHandle = "";
let rotateStart = { x: 0, y: 0, rotation: 0 };
let copiedObject = null;

const isTypingTarget = (el) => {
  if (!el) return false;
  const tag = (el.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (el.isContentEditable) return true;
  return false;
};

const roundToTwo = (value) => {
  return Math.round(value * 100) / 100;
};

const textMeasureCanvas =
  typeof document !== "undefined" ? document.createElement("canvas") : null;
const textMeasureCtx = textMeasureCanvas
  ? textMeasureCanvas.getContext("2d")
  : null;
const measureTextSize = (text, fontSize) => {
  if (!textMeasureCtx) return { width: 0, height: 0 };
  textMeasureCtx.font = `${fontSize}px Inter, Pretendard, system-ui, -apple-system, sans-serif`;
  const metrics = textMeasureCtx.measureText(text || "");
  const paddingX = 0; // 3px * 2
  const paddingY = 0; // 2px * 2
  return {
    width: Math.ceil(metrics.width + paddingX),
    height: Math.ceil(fontSize + paddingY),
  };
};

const updateTextObjectContent = (obj, nextText) => {
  if (!obj || obj.type !== "text") return;
  const prevContent = obj.content;
  obj.content = nextText;
  if (obj.name === prevContent) {
    obj.name = nextText;
  }
  const { width, height } = measureTextSize(obj.content, obj.fontSize);
  obj.width = width;
  obj.height = height;
};

const editTextObject = (obj) => {
  if (!obj || obj.type !== "text") return;
  const next = prompt("텍스트를 수정하세요:", obj.content ?? "");
  if (next === null) return;
  updateTextObjectContent(obj, next);
};

const getContentOrigin = () => {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  const contentEl = document.querySelector(".content");
  if (!contentEl)
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const rect = contentEl.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

// `.content`에 scale(transform)이 적용된 상태에서 client 좌표를 "스케일 전" 좌표로 역변환
const unscaleClientPoint = (clientX, clientY) => {
  const scale = contentScale.value || 1;
  if (scale === 1 || typeof window === "undefined")
    return { x: clientX, y: clientY };
  const { x: originX, y: originY } = getContentOrigin();
  return {
    x: originX + (clientX - originX) / scale,
    y: originY + (clientY - originY) / scale,
  };
};

// 월드 <-> 카메라(화면) 좌표 변환
// - camera space: 화면 중심 기준(px), 회전/줌이 적용된 "뷰" 좌표
const worldToCameraPoint = (worldX, worldY) => {
  const dx = (worldX - camWorldX.value) * camZoom.value;
  const dy = -(worldY - camWorldY.value) * camZoom.value;
  const rot = (-camRot.value * Math.PI) / 180;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  return {
    x: dx * cos - dy * sin,
    y: dx * sin + dy * cos,
  };
};

const cameraToWorldPoint = (camPX, camPY) => {
  const rot = (camRot.value * Math.PI) / 180;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  return {
    x: camWorldX.value + (camPX * cos - camPY * sin) / camZoom.value,
    y: camWorldY.value - (camPX * sin + camPY * cos) / camZoom.value,
  };
};

const getCameraState = () => {
  return {
    camX: camX.value,
    camY: camY.value,
    camRot: camRot.value,
    camZoom: camZoom.value,
    camWorldX: camWorldX.value,
    camWorldY: camWorldY.value,
  };
};

const applyCameraState = (state) => {
  isRestoringCamera.value = true;
  camX.value = state?.camX ?? 0;
  camY.value = state?.camY ?? 0;
  camRot.value = state?.camRot ?? 0;
  camZoom.value = state?.camZoom ?? 1;
  camWorldX.value = state?.camWorldX ?? 0;
  camWorldY.value = state?.camWorldY ?? 0;
  prevCamX.value = camX.value;
  prevCamY.value = camY.value;
  isRestoringCamera.value = false;
};

const getActiveSceneIndex = () => {
  return scenes.value.findIndex((s) => s.id === activeSceneId.value);
};

const getActiveScene = () => {
  const index = getActiveSceneIndex();
  if (index < 0) return null;
  return scenes.value[index];
};

const prevScene = computed(() => {
  const index = getActiveSceneIndex();
  if (index <= 0) return null;
  return scenes.value[index - 1] ?? null;
});

const prevSceneObjects = computed(() => {
  return prevScene.value?.objects ?? [];
});

const prevWorldTransform = computed(() => {
  const cam = prevScene.value?.camera;
  const zoom = cam?.camZoom ?? 1;
  const rot = cam?.camRot ?? 0;
  const worldX = cam?.camWorldX ?? 0;
  const worldY = cam?.camWorldY ?? 0;

  return {
    transform: `scale(${zoom}) rotate(${-rot}deg) translate(${-worldX}px, ${worldY}px)`,
    "--inv-zoom": String(1 / (zoom || 1)),
  };
});

const selectScene = (sceneId) => {
  const scene = scenes.value.find((s) => s.id === sceneId);
  if (!scene) return;

  activeSceneId.value = sceneId;
  selectedObjectId.value = null;
  copiedObject = null;

  objects.value = scene.objects;
  applyCameraState(scene.camera);
};

const addScene = () => {
  const baseObjects = objects.value;
  const baseCamera = getCameraState();

  const newScene = {
    id: ++sceneIdCounter,
    name: `프레임 ${sceneIdCounter}`,
    objects: baseObjects.map((o) => cloneObject(o)),
    camera: { ...baseCamera },
  };

  const activeIndex = scenes.value.findIndex(
    (s) => s.id === activeSceneId.value,
  );
  const insertIndex = activeIndex >= 0 ? activeIndex + 1 : scenes.value.length;
  scenes.value.splice(insertIndex, 0, newScene);
  selectScene(newScene.id);
};

const deleteScene = (sceneId) => {
  if (scenes.value.length <= 1) return;

  const index = scenes.value.findIndex((s) => s.id === sceneId);
  if (index < 0) return;

  const deletingActive = activeSceneId.value === sceneId;

  let nextActiveId = activeSceneId.value;
  if (deletingActive) {
    const prev = scenes.value[index - 1];
    const next = scenes.value[index + 1];
    nextActiveId = (prev ?? next)?.id ?? null;
  }

  scenes.value.splice(index, 1);

  if (deletingActive && nextActiveId != null) {
    selectScene(nextActiveId);
  }
};

// 초기 장면 1개 생성
(() => {
  const initialScene = {
    id: ++sceneIdCounter,
    name: `프레임 ${sceneIdCounter}`,
    objects: objects.value,
    camera: getCameraState(),
  };
  scenes.value = [initialScene];
  activeSceneId.value = initialScene.id;
})();

// 오브젝트 값을 "카메라 좌표계"로 표시/입력하기 위한 헬퍼
const getObjectCameraPoint = (obj) => worldToCameraPoint(obj.x, obj.y);
const setObjectCameraX = (obj, camXValue) => {
  const p = getObjectCameraPoint(obj);
  const world = cameraToWorldPoint(camXValue, p.y);
  obj.x = world.x;
  obj.y = world.y;
};
const setObjectCameraY = (obj, camYValue) => {
  const p = getObjectCameraPoint(obj);
  const world = cameraToWorldPoint(p.x, camYValue);
  obj.x = world.x;
  obj.y = world.y;
};
const getObjectCameraRotation = (obj) => (obj.rotation || 0) - camRot.value;
const setObjectCameraRotation = (obj, cameraDeg) => {
  obj.rotation = cameraDeg + camRot.value;
};
const getObjectCameraSize = (obj) => getObjectSize(obj) * camZoom.value;
const setObjectCameraSize = (obj, cameraSize) => {
  const zoom = camZoom.value || 1;
  updateObjectSize(obj, cameraSize / zoom);
};

const addImageObject = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        // 이미지 로드 후 원본 비율 계산
        const img = new Image();
        img.onload = () => {
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          const baseSize = 100 / camZoom.value;
          const width = baseSize;
          const height = baseSize / aspectRatio;

          objects.value.unshift({
            id: ++objectIdCounter,
            type: "image",
            name: file.name,
            x: camWorldX.value,
            y: camWorldY.value,
            rotation: camRot.value,
            scale: 1,
            width: width,
            height: height,
            src: event.target.result,
          });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
};

const addTextObject = () => {
  const text = prompt("텍스트를 입력하세요:", "텍스트");
  if (text) {
    const fontSize = 24 / camZoom.value;
    const { width, height } = measureTextSize(text, fontSize);
    objects.value.unshift({
      id: ++objectIdCounter,
      type: "text",
      name: text,
      x: camWorldX.value,
      y: camWorldY.value,
      rotation: camRot.value,
      scale: 1,
      fontSize: fontSize,
      content: text,
      width: width,
      height: height,
    });
  }
};

const deleteObject = (id) => {
  objects.value = objects.value.filter((obj) => obj.id !== id);
  if (selectedObjectId.value === id) {
    selectedObjectId.value = null;
  }
};

const cloneObject = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

const moveObjectUp = (id) => {
  const index = objects.value.findIndex((obj) => obj.id === id);
  if (index > 0) {
    [objects.value[index], objects.value[index - 1]] = [
      objects.value[index - 1],
      objects.value[index],
    ];
  }
};

const moveObjectDown = (id) => {
  const index = objects.value.findIndex((obj) => obj.id === id);
  if (index < objects.value.length - 1) {
    [objects.value[index], objects.value[index + 1]] = [
      objects.value[index + 1],
      objects.value[index],
    ];
  }
};

const updateObjectSize = (obj, newSize) => {
  const aspectRatio = obj.width / obj.height;
  // size = sqrt(width * height)
  // width = size * sqrt(ratio), height = size / sqrt(ratio)
  obj.width = newSize * Math.sqrt(aspectRatio);
  obj.height = newSize / Math.sqrt(aspectRatio);
};

const getObjectSize = (obj) => {
  return Math.sqrt(obj.width * obj.height);
};

const startObjectDrag = (e, obj) => {
  e.stopPropagation();
  if (e.button !== 0) return;
  isDraggingObject.value = true;
  selectedObjectId.value = obj.id;

  const pointer = unscaleClientPoint(e.clientX, e.clientY);
  objectDragStart = {
    x: pointer.x,
    y: pointer.y,
    objX: obj.x,
    objY: obj.y,
    axisLock: null,
  };
};

const handleObjectDrag = (e) => {
  if (!isDraggingObject.value || !selectedObjectId.value) return;

  const obj = objects.value.find((o) => o.id === selectedObjectId.value);
  if (!obj) return;

  const pointer = unscaleClientPoint(e.clientX, e.clientY);
  const dx = pointer.x - objectDragStart.x;
  const dy = pointer.y - objectDragStart.y;

  // 스크린 좌표 이동을 월드 좌표로 변환 (카메라 회전/줌 고려)
  const rot = (camRot.value * Math.PI) / 180;
  const zoom = camZoom.value;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);

  const worldDx = (dx * cos - dy * sin) / zoom;
  const worldDy = (dx * sin + dy * cos) / zoom;

  let nextX = objectDragStart.objX + worldDx;
  let nextY = objectDragStart.objY + worldDy;

  if (e.shiftKey) {
    if (!objectDragStart.axisLock) {
      const absX = Math.abs(worldDx);
      const absY = Math.abs(worldDy);
      // 미세한 흔들림에서는 축을 확정하지 않음
      if (absX > 0.5 || absY > 0.5) {
        // 더 크게 움직인 축 방향으로만 이동 허용
        objectDragStart.axisLock = absX >= absY ? "x" : "y";
      }
    }

    // axisLock: "x" => 수평 이동만(= Y 고정), "y" => 수직 이동만(= X 고정)
    if (objectDragStart.axisLock === "x") {
      nextY = objectDragStart.objY;
    } else if (objectDragStart.axisLock === "y") {
      nextX = objectDragStart.objX;
    }
  } else {
    objectDragStart.axisLock = null;
  }

  obj.x = nextX;
  obj.y = nextY;
};

const stopObjectDrag = () => {
  isDraggingObject.value = false;
  objectDragStart.axisLock = null;
};

const startResize = (e, handle, obj) => {
  e.stopPropagation();
  isResizing.value = true;
  selectedObjectId.value = obj.id;
  resizeHandle = handle;

  // 현재 중심 좌표 (obj.x, obj.y는 이미 중앙)
  const centerX = obj.x;
  const centerY = obj.y;

  // 핸들의 현재 위치
  let handleOffsetX = 0;
  let handleOffsetY = 0;

  if (handle === "se") {
    handleOffsetX = obj.width / 2;
    handleOffsetY = obj.height / 2;
  } else if (handle === "sw") {
    handleOffsetX = -obj.width / 2;
    handleOffsetY = obj.height / 2;
  } else if (handle === "ne") {
    handleOffsetX = obj.width / 2;
    handleOffsetY = -obj.height / 2;
  } else if (handle === "nw") {
    handleOffsetX = -obj.width / 2;
    handleOffsetY = -obj.height / 2;
  }

  // 오브젝트 회전 적용
  const objRot = (obj.rotation * Math.PI) / 180;
  const objCos = Math.cos(objRot);
  const objSin = Math.sin(objRot);
  const rotatedOffsetX = handleOffsetX * objCos - handleOffsetY * objSin;
  const rotatedOffsetY = handleOffsetX * objSin + handleOffsetY * objCos;

  // 핸들의 현재 월드 좌표
  const handleWorldX = centerX + rotatedOffsetX;
  const handleWorldY = centerY + rotatedOffsetY;

  // 현재 중심에서 핸들까지의 거리
  const currentDistance = Math.sqrt(
    (handleWorldX - centerX) ** 2 + (handleWorldY - centerY) ** 2,
  );

  const pointer = unscaleClientPoint(e.clientX, e.clientY);
  objectDragStart = {
    x: pointer.x,
    y: pointer.y,
    objX: obj.x,
    objY: obj.y,
    width: obj.width || 100,
    height: obj.height || 100,
    scale: obj.scale,
    fontSize: obj.fontSize,
    centerX: centerX,
    centerY: centerY,
    currentDistance: currentDistance,
  };
};

const handleResize = (e) => {
  if (!isResizing.value || !selectedObjectId.value) return;

  const obj = objects.value.find((o) => o.id === selectedObjectId.value);
  if (!obj) return;

  const pointer = unscaleClientPoint(e.clientX, e.clientY);
  const dx = pointer.x - objectDragStart.x;
  const dy = pointer.y - objectDragStart.y;

  const rot = (camRot.value * Math.PI) / 180;
  const zoom = camZoom.value;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);

  const worldDx = (dx * cos - dy * sin) / zoom;
  const worldDy = (dx * sin + dy * cos) / zoom;

  const aspectRatio = objectDragStart.width / objectDragStart.height;

  // 리사이즈 전 오브젝트의 중심 좌표
  const centerX = objectDragStart.centerX;
  const centerY = objectDragStart.centerY;

  // 핸들의 초기 오브젝트 내 상대 위치
  let handleOffsetX = 0;
  let handleOffsetY = 0;

  if (resizeHandle === "se") {
    handleOffsetX = objectDragStart.width / 2;
    handleOffsetY = objectDragStart.height / 2;
  } else if (resizeHandle === "sw") {
    handleOffsetX = -objectDragStart.width / 2;
    handleOffsetY = objectDragStart.height / 2;
  } else if (resizeHandle === "ne") {
    handleOffsetX = objectDragStart.width / 2;
    handleOffsetY = -objectDragStart.height / 2;
  } else if (resizeHandle === "nw") {
    handleOffsetX = -objectDragStart.width / 2;
    handleOffsetY = -objectDragStart.height / 2;
  }

  // 오브젝트 회전 적용
  const objRot = (obj.rotation * Math.PI) / 180;
  const objCos = Math.cos(objRot);
  const objSin = Math.sin(objRot);
  const rotatedOffsetX = handleOffsetX * objCos - handleOffsetY * objSin;
  const rotatedOffsetY = handleOffsetX * objSin + handleOffsetY * objCos;

  // 핸들의 초기 월드 좌표
  const handleWorldX = centerX + rotatedOffsetX;
  const handleWorldY = centerY + rotatedOffsetY;

  // 핸들이 이동한 월드 거리
  const newHandleWorldX = handleWorldX + worldDx;
  const newHandleWorldY = handleWorldY + worldDy;

  // 오브젝트 중심에서 핸들까지의 현재 거리
  const newDistance = Math.sqrt(
    (newHandleWorldX - centerX) ** 2 + (newHandleWorldY - centerY) ** 2,
  );

  // 거리 비율로 크기 계산 (스무스한 스케일링)
  const distanceRatio = newDistance / objectDragStart.currentDistance;
  const newWidth = objectDragStart.width * distanceRatio;
  const newHeight = newWidth / aspectRatio;

  // 중심을 유지 (obj.x, obj.y는 중앙 기준)
  obj.width = newWidth;
  obj.height = newHeight;
  obj.x = centerX;
  obj.y = centerY;

  // 텍스트 객체의 폰트 사이즈도 함께 조절
  if (obj.type === "text" && objectDragStart.fontSize) {
    obj.fontSize = objectDragStart.fontSize * distanceRatio;
  }
};

const stopResize = () => {
  isResizing.value = false;
  resizeHandle = "";
};

const startRotate = (e, obj) => {
  e.stopPropagation();
  isRotating.value = true;
  selectedObjectId.value = obj.id;

  // 오브젝트의 월드 중심 좌표 (obj.x, obj.y는 이미 중심)
  const objCenterWorldX = obj.x;
  const objCenterWorldY = obj.y;

  // 스크린 중심 좌표(콘텐츠 스케일 고려)
  const screenRect = e.currentTarget.closest(".screen").getBoundingClientRect();
  const scaledScreenCenterX = screenRect.left + screenRect.width / 2;
  const scaledScreenCenterY = screenRect.top + screenRect.height / 2;
  const { x: screenCenterX, y: screenCenterY } = unscaleClientPoint(
    scaledScreenCenterX,
    scaledScreenCenterY,
  );

  // 월드 좌표를 스크린 좌표로 변환
  const rot = (-camRot.value * Math.PI) / 180;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);

  const relX = (objCenterWorldX - camWorldX.value) * camZoom.value;
  const relY = (objCenterWorldY - camWorldY.value) * camZoom.value;

  const screenX = relX * cos - relY * sin + screenCenterX;
  const screenY = relX * sin + relY * cos + screenCenterY;

  const pointer = unscaleClientPoint(e.clientX, e.clientY);

  rotateStart = {
    x: pointer.x,
    y: pointer.y,
    rotation: obj.rotation,
    centerX: screenX,
    centerY: screenY,
  };
};

const handleRotate = (e) => {
  if (!isRotating.value || !selectedObjectId.value) return;

  const obj = objects.value.find((o) => o.id === selectedObjectId.value);
  if (!obj) return;

  // 스크린 좌표에서의 오프셋
  const pointer = unscaleClientPoint(e.clientX, e.clientY);
  const dx = pointer.x - rotateStart.centerX;
  const dy = pointer.y - rotateStart.centerY;

  // 이미지 상단이 마우스를 향하도록: atan2(dx, -dy)로 계산
  // -dy를 사용하는 이유: 위쪽(음수 Y)이 0도가 되어야 함
  const screenAngle = Math.atan2(dx, -dy) * (180 / Math.PI);

  // 카메라 회전을 고려하여 월드 좌표에서의 각도 계산
  const worldAngle = screenAngle + camRot.value;

  const snapTo45 = (deg) => {
    const normalized = ((deg % 360) + 360) % 360;
    const snapped = Math.round(normalized / 45) * 45;
    return snapped % 360;
  };

  // 회전 설정
  obj.rotation = e.shiftKey ? snapTo45(worldAngle) : worldAngle;
};

const stopRotate = () => {
  isRotating.value = false;
};

const handleContentWheel = (e) => {
  if (!e.ctrlKey) return;
  e.preventDefault();

  const scaleDelta = e.deltaY > 0 ? 0.9 : 1.1;
  contentScale.value *= scaleDelta;
  contentScale.value = Math.max(0.5, Math.min(3, contentScale.value));
};

if (typeof window !== "undefined") {
  window.addEventListener("mousemove", (e) => {
    handleDrag(e);
    handleScenesSidebarDrag(e);
    handleObjectDrag(e);
    handleResize(e);
    handleRotate(e);
  });
  window.addEventListener("mouseup", () => {
    stopDrag();
    stopScenesSidebarDrag();
    stopObjectDrag();
    stopResize();
    stopRotate();
  });
  window.addEventListener("keydown", (e) => {
    if (isTypingTarget(e.target)) return;

    if (e.key === "Delete" && selectedObjectId.value) {
      deleteObject(selectedObjectId.value);
    }

    if (selectedObjectId.value) {
      const obj = objects.value.find((o) => o.id === selectedObjectId.value);
      if (obj) {
        const p = getObjectCameraPoint(obj);
        if (
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight" ||
          e.key === "ArrowUp" ||
          e.key === "ArrowDown"
        ) {
          e.preventDefault();
        }

        if (e.key === "ArrowLeft") setObjectCameraX(obj, p.x - 1);
        if (e.key === "ArrowRight") setObjectCameraX(obj, p.x + 1);
        if (e.key === "ArrowUp") setObjectCameraY(obj, p.y - 1);
        if (e.key === "ArrowDown") setObjectCameraY(obj, p.y + 1);
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
      if (selectedObjectId.value) {
        const obj = objects.value.find((o) => o.id === selectedObjectId.value);
        if (obj) {
          copiedObject = cloneObject(obj);
        }
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
      if (copiedObject) {
        const newObj = cloneObject(copiedObject);
        newObj.id = ++objectIdCounter;
        newObj.x += 10;
        newObj.y += 10;
        objects.value.unshift(newObj);
        selectedObjectId.value = newObj.id;
      }
    }
  });
}

const startDrag = (e) => {
  isDragging.value = true;
  dragStartX.value = e.clientX;
  dragStartWidth.value = sidebarWidth.value;
};

const handleDrag = (e) => {
  if (!isDragging.value) return;
  const delta = e.clientX - dragStartX.value;
  const newWidth = dragStartWidth.value + delta;

  if (e.clientX < 100) {
    sidebarWidth.value = 0;
  } else if (dragStartWidth.value === 0) {
    // width가 0일 때는 현재 마우스 위치를 직접 사용
    sidebarWidth.value = Math.max(150, Math.min(e.clientX, 600));
  } else if (newWidth < 316) {
    sidebarWidth.value = 316;
  } else {
    sidebarWidth.value = Math.min(newWidth, 600);
  }
};

const stopDrag = () => {
  isDragging.value = false;
};

const startScenesSidebarDrag = (e) => {
  isDraggingScenesSidebar.value = true;
  scenesDragStartX.value = e.clientX;
  scenesDragStartWidth.value = scenesSidebarWidth.value;
};

const handleScenesSidebarDrag = (e) => {
  if (!isDraggingScenesSidebar.value) return;
  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth;
  const mouseWidth = viewportWidth - e.clientX;

  // 마우스 기준으로 폭이 충분히 작아지면 완전 접힘
  if (mouseWidth <= 90) {
    scenesSidebarWidth.value = 0;
    return;
  }

  const delta = scenesDragStartX.value - e.clientX;
  const newWidth = scenesDragStartWidth.value + delta;

  if (scenesDragStartWidth.value === 0) {
    // 접힌 상태(0)에서 드래그로 다시 펼칠 때는 마우스 위치를 기준으로
    scenesSidebarWidth.value = Math.max(180, Math.min(mouseWidth, 600));
  } else if (newWidth < 180) {
    scenesSidebarWidth.value = 180;
  } else {
    scenesSidebarWidth.value = Math.min(newWidth, 600);
  }
};

const stopScenesSidebarDrag = () => {
  isDraggingScenesSidebar.value = false;
};

const worldTransform = computed(() => {
  return {
    transform: `scale(${camZoom.value}) rotate(${-camRot.value}deg) translate(${-camWorldX.value}px, ${camWorldY.value}px)`,
    "--inv-zoom": String(1 / (camZoom.value || 1)),
  };
});

watch([camX, camY, camRot], () => {
  if (isRestoringCamera.value) return;
  const deltaX = camX.value - prevCamX.value;
  const deltaY = camY.value - prevCamY.value;

  if (deltaX !== 0 || deltaY !== 0) {
    const rot = (camRot.value * Math.PI) / 180;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);

    camWorldX.value += deltaX * cos - deltaY * sin;
    camWorldY.value += deltaX * sin + deltaY * cos;

    prevCamX.value = camX.value;
    prevCamY.value = camY.value;
  }
});

watch([camX, camY, camRot, camZoom, camWorldX, camWorldY], () => {
  if (isRestoringCamera.value) return;
  const scene = getActiveScene();
  if (!scene) return;
  scene.camera = getCameraState();
});

const resetCamera = () => {
  camX.value = 0;
  camY.value = 0;
  camRot.value = 0;
  camZoom.value = 1;
  camWorldX.value = 0;
  camWorldY.value = 0;
  prevCamX.value = 0;
  prevCamY.value = 0;
};
</script>

<template>
  <div class="page">
    <section
      class="controls"
      :style="{
        width: sidebarWidth + 'px',
        padding: sidebarWidth === 0 ? '0' : '',
      }"
      :class="{ dragging: isDragging, collapsed: sidebarWidth === 0 }"
    >
      <div class="control-group">
        <label>
          <div class="label-header">
            <span class="title">카메라 X</span>
            <input class="number" type="number" v-model.number="camX" />
          </div>
          <input
            type="range"
            min="-400"
            max="400"
            step="1"
            v-model.number="camX"
          />
        </label>
      </div>

      <div class="control-group">
        <label>
          <div class="label-header">
            <span class="title">카메라 Y</span>
            <input class="number" type="number" v-model.number="camY" />
          </div>
          <input
            type="range"
            min="-300"
            max="300"
            step="1"
            v-model.number="camY"
          />
        </label>
      </div>

      <div class="control-group">
        <label>
          <div class="label-header">
            <span class="title">회전 (deg)</span>
            <input class="number" type="number" v-model.number="camRot" />
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            v-model.number="camRot"
          />
        </label>
      </div>

      <div class="control-group">
        <label>
          <div class="label-header">
            <span class="title">줌</span>
            <input
              class="number"
              type="number"
              step="0.01"
              v-model.number="camZoom"
            />
          </div>
          <input
            type="range"
            min="0.0"
            max="3"
            step="0.01"
            v-model.number="camZoom"
          />
        </label>
      </div>

      <div class="tooltip-hint">ctrl + 휠로 화면 확대/축소</div>

      <div class="control-actions">
        <button class="reset" type="button" @click="resetCamera">리셋</button>

        <div class="object-controls">
          <button class="add-btn" type="button" @click="addImageObject">
            이미지 추가
          </button>
          <button class="add-btn" type="button" @click="addTextObject">
            텍스트 추가
          </button>
        </div>
        <div class="toggle-options">
          <label class="toggle-item">
            <input type="checkbox" v-model="showGrid" />
            <span>좌표평면 표시</span>
          </label>
          <label class="toggle-item">
            <input type="checkbox" v-model="clipToScreen" />
            <span>화면 밖 숨기기</span>
          </label>
        </div>
        <div class="objects-list" v-if="objects.length > 0">
          <div v-for="obj in objects" :key="obj.id" class="object-item">
            <div class="object-header">
              <div class="object-info">
                <div class="object-thumb">
                  <img
                    v-if="obj.type === 'image'"
                    :src="obj.src"
                    alt="thumbnail"
                    draggable="false"
                  />
                  <span v-else>{{
                    (obj.name || obj.content || "텍스트").slice(0, 1)
                  }}</span>
                </div>
                <input
                  class="object-name-input"
                  type="text"
                  v-model="obj.name"
                  placeholder="이름"
                />
              </div>
              <div class="object-buttons">
                <button
                  class="move-btn"
                  @click="moveObjectUp(obj.id)"
                  title="앞으로"
                  aria-label="앞으로"
                >
                  <img
                    class="move-icon"
                    :src="arrowUpImg"
                    alt=""
                    aria-hidden="true"
                    draggable="false"
                  />
                </button>
                <button
                  class="move-btn"
                  @click="moveObjectDown(obj.id)"
                  title="뒤로"
                  aria-label="뒤로"
                >
                  <img
                    class="move-icon"
                    :src="arrowDownImg"
                    alt=""
                    aria-hidden="true"
                    draggable="false"
                  />
                </button>
                <button
                  class="delete-btn icon"
                  @click="deleteObject(obj.id)"
                  title="삭제"
                  aria-label="삭제"
                >
                  ×
                </button>
              </div>
            </div>
            <div class="object-properties">
              <div class="property-row">
                <label>X</label>
                <input
                  type="number"
                  step="1"
                  :value="roundToTwo(getObjectCameraPoint(obj).x)"
                  @change="setObjectCameraX(obj, Number($event.target.value))"
                />
              </div>
              <div class="property-row">
                <label>Y</label>
                <input
                  type="number"
                  step="1"
                  :value="roundToTwo(getObjectCameraPoint(obj).y)"
                  @change="setObjectCameraY(obj, Number($event.target.value))"
                />
              </div>
              <div class="property-row">
                <label>크기</label>
                <input
                  type="number"
                  step="1"
                  :value="getObjectCameraSize(obj).toFixed(1)"
                  @change="
                    setObjectCameraSize(obj, Number($event.target.value));
                    obj.width = roundToTwo(obj.width);
                    obj.height = roundToTwo(obj.height);
                  "
                />
              </div>
              <div class="property-row">
                <label>회전</label>
                <input
                  type="number"
                  step="1"
                  :value="roundToTwo(getObjectCameraRotation(obj))"
                  @change="
                    setObjectCameraRotation(obj, Number($event.target.value))
                  "
                />
              </div>

              <div class="property-row full" v-if="obj.type === 'text'">
                <label>내용</label>
                <input
                  type="text"
                  :value="obj.content"
                  @input="updateTextObjectContent(obj, $event.target.value)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="drag-handle" @mousedown="startDrag"></div>

    <div
      class="content"
      @wheel="handleContentWheel"
      :style="{
        transformOrigin: '50% 50%',
        transform: `scale(${contentScale})`,
      }"
    >
      <header class="title-bar"></header>

      <main class="stage">
        <div class="screen-wrapper">
          <div
            class="screen"
            :style="{ overflow: clipToScreen ? 'hidden' : 'visible' }"
            @mousedown="
              (e) => {
                if (!e.target.closest('.world-object')) selectedObjectId = null;
              }
            "
          >
            <template v-if="showGrid">
              <div class="camera-grid"></div>
              <div class="camera-axis camera-axis-x"></div>
              <div class="camera-axis camera-axis-y"></div>
            </template>

            <div
              v-if="prevSceneObjects && prevSceneObjects.length > 0"
              class="world ghost-world ghost-layer"
              :style="prevWorldTransform"
              aria-hidden="true"
            >
              <div
                v-for="(pobj, pindex) in prevSceneObjects"
                :key="`prev-${pobj.id}`"
                class="world-object ghost-object"
                :style="{
                  left: pobj.x - pobj.width / 2 + 'px',
                  top: pobj.y - pobj.height / 2 + 'px',
                  transform: `rotate(${pobj.rotation}deg) scale(${pobj.scale})`,
                  zIndex: -10 - pindex,
                }"
              >
                <img
                  v-if="pobj.type === 'image'"
                  :src="pobj.src"
                  :style="{
                    width: pobj.width + 'px',
                    height: pobj.height + 'px',
                  }"
                  draggable="false"
                />
                <div
                  v-else
                  class="text-object"
                  :style="{
                    fontSize: pobj.fontSize + 'px',
                    width: pobj.width + 'px',
                    height: pobj.height + 'px',
                  }"
                >
                  {{ pobj.content }}
                </div>
              </div>
            </div>

            <div class="world" :style="worldTransform">
              <div class="world-screen-bg" aria-hidden="true"></div>

              <!-- 오브젝트 렌더링 -->
              <div
                v-for="(obj, index) in objects"
                :key="obj.id"
                class="world-object"
                :class="{ selected: selectedObjectId === obj.id }"
                :style="{
                  left: obj.x - obj.width / 2 + 'px',
                  top: obj.y - obj.height / 2 + 'px',
                  transform: `rotate(${obj.rotation}deg) scale(${obj.scale})`,
                  zIndex: objects.length - 1 - index,
                }"
                @mousedown="startObjectDrag($event, obj)"
                @dblclick="
                  (e) => {
                    if (obj.type !== 'text') return;
                    e.stopPropagation();
                    editTextObject(obj);
                  }
                "
              >
                <img
                  v-if="obj.type === 'image'"
                  :src="obj.src"
                  :style="{
                    width: obj.width + 'px',
                    height: obj.height + 'px',
                  }"
                  draggable="false"
                />
                <div
                  v-else
                  class="text-object"
                  :style="{
                    fontSize: obj.fontSize + 'px',
                    width: obj.width + 'px',
                    height: obj.height + 'px',
                  }"
                >
                  {{ obj.content }}
                </div>

                <!-- 선택된 오브젝트의 조작 핸들 -->
                <template v-if="selectedObjectId === obj.id">
                  <!-- 회전 핸들 -->
                  <div
                    class="rotate-handle"
                    @mousedown="startRotate($event, obj)"
                  >
                    <div class="rotate-dot"></div>
                    <div class="rotate-line"></div>
                  </div>

                  <!-- 리사이즈 핸들 -->
                  <div
                    class="resize-handle nw"
                    @mousedown="startResize($event, 'nw', obj)"
                  ></div>
                  <div
                    class="resize-handle ne"
                    @mousedown="startResize($event, 'ne', obj)"
                  ></div>
                  <div
                    class="resize-handle sw"
                    @mousedown="startResize($event, 'sw', obj)"
                  ></div>
                  <div
                    class="resize-handle se"
                    @mousedown="startResize($event, 'se', obj)"
                  ></div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <div class="drag-handle right" @mousedown="startScenesSidebarDrag"></div>

    <section
      class="scenes-sidebar"
      :class="{ collapsed: scenesSidebarWidth === 0 }"
      :style="{ width: scenesSidebarWidth + 'px' }"
    >
      <div class="scenes-panel">
        <div class="scenes-header">
          <div class="scenes-title">프레임</div>
          <button class="scene-add-btn" type="button" @click="addScene">
            + 추가
          </button>
        </div>
        <div class="scenes-list">
          <div
            v-for="scene in scenes"
            :key="scene.id"
            class="scene-item"
            :class="{ active: scene.id === activeSceneId }"
            @click="selectScene(scene.id)"
          >
            <input
              class="scene-name"
              type="text"
              v-model="scene.name"
              @click.stop
            />
            <button
              class="scene-delete-btn"
              type="button"
              :title="
                scenes.length <= 1
                  ? '마지막 프레임은 삭제할 수 없습니다'
                  : '프레임 삭제'
              "
              aria-label="프레임 삭제"
              :disabled="scenes.length <= 1"
              @click.stop="deleteScene(scene.id)"
            >
              ×
            </button>
          </div>
        </div>

        <div class="scenes-footer" aria-label="프로젝트 정보">
          <div class="scenes-footer-brand">
            <img
              class="scenes-footer-logo"
              src="/typohelpericon.svg"
              alt="사이트 로고"
              draggable="false"
            />
            <div class="scenes-footer-title">typoHelper</div>
          </div>
          <div class="scenes-footer-links">
            <a
              class="scenes-footer-link"
              href="https://github.com/kkreppass"
              target="_blank"
              rel="noopener noreferrer"
            >
              제작자 GitHub
            </a>
            <span class="scenes-footer-sep">•</span>
            <a
              class="scenes-footer-link"
              href="https://playentry.org/community/tips/697db740fcc2be1209a6bbba"
              target="_blank"
              rel="noopener noreferrer"
            >
              사용법
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
