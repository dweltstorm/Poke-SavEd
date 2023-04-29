const { encode, decode } = require('./Utils/encoding.js')
const fs = require('fs')
const  { File, TRAINER_INFO }  = require('./Classes/File.js')
test = new File('save2.sav')


test.LatestSave.TRAINER_INFO.playerName = 'mia';
console.log(test.save_to_file())