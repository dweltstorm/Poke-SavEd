const { encode, decode } = require('./Utils/encoding.js')
const fs = require('fs')
const  { File, Section }  = require('./Classes/File.js')
test = new File('save.sav')
sec1 = test.getSection(0)

console.log(sec1.checkSum);
console.log(sec1.calculateCheckSum());