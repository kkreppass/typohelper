// @ts-check

import Tar from "tar-js";

/** @typedef {{ id: string; name: string; objects: Obj[] }} Scene */
/** @typedef {{ name: string; x: number; y: number; width: number; height: number; scale: number; rotation: number }} BaseObj */
/** @typedef {BaseObj & { raw: Uint8Array; type: "image" }} ImageObj */
/** @typedef {BaseObj & { content: string; type: "text"; fontSize: number }} TextObj */
/** @typedef {ImageObj | TextObj} Obj */
/** @typedef {{ path: string; data: Uint8Array }} Asset */
/** @typedef {{ x: number; y: number; rotation: number; scale: number }} Camera */

/**
 * @template T
 * @param {T} data
 */
const entryVariable = data => ({
  id: Math.random().toString(36).substring(2, 6),
  visible: false,
  value: 0,
  variableType: "variable",
  isCloud: false,
  isRealTime: false,
  cloudDate: false,
  object: null,
  ...data,
});

/** @type {Set<string>} */
const hashTable = new Set;
const hashString = "0123456789abcdefghijklmnopqrstuvwxyz";

/**
 * @param {number} length
 */
function generateHash(length) {
  for (;;) {
    const hash = [...crypto.getRandomValues(new Uint8Array(length))].map(v => hashString[v % hashString.length]).join("");
    if (hashTable.has(hash)) continue;
    hashTable.add(hash);
    return hash;
  }
}

const funcId = "iw8f";

/**
 * @param {string} id
 * @param {"x" | "y" | "rotation" | "direction" | "size" | "picture_index" | "picture_name"} coord
 */
const coordObj = (id, coord) => ({
  type: "coordinate_object",
  params: [null, id, null, coord],
});

/**
 * @param {Camera} cam
 */
