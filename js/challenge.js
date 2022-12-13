/* ideas

text
screen
brainfuck interpreter

*/

class Challenge {
    constructor(name, title, category, desc, prereqs, unlocks, requiredRegs, tests, invokeFn, setupFn, testFn, getExpectedFn, diffFn) {
        this.title = title;
        this.name = name;
        this.category = category;
        this.prereqs = prereqs;
        this.unlocks = unlocks;
        this.desc = desc;
        this.tests = tests;
        this.requiredRegs = requiredRegs;
        this.invokeFn = invokeFn.bind(this);
        this.testFn = testFn.bind(this);
        this.getExpectedFn = getExpectedFn.bind(this);
        this.setupFn = setupFn.bind(this);
        this.diffFn = diffFn.bind(this);
    }

    invoke() {
        challengeStatusObject[this.name].new = false;
        widgets.find("#challengeText").innerHTML = "<div>" + this.desc.replace(/\<op\>(.+?)\<\/op\>/g, "<code class='clickable-op' onclick='widgets.smallReference.show(\"$1\");'>$1</code>") + "</div>";
        if (this.requiredRegs.length > 0 && this.requiredRegs[0] !== "all") {
            for (var regName in processor.registers) {
                if (this.requiredRegs.indexOf(regName) === -1) {
                    widgets.registerContainer.hideRegister(regName);
                } else {
                    widgets.registerContainer.showRegister(regName);
                }
            }
        } else {
            for (var regName in processor.registers) {
                widgets.registerContainer.showRegister(regName);
            }
        }
        this.invokeFn();
    }

    static regDiff(diffWidget, oldBlob, expectedBlob) {
        //window.god = oldBlob;
        diffWidget.appendRegisterObject("Input Registers", oldBlob.registers);
        diffWidget.appendRegisterObject("Expected Registers", expectedBlob.registers);
        diffWidget.appendRegisterObject("Your Registers", processor.matchRegisters(expectedBlob.registers));
    }

    static memDiff(diffWidget, oldBlob, expectedBlob) {
        if (this.root === undefined || this.newRoot === undefined) {
            console.log("HEY MEMORY CHALLENGES NEED TO SET VALUES this.root AND this.newRoot THANKS");
        }
        /*console.log("old", oldBlob, 
        "expected", expectedBlob,
        "current", processor.memory.toBlob());*/
        //console.log(this, this.newRoot);
        /*console.log("old", oldBlob.memoryBlob);
        console.log("expected", expectedBlob.memoryBlob);
        console.log("current", processor.memory.toBlob());*/
        diffWidget.appendMemoryBlob("Input Memory", oldBlob.memoryBlob, this.root);
        diffWidget.appendMemoryBlob("Expected Memory", expectedBlob.memoryBlob, this.newRoot);
        diffWidget.appendMemoryPageFromRoot("Your Memory", processor.memory, this.newRoot);
    }

    static statusDiff(diffWidget, oldBlob, expectedBlob) {
        diffWidget.appendRegisterObject("Input Registers", oldBlob.registers);
        diffWidget.appendWidget("Expected Status Bits", new StatusBitsWidget(expectedBlob.registers.S.value));
        diffWidget.appendWidget("Your Status Bits", new StatusBitsWidget(processor.registers.S.value));
    }

    static statusDiffWithReg(diffWidget, oldBlob, expectedBlob) {
        diffWidget.appendRegisterObject("Input Registers", oldBlob.registers);
        diffWidget.appendWidget("Expected Status Bits", new StatusBitsWidget(expectedBlob.registers.S.value));
        diffWidget.appendWidget("Your Status Bits", new StatusBitsWidget(processor.registers.S.value));
        diffWidget.appendRegisterObject("Your Registers", processor.matchRegisters(expectedBlob.registers));
    }

