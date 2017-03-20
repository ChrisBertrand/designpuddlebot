'use strict';
var fs = require('fs')

fs.createReadStream('bot.sample-env').pipe(fs.createWriteStream('.env'));