const fs = require('fs')
const Path = require('path');

const mustache = require('./src/mustache');
const templateInjector = require('./src/template-injector');
const statement = require('./src/statement');
var template = '';


function exTemplate(template, data){
    template = statement(template, data);
     // template = templateInjector(template);
            // template = mustache(template, data);
    return template;
}


function index(req, res, next){
    if(req === undefined) return;
    process.env.xviews = req.app.get('views') || 'views';
    res.render = (tmpl, data = {}) => {
        try {
            const filePath = Path.join(process.env.xviews, `${tmpl}.x`);
            template = fs.readFileSync(filePath, 'utf8');
            template = statement(template, data);
            template = exTemplate(template);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(template); 
        } catch (err) {
          next(err);
        }
    };
    
    next();
}




module.exports = index