const getProjectJsonTemplate = cam => ({
  aiUtilizeBlocks: [],
  expansionBlocks: [],
  externalModules: [],
  externalModulesLite: [],
  hardwareLiteBlocks: [],
  interface: { canvasWidth: 264, object: "7y0y" },
  messages: [],
  speed: 60,
  tables: [],
  /** @type {unknown[]} */
  objects: [],
  /** @type {unknown[]} */
  scenes: [],
  variables: [
    // 병합 시 편의를 위해, 피시 작품에 쓰이는 카메라 코드의 변수 id를 그대로 가져왔습니다.
    // 다른 id는 작품에 적용 시 자연스러운 병합이 되지 않을 수 있습니다.
    entryVariable({ name: "cameraX", id: "oc4x", value: cam.x }),
    entryVariable({ name: "cameraY", id: "3o6u", value: cam.y }),
    entryVariable({ name: "rotation", id: "srni", value: cam.rotation }),
    entryVariable({ name: "scale", id: "ue9z", value: cam.scale }),
  ],
  functions: [
    // 병합 시 편의를 위해, 피시 카메라 함수를 그대로 가져왔습니다.
    {
      id: funcId,
      type: "normal",
      localVariables: [],
      useLocalVariables: false,
      content: "[[{\"id\":\"2zq7\",\"x\":50,\"y\":30,\"type\":\"function_create\",\"params\":[{\"id\":\"2d23\",\"x\":0,\"y\":0,\"type\":\"function_field_label\",\"params\":[\"theta\",{\"id\":\"hfj4\",\"x\":0,\"y\":0,\"type\":\"function_field_string\",\"params\":[{\"id\":\"1m4g\",\"x\":0,\"y\":0,\"type\":\"stringParam_fpd9\",\"params\":[],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},{\"id\":\"f80e\",\"x\":0,\"y\":0,\"type\":\"function_field_label\",\"params\":[\"x\",{\"id\":\"6rfb\",\"x\":0,\"y\":0,\"type\":\"function_field_string\",\"params\":[{\"id\":\"kkj4\",\"x\":0,\"y\":0,\"type\":\"stringParam_pncn\",\"params\":[],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},{\"id\":\"dch6\",\"x\":0,\"y\":0,\"type\":\"function_field_label\",\"params\":[\"y\",{\"id\":\"dh3o\",\"x\":0,\"y\":0,\"type\":\"function_field_string\",\"params\":[{\"id\":\"09vd\",\"x\":0,\"y\":0,\"type\":\"stringParam_gf2e\",\"params\":[],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},{\"id\":\"cpcu\",\"x\":0,\"y\":0,\"type\":\"function_field_label\",\"params\":[\"scale\",{\"id\":\"a29s\",\"x\":0,\"y\":0,\"type\":\"function_field_string\",\"params\":[{\"id\":\"ic1m\",\"x\":0,\"y\":0,\"type\":\"stringParam_dnc1\",\"params\":[],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},null],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":false,\"assemble\":true,\"extensions\":[]}],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":false,\"assemble\":true,\"extensions\":[]}],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":false,\"assemble\":true,\"extensions\":[]}],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":false,\"assemble\":true,\"extensions\":[]}],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":false,\"assemble\":true,\"extensions\":[]}],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":false,\"assemble\":true,\"extensions\":[]}],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":false,\"assemble\":true,\"extensions\":[]}],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":false,\"assemble\":true,\"extensions\":[]},null],\"statements\":[[{\"id\":\"792w\",\"x\":0,\"y\":0,\"type\":\"locate_xy\",\"params\":[{\"id\":\"pqet\",\"x\":0,\"y\":0,\"type\":\"calc_basic\",\"params\":[{\"id\":\"5arp\",\"x\":0,\"y\":0,\"type\":\"calc_basic\",\"params\":[{\"id\":\"88hq\",\"x\":0,\"y\":0,\"type\":\"calc_basic\",\"params\":[{\"id\":\"o3zv\",\"x\":0,\"y\":0,\"type\":\"calc_operation\",\"params\":[null,{\"id\":\"fxfu\",\"x\":0,\"y\":0,\"type\":\"get_variable\",\"params\":[\"srni\",null],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},null,\"cos\"],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},\"MULTI\",{\"id\":\"ki1t\",\"x\":0,\"y\":0,\"type\":\"calc_basic\",\"params\":[{\"id\":\"8f7w\",\"x\":0,\"y\":0,\"type\":\"stringParam_pncn\",\"params\":[],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},\"MINUS\",{\"id\":\"4qs4\",\"x\":0,\"y\":0,\"type\":\"get_variable\",\"params\":[\"oc4x\",null],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]}],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]}],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},\"MINUS\",{\"id\":\"hfyz\",\"x\":0,\"y\":0,\"type\":\"calc_basic\",\"params\":[{\"id\":\"ysnn\",\"x\":0,\"y\":0,\"type\":\"calc_operation\",\"params\":[null,{\"id\":\"zhhn\",\"x\":0,\"y\":0,\"type\":\"get_variable\",\"params\":[\"srni\",null],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},null,\"sin\"],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},\"MULTI\",{\"id\":\"yhsm\",\"x\":0,\"y\":0,\"type\":\"calc_basic\",\"params\":[{\"id\":\"54ku\",\"x\":0,\"y\":0,\"type\":\"stringParam_gf2e\",\"params\":[],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},\"MINUS\",{\"id\":\"ewuk\",\"x\":0,\"y\":0,\"type\":\"get_variable\",\"params\":[\"3o6u\",null],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]}],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]}],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]}],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},\"MULTI\",{\"id\":\"ey3f\",\"x\":0,\"y\":0,\"type\":\"get_variable\",\"params\":[\"ue9z\",null],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]}],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},{\"id\":\"1mt0\",\"x\":0,\"y\":0,\"type\":\"calc_basic\",\"params\":[{\"id\":\"oo41\",\"x\":0,\"y\":0,\"type\":\"calc_basic\",\"params\":[{\"id\":\"o9z0\",\"x\":0,\"y\":0,\"type\":\"calc_basic\",\"params\":[{\"id\":\"n495\",\"x\":0,\"y\":0,\"type\":\"calc_operation\",\"params\":[null,{\"id\":\"bzgf\",\"x\":0,\"y\":0,\"type\":\"get_variable\",\"params\":[\"srni\",null],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},null,\"sin\"],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},\"MULTI\",{\"id\":\"znpb\",\"x\":0,\"y\":0,\"type\":\"calc_basic\",\"params\":[{\"id\":\"jttv\",\"x\":0,\"y\":0,\"type\":\"stringParam_pncn\",\"params\":[],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},\"MINUS\",{\"id\":\"rz6s\",\"x\":0,\"y\":0,\"type\":\"get_variable\",\"params\":[\"oc4x\",null],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]}],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]}],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},\"PLUS\",{\"id\":\"4nb1\",\"x\":0,\"y\":0,\"type\":\"calc_basic\",\"params\":[{\"id\":\"8r8a\",\"x\":0,\"y\":0,\"type\":\"calc_operation\",\"params\":[null,{\"id\":\"wiqf\",\"x\":0,\"y\":0,\"type\":\"get_variable\",\"params\":[\"srni\",null],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},null,\"cos\"],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},\"MULTI\",{\"id\":\"2yew\",\"x\":0,\"y\":0,\"type\":\"calc_basic\",\"params\":[{\"id\":\"dwsp\",\"x\":0,\"y\":0,\"type\":\"stringParam_gf2e\",\"params\":[],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},\"MINUS\",{\"id\":\"z8hq\",\"x\":0,\"y\":0,\"type\":\"get_variable\",\"params\":[\"3o6u\",null],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]}],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]}],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]}],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},\"MULTI\",{\"id\":\"13hs\",\"x\":0,\"y\":0,\"type\":\"get_variable\",\"params\":[\"ue9z\",null],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]}],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},null],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},{\"id\":\"dvy0\",\"x\":0,\"y\":0,\"type\":\"rotate_absolute\",\"params\":[{\"id\":\"tstt\",\"x\":0,\"y\":0,\"type\":\"calc_basic\",\"params\":[{\"id\":\"zexz\",\"x\":0,\"y\":0,\"type\":\"stringParam_fpd9\",\"params\":[],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},\"MINUS\",{\"id\":\"n0ek\",\"x\":0,\"y\":0,\"type\":\"get_variable\",\"params\":[\"srni\",null],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]}],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},null],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},{\"id\":\"z80h\",\"x\":0,\"y\":0,\"type\":\"set_scale_size\",\"params\":[{\"id\":\"anzy\",\"x\":0,\"y\":0,\"type\":\"calc_basic\",\"params\":[{\"id\":\"1bhc\",\"x\":0,\"y\":0,\"type\":\"stringParam_dnc1\",\"params\":[],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},\"MULTI\",{\"id\":\"y7yn\",\"x\":0,\"y\":0,\"type\":\"get_variable\",\"params\":[\"ue9z\",null],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]}],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]},null],\"statements\":[],\"movable\":null,\"deletable\":1,\"emphasized\":false,\"readOnly\":null,\"copyable\":true,\"assemble\":true,\"extensions\":[]}]],\"movable\":null,\"deletable\":false,\"emphasized\":false,\"readOnly\":null,\"copyable\":false,\"assemble\":true,\"extensions\":[]}]]",
    },
  ],
});

