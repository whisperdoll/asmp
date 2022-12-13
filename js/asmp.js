var VERSION = 0;

var processor,
    assembler,
    widgets,
    programLength,
    currentChallenge,
    challengeStatusObject,
    settingsObject,
    $currentSpotlight,
    spotlightZ,
    reference,
    currentDevice,
    playing = false,
    playTimer;

function init() {
    //test();

    reference = new Reference();
    processor = new i8080();
    assembler = new Assembler(processor);

    challengeStatusObject = Storage.get("challengeStatus", {});
    settingsObject = Storage.get("settings", {});

    var version = Storage.get("version", VERSION);
    if (version != VERSION) {
        challengeStatusObject = {};
        settingsObject = {};

        Storage.set("challengeStatus", challengeStatusObject);
        Storage.set("settings", settingsObject);
        Storage.set("version", VERSION);
    }

    initSettings();

    widgets = {
        find: function(selector, forceRefresh) {
            if (forceRefresh === undefined) forceRefresh = false;

            if (widgets.findCache.hasOwnProperty(selector) && !forceRefresh) {
                return widgets.findCache[selector];
            }

            return widgets.findCache[selector] = document.querySelector(selector);
        },
        findAll: function(selector) {
            return document.querySelectorAll(selector);
        },
        findCache: {},

        code: new CodeWidget(processor.lengthArray, processor.registers.PC),
        memory: new MemoryWidget(processor.memory, processor.lengthArray, processor.registers.PC),
        console: new ConsoleWidget(),
        workspaceContainer: new WrapperWidget(document.getElementById("container")),
        gameContainer: new WrapperWidget(document.getElementById("gameContainer")),
        registerContainer: new RegisterContainerWidget(),
        diff: new DiffWidget(),
        fade: new WrapperWidget(document.getElementById("fade")),
        tutorialText: new WrapperWidget(document.getElementById("tutorialText")),
        reference: new ReferenceWidget(reference),
        settings: new SettingsWidget(settingsObject),
        challengeListContainer: new ChallengeListContainerWidget(),
        deviceContainer: new DeviceContainerWidget(),
        stack: new StackWidget(processor.stack),
        statusFlags: new StatusWidget(processor.registers.S),

        panel1: new PanelWidget(1),
        panel2: new PanelWidget(2),
        panel3: new PanelWidget(3),
        panel4: new PanelWidget(4)
    };

    widgets.workspaceContainer.appendWidget(widgets.reference);
    widgets.workspaceContainer.$element.parentNode.appendChild(widgets.challengeListContainer.$element);

    var url = window.location;
    var params = new URLSearchParams(url.search);
    if (params.has("ref")) {
        widgets.reference.show();
        hideElement__(widgets.reference.$close);
        hideElement__(widgets.reference.$openNew);
        return;
    }



    document.getElementById("assemble").addEventListener("click", () => doAssemble());
    document.getElementById("play").addEventListener("click", () => doPlay());
    document.getElementById("pause").addEventListener("click", () => doPause());
    document.getElementById("step").addEventListener("click", () => doStep());
    document.getElementById("run").addEventListener("click", () => doRun());
    document.getElementById("test").addEventListener("click", () => doTest());
    document.getElementById("testcase").addEventListener("click", () => doTestCase());
    //document.getElementById("resetDevice").addEventListener("click", () => doResetDevice());
    document.getElementById("ref").addEventListener("click", () => doShowRef());
    document.getElementById("settings").addEventListener("click", () => doShowSettings());
    document.getElementById("back").addEventListener("click", () => doGoBack());
    /*document.getElementById("stackButton-memory").addEventListener("click", () => doToggleMemory());
    document.getElementById("stackButton-stack").addEventListener("click", () => doToggleStack());*/

    widgets.smallReference = new SmallReferenceWidget(widgets.reference);
    widgets.memorySeek = new MemorySeekWidget(widgets.memory);

    widgets.registerContainer.$element.id = "registerContainer-main";

    widgets.gameContainer.appendWidget(widgets.panel1);
    widgets.gameContainer.appendWidget(widgets.panel2);
    widgets.gameContainer.appendWidget(widgets.panel3);
    widgets.gameContainer.appendWidget(widgets.panel4);

    widgets.panel1.appendChild(document.getElementById("buttonContainer"));
    widgets.panel4.appendChild(document.getElementById("challengeText"));
    //widgets.panel2.appendChild(document.getElementById("stackButtonContainer"));

    widgets.registerContainer.importRegisters(processor.registers);
    widgets.panel3.appendWidget(widgets.code);
    widgets.panel2.appendWidget(widgets.registerContainer);
    widgets.workspaceContainer.appendWidget(widgets.diff);
    widgets.workspaceContainer.appendWidget(widgets.smallReference);
    widgets.workspaceContainer.appendWidget(widgets.settings);

    widgets.panel2.appendWidget(widgets.memory);
    widgets.panel2.appendWidget(widgets.memorySeek);
    widgets.panel2.appendWidget(widgets.statusFlags);
    widgets.panel2.appendWidget(widgets.stack);
    widgets.panel4.appendWidget(widgets.deviceContainer);
    widgets.panel4.appendWidget(widgets.console);
    
    widgets.workspaceContainer.hide();
    widgets.diff.hide();
    widgets.fade.hide();
    widgets.tutorialText.hide();
    widgets.reference.hide();
    widgets.smallReference.hide();
    widgets.settings.hide();
    widgets.challengeListContainer.show();

    populateChallengeContainer();

    updateWidgets();
}

