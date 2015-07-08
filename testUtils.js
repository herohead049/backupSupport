var util = require('../backupSupport/lib/cdutils.js');

var c = util.chalk;

util.writeConsole(c.disabled,'Cool process','here is the data');

//util.writeFile('file.txt' , 'here is the data');
//util.appendFile('file.txt' , 'here is the data');
util.unlink('file.txt');
