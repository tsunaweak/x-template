
function replaceVariables(condition) {
  if(!(/\$[\w\d]+/g.test(condition))){
    return condition;
  }
  let variables = condition.match(/\$[a-zA-Z_][a-zA-Z0-9_]*/g);
  for (let variable of variables) {
    let index = variable.slice(1);
    condition = condition.replace(variable, `data['${index}']`);
  }
  return condition;
}

function replaceTempalteV1(template, data){ //this function does not support nested if-else, else-if statement
  let str = `
  <x-if='$true && $one == 1 && $string == "string"'>
    <x-if='true'>
      <h1>1</h1>
    </x-if>
  <x-else-if="false">
    <h1>2</h1>
  <x-else-if='false'>
    <h1>3</h1>
  <x-else>
    <h1>4</h1>
  </x-if>
    `


  template = template.replace(
    /<x-if=['|"](.+?)['|"]>([\s\S]*?)<\/x-if>/g,
    (match, cg1, cg2, offset, string, grps) => {
      let condition = replaceVariables(cg1);
      let elseIndex = cg2.indexOf("<x-else>");
      let firstElseIfIndex = cg2.indexOf("<x-else-if");
      if (
        new Function("data", "condition", `return ${condition}`)(
          data,
          condition
        )
      ) {
        // check if has else-if statement,
        // if it present get the index of the else-if statement
        // and use to extract the content of if-block
        let ifIndex = firstElseIfIndex == -1 ? elseIndex : firstElseIfIndex;
        return cg2.substr(0, ifIndex);
      } else {
        //the regex pattern should be a in variable to prevent the infinite loop in while block
        const regex = /<x-else-if=["'](.*?)["']>\s*(.*)\s*/g; 
        while ((match = regex.exec(cg2)) !== null) {  //handles the else-if 
          const elseIfCondition = replaceVariables(match[1]);
          const elseIfContent = match[2];
          if (new Function("data", "elseIfCondition", `return ${elseIfCondition}`)(data, elseIfCondition ) ) {
            return elseIfContent;
          }
        }
        if(elseIndex === -1) return '';
        return cg2.substr(elseIndex, cg2.length);
      }
    }
  );
  return template;
}



module.exports = (template, data) => {
  
};