const fs = require("fs");
const Path = require("path");
const cheerio = require("cheerio");

var templateInjectorRegex = /<x-((?:.|\r?\n)+?)\/>(?![^<!--].*?-->)/g;

var templateInjectorRegex = /<x-.*?\/>(?![^<!--].*-->)/g;
var htmlCommentsRegex = /<!--[\s\S]*?-->/g;


//var incompletePatterh = /<x-.*?\/>(?![^<!--].*-->)/g;



var classInjectorRegex = /x-class="([^"]*)"/;

module.exports = (template, data) => {
  template = template.replace(
    templateInjectorRegex,
    (element) => {
      if (/^<x-.*\/>$/.test(element)) {
        element = element.slice(3, -2).trim();
        let match = element.match(classInjectorRegex);
        let classList = match ? match[1] : "";
        if (classList.length > 0) {
          element = element.replace(match[0], "").trim();
        }
        let content = fs.readFileSync(
          Path.join(process.env.xviews, `${element.replaceAll("-", "/")}.x`),
          "utf8"
        );
        const $ = cheerio.load(content);
        const classElement = $($("html > body > *")[0]);
        classElement.addClass(classList);
        return $("body").html();
      }
    }
  );
  return template;
};
