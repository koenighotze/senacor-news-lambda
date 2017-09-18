'use strict';

const Fs = require('fs');
module.exports = {
    homePage: Fs.readFileSync(__dirname + '/new_homepage.html', 'utf8')
};