    runTest(processor) {
        processor.clear(true);
        doAssemble(true);
        var plength = processor.programLength;
        var memCache = array_copy(processor.memory.array);
        var avgSteps = 0;

        var time = [0,0,0,0,0];

        for (var i = 0; i < this.tests; i++) {
            time[0] -= Date.now();
            processor.clear(true);
            time[0] += Date.now();
            time[1] -= Date.now();
            processor.memory.array = array_copy(memCache);
            processor.programLength = plength;
            time[1] += Date.now();
            time[2] -= Date.now();
            this.setupFn(processor, i);
            time[2] += Date.now();

            time[3] -= Date.now();
            var oldBlob = processor.toBlob();
            time[3] += Date.now();
            time[4] -= Date.now();
            var z = processor.execute();
            time[4] += Date.now();

            if (z.error) {
                return {
                    error: z.error
                };
            }

            var newBlob = processor.toBlob();

            let success = this.testFn(oldBlob, newBlob);

            if (!success) {
                return {
                    success: false,
                    oldBlob: oldBlob,
                    newBlob: newBlob
                };
            }

            avgSteps += z.steps;
        }

        avgSteps /= this.tests;
        var totalTime = (time.reduce((acc, val) => acc + val) / 1000);

        console.log(time);
        console.log("Total time: " + (time.reduce((acc, val) => acc + val) / 1000) + "s");

        // success ! //

        if (!challengeStatusObject.unlocked) {
            challengeStatusObject.unlocked = [];
        }

        for (var i = 0; i < this.unlocks.length; i++) {
            let unlock = this.unlocks[i];
            if (challengeStatusObject.unlocked.indexOf(unlock) === -1) {
                challengeStatusObject.unlocked.push(unlock);
            }
        }

        Storage.set("challengeStatus", challengeStatusObject);

        var currentPage = widgets.challengeListContainer.currentPage;
        populateChallengeContainer();
        widgets.challengeListContainer.switchToPage(currentPage);

        return {
            success: true,
            stats: {
                "Tests Conducted": this.tests,
                "Total Test Time": totalTime + "s",
                "Average Test Time": (totalTime / this.tests) + "s",
                "Average Steps": avgSteps
            }
        };
    }

    static elementInvoke() {
        widgets.challengeListContainer.hide();
        widgets.workspaceContainer.show();
        processor.reset();
        widgets.console.clear();
        widgets.code.value = challengeStatusObject[this.name].solution;
        updateWidgets();
        currentChallenge = this;
        this.invoke();
    }
}