function updateWidgets() {
    for (var wname in widgets) {
        if (widgets[wname].update) {
            widgets[wname].update();
        }
    }

    if (currentDevice) {
        widgets.deviceContainer.show();
    } else {
        widgets.deviceContainer.hide();
    }
}

function setDevice(d) {
    widgets.deviceContainer.clear();
    widgets.deviceContainer.appendDevice(d);
    widgets.deviceContainer.show();

    currentDevice = d;
}

function saveSolution() {
    if (!this.currentChallenge) {
        return;
    }

    var solution = widgets.code.value;
    challengeStatusObject[currentChallenge.name].solution = solution;
    Storage.set("challengeStatus", challengeStatusObject);
}

function spotlightElement($e, html, x, y, callback) {
    spotlightOff();
    widgets.tutorialText.show();
    widgets.fade.show();
    widgets.tutorialText.$element.innerHTML = html;

    if (x >= 0) {
        widgets.tutorialText.$element.style.left = x + "px";
        widgets.tutorialText.$element.style.right = "unset";
    } else {
        widgets.tutorialText.$element.style.right = (-x) + "px";
        widgets.tutorialText.$element.style.left = "unset";
    }

    if (y >= 0) {
        widgets.tutorialText.$element.style.top = y + "px";
        widgets.tutorialText.$element.style.bottom = "unset";
    } else {
        widgets.tutorialText.$element.style.bottom = (-y) + "px";
        widgets.tutorialText.$element.style.top = "unset";
    }

    if (!callback) {
        callback = endTutorial;
    }

    var $sc = document.createElement("div");
    $sc.className = "tutorialButtonContainer";
    var $s = document.createElement("span");
    $s.innerText = "Next";
    $s.className = "tutorialNext";
    $s.addEventListener("click", callback);
    var $c = document.createElement("span");
    $c.className = "tutorialSkip";
    $c.innerText = "Close";
    $c.addEventListener("click", endTutorial);
    $sc.appendChild($c);
    $sc.appendChild($s);
    widgets.tutorialText.$element.appendChild($sc);

    if ($e) {
        spotlightZ = getComputedStyle($e)["z-index"];
        $e.style["z-index"] = "1001";
        $currentSpotlight = $e;
        $e.scrollIntoView(true);
    }
}

function spotlightOff() {
    widgets.fade.hide();
    widgets.tutorialText.hide();
    if ($currentSpotlight) {
        $currentSpotlight.style["z-index"] = spotlightZ;
    }
}

