class Reference {
    constructor() {
        this.docString = ""; // set by build

        this.doc = {};

        this.argRef = {
            "v8": "8-bit value or expression",
            "v16": "16-bit value or expression",
            "v8a": "List of 8-bit values, expressions, or ascii literals. Ascii literals are surrounded by single quotes, and single quotes within ascii literals must be escaped by using another single quote ('')",
            "reg": "8-bit register - A, B, C, D, E, H, L, or M",
            "regpair/PSW": "16-bit register pair or PSW register - BC, DE, HL, or PSW (PSW being a 16-bit register composed of the Status Register (S) augmented with the accumulator (A)",
            "regpair/SP": "16-bit register pair or SP register - BC, DE, HL, or SP (SP being the Stack Pointer Register, controlling the origin of the stack",
            "regpair/BD": "16-bit register pair that is either BC or DE",
            "-": "No argument required"
        }

        this.searchableStringCache = {};
        this.elementCache = {};

        this._construct();
    }

    _construct() {
        var lines = this.docString.replace(/\r/g, "").split("\n");
        for (var i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            let label = (line.substr(0, 2) === "::" ? "label:" : "label");
            let argLabel = "label";
            let op = line.substr(2);
            let name = lines[i+1];
            let args = lines[i+2].split(",");
            let flags = lines[i+3].split("").map((flag) => {
                switch (flag) {
                    case "S": return "Sign";
                    case "Z": return "Zero";
                    case "C": return "Carry";
                    case "X": return "Auxiliary Carry";
                    case "P": return "Parity";
                    case "-": return "None";
                }
            });
            let desc = "";

            let j = i + 4;

            for (j = i + 4; j < lines.length && lines[j] !== ""; j++) {
                let d = lines[j];
                desc += d + "\n";
            }

            i = j;

            this.doc[op] = {
                "op": op,
                "name": name,
                "args": args,
                "flags": flags,
                "desc": desc,
                "label": label,
                "argLabel": argLabel
            };
        }
    }

    genSearchableString(op) {
        op = op.toUpperCase();

        if (this.searchableStringCache.hasOwnProperty(op)) {
            return this.searchableStringCache[op];
        }

        var doc = this.doc[op];

        var ret = doc.op + " " + doc.name + " " + doc.label + " " + doc.args.join(" ") + " " + this.genDesc(op, false) + " " + doc.flags.join(" ");
        ret = ret.replace(/\W/g, "").toLowerCase();

        this.searchableStringCache[op] = ret;
        return ret;
    }
    
    genDesc(op, html, argElements) {
        op = op.toUpperCase();
        var doc = this.doc[op];

        var d = doc.desc;
        d = d.replace(/\n/g, html ? "<br><br>" : " ");
        d = d.replace(/\#/g, html ? "<span class='ref-desc-label'>" + doc.argLabel + "</span>" : doc.argLabel);
        d = d.replace(/\@(.+?)@/g, html ? "<span class='ref-desc-address' title='Memory Address'>$1</span>" : "memory $1");
        d = d.replace(/\$1/g, html ? argElements[0].outerHTML : doc.args[0]);
        d = d.replace(/\$2/g, html ? argElements[1].outerHTML : doc.args[1]);

        return d;
    }

    genOpElement(op) {
        op = op.toUpperCase();
        var doc = this.doc[op];

        var $ret = document.createElement("div");
        $ret.className = "ref-container ref-" + op;

        if (this.elementCache.hasOwnProperty(op)) {
            $ret.innerHTML = this.elementCache[op];
            return $ret;
        }

        var $header = document.createElement("div");
        $header.className = "ref-header";
        $header.innerText = doc.op + " - " + doc.name;
        $ret.appendChild($header);

        var $usage = document.createElement("div");
        $usage.className = "ref-usage";
        $ret.appendChild($usage);

        var $status = document.createElement("div");
        $status.className = "ref-status";
        $status.innerText = "Status Bits Affected: " + doc.flags.join(", ");
        $ret.appendChild($status);

        var $usageLabel = document.createElement("span");
        $usageLabel.className = "ref-usage-label";
        $usageLabel.innerText = doc.label;
        $usage.appendChild($usageLabel);
        
        var $usageOp = document.createElement("span");
        $usageOp.className = "ref-usage-op";
        $usageOp.innerText = doc.op;
        $usage.appendChild($usageOp);

        var $usageArgs = document.createElement("span");
        $usageArgs.className = "ref-usage-args";
        $usage.appendChild($usageArgs);

        var argElements = [{outerHTML:""},{outerHTML:""}];

        for (var i = 0; i < doc.args.length; i++) {
            if (doc.args[i] === "-") {
                break;
            }

            let $arg = document.createElement("span");
            $arg.className = "ref-usage-arg";
            $arg.innerText = doc.args[i];
            $arg.title = this.argRef[doc.args[i]];

            $usageArgs.appendChild($arg);
            argElements[i] = $arg;
            if (i !== doc.args.length - 1) {
                $usageArgs.innerHTML += ",";
            }
        }

        var $desc = document.createElement("div");
        $desc.className = "ref-desc";

        var d = this.genDesc(op, true, argElements);

        $desc.innerHTML = d;
        $ret.appendChild($desc);

        this.elementCache[op] = $ret.innerHTML;

        return $ret;
    }
}