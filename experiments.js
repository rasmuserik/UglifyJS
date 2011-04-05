require.paths.push("lib");
p = require("parse-js");
fs = require("fs");
tree = p.parse(fs.readFileSync("lib/parse-js.js").toString());

heads = {};
function visit(n) {
    if(Array.isArray(n)) {
        var i = 0;
        if(typeof(n[0]) === "string") {
            heads[n[0]] = true;
            ++i;
        }
        for(; i < n.length; ++i) {
            visit(n[i]);
        }
    }
}
visit(tree);
//console.log(JSON.stringify(tree, undefined, "  "));

a = [];
for(x in heads) {
    a.push(x);
}
console.log(a.join(" "));

function assert(b) {
    if(!b) {
        throw "assert error";
    }
}

function tostr(node) {
    if(node === null || node === undefined) {
        return "";
    }
    if(Array.isArray(node[0])) {
        return "{" + node.map(tostr).join(";\n") + "}";
    }
    fn = {
        toplevel: function(node) {
            if(node.length !== 2) console.log("ERROR NODE:", node);
            return node[1].map(tostr).join("\n");
        },
        comment2: function(node) {
            if(node.length !== 2) console.log("ERROR NODE:", node);
            return "/*" + node[1] + "*/";
        },
        'var': function(node) {
            if(node.length !== 2) console.log("ERROR NODE:", node);
            return "var " + node[1].map(function(arr) {
                if(arr.length === 1) {
                    return arr[0];
                } else if(arr.length === 2) {
                    return arr[0] + " = " + tostr(arr[1]);
                } 
                assert(false);
            }).join(", ") + ";";
        },
        call: function(node) {
            if(node.length !== 3) console.log("ERROR NODE:", node);
            return tostr(node[1]) + "(" + node[2].map(tostr).join(", ") + ")";
        },
        "new": function(node) {
            if(node.length !== 3) console.log("ERROR NODE:", node);
            return "new " + tostr(node[1]) + "(" + node[2].map(tostr).join(", ") + ")";
        },
        seq: function(node) {
            return "(" + node.slice(1).map(tostr).join(",") + ")";
        }, 
        "true": function(node) {
            if(node.length !== 1) console.log("ERROR NODE:", node);
            return "true";
        },
        "break": function(node) {
            if(node.length !== 2) console.log("ERROR NODE:", node);
            if(node[1] !== null) console.log("ERROR NODE:", node);
            return "break";
        },
        name: function(node) {
            if(node.length !== 2) console.log("ERROR NODE:", node);
            return node[1];
        },
        array: function(node) {
            if(node.length !== 2) console.log("ERROR NODE:", node);
            return "[" + node[1].map(tostr).join(", ") + "]";
        },
        string: function(node) {
            if(node.length !== 2) console.log("ERROR NODE:", node);
            return JSON.stringify(node[1]);
        },
        "function": function(node) {
            if(node.length !== 4) console.log("ERROR NODE:", node);
            if(node[1] !== null) {
                console.log("ERROR NODE:", node);
            }
            return "function(" + node[2].join(", ") + "){" + node[3].map(tostr).join(";") + "}";
        },
        regexp : function(node) {
            if(node.length !== 3) console.log("ERROR NODE:", node);
            return 'RegExp("' + node[1] + '", "' + node[2] + '")';
        },
        object: function(node) {
            if(node.length !== 2) console.log("ERROR NODE:", node);
            return "{" + node[1].map(function(arr){
                assert(arr.length === 2);
                return JSON.stringify(arr[0]) + ": " + tostr(arr[1]);
            }).join(", ") + "}";
        },
        comment1: function(node) {
            if(node.length !== 2) console.log("ERROR NODE:", node);
            return "//" + node[1];
        },
        dot: function(node) {
            if(node.length !== 3) console.log("ERROR NODE:", node);
            return tostr(node[1]) + "." + node[2];
        },
        stat: function(node) {
            if(node.length !== 2) console.log("ERROR NODE:", node);
            return tostr(node[1]) + ";";
        },
        "for": function(node) {
            if(node.length !== 5) console.log("ERROR NODE:", node);
            return "for(" + tostr(node[1]) + ";" + tostr(node[2]) + ";" + tostr(node[3]) + ")" + tostr(node[4]);
        },
        defun: function(node) {
            if(node.length !== 4) console.log("ERROR NODE:", node);
            return "function " + node[1] + "(" + node[2].join(", ") + "){" + node[3].map(tostr).join(";\n") + "}\n";
        },
        block: function(node) {
            //if(node.length !== 1) console.log("ERROR NODE:", node);
            return node.slice(1).map(tostr).join(";\n");
        },
        binary: function(node) {
            if(node.length !== 4) console.log("ERROR NODE:", node);
            return "(" + tostr(node[2]) + ")" + node[1] + "(" + tostr(node[3]) + ")";
        },
        "switch": function(node) {
            if(node.length !== 3) console.log("ERROR NODE:", node);
            console.log(node[2]);
            return "switch(" + tostr(node[1]) + ") {" +
                //"\n/*" + JSON.stringify(node[2]) + "*/\n" +
                node[2].map(function(node) {
                    if(node.length !== 2) console.log("CASE ERROR NODE:", node);
                    return "case (" + tostr(node[0]) + "):" + ((node[1].length === 0) ?  "" : tostr(node[1]));
                }).join("") + "}"; 
        },
        num: function(node) {
            if(node.length !== 2) console.log("ERROR NODE:", node);
            return node[1];
        },
        conditional: function(node) {
            if(node.length !== 4) console.log("ERROR NODE:", node);
            return "(" + tostr(node[1]) + ")?(" + tostr(node[2]) + "):(" + tostr(node[3]) + ")";
        },
        sub: function(node) {
            if(node.length !== 3) console.log("ERROR NODE:", node);
            return tostr(node[1]) + "[" + tostr(node[2]) + "]";
        },
        while: function(node) {
            if(node.length !== 3) console.log("ERROR NODE:", node);
            return "while("+tostr(node[1]) + ")" + tostr(node[2]);
        },
        "if": function(node) {
            if(node.length !== 4) console.log("ERROR NODE:", node);
            return "if(" + tostr(node[1]) + ")" + tostr(node[2]) + (node[3]? " else " + tostr(node[3]) : "");
        },
        "unary-postfix": function(node) {
            if(node.length !== 3) console.log("ERROR NODE:", node);
            return tostr(node[2]) + node[1];
        },
        "unary-prefix": function(node) {
            if(node.length !== 3) console.log("ERROR NODE:", node);
            return node[1] + tostr(node[2]);
        },
        "try": function(node) {
            if(node.length !== 4) console.log("ERROR NODE:", node);
            return "try { " + tostr(node[1]) + " }" +
                (node[2]? (" catch(" + node[2][0] + ") {" + tostr(node[2][1]) + "}") :"") +
                (node[3]? (" finally {" + tostr(node[3][0]) + "}"):"");

        },
        assign: function(node) {
            if(node.length !== 4) console.log("ERROR NODE:", node);
            return tostr(node[2]) + (node[1] === true ? "" : node[1] ) + "=" + tostr(node[3]);
        },
        "throw": function(node) {
            if(node.length !== 2) console.log("ERROR NODE:", node);
            return "throw " + tostr(node[1]);
        },
        "return": function(node) {
            if(node.length !== 2) console.log("ERROR NODE:", node);
            return "return " + tostr(node[1]);
        },

    }[node[0]] || function(node) { console.log(node); return "unhandled(" + JSON.stringify(node) + ")" };
    return fn(node);
}
//console.log(tostr(tree));
t = tostr(tree);
console.log(t);