function doTutorial() {
    var w = widgets.workspaceContainer.$element;
    widgets.console.print("hi :)");

    var t = [
        [null, "Welcome to ASMP? How do you play? I will teach today.", 450, 50],
        [widgets.code.$element, "This is your code zone,<br>You will write your code here.", 40, 100],
        [widgets.registerContainer.$element, "These are your registers...<br>They hold values<br>and can be altered<br>by certain instructions.<br><br>You can think of them<br>as global variables,<br>values stored outside of memory.", 45, 70],
        [widgets.memory.$element, "&lt;-- This is a display of what's currently in memory.<br>Assembling your program will cause it to be translated into bytes stored here.", 380, 100],
        [widgets.memorySeek.$element, "You can goto a specific memory address here.", 380, 210],
        [widgets.stack.$element, "This is a visualization of the contents of the stack<br>(which you will learn about later!)", 380, 300],
        [widgets.find("#challengeText"), "This is your current challenge.<br>In order to progress, you must<br>follow the specifications<br>outlined here.", 520, 90],
        [widgets.panel1.$element, "These are your little buttons.",  80, 100],
        [widgets.find("#assemble"), "<b>Assemble</b> compiles your code and puts it into memory.", 80, 0],
        [widgets.find("#play"), "<b>Play</b> will run your code one step at a time", 80, 60],
        [widgets.find("#pause"), "<b>Pause</b> compiles your code and puts it into memory.", 80, 123],
        [widgets.find("#step"), "<b>Step</b> runs the program in memory one instruction at at time, useful for debugging.", 80, 185],
        [widgets.find("#run"), "<b>Run</b> runs the program in memory in its entirety.", 80, 250],
        [widgets.find("#test"), "<b>Test</b> generates a series of test registers and/or test memory blocks and runs your program against them<br>to check to see if you've successfully completed the challenge.", 80, 305],
        [widgets.find("#testcase"), "<b>Gen Test Case</b> puts the processor into a test state<br>for debugging purposes. This is useful<br>if you want to step through your attempted solution.", 80, 360],
        [widgets.find("#ref"), "<b>Ref</b> will open the instruction reference.<br>This is useful if you've forgotten what commands do or are<br>curious as to what other commands might exist", 80, 425],
        [widgets.find("#settings"), "<b>Settings</b> will allow you to change certain settings, such as the speed at which programs <b>play</b>.", 80, 505],
        [widgets.find("#back"), "<b>Back</b> will take you back to the challenge list.<br>All of your code is saved per challenge,<br>so don't worry about losing anything you're working on!", 80, 550],
        [widgets.console.$element, "This is the console.<br>Error messages and test results will appear here, alongside other things.", 650, -220],
        [null, "That's all there is to it!<br>This tutorial will run every time this challenge is accessed, so if you ever get confused, feel free to come back!<br>Have fun! :)", 350, 50]
    ];

    var z = function(t, i) {
        if (i === t.length) {
            return null;
        }
        
        return function() { spotlightElement(...t[i], z(t, i + 1)); };
    };

    z(t, 0)();
}

function endTutorial() {
    spotlightOff();
}

function initSettings() {
    if (!settingsObject.playSpeed) {
        settingsObject.playSpeed = 200;
    }
    
    Storage.set("settings", settingsObject);
}

function doAssemble(silent) {
    saveSolution();
    if (silent === undefined) silent = false;
    if (!silent) widgets.console.clear();
    processor.reset();
    var z = assembler.assemble(widgets.code.value);
    if (!silent) updateWidgets();
    if (z.error) {
        widgets.console.error(z.error);
        return { error: z.error };
    }

    programLength = z.length;
    if (!silent) widgets.console.print("Assembled successfully. Yay!");
    return {
        error: null
    };
}

