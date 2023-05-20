const fs = require("fs");
const Path = require("path");
const cheerio = require("cheerio");
const { overrideTailwindClasses } = require('tailwind-override')

// var templateInjectorRegex = /<x-((?:.|\r?\n)+?)\/>(?![^<!--].*?-->)/g;

const { removeHTMLComments, addHTMLComments } = require("./comment");
const mustache = require("./mustache");

var templateInjectorRegex = /<x-.[\s\S]*?(\/>|<\/x)/g;

/**
 * (?:^|[^<x-])[\s\S]*?(?:\/>|<\/x[\s\S]*?)
 * /<x-[^>]*\/>|<x-(?!\/)[^>]*>(?:[\s\S]*?(?!<x-)[\s\S]*?)<\/x-[^>]*>/g it captures <-x/> and <x-> </x>
 * <(\w+)\s*[^>]*\/>(?![^<]*<\/x-)
 */
//var htmlCommentsRegex = /<!--[\s\S]*?-->/g;

//var incompletePatterh = /<x-.*?\/>(?![^<!--].*-->)/g;

var dataInjectorRegex = /x-data=['"]\{([^}]*)\}['"]/;

var defaultPlaceholder = {
  "btn-label": "Button",
  "card-title": "Card Title",
};

var classList = "";
var data = {};

function removeAttributes(element) {
  //remove the x-data attrbute
  element = element.replace(/x-class=["']([^"']+)["']/, "");
  //remove the x-data attribute
  element = element.replace(/x-data=['"]\{([^}]*)\}['"]/, "");
  //remove the x-pre attribute
  element = element.replace(/x-pre=["']([^"']+)["']/, "");

  return element;
}

function isObjectEmpty(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

function extractClass(element) {
  let match = element.match(/x-class=["']([^"']+)["']/);
  let cList = match ? match[1] : "";
  if (cList.length > 0) {
    element = element.replace(match[0], "").trim();
    classList += `${cList} `;
  }
  return classList;
}
function replacePreComponents(content, element) {
  let match = element.match(/x-pre=["']([^"']+)["']/);
  let preComponents = match
    ? match[1]
        .split("|")
        .map((components) => {
          return `<x-${components}/>`;
        })
        .join("\n")
    : "";
  if (preComponents.length > 0) {
    content = mustache(content, { "x-pre": preComponents });
  }
  return content;
}

function extractData(element) {
  let dataMatch = element.match(/x-data=['"]\{([^}]*)\}['"]/);
  let dataList = dataMatch ? dataMatch[1] : "";
  if (dataList.length > 0) {
    element = element.replace(dataMatch[0], "").trim();
    const normalizedValue = dataList
      .replace(/(['"])?([a-zA-Z0-9_-]+)(['"])?:/g, '"$2":')
      .replace(/'/g, '"');
    if (isObjectEmpty(data)) {
      data =  { ...defaultPlaceholder, ...JSON.parse(`{${normalizedValue}}`) };
    }
    return data;
  }
  return defaultPlaceholder;
}

function readTemplateFile(e) {
  return fs.readFileSync(
    Path.join(process.env.xviews, `${e.replaceAll("-", "/")}.x`),
    "utf8"
  );
}

function main(template) {
  template = removeHTMLComments(template);
  template = template.replace(templateInjectorRegex, (original) => {
    templateInjectorRegex.lastIndex = 0;
    if (original.includes("<x-template-comment")) {
      return original;
    }

    let element = removeAttributes(original);
    element = element.slice(3, -2).trim();
    let contents = readTemplateFile(element);
    contents = replacePreComponents(contents, original);
    let classAttributes = extractClass(original);

    let dataAttributes = extractData(original);
    if(!isObjectEmpty(dataAttributes)){
      contents = mustache(contents, dataAttributes);
    }


    contents = main(contents);

    const $ = cheerio.load(contents);
    const classElement = $($("html > body > *")[0]);
    classElement.addClass(classAttributes);
    classElement[0].attribs.class = overrideTailwindClasses(classElement[0].attribs.class);
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
