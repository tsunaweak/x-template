const fs = require("fs");
const Path = require("path");

const yargs = require("yargs");

const mustache = require("./src/mustache");
const templateInjector = require("./src/template-injector");
const statement = require("./src/statement");

const options = yargs
  .scriptName("x-template-cli")
  .option('views', {
    alias: 'v',
    describe: 'Provide views root directory'
  })
  .option('input', {
    alias: 'i',
    describe: 'Provide the input file related to the provided views'
  })
  .option('output', {
    alias: 'o',
    describe: 'Provide the output file'
  })
  .option('data', {
    alias: 'd',
    describe: 'Provide the json data'
  })
  .demandOption(['views', 'input'], '\tPlease provide the required arguments')
  .help()
  .argv
let data = (options.data == undefined) ? {} : JSON.parse(options.data);
let output = (options.output == undefined) ? options.input : options.output;
process.env.xviews = Path.join(process.cwd(), options.views)
let filePath = Path.join(process.env.xviews, options.i)
let template = fs.readFileSync(filePath, 'utf8');
template = statement(template, data);
template = templateInjector(template);
template = mustache(template, data);


console.log(template)