function doPlay() {
    if (!playing) {
        if (playTimer !== null) {
            clearInterval(playTimer);
        }

        playTimer = setInterval(function() {
            if (!playing || processor.registers.PC.value >= processor.programLength) {
                clearInterval(playTimer);
                playTimer = null;
                playing = false;
                return;
            }

            doStep();
        }, settings.playSpeed);

        playing = true;
    }
}

function doPause() {
    playing = false;
}

function doStep() {
    var z = processor.step();
    if (z.error) {
        widgets.console.error(z.error);
        playing = false;
    }
    updateWidgets();
}

function doRun() {
    var a = doAssemble();
    if (a.error) {
        return { error: a.error };
    }

    var x = processor.execute();
    var ret = {};

    if (x.error) {
        widgets.console.error(x.error);
        ret.error = x.error;
    } else {
        widgets.console.print("Done.");
    }

    var temp = processor.registers.PC.value;
    processor.registers.PC.value = x.finalValue;
    updateWidgets();
    processor.registers.PC.value = temp;
    return ret;
}

function showDiff(success, stats, oldBlob, expectedBlob) {
    widgets.diff.clear();
    success || currentChallenge.diffFn.call(currentChallenge, widgets.diff, i8080.matchBlobWithArray(oldBlob, currentChallenge.requiredRegs), expectedBlob);
    widgets.diff.update();
    widgets.diff.show(success, stats);
}

function doTest() {
    var x = doAssemble();
    if (x.error) {
        return;
    }

    widgets.console.print("Testing...");
    updateWidgets();

    setTimeout(() => {
        var z = currentChallenge.runTest(processor);
        var sd = () => showDiff(z.success, z.stats, z.success ? null : z.oldBlob, z.success ? null : currentChallenge.getExpectedFn(z.oldBlob));
        
        var $s = document.createElement("span");
        $s.className = "consoleLink";
        $s.innerText = "Test complete.";
        $s.addEventListener("click", sd);
        widgets.console.$element.appendChild($s);

        if (z.success) {
            challengeStatusObject[currentChallenge.name].success = true;
            Storage.set("challengeStatus", challengeStatusObject);
            widgets.find("#challenge-" + currentChallenge.name, true).className += " complete";
        }

        sd();

        updateWidgets();
    }, 200);
}

function doTestCase() {
    var x = doAssemble();
    if (x.error) {
        return;
    }

    currentChallenge.setupFn(processor, ~~(Math.random() * currentChallenge.tests));
    widgets.console.print("Generated test case.");
    updateWidgets();
}

function doResetDevice() {
    currentDevice && currentDevice.reset && currentDevice.reset();
}

function doShowRef() {
    widgets.reference.show();
}

function doShowSettings() {
    widgets.settings.show();
}

function doGoBack() {
    saveSolution();
    populateChallengeContainer();
    widgets.challengeListContainer.switchToPage(currentChallenge.category);
    widgets.workspaceContainer.hide();
    widgets.challengeListContainer.show();
    array_clear(processor.ioDevices);
    currentDevice = null;
    processor.reset();
}

function doToggleMemory() {
    showElement__(widgets.memory.$element);
    hideElement__(widgets.stack.$element);
    widgets.find("#stackButton-memory").classList.add("active");
    widgets.find("#stackButton-stack").classList.remove("active");
}

function doToggleStack() {
    hideElement__(widgets.memory.$element);
    showElement__(widgets.stack.$element);
    widgets.find("#stackButton-memory").classList.remove("active");
    widgets.find("#stackButton-stack").classList.add("active");
}

function deinit() {
    saveSolution();
}

window.onload = init;
window.onbeforeunload = deinit;

function assert(str) {
    tt++;
    if (eval(str)) {
        console.log("o test passed: " + str);
        tc++;
    } else {
        console.log("x test FAILED: " + str);
    }
}