var challenges = [new Challenge("sandbox","Sandbox","bootcamp",":)",[],["sandbox"],["all"],1,function() {

},function(processor, i) {

},function(oldBlob, newBlob) {
    return true;
},function(oldBlob) {

},function() {}),new Challenge("tutorial","Tutorial","bootcamp","Add 5 to the value of <b>A</b>.<br><br>Instructions in assembly follow the following format:<br><br><code>label: instruction arg1,arg2</code><br><br>where <code>label</code> is an optional label referring to the memory address of the instruction (not needed here),<br>and <code>instruction</code> is the \"function\" being called, both being case-insensitive. Notice that there are no tokens for ending statements such as semicolons; Instructions only take up one line, and are run line-by-line<br><br>Some instructions require parameters, which may be numbers, expressions, or register references, depending on the instruction.<br><br>To complete this challenge, use the instruction <op>adi</op> <--(click to see usage).<br><br>When you think you've found the solution, click <b>Test</b>.",[],["tutorial","adi"],["A"],256,function() {
    doTutorial();
},function(processor, i) {
    processor.registers.A.value = i;
},function(oldBlob, newBlob) {
    return oldBlob.registers.A.plus(5).value === newBlob.registers.A.value;
},function(oldBlob) {
    return {
        registers: {
            A: oldBlob.registers.A.plus(5)
        }
    };
},Challenge.regDiff),new Challenge("add","Add Register","bootcamp","Subtract 1 from the value of <b>B</b>, then add that value to the value of <b>A</b>.<br><br>For many instructions, there exist two versions - one that operates using an explicit value (like <op>adi</op>), and one that operates using a register's value.<br><br>For this challenge, you will use the version of <op>adi</op> that takes a register as an argument instead of a value, and uses that register's value to add to <b>A</b>: <op>add</op><br><br>There also exist subtraction instructions <op>sui</op> and <op>sub</op> that mirror these.",["tutorial"],["add"],["A","B"],256 * 256,function() {

},function(processor, i) {
    processor.registers.A.value = i / 256;
    processor.registers.B.value = i & (255);
},function(oldBlob, newBlob) {
    return newBlob.registers.A.equals(oldBlob.registers.A.plus(oldBlob.registers.B.minus(1)));
},function(oldBlob) {
    return {
        registers: {
            A: oldBlob.registers.A.plus(oldBlob.registers.B.minus(1))
        }
    };
},Challenge.regDiff),new Challenge("expressions","Expressions","bootcamp","Add <code>8 + 7 / 3 * 16 mod 3</code> to the value of <b>A</b>.<br><br>Instead of explicit numbers, it is permitted to use mathematical expressions to pass a value.<br><br>Mathematical expressions may include the following operators:<br><code>+</code> - addition - produces the sum of two numbers<br><code>-</code> - subtraction, negation - produces the difference of two numbers or negates one number<br><code>*</code> - multiplication - produces the product of two numbers<br><code>/</code> - integer division - produces the quotient of two numbers rounded down<br><code>MOD</code> - modulo - produces the remainder of dividing two numbers<br><code>NOT</code> - logical NOT - produces the bit compliment of one number<br><code>AND</code> - logical AND - produces the bit-by-bit logical AND of two numbers<br><code>OR</code> - logical OR - produces the bit-by-bit logical OR of two numbers<br><code>XOR</code> - logical XOR - produces the bit-by-bit logical XOR of two numbers<br><code>SHR</code> - bit shift right - produces the value of the first operand bit-shifted right a number of times equal to the second operand<br><code>SHL</code> - bit shift left - produces the value of the first operand bit-shifted left a number of times equal to the second operand<br><code>()</code> - parentheses - indicates a sub-expression is to be evaluated first",["tutorial"],["expressions"],["A"],256,function() {

},function(processor, i) {
    processor.registers.A.value = i;
},function(oldBlob, newBlob) {
    return newBlob.registers.A.equals(oldBlob.registers.A.plus(8 + parseInt(7 / 3) * 16 % 3));
},function(oldBlob) {
    return {
        registers: {
            A: oldBlob.registers.A.plus(8 + parseInt(7 / 3) * 16 % 3)
        }
    };
},Challenge.regDiff),new Challenge("memcpy","Copying Memory","computer","Copy 64 bytes of memory starting at the address stored in <b>HL</b> to the address 100 bytes later (<b>HL</b> + 100).",["tutorial"],["memcpy"],["all"],100,function() {},function(processor, i) {
    this.root = int8.random().toInt16().plus(1000);
    this.newRoot = this.root.plus(100);
    processor.registers.HL.value = this.root.value;
    for (var i = 0; i < 64; i++) {
        processor.memory.setByte(this.root.plus(i), int8.randomNonZero());
    }
},function(oldBlob, newBlob) {
    var om = oldBlob.memoryBlob;
    var nm = newBlob.memoryBlob;

    //console.log(om, nm);
    
    for (var i = 0; i < 64; i++) {
        if (coerceInt(om[i + this.root.value]) !== coerceInt(nm[i + this.newRoot.value])) {
            return false;
        }
    }

    return true;
},function(oldBlob) {
    var c = oldBlob.memoryBlob;
    var ret = {
        memoryBlob: []
    };
    
    for (var i = 0; i < 64; i++) {
        ret.memoryBlob[i + this.newRoot.value] = c[i + this.root.value];
    }

    return ret;
},Challenge.memDiff),new Challenge("addsub","Addition and Subtraction","bootcamp","Set the value of <b>A</b> to equal: <b>A</b> + <b>B</b> - <b>D</b> - 1 + <b>C</b> + 80<br><br>Useful instructions: <op>inr</op> <op>dcr</op> <op>add</op> <op>sub</op> <op>adi</op> <op>sui</op>",["add"],["addsub"],["A","B","C","D"],10000,function() {},function(processor, i) {
    processor.registers.A.value = ~~(Math.random() * 256);
    processor.registers.B.value = ~~(Math.random() * 256);
    processor.registers.C.value = ~~(Math.random() * 256);
    processor.registers.D.value = ~~(Math.random() * 256);
},function(oldBlob, newBlob) {
    var or = oldBlob.registers;
    return newBlob.registers.A.equals(or.A.value + or.B.value - or.D.value - 1 + or.C.value + 80);
},function(oldBlob) {
    var or = oldBlob.registers;
    var ret = {
        registers: {
            A: new int8(or.A.value + or.B.value - or.D.value - 1 + or.C.value + 80)
        }
    };

    return ret; 
},Challenge.regDiff),new Challenge("devices","I/O Devices","bootcamp","Accept two inputs from the device (device 0) and send the device their sum.<br><br>Many assembly projects have to do with interfacing with certain devices, receiving input and sending output.<br><br>This is accomplished through the <op>in</op> and <op>out</op> instructions.",["addsub"],["iodevices"],["A","B"],1000,function() {
    var d = new IO_SumRequester(processor);
    setDevice(d);
    processor.setDevice(0, d);
},function(processor, i) {
    currentDevice.reset();
},function(oldBlob, newBlob) {
    return currentDevice.lastReceived && currentDevice.lastReceived.value === (currentDevice.bytesToSend.reduce((l, r) => l.value + r.value) & 0xff);
},function(oldBlob) {
    return {
        sum: currentDevice.bytesToSend.reduce((l, r) => l.value + r.value)
    };
},function(diffWidget, oldBlob, expectedBlob) {
    var d = new IO_SumRequester(processor);
    d.$inner.innerText = currentDevice.bytesToSend.map(i8 => i8.toDecString()).join(" ");
    d.$sum.innerText = "Sum: " + expectedBlob.sum;

    diffWidget.appendWidget("Expected Device", new WrapperWidget(d.$element));
    diffWidget.appendWidget("Your Device", new WrapperWidget(currentDevice.$element.cloneNode(true)));
}),new Challenge("bitwise","Bitwise Operations","bootcamp","Set the value of <b>A</b> to <code><b>A</b> & <b>B</b> | <b>C</b> ^ 255</code>. You can assume all 3 registers will hold random values.<br><br>Like the addition and subtraction instructions, there exist instructions that perform logical bitwise operations AND, OR, and XOR using either an explicit value/expression or a register.<br><br>These operations are as follows:<br><br><table class=\"myAwesomeTable\"><tr><th>Operation</th><th>Immediate Value</th><th>Register Value</th></tr><tr><td>AND</td><td><op>ANI</op></td><td><op>ANA</op></td></tr><tr><td>OR</td><td><op>ORI</op></td><td><op>ORA</op></td></tr><tr><td>XOR</td><td><op>XRI</op></td><td><op>XRA</op></td></tr></table>",["add"],["bitwise"],["A","B","C"],10000,function() {

},function(processor, i) {
    processor.registers.A.value = ~~(Math.random() * 256);
    processor.registers.B.value = ~~(Math.random() * 256);
    processor.registers.C.value = ~~(Math.random() * 256);
},function(oldBlob, newBlob) {
    var or = oldBlob.registers;
    return newBlob.registers.A.equals(or.A.and(or.B).or(or.C).xor(255));
},function(oldBlob) {
    var or = oldBlob.registers;
    return {
        registers: {
            A: or.A.and(or.B).or(or.C).xor(255)
        }
    };
},Challenge.regDiff),new Challenge("carry","Carry Bit","bootcamp","Set the Carry Bit to 1 if the value of <b>A</b> is less than 200, and set it to 0 otherwise. You may assume the Carry Bit is initially set to 0.<br><br>The Carry Bit is bit 0 (least significant) of the Status Register <b>S</b>, and is set according to the result of the previous operation.<br><br>There are two instructions that operate directly on the Carry Bit, which are <op>stc</op> and <op>cmc</op>.<br><br>Addition operations will set the carry bit to 1 if an overflow occurs (the value of the register being operated upon exceeds 0xFF and wraps back around).<br>If no overflow occurs, the Carry Bit will be set to 0.<br><br>e.g. Adding 200 to a register holding a value of 100 will set that register's value to (100 + 200) mod 256 = 44, and will set the Carry Bit to 1.<br><br>Addition operations that affect the carry bit: <op>add</op> <op>adi</op> <op>adc</op> <op>aci</op> <op>dad</op><br><br>Subtraction operations will set the carry bit if an underflow occurs (the value of the register being operated upon goes below 0x00 and wraps around).<br>If no underflow occurs, the Carry Bit will be set to 0.<br><br>e.g. Subtracting 200 from a register holding a value of 100 will set that register's value to (100 - 200) mod 256 = 156, and will set the Carry Bit to 1.<br><br>Subtraction operations that affect the carry bit: <op>sub</op> <op>sui</op> <op>sbb</op> <op>sbi</op> <br><br>The Rotate instructions affect the Carry Bit in their own unique ways as well.<br><br>Rotate instructions: <op>rlc</op> <op>rrc</op> <op>ral</op> <op>rar</op><br><br>Operations that set the Carry Bit to 0: <op>ana</op> <op>ani</op> <op>ora</op> <op>ori</op> <op>xra</op> <op>xri</op><br><br>Other operations that affect the Carry Bit: <op>dma</op> <op>cmp</op> <op>cmi</op>",["addsub"],["carryBit"],["A","S"],256,function() {

},function(processor, i) {
    processor.registers.A.value = i;
    processor.registers.S.value = 0;
},function(oldBlob, newBlob) {
    //console.log((newBlob.registers.S.value & 1) === 1, oldBlob.registers.A.equals(newBlob.registers.A));
    return (oldBlob.registers.A.value < 200 ? (newBlob.registers.S.value & i8080.flagMasks.carry) : !(newBlob.registers.S.value & i8080.flagMasks.carry));
},function(oldBlob) {
    return {
        registers: {
            S: new int8(oldBlob.registers.A.value < 200 ? i8080.flagMasks.carry : 0)
        }
    };
},Challenge.statusDiff),new Challenge("zero","Zero Bit","bootcamp","Set the Zero Bit to 1. You may assume that it is set to 0 initially, and that <b>A</b> will hold a random value.<br><br>The Zero Bit is bit 6 of the Status Register <b>S</b>, and is set according to the result of the previous operation.<br><br>The Zero Bit will be set to 1 if an operations results in a value of 0, and will be set to 0 otherwise.<br><br>Operations that affect the Zero Bit: <op>inr</op> <op>dcr</op> <op>dma</op> <op>add</op> <op>adi</op> <op>adc</op> <op>aci</op> <op>sub</op> <op>sui</op> <op>sbb</op> <op>sbi</op> <op>ana</op> <op>ani</op> <op>ora</op> <op>ori</op> <op>xra</op> <op>xri</op> <op>cmp</op> <op>cmi</op> ",["addsub"],["zeroBit"],["A","S"],256,function() {

},function(processor, i) {
    processor.registers.A.value = i;
},function(oldBlob, newBlob) {
    return (newBlob.registers.S & i8080.flagMasks.zero);
},function(oldBlob) {
    return {
        registers: {
            S: new int8(i8080.flagMasks.zero)
        }
    };
},Challenge.statusDiff),new Challenge("sign","Sign Bit","bootcamp","Compliment the Sign Bit (set it to 0 if it is 1, and set it to 1 if it is 0).<br><br>The Sign Bit is bit 7 (most significant) of the Status Register <b>S</b>, and is set according to the result of the previous operation.<br><br>The Sign Bit is set to 1 if the result of the previous operation is negative according to <a target=\"_blank\" href=\"https://en.wikipedia.org/wiki/Two%27s_complement\">Two's Compliment</a> arithmetic, and set to 0 otherwise.<br><br>As such, the Sign Bit can also be seen as representing bit 7 of the previous operation, as bit 7 being set indicates a negative number in Two's Compliment arithmetic for 8-bit numbers.<br><br>Building upon this, it can be said that the range of numbers from 128 through 255 (representing -128 through -1) will set the Sign Bit to 1, with 0-127 setting it to 0.<br><br>The following operations affect the Sign Bit: <op>inr</op> <op>dcr</op> <op>dma</op> <op>add</op> <op>adi</op> <op>adc</op> <op>aci</op> <op>sub</op> <op>sui</op> <op>sbb</op> <op>sbi</op> <op>ana</op> <op>ani</op> <op>ora</op> <op>ori</op> <op>xra</op> <op>xri</op> <op>cmp</op> <op>cmi</op>",["addsub"],["signBit"],["A","S"],256,function() {

},function(processor, i) {
    processor.registers.A.value = i;
    processor.setZSP(processor.registers.A);
},function(oldBlob, newBlob) {
    return (oldBlob.registers.S.value & i8080.flagMasks.sign) ^ (newBlob.registers.S.value & i8080.flagMasks.sign);
},function(oldBlob) {
    return {
        registers: {
            S: new int8((oldBlob.registers.S & i8080.flagMasks.sign) ^ i8080.flagMasks.sign)
        }
    };
},Challenge.statusDiff),new Challenge("parity","Parity Bit","bootcamp","Compliment the Parity Bit.<br><br>The Parity Bit is bit 2 of the Status Register <b>S</b>, and is set according the result of the previous operation.<br><br>The Parity Bit is set according to a number's <i>bit parity</i>.<br><br>Bit parity is determined by counting up the number of bits in a number that are equal to 1, and determining whether that number is odd or even.<br><br>For example, the number 01101010B (106) has 4 bits set to 1, and since 4 is even, it is said to have <i>even</i> bit parity.<br>11101010B (234) has 5 bits set to 1, however, so it is said to have <i>odd</i> bit parity.<br><br>The Parity Bit will be set to 1 if the result of the previous operation has even bit parity, and 0 for odd.<br><br>Operations that affect the Parity Bit: <op>inr</op> <op>dcr</op> <op>dma</op> <op>add</op> <op>adi</op> <op>adc</op> <op>aci</op> <op>sub</op> <op>sui</op> <op>sbb</op> <op>sbi</op> <op>ana</op> <op>ani</op> <op>ora</op> <op>ori</op> <op>xra</op> <op>xri</op> <op>cmp</op> <op>cmi</op>",["addsub","bitwise"],["parityBit"],["A","S"],256,function() {

},function(processor, i) {
    processor.registers.A.value = i;
    processor.setZSP(processor.registers.A);
},function(oldBlob, newBlob) {
    return (oldBlob.registers.S.value & i8080.flagMasks.parity) ^ (newBlob.registers.S.value & i8080.flagMasks.parity);
},function(oldBlob) {
    return {
        registers: {
            A: null,
            S: new int8((oldBlob.registers.S & i8080.flagMasks.parity) ^ i8080.flagMasks.parity)
        }
    };
},Challenge.statusDiffWithReg),new Challenge("jmp","Labels and Jumping","bootcamp","Set the value of <b>A</b> to the value of <b>B</b> times the value of <b>C</b>.<br><br>Recall the format for assembly instructions:<br><br><code>label: instruction arg1,arg2</code><br><br>Labels are a way to remember certain instructions/points in memory for future use, and are often used for looping.<br><br>Labels can be between 1-5 characters (longer labels will be truncated to 5 characters), are NOT case sensitive (<code>LABEL</code> is the same as <code>label</code>), and must start with a either a letter A-Z, or one of the symbols @ or ?.<br><br>Labels can be used as variables which contain a 16-bit value corresponding to the memory address that their line is assembled to - this allows them to be used with the <op>jmp</op> command.<br><br>In order to transfer execution to the point of a label, the <op>jmp</op> instruction is used. For example, the following code will add 5 to the <b>accumulator</b> indefinitely:<br><br><code>loop: add 5<br>jmp loop</code><br><br>This, of course, isn't very useful. That's why there exist <i>conditional jump instructions</i>. Conditional jump instructions first check the value of a status bit, and depending on that value, either performs a jump operation or does nothing.<br><br>The conditional jump instructions are as follows:<br><br><table class='myAwesomeTable'><tr><th>Status Bit</th><th>Jumps if 1</th><th>Jumps if 0</th></tr><tr><td>Zero</td><td><op>jz</op></td><td><op>jnz</op></td></tr><tr><td>Carry</td><td><op>jc</op></td><td><op>jnc</op></td></tr><tr><td>Parity</td><td><op>jpe</op></td><td><op>jpo</op></td></tr><tr><td>Sign</td><td><op>jm</op></td><td><op>jp</op></td></tr></table>",["tutorial","addsub","carryBit","zeroBit","parityBit","signBit"],["jmp","mult"],["A","B","C"],10000,function() {

},function(processor, i) {
    processor.registers.B.value = ~~(Math.random() * 256);
    processor.registers.C.value = ~~(Math.random() * 256);
},function(oldBlob, newBlob) {
    var or = oldBlob.registers;
    return newBlob.registers.A.equals(or.B.times(or.C));
},function(oldBlob) {
    var or = oldBlob.registers;
    return {
        registers: {
            A: or.B.times(or.C)
        }
    };
},Challenge.regDiff),new Challenge("regpair","Register Pairs","bootcamp","Set the value of <b>DE</b> to the value of <b>BC</b> + 20.<br><br>Register Pairs are formed by combining two 8-bit registers into one 16-bit register.<br><br>The value of a Register Pair is formed by concatenating the first register's bits with the second's.<br><br>For example, if <b>B</b> has a value of 0x5A and <b>C</b> has a value of 0x73, <b>BC</b> will have a value of 0x5A73.<br><br>Operating upon a register that is a part of a Register Pair will affect that Register Pair's value, and vice versa.<br><br>There exist 4 Register Pairs and 2 registers that sometimes act as Register Pairs, and those are as follows:<br><br><u>Register Pairs</u><br><b>BC</b> - Register Pair made up of <b>B</b> and <b>C</b>.<br><b>DE</b> - Register Pair made up of <b>D</b> and <b>E</b>.<br><b>HL</b> - Register Pair made up of <b>H</b> and <b>L</b> - used as a default Register Pair by some instructions.<br><b>PSW</b> - Register Pair made up of <b>S</b> and <b>A</b> - useful for storing/recalling the state of the processor using the stack.<br><br><u>Other 16-bit Registers</u><br><b>PC</b> - The Program Counter, which stores and controls the memory address of the instruction being currenetly executed.<br><b>SP</b> - The Stack Pointer, which stores and controls the root address of the stack.<br><br>The instructions that operate specifically on/with Register Pairs are as follows:<br><br><op>stax</op> <op>ldax</op> <op>push</op> <op>pop</op> <op>lxi</op> <op>dad</op> <op>inx</op> <op>dcx</op> <op>xchg</op> <op>xthl</op> <op>shld</op> <op>lhld</op> <op>pchl</op> <op>sphl</op><br><br><b>(Note that Register Pairs BC, DE, and HL are to be referred to as B, D, and H when used as an argument for an instruction.)</b>",["addsub"],["regpair"],["all"],10000,function() {

},function(processor, i) {
    processor.registers.BC.value = ~~(Math.random() * 256 * 256);
    processor.registers.DE.value = ~~(Math.random() * 256 * 256);
},function(oldBlob, newBlob) {
    var or = oldBlob.registers;
    return newBlob.registers.DE.equals(or.BC.plus(20));
},function(oldBlob) {
    var or = oldBlob.registers;
    return {
        registers: {
            DE: or.BC.plus(20)
        }
    };
},Challenge.regDiff),new Challenge("screen","Screen - Checkerboard","devices","Output a checkerboard design on the screen, starting with a black square.<br><br>The screen device is a 9x9 monochrome screen, and accepts input as a series of two bytes - the first byte will indicate the 0-based index of the pixel to be operated upon, and the second byte will determine the operation. A second byte containing the value 0 will turn the pixel off, whereas any other value with turn the pixel on.",["iodevices"],["screen"],["all"],1,function() {
    var d = new IO_Screen(processor, 9, 9);
    setDevice(d);
    processor.setDevice(0, d);
},function(processor, i) {
    currentDevice.reset();
},function(oldBlob, newBlob) {
    return array_compare(currentDevice.array, [
        1, 0, 1, 0, 1, 0, 1, 0, 1,
        0, 1, 0, 1, 0, 1, 0, 1, 0,
        1, 0, 1, 0, 1, 0, 1, 0, 1,
        0, 1, 0, 1, 0, 1, 0, 1, 0,
        1, 0, 1, 0, 1, 0, 1, 0, 1,
        0, 1, 0, 1, 0, 1, 0, 1, 0,
        1, 0, 1, 0, 1, 0, 1, 0, 1,
        0, 1, 0, 1, 0, 1, 0, 1, 0,
        1, 0, 1, 0, 1, 0, 1, 0, 1
    ]);
},function(oldBlob) {
    return {
        array: [
            1, 0, 1, 0, 1, 0, 1, 0, 1,
            0, 1, 0, 1, 0, 1, 0, 1, 0,
            1, 0, 1, 0, 1, 0, 1, 0, 1,
            0, 1, 0, 1, 0, 1, 0, 1, 0,
            1, 0, 1, 0, 1, 0, 1, 0, 1,
            0, 1, 0, 1, 0, 1, 0, 1, 0,
            1, 0, 1, 0, 1, 0, 1, 0, 1,
            0, 1, 0, 1, 0, 1, 0, 1, 0,
            1, 0, 1, 0, 1, 0, 1, 0, 1
        ]
    };
},function(diffWidget, oldBlob, expectedBlob) {
    var d = new IO_Screen(processor);
    d.setArray(expectedBlob.array);

    diffWidget.appendWidget("Expected Device", new WrapperWidget(d.$element));
    var $c = currentDevice.$element.cloneNode(true);
    $c.childNodes[0].getContext("2d").drawImage(currentDevice.$canvas, 0, 0);
    diffWidget.appendWidget("Your Device", new WrapperWidget($c));
}),new Challenge("screenReverse","Screen - Mirror","devices","Mirror the screen horizontally. The screen is device 0.<br><br>In addition to writing pixels to the screen, you may read pixels. This can be done by sending the screen the index on which to operate, then using the <op>in</op> command to read a byte from the screen. A 0 read from the screen will indicate that the pixel is not turned on, whereas any other value will indicate that the pixel is turned on.<br><br>Requesting a pixel in this fashion will reset the screen's input state in the same way that writing a pixel does, so the next thing you will have to do will always be to select an index.",["screen"],["screenReverse"],["all"],100,function() {
    var d = new IO_Screen(processor, 9, 9);
    setDevice(d);
    processor.setDevice(0, d);
},function(processor, i) {
    currentDevice.reset();
    var arr = [];
    for (var i = 0; i < 81; i++) {
        arr.push(pick1(0, 1));
    }

    currentDevice.setArray(arr);
    currentDevice.ogArray = array_copy(arr);
},function(oldBlob, newBlob) {
    return array_compare(currentDevice.array, array_mirror_h(array_copy(currentDevice.ogArray), currentDevice.resX));
},function(oldBlob) {
    return {
        array: array_mirror_h(array_copy(currentDevice.ogArray), currentDevice.resX)
    };
},function(diffWidget, oldBlob, expectedBlob) {
    var d = new IO_Screen(processor);
    var $c;

    d.setArray(currentDevice.ogArray);
    $c = d.$element.cloneNode(true);
    $c.childNodes[0].getContext("2d").drawImage(d.$canvas, 0, 0);
    diffWidget.appendWidget("Input Device", new WrapperWidget($c));

    d.setArray(expectedBlob.array);
    $c = d.$element.cloneNode(true);
    $c.childNodes[0].getContext("2d").drawImage(d.$canvas, 0, 0);
    diffWidget.appendWidget("Expected Device", new WrapperWidget($c));

    $c = currentDevice.$element.cloneNode(true);
    $c.childNodes[0].getContext("2d").drawImage(currentDevice.$canvas, 0, 0);
    diffWidget.appendWidget("Your Device", new WrapperWidget($c));
}),new Challenge("sqrt","Square Root","math","Set the value of <b>A</b> to the square root of itself (rounded down). You may assume that <b>A</b> will hold a random value.",["addsub"],["sqrt"],["all"],1000,function() {

},function(processor, i) {
    processor.registers.A.value = int8.random().value;
},function(oldBlob, newBlob) {
    return ~~Math.sqrt(oldBlob.registers.A.value) === newBlob.registers.A.value;
},function(oldBlob) {
    return {
        registers: {
            A: new int8(Math.sqrt(oldBlob.registers.A.value))
        }
    };
},Challenge.regDiff),new Challenge("gcd","GCD","math","Set the value of <b>A</b> to the Greatest Common Denominator (GCD) of the values of <b>B</b> and <b>C</b>.<br><br>The GCD is the largest number that evenly divides the two numbers (e.g. 2 is the greatest number that evenly goes into 4 and 6, so 2 is the GCD of 4 and 6.)",["addsub"],["gcd"],["all"],1000,function() {

},function(processor, i) {
    processor.registers.B.value = int8.random().value;
    processor.registers.C.value = int8.random().value;
},function(oldBlob, newBlob) {
    return gcd(oldBlob.registers.B.value, oldBlob.registers.C.value) === newBlob.registers.A.value;
},function(oldBlob) {
    return {
        registers: {
            A: new int8(gcd(oldBlob.registers.B.value, oldBlob.registers.C.value))
        }
    };
},Challenge.regDiff),new Challenge("prime","Prime Test","math","Set the value of <b>A</b> to <code>1</code> if the value stored in <b>BC</b> is prime. Set the value of <b>A</b> to <code>0</code> otherwise.",["addsub","regpair"],["prime"],["all"],65536,function() {

},function(processor, i) {
    processor.registers.BC.value = i;
},function(oldBlob, newBlob) {
    return newBlob.registers.A.value === +isPrime(oldBlob.registers.BC.value);
},function(oldBlob) {
    return {
        registers: {
            A: new int8(isPrime(oldBlob.registers.BC.value))
        }
    };
},Challenge.regDiff),new Challenge("memreg","Memory Register","bootcamp","Add 5 to the value stored in memory at the location specified by <b>HL</b>, then set the memory location immediately following that to double the value.<br><br>e.g. If the value at the memory address specified by the value of <b>HL</b> was 7, the value at the memory address specified by the value of HL plus one should be set to <code>(7 + 5) * 2 = 24</code>.<br><br>The Memory Register <b>M</b> is a special register in that its value is NOT independent from memory.<br><br>Operating upon the <b>M</b> register will affect the value stored in memory at the location specified by the value of <b>HL</b>.<br><br>For example, if the value at memory address 200 was 8, in order to increment this value to 9, one could set the value of <b>HL</b> to 200 and pass <b>M</b> as the argument for the <op>inr</op> instruction.",["regpair"],["memreg"],["all"],65536,function() {

},function(processor, i) {
    processor.registers.HL.value = randomInt(5000,8000);
    processor.memory.setByte(processor.registers.HL.value, int8.random());
    this.root = this.newRoot = processor.registers.HL.value;
},function(oldBlob, newBlob) {
    var om = oldBlob.memoryBlob;
    var nm = newBlob.memoryBlob;
    var i = oldBlob.registers.HL.value;

    //console.log(om, nm);

    return (nm[i] !== undefined) && (nm[i + 1] !== undefined) && (om[i] !== undefined)
        && ((coerceInt(nm[i]) & 0xff) === ((coerceInt(om[i]) + 5) & 0xff))
        && ((coerceInt(nm[i + 1]) & 0xff) === ((2 * (coerceInt(om[i]) + 5)) & 0xff));
},function(oldBlob) {
    var om = oldBlob.memoryBlob;
    var i = oldBlob.registers.HL.value;

    var ret = {
        memoryBlob: []
    };

    ret.memoryBlob[i] = new int8(coerceInt(om[i]) + 5);
    ret.memoryBlob[i + 1] = new int8((coerceInt(om[i]) + 5) * 2);
    
    return ret;
},Challenge.memDiff)]; // will be built from challenges.cdoc

function populateChallengeContainer() {
    widgets.challengeListContainer.clear();

    if (!challengeStatusObject.unlocked) {
        challengeStatusObject.unlocked = [];
    }

    var unlocked = challengeStatusObject.unlocked;

    for (var i = 0 ; i < challenges.length; i++) {
        let prereqs = challenges[i].prereqs;

        if (prereqs.every(prereq => unlocked.indexOf(prereq) !== -1)) {
            widgets.challengeListContainer.appendChallenge(challenges[i]);
        }
    }

    Storage.set("challengeStatus", challengeStatusObject);
}