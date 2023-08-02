const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const isObject = (item) => {
  return (item && typeof item === 'object' && !Array.isArray(item));
}
const mergeDeep = (target, ...sources) => {
  if (!sources.length) return target;
  const source = sources.shift();
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, {
          [key]: {}
        });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, {
          [key]: source[key]
        });
      }
    }
  }
  return mergeDeep(target, ...sources);
}

function parseDataFile(filePath, defaults) {
  try {
    let stored = JSON.parse(fs.readFileSync(filePath));
    let tmp = {};
    mergeDeep(tmp, defaults);
    mergeDeep(tmp, stored);
    return tmp;
  } catch (error) {
    return defaults;
  }
}

function setDescendantProp(obj, desc, value) {
  if (typeof desc == 'string') return setDescendantProp(obj, desc.split('.'), value);
  else if (desc.length == 1 && value !== undefined) return obj[desc[0]] = value;
  else if (desc.length == 0) return obj;
  else return setDescendantProp(obj[desc[0]], desc.slice(1), value);
}
class store {
  constructor(opts) {
    const userDataPath = app.getPath('userData');
    this.path = path.join(userDataPath, `${opts.configName}.json`);
    if (fs.existsSync(this.path)) {
      this.data = parseDataFile(this.path, opts.defaults);
    } else {
      fs.closeSync(fs.openSync(this.path, 'w'));
      this.data = opts.defaults;
    }
  }
  getFilePath() {
    return this.path;
  }
  get(key) {
    return this.data[key];
  }
  set(key, val) {
    setDescendantProp(this.data, key, val);
    fs.writeFile(this.path, JSON.stringify(this.data, null, 4), () => {});
  }
}
module.exports = store;