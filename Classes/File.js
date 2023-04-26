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
  }
  get Save() {
    const A = this.bytes.subarray(0, 57344); const B = this.bytes.subarray(57344, 114688);
    return A.subarray(-4, A.length) > B.subarray(-4, B.length) ? new SaveFile(A) : new SaveFile(B)
  }

  getSection(id) {
    return new Section(this.Save.sections[id])
  }

  get TRAINER_INFO() {
    return new TRAINER_INFO(this.getSection(0))
  }
}

class SaveFile {
  constructor(buf) {
    this.buf = buf;
    this.saveIndex = this.buf.subarray(-4, this.buf.length).readUint32LE()
    this.sections = this.buf.chunks(4096).shiftDown(this.saveIndex % 14)
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
}