/**
 * @param {Obj} obj
 * @param {string} scene
 * @param {boolean} [isLast]
 */
const getBaseObjectData = (obj, scene, isLast) => {
  const id = generateHash(4);

  return {
    id,
    name: obj.name,
    scene,
    lock: false,
    rotateMethod: "free",
    script: JSON.stringify([isLast ? [
      { type: "when_run_button_click" },
      { type: "start_scene", params: [scene] },
    ] : [], [
      { type: "when_scene_start" },
      { type: "create_clone", params: ["self"] },
    ], [
      { type: "when_clone_start" },
      { type: "show" },
      { type: "repeat_inf", statements: [[
        { type: `func_${funcId}`, params: [
          coordObj(id, "rotation"),
          coordObj(id, "x"),
          coordObj(id, "y"),
          coordObj(id, "size"),
        ] },
      ]] },
    ]].filter(v => v.length > 0)),
  };
};

/**
 * @param {Obj} obj
 */
const getBaseEntityData = obj => ({
  x: obj.x,
  y: -obj.y,
  regX: obj.width / 2,
  regY: obj.height / 2,
  scaleX: obj.scale,
  scaleY: obj.scale,
  rotation: obj.rotation,
  direction: 90,
  width: obj.width,
  height: obj.height,
  visible: false,
});