function test() {
    i = new i8080();
    n = new Assembler(i);
    tc = 0;
    tt = 0;

    // int8 tests //
    x = new int8(0xFE);
    assert("x.value === 0xFE");
    assert("x.getBit(0) === 0");
    assert("x.getBit(4) === 1");
    x.setBit(4, 0);
    assert("x.getBit(4) === 0");
    assert("x.value === 0b11101110");

    // register tests //
    i.registers.A.value = 256;
    assert("i.registers.A.value == 0");

    for (var z = 0; z < 256 + 0x41; z++) {
        i.registers.A.value++;
    }
    assert("i.registers.A.value == 0x41");

    i.registers.B.value = 0x98;
    assert("i.registers.B.value == 0x98");
    assert("i.registers.BC.value == 0x9800");
    
    i.registers.BC.value = 0xF3FF;
    assert("i.registers.BC.value == 0xF3FF");
    assert("i.registers.B.value == 0xF3");
    assert("i.registers.C.value == 0xFF");
    i.registers.BC.value++;
    assert("i.registers.BC.value == 0xF400");
    assert("i.registers.B.value == 0xF4");
    assert("i.registers.C.value == 0x00");

    i.setFlag(i.flagMasks.parity, 1);
    assert("i.registers.S.value === 0x04");
    i.setFlag(i.flagMasks.sign, 1);
    assert("i.registers.S.value === 0x84");
    i.setFlag(i.flagMasks.parity, 0);
    assert("i.registers.S.value === 0x80");
    i.registers.S.value = 0x0;

    // mem tests //
    i.memory.setByte(0x80, 0xFE);
    assert("i.memory.getByte(0x80).value === 0xFE");
    //assert("i.memory.array[0x80].value === 0xFE");
    assert("i.memory.getWord(0x80).value === 0x00FE");
    i.memory.setWord(0x90, 0xEFA9);
    assert("i.memory.getByte(0x90 + 1).value === 0xEF");
    assert("i.memory.getByte(0x90).value === 0xA9");
    assert("i.memory.getWord(0x90).value === 0xEFA9");
    assert("i.memory.getWord(0x90).highBits.value === 0xEF");
    assert("i.memory.getWord(0x90).lowBits.value === 0xA9");

    // command tests //
    for (var cmdName in n.commands) {
        if (n.commands[cmdName].hasOwnProperty("test")) {
            n.commands[cmdName].test();
        }
    }


    // results //
    console.log(tc + "/" + tt + " tests passed");
}

function array_clear(array) {
    array = [];
}

function array_compare(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return false;
    }

    for (var i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }

    return true;
}

function array_copy(arr) {
    return arr.slice();
}

function array_swap(arr, i1, i2) {
    var temp = arr[i1];
    arr[i1] = arr[i2];
    arr[i2] = temp;
    return arr;
}

function array_mirror_h(arr, w) {
    if (w === undefined) {
        throw "array_mirror_h requires width arg";
    }

    var h = Math.ceil(arr.length / w);
    var hw = ~~(w / 2);
    for (var i = 0; i < h; i++) {
        for (var j = 0; j < hw; j++) {
            array_swap(arr, j + (i * w), w - j - 1 + (i * w));
        }
    }
    return arr;
}

function pick1(...args) {
    return args[~~(Math.random() * args.length)];
}

function randomInt(minInclusive, maxExclusive) {
    if (maxExclusive === undefined) {
        maxExclusive = minInclusive;
        minInclusive = 0;
    }

    return parseInt(Math.random() * (maxExclusive - minInclusive) + minInclusive);
}

function isPrime(x) {
    if (x < 2) {
        return false;
    } else if (x === 2) {
        return true;
    } else if (x % 2 === 0) {
        return false;
    }

    var len = ~~Math.sqrt(len) + 1;

    for (var i = 3; i < len; i += 2) {
        if (x % i === 0) {
            return false;
        }
    }

    return true;
};

function gcd(x, y) {
    if (x === 0 || y === 0) {
        return 0;
    }
    
    if (x > y) {
        var temp = x;
        x = y;
        y = temp;
    }

    for (var i = x; i > 0; i--) {
        if (x % i === 0 && y % i === 0) {
            return i;
        }
    }
}