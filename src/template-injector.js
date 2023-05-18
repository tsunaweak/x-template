const fs = require("fs");
const Path = require("path");
const cheerio = require("cheerio");

// var templateInjectorRegex = /<x-((?:.|\r?\n)+?)\/>(?![^<!--].*?-->)/g;

const { removeHTMLComments, addHTMLComments } = require("./comment");
const mustache = require("./mustache");

var templateInjectorRegex = /<x-.*?\/>/g;
var htmlCommentsRegex = /<!--[\s\S]*?-->/g;

var defaultData = {
  "btn-label": "Button",
  "card-label": "card-label",
};

var data = {};
var classList = "";

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

function readTemplateFile(element, ignoreData = false) {
  let content = fs.readFileSync(
    Path.join(process.env.xviews, `${element.replaceAll("-", "/")}.x`),
    "utf8"
  );
  if (templateInjectorRegex.test(content)) {
    templateInjectorRegex.lastIndex = 0;
    let dataMatchChild = content.match(dataInjectorRegex);
    let dataListChild = dataMatchChild ? dataMatchChild[1] : "";
    if (dataListChild.length > 0) {
      content = content.replace(dataMatchChild[0], "").trim();
      const normalizedValue = dataListChild
        .replace(/(['"])?([a-zA-Z0-9_-]+)(['"])?:/g, '"$2":')
        .replace(/'/g, '"');
      if (!ignoreData) {
        Object.assign(data, defaultData, JSON.parse(`{${normalizedValue}}`));
      }
      ignoreData = true;
    }
    content = content.slice(3, -2).trim();
    content = extractClass(content);
    return readTemplateFile(content, ignoreData);
  }
  return content;
}

//var incompletePatterh = /<x-.*?\/>(?![^<!--].*-->)/g;

var classInjectorRegex = /x-class=["']([^"']+)["']/;
var dataInjectorRegex = /x-data=['"]\{([^}]*)\}['"]/;

function main(template) {
  template = template.replace(templateInjectorRegex, (e) => {
    classList = "";
    data = {};
    templateInjectorRegex.lastIndex = 0;
    if (e.includes("<x-template-comment")) {
      return e;
    }
    if (templateInjectorRegex.test(e)) {
      templateInjectorRegex.lastIndex = 0;
      e = e.slice(3, -2).trim();

      element = extractClass(e);


      let dataMatch = element.match(dataInjectorRegex);
      let dataList = dataMatch ? dataMatch[1] : "";
      let ignoreData = false;
      if (dataList.length > 0) {
        element = element.replace(dataMatch[0], "").trim();

        //it need's the string to be normalize
        // from { label: "Sign up" } to { "label": "Sign up" }
        // the { label: "Sign up" } cannot be parsed as JSON if not normalized
        const normalizedValue = dataList.replace(/(['"])?([a-zA-Z0-9_-]+)(['"])?:/g, '"$2":').replace(/'/g, '"');
        Object.assign(data, defaultData, JSON.parse(`{${normalizedValue}}`));
        ignoreData = true;
      }
      let content = readTemplateFile(element, ignoreData);


      content = mustache(content, data);

      const $ = cheerio.load(content);
      const classElement = $($("html > body > *")[0]);
      classElement.addClass(classList);
      return $("body").html();
    }
  });
 
  return template;
}

module.exports = (template) => {
  template = removeHTMLComments(template);
  template = main(template);
  template = addHTMLComments(template);

  return template;
};
