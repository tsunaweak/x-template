var commentRegex = /((<!--.*?-->)|(<!--[\S\s]+?-->)|(<!--[\S\s]*?-->$))/g;
var commentTemplateRegex = /<x-template-comment-(.+?)(?:\/>\s?|$)/g;

var comments = [];


function removeHTMLComments(template){
    template = template.replace(commentRegex, (match, grp1, grp2, grp3, grp4, i, original) => {
        comments[parseInt(i)] = match;
        return `<x-template-comment-${i}/>`;
    });
    commentRegex.lastIndex = 0;
    
    return template;
}

function addHTMLComments(template){
    template = template.replace(commentTemplateRegex, (match, grp1, grp2, grp3, grp4, i, original) => {
        commentTemplateRegex.lastIndex = 0;
        let matched = commentTemplateRegex.exec(match);
        if (matched) {
            let offset = parseInt(matched[1]);
            return comments[offset];
        }
    });
    commentTemplateRegex.lastIndex = 0;
    return template;
}


module.exports = {
    removeHTMLComments,
    addHTMLComments
}