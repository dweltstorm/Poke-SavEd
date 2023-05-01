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

String.prototype.pad = function(length, fill) {
	return this.length > length ? String(this) : Array(length-this.length).fill(fill).concat(Array.from(this)).join('');
}

Buffer.prototype.chunks = function (chunkSize) {
	var result = [];
	var len = this.length;
	var i = 0;

	while (i < len) {
		result.push(this.slice(i, i += chunkSize));
	}

	return result;
}
Buffer.prototype.writeBytes = function (bytes, offset=0) {
	for(var i=0; i < bytes.length; i++) {
		this[i+offset] = bytes[i]
	}
}

class File {
  #path; #LatestSave; #SaveA; #SaveB;
  constructor(path) {
    this.#path = path
    this.bytes = fs.readFileSync(path);
    this.SaveA = new SaveFile(this.bytes.subarray(0, 57344)); this.SaveB = new SaveFile(this.bytes.subarray(57344, 114688));
    if (this.SaveB.saveIndex == 1) {
    	this.LatestSave = this.SaveB;
    } else if (this.SaveA.saveIndex > this.SaveB.saveIndex) {
    	this.LatestSave = this.SaveA
    } else if (this.SaveA.saveIndex < this.SaveB.saveIndex) {
    	this.LatestSave = this.SaveB;
    } else {
    	this.LatestSave = this.SaveB;
    }
  }

  get TRAINER_INFO() {
  	this.LatestSave.TRAINER_INFO.calculateCheckSum();
    return this.LatestSave.TRAINER_INFO;
  }

  save_to_file() {
  	fs.writeFileSync(this.#path, Buffer.concat([this.SaveA.data, this.SaveB.data]))
  	return fs.readFileSync(this.#path)
  }
  
}


class SaveFile {
  constructor(buf) {
    this.buf = buf;
    this.saveIndex = this.buf.subarray(-4, this.buf.length).readUint32LE()
    this.sections = this.buf.chunks(4096).shiftDown(this.saveIndex % 14).map((x, i) => new types[i](x))
  }
  
  get TRAINER_INFO() {
  	return this.sections[0];
  }
  
  get data() {
  	return Buffer.concat(this.sections.map(x => {
  		return Buffer.concat([x.data, x.sectionId, x.checkSum, x.signature, x.saveIndex]);
  	}));
  }
}

class Section {
  constructor(buf) {
    this.data = buf.subarray(0, 3968);
    this.sectionId = buf.subarray(0x0FF4, 0x0FF6)
    this.checkSum = this.calculateCheckSum();
    this.signature = buf.subarray(0x0FF8, 0x0FFC)
    this.saveIndex = buf.subarray(0x0FFC, 0x1000)
  }

  calculateCheckSum() {
    let sum = 0;
    let data = Buffer.concat(Object.keys(this).map(x => this[x]))
    for (let i = 0; i < this.data.length; i += 4) {
      sum += this.data.readUint32LE(i);
    }
    sum = ((sum >>> 16) + (sum & 0xffff)) & 0xffff;
    let buf = Buffer.alloc(2); buf.writeUint16LE(sum)
    return buf
  }
}

class TRAINER_INFO extends Section {
  constructor(section) {
    super(section)
  }

  get playerName() {
    return decode(this.data.subarray(0x00, 0x07));
  }

  set playerName(name) {
    this.data.writeBytes(encode(name))
  }
  
  get playerGender() {
  	return this.data[7] == 0 ? 'M' : 'F' 
  }
  
  set playerGender(gender) {
  	gender == 'M' ? this.data[7] = 0 : this.data[7] = 1
  }
  
  get trainerId() {
  	return this.data.readUint32LE(0x0A)
  }
  
  set trainerId(newid) {
  	this.data.writeUint32LE(0x0A)
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