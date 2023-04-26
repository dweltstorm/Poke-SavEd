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
    this.sections = this.buf.chunks(4096).shiftDown(this.saveIndex % 14)
  }

  getSection(id) {
    return new Section(this.sections[id])
  }

}

class Section {
  constructor(buf) {
    this.buf = buf;
    this.data = this.buf.subarray(0, 3968);
    this.sectionId = this.buf.subarray(0x0FF4, 0x0FF8)
    this.checkSum = this.buf.subarray(0x0FF6, 0x0FF8)
    this.signature = this.buf.subarray(0x0FF8, 0x0FFC)
    this.saveIndex = this.buf.subarray(0x0FFC, 0x1000)
  }

  calculateCheckSum() {
    let sum = 0;
    for (let i = 0; i < this.data.length; i += 4) {
      sum += this.data.readUint32LE(i);
    }
    
    sum = (sum >>> 16) + (sum & 0xffff);
    sum = (sum + (sum >>> 16)) & 0xffff;
    let buf = Buffer.alloc(2); buf.writeUInt16LE(sum)
    return buf;
  }
}

function readUInt32LittleEndian(buffer) {
  return (buffer[0] |
    (buffer[1] << 8) |
    (buffer[2] << 16) |
    (buffer[3] << 24)) >>> 0;
}