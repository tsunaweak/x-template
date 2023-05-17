const fs = require("fs");
const Path = require("path");
const cheerio = require("cheerio");


// var templateInjectorRegex = /<x-((?:.|\r?\n)+?)\/>(?![^<!--].*?-->)/g;

const { removeHTMLComments, addHTMLComments }  = require('./comment');
const mustache = require("./mustache");

var templateInjectorRegex = /<x-.*?\/>/g;
var htmlCommentsRegex = /<!--[\s\S]*?-->/g;


var defaultData = {
  'btn-label': 'Button',
  'card-label': 'card-label'
}




//var incompletePatterh = /<x-.*?\/>(?![^<!--].*-->)/g;



var classInjectorRegex = /x-class=['|"](.*)['|"]/;
var dataInjectorRegex = /x-data=['|"](.*)['|"]/;


module.exports = (template) => {
  template = removeHTMLComments(template);
  template = template.replace(
    templateInjectorRegex,
    (element) => {
      if(element.includes('<x-template-comment')) 
      {
        return element;
      }
      if (/^<x-.*\/>$/.test(element)) {
        element = element.slice(3, -2).trim();
        let classMatch = element.match(classInjectorRegex);
        let classList = classMatch ? classMatch[1] : "";
        if (classList.length > 0) {
          element = element.replace(classMatch[0], "").trim();
        }

        let dataMatch  = element.match(dataInjectorRegex);
        let dataList = dataMatch  ? dataMatch[1] : "";
        
        let data = {};
        if (dataList.length > 0) {
          element = element.replace(dataMatch[0], "").trim();
          //it need's the string to be normalize
          // from { label: "Sign up" } to { "label": "Sign up" }
          // the { label: "Sign up" } cannot be parsed as JSON if not normalized
          const normalizedValue = dataList.replace(/(['"])?([a-zA-Z0-9_-]+)(['"])?:/g, '"$2":').replace(/'/g, '\"');
          Object.assign(data, defaultData, JSON.parse(normalizedValue));

        }else{
          data = defaultData;
        }
 
        let content = fs.readFileSync(
          Path.join(process.env.xviews, `${element.replaceAll("-", "/")}.x`),
          "utf8"
        );


        if(dataList.length > 0){
          content = mustache(content, data);
        }
       




        const $ = cheerio.load(content);
        const classElement = $($("html > body > *")[0]);
        classElement.addClass(classList);
        return $("body").html();
      }
    }
  );
  template = addHTMLComments(template);
  templateInjectorRegex.lastIndex = 0;
  return template;
};