const getBaseSpriteData = () => ({
  sounds: [],
});

/**
 * @param {TextObj} obj
 * @param {string} scene
 * @param {boolean} [isLast]
 */
const getTextObjectData = (obj, scene, isLast) => ({
  ...getBaseObjectData(obj, scene, isLast),
  objectType: "textBox",
  text: obj.content,
  entity: {
    ...getBaseEntityData(obj),
    font: `${obj.fontSize}px Inter,Pretendard,system-ui,-apple-system,sans-serif`,
    colour: "#2c313d",
    bgColor: "#fff",
  },
  sprite: {
    ...getBaseSpriteData(),
    pictures: [],
  },
});

const dataSymbol = Symbol("fileData");
const imageType = "png";

/**
 * @param {ImageObj} obj
 * @param {string} scene
 * @param {boolean} [isLast]
 */
const getImageObjectData = (obj, scene, isLast) => {
  const pictureId = generateHash(4);
  const pictureFileName = generateHash(32);
  const pictureFileUrl = getAssetPath(pictureFileName, imageType);

  return {
    ...getBaseObjectData(obj, scene, isLast),
    objectType: "sprite",
    entity: {
      ...getBaseEntityData(obj),
      font: "undefinedpx ",
    },
    selectedPictureId: pictureId,
    sprite: {
      ...getBaseSpriteData(),
      pictures: [{
        id: pictureId,
        name: obj.name,
        filename: pictureFileName,
        fileurl: pictureFileUrl,
        thumbUrl: pictureFileUrl,
        imageType,
        dimension: {
          width: Math.round(obj.width),
          height: Math.round(obj.height),
        },
        [dataSymbol]: obj.raw,
      }],
    },
  };
};

/**
 * @param {Obj} obj
 * @param {string} sceneId
 * @param {boolean} [isLast]
 */
const getObjectData = (obj, sceneId, isLast) => {
  if (obj.type == "text") return getTextObjectData(obj, sceneId, isLast);
  return getImageObjectData(obj, sceneId, isLast);
};

/**
 * @param {string} filename
 * @param {string} imageType
 */
const getAssetPath = (filename, imageType) =>
  `temp/${filename.substring(0, 2)}/${filename.substring(2, 4)}/image/${filename}.${imageType}`;

/**
 * @param {Scene[]} scenes
 * @param {Camera} camera
 */
const createProjectJson = (scenes, camera) => {
  const project = getProjectJsonTemplate(camera);

  /** @type {Asset[]} */
  const assets = [];

  for (const scene of scenes) {
    const sceneId = generateHash(4);
    project.scenes.push({
      id: sceneId,
      name: scene.name,
    });

    scene.objects.forEach((obj, i) => {
      const isLast = i == scene.objects.length - 1;
      const objectData = getObjectData(obj, sceneId, isLast);
      project.objects.push(objectData);

      for (const asset of objectData.sprite.pictures) {
        assets.push({
          path: asset.fileurl,
          data: asset[dataSymbol],
        });
      }
    });
  }

  return { project, assets };
};

const encoder = new TextEncoder;

/**
 * @param {Scene[]} scenes
 * @param {Camera} camera
 */
export const scenesToProject = (scenes, camera) => {
  const { project, assets } = createProjectJson(scenes, camera);
  const json = JSON.stringify(project);
  const buf = encoder.encode(json);

  const tar = new Tar;
  tar.append("temp/project.json", buf);

  for (const asset of assets) {
    tar.append(asset.path, asset.data);
  }

  return tar.out;
};
