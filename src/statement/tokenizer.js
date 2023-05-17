let str = `
<x-if='$true && $one == 1 && $string == 'stringx'' x->
<x-if='true' x->
<h1>1</h1>
</x-if>
<x-else-if="false" x->
<h1>2</h1>
<x-else-if='false' x->
<h1>3</h1>
<x-else>
<h1>4</h1>
</x-if>
`;

console.log(str[1]);

let openIfTag = "<x-if=";
let elseIfTag = "<x-else-if=";
let elseTag = "x-else>";
let closeIfTag = "</x-if>";

function tokenizer(input) {
  let cursor = 0;

  let tokens = [];

  while (cursor < input.length) {
    let char = input[cursor];
    if (input.slice(cursor, cursor + openIfTag.length) === openIfTag) {
      cursor += openIfTag.length;
      let condition = "";
      while (
        cursor < input.length &&
        input.slice(cursor, cursor + 3) !== "x->"
      ) {
        condition += input[cursor];
        cursor++;
      }
      tokens.push({
        type: "openTag",
        value: openIfTag,
        condition: condition.slice(1, -2),
        index: cursor + 3,
      });
    } else if (input.slice(cursor, cursor + elseIfTag.length) === elseIfTag) {
      cursor += elseIfTag.length;
      let condition = "";
      while (
        cursor < input.length &&
        input.slice(cursor, cursor + 3) !== "x->"
      ) {
        condition += input[cursor];
        cursor++;
      }
      tokens.push({
        type: "openTagElseIf",
        value: elseIfTag,
        condition: condition.slice(1, -2),
        index: cursor + 3,
      });
    } else if (input.slice(cursor, cursor + elseTag.length) === elseTag) {
      cursor += elseTag.length;
      tokens.push({
        type: "elseTag",
        value: elseTag,
        condition: undefined,
        index: cursor - elseTag.length,
      });
    } else if (input.slice(cursor, cursor + closeIfTag.length) === closeIfTag) {
      cursor += closeIfTag.length;
      tokens.push({
        type: "closeTag",
        value: closeIfTag,
        condition: undefined,
        index: cursor - closeIfTag.length,
      });
    }
    cursor++;
  }
  return tokens;
}

let tokens = tokenizer(str);

let statement = '';
tokens.forEach((e, i) => {
  if(e.type == 'openTag'){
    statement += `if (${e.condition}) {`
    
  }
});

console.log(tokens);
