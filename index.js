const { encode, decode } = require('./Utils/encoding.js')
const fs = require('fs')
const  { File, Section }  = require('./Classes/File.js')
test = new File('save.sav')


console.log(encode())