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

Buffer.prototype.chunks = function (chunkSize) {
	var result = [];
	var len = this.length;
	var i = 0;

	while (i < len) {
		result.push(this.slice(i, i += chunkSize));
	}

	return result;
}

exports.File = class {
  constructor(path) {
    this.bytes = fs.readFileSync(path);
    return this.Save;
  }
  get Save() {
    const A = this.bytes.subarray(0, 57344); const B = this.bytes.subarray(57344, 114688);
    return A.subarray(-4, A.length) > B.subarray(-4, B.length) ? new SaveFile(A) : new SaveFile(B)
  }

}


class SaveFile {
  constructor(buf) {
    this.buf = buf;
    this.saveIndex = this.buf.subarray(-4, this.buf.length).readUint32LE()
    this.sections = this.buf.chunks(4096).shiftDown(this.saveIndex % 14).map((x, i) => new types[i](x))
  }


  getSection(id) {
    return this.sections[id];
  }

}

class Section {
  constructor(buf) {
    this.data = buf.subarray(0, 3968);
    this.sectionId = buf.subarray(0x0FF4, 0x0FF8)
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
}

exports.TRAINER_INFO = class extends Section {
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
    return this._playerGender == 0x01 ?  'M' :  'F'
  }

  set playerGender(gender) {
    if (gender == 'M') {
      this._playerGender = Buffer.from([0x01]);
    } else if (gender == 'F') {
      this._playerGender = Buffer.from([0x00]);
    }
  }
}

const types = {
  0: exports.TRAINER_INFO,
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