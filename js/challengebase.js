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

var challenges = []; // will be built from challenges.cdoc

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