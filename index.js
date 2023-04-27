const { encode, decode } = require('./Utils/encoding.js')
const fs = require('fs')
const  { File, Section, TRAINER_INFO }  = require('./Classes/File.js')
test = new File('save2.sav')

/* var info = new TRAINER_INFO(test.getSection(0));
info.playerName = "Mia"; info.playerGender = "F"; */
console.log(test.sections[1]);