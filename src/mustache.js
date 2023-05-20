
const { removeHTMLComments, addHTMLComments }  = require('./comment');


let mustacheRegex = /{([^}]+)}}(?![^<!--].*?-->)(?![^<!--][\S\s]+?-->)(?![^<!--][\S\s]*?-->)/g;

mustacheRegex = /{([^}]+)}}/g;
const entities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
function escapeHtml(string) {
    return String(string).replace(/[&<>"'`=\/]/g, (s) => entities[s]);
}



function normalizePlaceholder(template) {
    template = template.replace(mustacheRegex, (match, grp1, grp2, grp3, grp4, i, original) => {
        return '{{ placeholder }}';
    });
    mustacheRegex.lastIndex = 0;
    return template;
}


module.exports = (template, data) => {
    template = removeHTMLComments(template);
    template = template.replace(mustacheRegex, (matched, i, original) => {
        let index = matched.slice(2, -2).trim();
        let negate = false;
       
        if (index.startsWith("!") && index.endsWith("!")) {
            index = index.slice(1, -1).trim();
            negate = true;
        }

        if (data[index] === undefined) {
            throw `The \`${index}\` does not exist in the provided data in \n${template}`;
        }

        let result = data[index];
        if (negate) {
            return result;
        }
        return escapeHtml(result);
    });
    template = addHTMLComments(template);
    template = normalizePlaceholder(template);
    mustacheRegex.lastIndex = 0;
    return template;
};