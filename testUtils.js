var util = require('../backupSupport/lib/cdutils.js');

var c = util.chalk;

var writeConsole = util.writeConsole;
var unlink = util.unlink;

writeConsole(c.success,'Cool process','here is the data');

//util.writeFile('file.txt' , 'here is the data');
//util.appendFile('file.txt' , 'here is the data');
//unlink('file.txt');
