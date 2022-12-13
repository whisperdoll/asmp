var fs = require("fs");

console.log("Building reference.js...");
(() => {
    var base = fs.readFileSync("js/referencebase.js", "utf8").toString();
    var doc = fs.readFileSync("reference.mdoc").toString();

    doc = doc.replace(/"/g, "\\\"").replace(/\r/g, "").replace(/\n/g, "\\n");
    base = base.replace(/this\.docString = "";/, "this.docString = \"" + doc + "\";");

    fs.writeFileSync("js/reference.js", base, "utf8");
})();

console.log("Building challenge.js...");
(() => {
    var base = fs.readFileSync("js/challengebase.js", "utf8").toString();
    var doc = fs.readFileSync("challenges.cdoc").toString().replace(/\r/g, "").split("\n");

    var ret = "[";
    var s = "";
    var o = {};
        
    for (var i = 0; i < doc.length; i++) {
        let line = doc[i];

        if (line[0] === "`") {
            if (s !== "") {
                o[currentKey] = s;
            }

            s = "";

            if (line === "```") {
                o.desc = o.desc.replace(/\n/g, "<br>").replace(/"/g, "\\\"");
                o.prereqs = JSON.stringify(o.prereqs);
                o.unlocks = JSON.stringify(o.unlocks);
                o.registers = JSON.stringify(o.registers);

                ret += `new Challenge("${o.name}","${o.title}","${o.category}","${o.desc}",${o.prereqs},${o.unlocks},${o.registers},${o.tests},${o.invoke},${o.setup},${o.test},${o.getExpected},${o.diff}),`;
                o = {};
                continue;
            }

            line = line.substr(1);
            let key = line.split(":")[0];
            let value = line.substr(line.indexOf(":") + 2);
            currentKey = key;

            switch (key) {
                case "name":
                    o.name = value;
                    break;
                case "title":
                    o.title = value;
                    break;
                case "category":
                    o.category = value;
                    break;
                case "requires":
                    o.prereqs = value ? value.split(",") : [];
                    break;
                case "unlocks":
                    o.unlocks = value ? value.split(",") : [];
                    break;
                case "registers":
                    o.registers = value ? value.split(",") : [];
                    break;
                case "tests":
                    o.tests = value;
                    break;
                case "desc":
                case "invoke":
                case "setup":
                case "test":
                case "diff":
                case "getExpected":
                    s = value;
                    break;
            }
        } else {
            s += "\n" + line;
        }
    }

    ret = ret.substr(0, ret.length - 1) + "]";

    base = base.replace("var challenges = []", "var challenges = " + ret);

    fs.writeFileSync("js/challenge.js", base, "utf8");
})();

console.log("Done.");