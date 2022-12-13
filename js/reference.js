class Reference {
    constructor() {
        this.docString = "::DB\nDefine Byte(s)\nv8a\n-\nSets the range of bytes starting at @#@ to $1.\n\n::DW\nDefine Word\nv16\n-\nSets the byte at @#@ to the lower 8 bits of $1, and sets the byte at @#@ to the higher 8 bits.\n\n::DS\nDefine Storage\nv16\n-\nReserves the next $1 bytes, causing the next instruction to be assembled at @# + $1@.\n\n::NOP\nNo operation\n-\n-\nDoes nothing - occupies one byte.\n\n::CMC\nCompliment Carry\n-\nC\nCompliments the carry bit, causing a 0 to turn into a 1 and vice-versa.\n\n::STC\nSet Carry\n-\nC\nSets the carry bit to 1.\n\n::INR\nIncrement Register or Memory\nreg\nZSPX\nIncrements the value of $1 by 1.\n\n::DCR\nDecrement Register or Memory\nreg\nZSPX\nDecrements the value of $1 by 1.\n\n::CMA\nComplement Accumulator\n-\n-\nCompliments the accumulator value, settings all 0s to 1s and vice versa.\n\n::DMA\nDecimal Adjust Accumulator\n-\nZSPCX\nAdjusts the accumulator for decimal calculations.\n\n::MOV\nMove Data\nreg,reg\n-\nSets the value of the first $1 to the value of the second $2.\nCan be though of as <code>MOV <i>dest</i>,<i>src</i></code>\n\n::MVI\nMove Immediate Data\nreg,v8\n-\n-\nSets the value of $1 to $2.\n\n::STAX\nStore Accumulator\nregpair/BD\n-\nStores the value of <b>A</b> into memory at the address corresponding to the @value of $1@.\n\n::LDAX\nLoad Accumulator\nregpair/BD\n-\nStores the value in memory located at the address corresponding to the @value of $1@ to <b>A</b>.\n\n::ADD\nAdd Register or Memory to Accumulator\nreg\nCSZPX\nAdds the value of $1 to <b>A</b>.\n\n::ADI\nAdd Immediate To Accumulator\nv8\nCSZPX\nAdds $1 to <b>A</b>.\n\n::ADC\nAdd Register or Memory to Accumulator With Carry\nreg\nCSZPX\nAdds the value of $1 and the value of the carry bit to <b>A</b>.\n\n::ACI\nAdd Immediate to Accumulator With Carry\nv8\nCSZPX\nAdds $1 and the value of the carry bit to <b>A</b>.\n\n::SUB\nSubtract Register or Memory From Accumulator\nreg\nCSZPX\nSubtracts the value of $1 from <b>A</b>.\n\n::SUI\nSubtract Immediate From Accumulator\nv8\nCSZPX\nSubtracts $1 from <b>A</b>.\n\n::SBB\nSubtract Register or Memory From Accumulator With Borrow\nreg\nCSZPX\nSubtracts the value of $1 and the value of the carry bit from <b>A</b>.\n\n::SBI\nSubtract Immediate From Accumulator With Borrow\nv8\nCSZPX\nSubtracts $1 and the value of the carry bit from <b>A</b>.\n\n::ANA\nLogical AND Register or Memory With Accumulator\nreg\nCZSP\nANDs the value of <b>A</b> by the value of $1 and stores the result to <b>A</b>.\nSets the carry bit to 0.\n\n::ANI\nLogical AND Immediate With Accumulator\nv8\nCZSP\nANDs the value of <b>A</b> by $1 and stores the result to <b>A</b>.\nSets the carry bit to 0.\n\n::ORA\nLogical OR Register or Memory With Accumulator\nreg\nCZSP\nORs the value of <b>A</b> by the value of $1 and stores the result to <b>A</b>.\nSets the carry bit to 0.\n\n::ORI\nLogical OR Immediate With Accumulator\nv8\nCZSP\nORs the value of <b>A</b> by $1 and stores the result to <b>A</b>.\nSets the carry bit to 0.\n\n::XRA\nLogical XOR Register or Memory With Accumulator\nreg\nCZSPX\nXORs the value of <b>A</b> by the value of $1 and stores the result to <b>A</b>.\nSets the carry bit to 0.\n\n::XRI\nLogical XOR Immediate With Accumulator\nv8\nCZSPX\nXORs the value of <b>A</b> by $1 and stores the result to <b>A</b>.\nSets the carry bit to 0.\n\n::CMP\nCompare Register or Memory With Accumulator\nreg\nCZSPX\nBehaves the same as SUB, internally subtracting the value of $1 from <b>A</b>, but no registers other than the Status Register are affected.\nUseful for testing for (in)equality using the status bits.\n\n::CPI\nCompare Immediate With Accumulator\nv8\nCZSPX\nBehaves the same as SBI, internally subtracting $1 from <b>A</b>, but no registers other than the Status Register are affected.\nUse for testing of (in)equality using the status bits.\n\n::RLC\nRotate Accumulator Left\n-\nC\nSets the carry bit to the highest bit of <b>A</b>, then rotates the bits of <b>A</b> left (setting the lowest bit to the highest bit).\ne.g. 10110110 becomes 01101101, setting the carry bit to 1.\n\n::RRC\nRotate Accumulator Right\n-\nC\nSets the carry bit to the lowest bit of <b>A</b>, then rotates the bits of <b>A</b> right (setting the highest bit to the lowest bit).\ne.g. 10110110 becomes 01011011, setting the carry bit to 0.\n\n::RAL\nRotate Accumulator Left Through Carry\n-\nC\nRotates the 9-bit number formed by prepending the carry bit to <b>A</b> left (setting the carry to the highest bit of <b>A</b>, and the lowest bit to the carry).\ne.g. If the carry bit is set to 1, 10110110 becomes 01101101, setting the carry bit to 1.\n\n::RAR\nRotate Accumulator Right Through Carry\n-\nC\nRotates the 9-bit number formed by prepending the carry bit to <b>A</b> right (setting the carry bit to the lowest bit of <b>A</b>, and the highest bit to the carry).\ne.g. If the carry bit is set to 1, 10110110 becomes 11011011, setting the carry bit to 0.\n\n::PUSH\nPush Data Onto Stack\nregpair/PSW\n-\nPushes the 16-bit value of $1 onto the stack.\n\n::POP\nPop Data Off Stack\nregpair/PSW\n-\nPops a 16-bit value from the stack and sets the value of $1 to the popped value. PSW will affect the status bits.\n\n::LXI\nLoad Register Pair Immediate\nregpair/SP,v16\n-\nSets the value of $1 to $2.\n\n::DAD\nDouble Add\nregpair/SP\nC\nAdds the value of $1 to the value of <b>HL</b>.\n\n::INX\nIncrement Register Pair\nregpair/SP\n-\nIncrements the value of $1 by 1.\n\n::DCX\nDecrement Register Pair\nregpair/SP\n-\nDecrements the value of $1 by 1.\n\n::XCHG\nExchange Registers\n-\n-\nSwaps the values of <b>HL</b> and <b>DE</b>.\n\n::XTHL\nExchange Stack\n-\n-\nSwaps the values of <b>HL</b> and the 16-bit value on top of the stack.\n\n::STA\nStore Accumulator Direct\nv16\n-\nStores the value of <b>A</b> at @$1@.\n\n::LDA\nLoad Accumulator Direct\nv16\n-\nSets the value of <b>A</b> to value stored at memory address @$1@.\n\n::SHLD\nStore H and L Direct\nv16\n-\nStores the value of <b>HL</b> to @$1@, little-endian style (lowest 8 bytes stored first).\n\n::LHLD\nLoad H and L Direct\nv16\n-\nSets the value of <b>HL</b> to the value stored at @$1@.\n\n::PCHL\nLoad Program Counter from H and L\n-\n-\nSets the value of <b>PC</b> to the value of <b>HL</b>, resuming program execution from @there@.\n\n::SPHL\nLoad SP From H And L\n-\n-\nSets the value of <b>SP</b> to the value of <b>HL</b>.\n\n;;ORG\nOrigin\nv16\n-\nSets the assembler's location to @$1@, resuming program assembly from there.\n\n::JMP\nJump\nv16\n-\nSets the value of <b>PC</b> to $1, resuming program execution from @there@.\n\n::JC\nJump If Carry\nv16\n-\nPerforms a JMP operation using @$1@ if the carry bit is set to 1.\n\n::JNC\nJump If No Carry\nv16\n-\nPerforms a JMP operation using @$1@ if the carry bit is set to 0.\n\n::JZ\nJump If Zero\nv16\n-\nPerforms a JMP operation using @$1@ if the zero bit is set to 1.\n\n::JNZ\nJump If Not Zero\nv16\n-\nPerforms a JMP operation using @$1@ if the zero bit is set to 0.\n\n::JM\nJump If Minus\nv16\n-\nPerforms a JMP operation using @$1@ if the sign bit is set to 1.\n\n::JP\nJump If Positive\nv16\n-\nPerforms a JMP operation using @$1@ if the sign bit is set to 0.\n\n::JPE\nJump If Parity Even\nv16\n-\nPerforms a JMP operation using @$1@ if the parity bit is set to 1 (even parity).\n\n::JPO\nJump If Parity Odd\nv16\n-\nPerforms a JMP operation using @$1@ if the parity bit is set to 0 (odd parity).\n\n::CALL\nCall\nv16\n-\nCalls the subroutine at @$1@, pushing the current value of <b>PC</b> to the stack and thus expecting a RET statement to resume execution from.\n\n::RST\nRestart\nv3\n-\nPerforms a CALL operation to the address formed by bit-shifting $1 left by 3.\nUsing value 101B, for example, performs a CALL operation at @0000 0000 0010 1000@.\nUsually used with IO Devices.\n\n::CC\nCall If Carry\nv16\n-\nPerforms a CALL operation using @$1@ if the carry bit is set to 1.\n\n::CNC\nCall If Not Carry\nv16\n-\nPerforms a CALL operation using @$1@ if the carry bit is set to 0.\n\n::CZ\nCall If Zero\nv16\n-\nPerforms a CALL operation using @$1@ if the zero bit is set to 1.\n\n::CNZ\nCall If Not Zero\nv16\n-\nPerforms a CALL operation using @$1@ if the zero bit is set to 0.\n\n::CM\nCall If Minus\nv16\n-\nPerforms a CALL operation using @$1@ if the sign bit is set to 1.\n\n::CP\nCall If Positive\nv16\n-\nPerforms a CALL operation using @$1@ if the sign bit is set to 0.\n\n::CPE\nCall If Parity Even\nv16\n-\nPerforms a CALL operation using @$1@ if the parity bit is set to 1 (even parity).\n\n::CPO\nCall If Parity Odd\nv16\n-\nPerforms a CALL operation using @$1@ if the parity bit is set to 0 (odd parity).\n\n::HLT\nHalt\n-\n-\nHalts the CPU and waits for an interrupt from an IO device. Useful for waiting for inputs before computing anything. Interrupts must be enabled for this to be useful.\n\n::RET\nReturn\n-\n-\nSets the value of <b>PC</b> to a value popped from the stack, resuming execution from there.\nUsually for use with CALL operations.\n\n::RC\nReturn If Carry\n-\n-\nPerforms a RET operation if the carry bit is set to 1.\n\n::RNC\nReturn If Not Carry\n-\n-\nPerforms a RET operation if the carry bit is set to 0.\n\n::RZ\nReturn If Zero\n-\n-\nPerforms a RET operation if the zero bit is set to 1.\n\n::RNZ\nReturn If Not Zero\n-\n-\nPerforms a RET operation if the zero bit is set to 0.\n\n::RM\nReturn If Minus\n-\n-\nPerforms a RET operation if the sign bit is set to 1.\n\n::RP\nReturn If Positive\n-\n-\nPerforms a RET operation if the sign bit is set to 0.\n\n::RPE\nReturn If Parity Even\n-\n-\nPerforms a RET operation if the parity bit is set to 1 (even parity).\n\n::RPO\nReturn If Parity Odd\n-\n-\nPerforms a RET operation if the parity bit is set to 0 (odd parity).\n\n::EI\nEnable Interrupts\n-\n-\nEnables IO device interrupts.\n\n::DI\nDisable Interrupts\n-\n-\nDisables IO device interrupts.\n\n::IN\nInput\nv8\n-\nSets the value of <b>A</b> to the value read from the device specified from $1.\n\n::OUT\nOutput\nv8\n-\nSends the value of <b>A</b> to the device specified by $1.\n\n;;EQU\nEquate\nv16\n-\nDefines # to be equal to $1. # can subsequently be used as a variable for instructions that take values as arguments. These labels can NOT be redefined.\n\n;;SET\nSet\nv16\n-\nDefines # to be equal to $1. # can subsequently be used as a variable for instructions that take values as arguments. These labels CAN be redefined.\nNote: This instruction is used internally for registers A, B, C, D, E, H, L, and M, to set them to values 7, 0, 1, 2, 3, 4, 5, and 6 respectively.\n\n;;IF\nIf\nv16\n-\nEvaluates $1, and only assembles the following statements leading up to a required ENDIF if $1 is not equal to 0.\n\n;;ENDIF\nEnd If\n-\n-\nUsed to terminate the body of an IF statement.\n\n;;END\nEnd Of Assembly\n-\n-\nTells the assembler that assembly is done, and the location of this instruction will be the physical end of the program.\nThis should be the very last command in code, as any instructions located farther in memory won't be reachable.\nIf no END statement is included, it will be internally appended to code at assembly time."; // set by build

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