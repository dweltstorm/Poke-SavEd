const fs = require('fs');
const { encode, decode } = require('../Utils/encoding.js')

Array.prototype.shiftDown = function(num) {
  var newArr = this.slice();
  for (var i = this.length - 1; i >= 0; i--) {
    if (i - num >= 0) {
      newArr[i - num] = this[i];
    } else {
      newArr[i - num + this.length] = this[i];
    }
  }
  return newArr;
};

Array.prototype.shiftUp = function(num) {
  var newArr = this.slice();
  for (var i = 0; i < this.length; i++) {
    if (i + num < this.length) {
      newArr[i + num] = this[i];
    } else {
      newArr[i + num - this.length] = this[i];
    }
  }
  return newArr;
};


Buffer.prototype.chunks = function (chunkSize) {
	var result = [];
	var len = this.length;
	var i = 0;

	while (i < len) {
		result.push(this.slice(i, i += chunkSize));
	}

	return result;
}

class File {
  #path;
  constructor(path) {
    this.#path = path
    this.bytes = fs.readFileSync(path);
    this.SaveA = new SaveFile(this.bytes.subarray(0, 57344)); this.SaveB = new SaveFile(this.bytes.subarray(57344, 114688));
    this.LatestSave = this.SaveA.saveIndex > this.SaveB.saveIndex ? this.SaveA : this.SaveB
  }

  get TRAINER_INFO() {
    return this.LatestSave.TRAINER_INFO;
  }

  save_to_file() {
  	fs.writeFileSync('Pokemon - Emerald Version (USA, Europe).sav', Buffer.concat([this.SaveA.data, this.SaveB.data]))
  }
  
}


class SaveFile {
  constructor(buf) {
    this.buf = buf;
    this.saveIndex = this.buf.subarray(-4, this.buf.length).readUint32LE()
    this.sections = this.buf.chunks(4096).shiftDown(this.saveIndex % 14).map((x, i) => new types[i](x))
  }
  
  get TRAINER_INFO() {
  	this.sections[0].update();
  	return this.sections[0];
  }
  
  get data() {
  	return Buffer.concat(this.sections.map(x => {
  		return x.total;
  	}).shiftUp(this.saveIndex % 14));
  }
}

class Section {
  constructor(buf) {
    this.data = buf.subarray(0, 3968);
    this.sectionId = buf.subarray(0x0FF4, 0x0FF6)
    this.checkSum = buf.subarray(0x0FF6, 0x0FF8)
    this.signature = buf.subarray(0x0FF8, 0x0FFC)
    this.saveIndex = buf.subarray(0x0FFC, 0x1000)
  }

  calculateCheckSum() {
    let sum = 0;
    for (let i = 0; i < this.data.length; i += 4) {
      sum += this.data.readUint32LE(i);
    }
    sum = ((sum >>> 16) + (sum & 0xffff)) & 0xffff;
    let buf = Buffer.alloc(2); buf.writeUint16LE(sum)
    return buf;
  }

  update() {
    let data = Buffer.concat(Object.keys(this).slice(5).map(x => this[x]))
    this.data = Buffer.concat([data, this.data.subarray(data.length, this.data.length)])
    this.checkSum = this.calculateCheckSum();
  }
  
  get total() {
  	this.update();
    let pad = Buffer.alloc(4096 - (this.data.length + this.sectionId.length + this.checkSum.length + this.signature.length + this.saveIndex.length)).fill(0);
    var items = Object.keys(this).slice(0, 5).map(x => this[x]); items.splice(1, 0, pad);
  	return Buffer.concat(items);
  }
}

class TRAINER_INFO extends Section {
  constructor(section) {
    super(section)
    this._playerName = this.data.subarray(0x0000, 0x0007);
    this._playerGender = this.data.subarray(0x0008, 0x0009);
  }

  get playerName() {
    return decode(this._playerName);
  }

  set playerName(name) {
    this._playerName = encode(name);

  }

  get playerGender() {
    return this._playerGender.readUint8() == 0 ?  'M' :  'F'
  }

  set playerGender(gender) {
    if (gender == 'M') {
      this._playerGender = Buffer.from([0x00]);
    } else if (gender == 'F') {
      this._playerGender = Buffer.from([0x01]);
    }
  }
}

const types = {
  0: TRAINER_INFO,
  1: Section,
  2: Section,
  3: Section,
  4: Section,
  5: Section,
  6: Section,
  7: Section,
  8: Section,
  9: Section,
  10: Section,
  11: Section,
  12: Section,
  13: Section,
}
module.exports = { File };