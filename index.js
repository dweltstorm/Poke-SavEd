const { encode, decode } = require('./Utils/encoding.js')
const fs = require('fs')
const  { File, TRAINER_INFO }  = require('./Classes/File.js')
test = new File('Pokemon - Emerald Version (USA, Europe).sav')

Buffer.prototype.chunks = function (chunkSize) {
	var result = [];
	var len = this.length;
	var i = 0;

	while (i < len) {
		result.push(this.slice(i, i += chunkSize));
	}

	return result;
}
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

test.TRAINER_INFO.playerName = 'l';
console.log(test.TRAINER_INFO)