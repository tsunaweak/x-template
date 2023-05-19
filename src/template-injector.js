const fs = require("fs");
const Path = require("path");
const cheerio = require("cheerio");

// var templateInjectorRegex = /<x-((?:.|\r?\n)+?)\/>(?![^<!--].*?-->)/g;

const { removeHTMLComments, addHTMLComments } = require("./comment");
const mustache = require("./mustache");

var templateInjectorRegex = /<x-.[\s\S]*?(\/>|<\/x)/g;

/**
 * (?:^|[^<x-])[\s\S]*?(?:\/>|<\/x[\s\S]*?)
 *
 */
//var htmlCommentsRegex = /<!--[\s\S]*?-->/g;

//var incompletePatterh = /<x-.*?\/>(?![^<!--].*-->)/g;

var classInjectorRegex = /x-class=["']([^"']+)["']/;
var dataInjectorRegex = /x-data=['"]\{([^}]*)\}['"]/;

var defaultData = {
  "btn-label": "Button",
  "card-title": "Card Title",
};

var data = {};
var classList = "";

function isObjectEmpty(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

function extractClass(element) {
  let match = element.match(classInjectorRegex);
  let cList = match ? match[1] : "";
  if (cList.length > 0) {
    element = element.replace(match[0], "").trim();
    classList += cList;
  }
  classInjectorRegex.lastIndex = 0;
  return element;
}
function extractData(element) {
  let dataMatch = element.match(dataInjectorRegex);
  let dataList = dataMatch ? dataMatch[1] : "";
  if (dataList.length > 0) {
    element = element.replace(dataMatch[0], "").trim();
    const normalizedValue = dataList
      .replace(/(['"])?([a-zA-Z0-9_-]+)(['"])?:/g, '"$2":')
      .replace(/'/g, '"');
    if (isObjectEmpty(data)) {
      Object.assign(data, defaultData, JSON.parse(`{${normalizedValue}}`));
    }
  }

  dataInjectorRegex.lastIndex = 0;
  return element;
}

function readTemplateFile(e) {
  return fs.readFileSync(
    Path.join(process.env.xviews, `${e.replaceAll("-", "/")}.x`),
    "utf8"
  );
}

function main(template) {
  template = removeHTMLComments(template);
  template = template.replace(templateInjectorRegex, (element) => {
    templateInjectorRegex.lastIndex = 0;
    if (element.includes("<x-template-comment")) {
      return element;
    }
    element = element.slice(3, -2).trim();
    element = extractClass(element);
    element = extractData(element);
    element = readTemplateFile(element);

    element = main(element);
    element = mustache(element, isObjectEmpty(data) ? defaultData : data);
    const $ = cheerio.load(element);
    const classElement = $($("html > body > *")[0]);
    classElement.addClass(classList);
    classList = "";
    data = {};
    return $("body").html();
  });
  template = addHTMLComments(template);
  return template;
}

module.exports = (template) => {
  template = main(template);
  return template;
};
