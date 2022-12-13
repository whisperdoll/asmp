function coerceInt(x) {
    switch(typeof(x)) {
        case "undefined": return 0;
        case "number":    return ~~x;
        case "string":    return ~~x;
        case "object":    return x.value;
        default:          return +x;
    }
}

class int8 {
    constructor(x) {
        this.value = x;
    }

    get value() {
        return this._value;
    }

    get signedValue() {
        return (this.sign === 1 ? this._value : -(this._value ^ 0xFF) - 1);
    }

    set value(x) {
        x = coerceInt(x);

        if (x < 0) {
            x = x ^ 0xFF + 1;
        }
        this._value = x & 0xFF; // keep last 8 bits
    }

    get sign() {
        return (this._value & 0x80 ? -1 : 1);
    }

    get compliment() {
        return new int8(this._value ^ 0xFF);
    }

    get twosCompliment() {
        return new int8((this._value ^ 0xFF) + 1);
    }

    setBit(bit, val) {
        val &= 1;
        if (val === 0) {
            this._value &= (1 << bit) ^ 0xFF;
        } else {
            this._value |= (1 << bit);
        }
    }

    getBit(bit) {
        return (this._value & (1 << bit)) >> bit;
    }

    toInt16() {
        return new int16(this._value);
    }

    copy() {
        return new int8(this._value);
    }

    toString(...args) {
        return this._value.toString(...args);
    }

    static random() {
        return new int8(Math.random() * (0xFF + 1));
    }

    static randomNonZero() {
        return new int8(Math.random() * 0xFF + 1);
    }

    plus(i8) {
        i8 = new int8(i8);
        return new int8(this.value + i8.value);
    }

    minus(i8) {
        i8 = new int8(i8);
        return new int8(this.value - i8.value);
    }

    times(i8) {
        i8 = new int8(i8);
        return new int8(this.value * i8.value);
    }

    dividedBy(i8) {
        i8 = new int8(i8);
        return new int8(this.value / i8.value);
    }

    and(i8) {
        return new int8(this.value & coerceInt(i8));
    }

    or(i8) {
        return new int8(this.value | coerceInt(i8));
    }

    xor(i8) {
        return new int8(this.value ^ coerceInt(i8));
    }

    mod(i8) {
        return new int8(this.value % coerceInt(i8));
    }

    equals(i8) {
        return this.value === (coerceInt(i8) & 255);
    }

    toHexString() {
        var s = this.value.toString(16).padStart(3, "0");
        return s.toUpperCase() + "H";
    }

    toBinString() {
        var s = this.value.toString(2).padStart(8, "0");
        return s + "B";
    }

    toDecString() {
        var s = this.value.toString(10);
        return s;
    }
}

class int16 {
    constructor(x) {
        this.value = x;
    }

    get value() {
        return this._value;
    }

    set value(x) {
        x = coerceInt(x);

        this._value = x & 0xFFFF;
    }

    get highBits() {
        return new int8((this._value & 0xFF00) >> 8);
    }

    set highBits(i8) {
        if (typeof(i8) === "number") {
            i8 = new int8(i8);
        }

        this._value = this._value & 0x00FF | (i8.value << 8);
    }

    get lowBits() {
        return new int8(this._value & 0x00FF);
    }

    set lowBits(i8) {
        if (typeof(i8) === "number") {
            i8 = new int8(i8);
        }

        this._value = this._value & 0xFF00 | i8.value;
    }

    static construct(i8_1, i8_2) {
        if (typeof(i8_1) === "number") {
            i8_1 = new int8(i8_1);
        }
        if (typeof(i8_2) === "number") {
            i8_2 = new int8(i8_2);
        }

        return new int16((i8_1.value << 8) | i8_2.value);
    }

    toInt8() {
        return this.lowBits;
    }

    copy() {
        return new int16(this._value);
    }

    toString(...args) {
        return this._value.toString(...args);
    }

    static random() {
        return new int16(Math.random() * (0xFFFF + 1));
    }

    static randomNonZero() {
        return new int16(Math.random() * 0xFFFF + 1);
    }

    plus(i16) {
        i16 = new int16(i16);
        return new int16(this.value + i16.value);
    }

    minus(i16) {
        i16 = new int16(i16);
        return new int16(this.value - i16.value);
    }

    times(i16) {
        i16 = new int16(i16);
        return new int16(this.value * i16.value);
    }

    dividedBy(i16) {
        i16 = new int16(i16);
        return new int16(this.value / i16.value);
    }

    and(i16) {
        return new int16(this.value & coerceInt(i16));
    }

    or(i16) {
        return new int16(this.value | coerceInt(i16));
    }

    xor(i16) {
        return new int16(this.value ^ coerceInt(i16));
    }

    mod(i16) {
        return new in16(this.value % coerceInt(i16));
    }

    equals(i16) {
        return this.value === coerceInt(i16) & 0xFFFF;
    }

    toHexString() {
        var s = this.value.toString(16).padStart(5, "0");
        return s.toUpperCase() + "H";
    }

    toBinString() {
        var s = this.value.toString(2).padStart(16, "0");
        return s + "B";
    }

    toDecString() {
        var s = this.value.toString(10);
        return s;
    }
}

class Register8 {
    constructor() {
        this._int8 = new int8(0);
    }

    get value() {
        return this._int8.value;
    }

    set value(x) {
        this._int8.value = x;
    }

    get int8() {
        return this._int8;
    }

    get int() {
        return this.int8;
    }

    plus(i8) {
        i8 = new int8(i8);
        return new int8(this.value + i8.value);
    }

    minus(i8) {
        i8 = new int8(i8);
        return new int8(this.value - i8.value);
    }

    times(i8) {
        i8 = new int8(i8);
        return new int8(this.value * i8.value);
    }

    dividedBy(i8) {
        i8 = new int8(i8);
        return new int8(this.value / i8.value);
    }

    and(i8) {
        return new int8(this.value & coerceInt(i8));
    }

    or(i8) {
        return new int8(this.value | coerceInt(i8));
    }

    xor(i8) {
        return new int8(this.value ^ coerceInt(i8));
    }

    mod(i8) {
        return new int8(this.value % coerceInt(i8));
    }

    equals(i16) {
        return this.value === coerceInt(i16) & 0xFFFF;
    }

    toHexString() {
        var s = this.value.toString(16).padStart(3, "0");
        return s.toUpperCase() + "H";
    }

    toBinString() {
        var s = this.value.toString(2).padStart(8, "0");
        return s + "B";
    }

    toDecString() {
        var s = this.value.toString(10);
        return s;
    }
}

class MRegister8 {
    constructor(addrReg16, memory) {
        this._reg = addrReg16;
        this._memory = memory;
    }

    get value() {
        return this._memory.getByte(this._reg.int16).value;
    }

    set value(x) {
        this._memory.setByte(this._reg.int16, x);
    }

    get int8() {
        return this._memory.getByte(this._reg.int16);
    }

    get int() {
        return this.int8;
    }

    plus(i8) {
        i8 = new int8(i8);
        return new int8(this.value + i8.value);
    }

    minus(i8) {
        i8 = new int8(i8);
        return new int8(this.value - i8.value);
    }

    times(i8) {
        i8 = new int8(i8);
        return new int8(this.value * i8.value);
    }

    dividedBy(i8) {
        i8 = new int8(i8);
        return new int8(this.value / i8.value);
    }

    and(i8) {
        return new int8(this.value & coerceInt(i8));
    }

    or(i8) {
        return new int8(this.value | coerceInt(i8));
    }

    xor(i8) {
        return new int8(this.value ^ coerceInt(i8));
    }

    mod(i8) {
        return new int8(this.value % coerceInt(i8));
    }

    equals(i16) {
        return this.value === coerceInt(i16) & 0xFFFF;
    }

    toHexString() {
        var s = this.value.toString(16).padStart(3, "0");
        return s.toUpperCase() + "H";
    }

    toBinString() {
        var s = this.value.toString(2).padStart(8, "0");
        return s + "B";
    }

    toDecString() {
        var s = this.value.toString(10);
        return s;
    }
}

class Register16 {
    constructor() {
        this._int16 = new int16(0);
    }

    get value() {
        return this._int16.value;
    }

    set value(x) {
        this._int16.value = x;
    }

    get int16() {
        return new int16(this.value);
    }

    get int() {
        return this.int16;
    }

    plus(i16) {
        i16 = new int16(i16);
        return new int16(this.value + i16.value);
    }

    minus(i16) {
        i16 = new int16(i16);
        return new int16(this.value - i16.value);
    }

    times(i16) {
        i16 = new int16(i16);
        return new int16(this.value * i16.value);
    }

    dividedBy(i16) {
        i16 = new int16(i16);
        return new int16(this.value / i16.value);
    }

    and(i16) {
        return new int16(this.value & coerceInt(i16));
    }

    or(i16) {
        return new int16(this.value | coerceInt(i16));
    }

    xor(i16) {
        return new int16(this.value ^ coerceInt(i16));
    }

    mod(i16) {
        return new in16(this.value % coerceInt(i16));
    }

    equals(i16) {
        return this.value === coerceInt(i16) & 0xFFFF;
    }

    toHexString() {
        var s = this.value.toString(16).padStart(5, "0");
        return s.toUpperCase() + "H";
    }

    toBinString() {
        var s = this.value.toString(2).padStart(16, "0");
        return s + "B";
    }

    toDecString() {
        var s = this.value.toString(10);
        return s;
    }
}

class Register8Pair {
    constructor(r8_1, r8_2) {
        this.register1 = r8_1;
        this.register2 = r8_2;
    }

    get value() {
        return (this.register1.value << 8) | this.register2.value;
    }

    set value(x) {
        var i16 = new int16(x);
        this.register1.value = i16.highBits.value;
        this.register2.value = i16.lowBits.value;
    }

    get int16() {
        return new int16(this.value);
    }

    get int() {
        return this.int16;
    }

    toHexString() {
        var s = this.value.toString(16).padStart(5, "0");
        return s.toUpperCase() + "H";
    }

    toBinString() {
        var s = this.value.toString(2).padStart(16, "0");
        return s + "B";
    }

    toDecString() {
        var s = this.value.toString(10);
        return s;
    }
}

class i8080 {
    constructor() {
        this.memory = new Memory(0xFFFF);

        this.registers = {
            A: new Register8(),
            B: new Register8(),
            C: new Register8(),
            D: new Register8(),
            E: new Register8(),
            H: new Register8(),
            L: new Register8()
        };

        this.registers.M = null;
        this.registers.BC = new Register8Pair(this.registers.B, this.registers.C);
        this.registers.DE = new Register8Pair(this.registers.D, this.registers.E);
        this.registers.HL = new Register8Pair(this.registers.H, this.registers.L);
        this.registers.PSW = null;

        this.registers.M = new MRegister8(this.registers.HL, this.memory);

        this.registers.S = new Register8();
        this.registers.PC = new Register16(); // program counter
        this.registers.SP = new Register16(); // stack pointer
        this.registers.PSW = new Register8Pair(this.registers.S, this.registers.A);


        this.register8Array = [
            this.registers.B,
            this.registers.C,
            this.registers.D,
            this.registers.E,
            this.registers.H,
            this.registers.L,
            this.registers.M,
            this.registers.A
        ];

        this.stack = new MemoryStack(this.memory, this.registers.SP);
        this.ioDevices = [];

        this.interruptsEnabled = false;
        this.stopped = false;
        this.programLength = 0;
        this.lengthArray = [];
        this.lastProcessed = {};
    }

    static get flagMasks() {
        return {
            // 0bSZ0X0P0C
            sign:       0b10000000,
            zero:       0b01000000,
            auxCarry:   0b00010000,
            parity:     0b00000100,
            carry:      0b00000001
        };
    }

    static determineBitParity(x) {
        x = coerceInt(x);

        var pbit = 1;
        while (x !== 0) {
            pbit ^= (x & 1);
            x >>= 1;
        }

        return pbit;
    }

    reset(clearMem) {
        if (clearMem === undefined) clearMem = true;

        if (clearMem) {
            this.memory.clear();
            this.stack.clear();
            this.programLength = 0;
        }

        for (var registerName in this.registers) {
            if (registerName !== "M")
                this.registers[registerName].value = 0;
        }
        
        /*this.ioDevices.forEach(d => {
            d.reset && d.reset();
        });*/

        this.interruptsEnabled = false;
        this.stopped = false;
    }

    clear(...args) {
        return this.reset(...args);
    }

    matchRegisters(robj) {
        // expects an object with register names as keys, will return an object with coinciding keys

        var ret = {};

        for (var reg in robj) {
            ret[reg] = this.registers[reg];
        }

        return ret;
    }

    exportRegisters() {
        var ret = {};

        for (var regName in this.registers) {
            ret[regName] = this.registers[regName].int.copy();
        }

        return ret;
    }

    importRegisters(regs) {
        for (var regName in regs) {
            this.registers[regName].value = regs[regName].value;
        }
    }

    getFlag(flagMask) {
        var ret = this.registers.S.value & flagMask;

        while (ret > 1) {
            ret >>= 1;
        }

        return ret;
    }

    setFlag(flagMask, val) {
        // val is 1 or 0 (which to set the flag to; 1 by default) //
        if (val === undefined) val = 1;
        if (val) {
            this.registers.S.value |= flagMask;
        } else {
            this.registers.S.value &= flagMask ^ 0xFF;
        }
    }

    setZSP(value8) {
        value8 = new int8(value8);
        this.setFlag(i8080.flagMasks.zero, value8.value === 0);
        this.setFlag(i8080.flagMasks.sign, value8.getBit(7));
        this.setFlag(i8080.flagMasks.parity, i8080.determineBitParity(value8));
    }
    
    getDevice(i) {
        i = new int8(i);
        return this.ioDevices[i.value] || null;
    }

    setDevice(i, device) {
        i = new int8(i);
        this.ioDevices[i.value] = device;
    }

    toBlob() {
        /*if (!window.times) {
            window.times = [0,0];
        }*/

        var ret = {};
        //window.times[0] -= Date.now();
        ret.registers = this.exportRegisters();
        //window.times[0] += Date.now();
        //window.times[1] -= Date.now();
        ret.memoryBlob = this.memory.toBlob();
        //window.times[1] += Date.now();
        return ret;
    }

    static matchBlob(dest, src) {
        var ret = {};

        if (src.registers) {
            ret.registers = {};

            for (var name in src.registers) {
                ret.registers[name] = dest.registers[name];
            }
        }

        if (src.memoryBlob) {
            ret.memoryBlob = src.memoryBlob; // this is fine this is ok
        }

        return ret;
    }

    static matchBlobWithArray(dest, array) {
        var ret = {
            registers: {},
            memoryBlob: dest.memoryBlob
        };

        var doAll = false;
        
        if (array.length === 0 || array[0] === "all") {
            doAll = true;
        }

        for (var name in dest.registers) {
            if (doAll || array.indexOf(name) !== -1) {
                ret.registers[name] = dest.registers[name];
            }
        }

        return ret;
    }

    static copyBlob(blob) {
        var ret = {};

        if (blob.registers) {
            ret.registers = {};
            for (var name in blob.registers) {
                ret.registers[name] = blob.registers[name].copy();
            }
        }

        if (blob.memoryBlob) {
            ret.memoryBlob = Memory.copyBlob(blob.memoryBlob);
        }

        return ret;
    }

    execute() {
        this.registers.PC.value = 0;
        var finalValue = 0;
        var steps = 0;

        while (this.registers.PC.value < this.programLength) {
            finalValue = this.registers.PC.value;
            var z = this.step();
            steps++;
            if (z.error) {
                return { error: z.error };
            }
            if (z.end) {
                break;
            }
        }

        return {
            error: null,
            finalValue: finalValue,
            steps: steps
        };
    }

    step() {
        if (this.registers.PC.value >= this.programLength) {
            widgets.console.warn("Cannot step past program's end");
            return {
                error: null
            };
        }

        if (!this.stopped) {
            var z = this.processByte(this.memory.getByte(this.registers.PC.value));
            if (z.error) {
                return { 
                    error: z.error
                };
            }

            if (z.end) {
                return {
                    end: true
                };
            }

            if (z.halt) {
                this.stopped = true;
            }

            if (z.hasOwnProperty("enableInterrupts")) {
                this.interruptsEnabled = z.enableInterrupts;
            }

            this.registers.PC.value++;
        }

        if (this.interruptsEnabled) {
            for (var i = 0; i < this.ioDevices.length; i++) {
                if (this.ioDevices[i].pendingInterrupt) {
                    // will have one instruction //
                    this.interruptsEnabled = false;
                    var z = this.processByte(this.ioDevices[i].interruptByte);
                    if (z.error) {
                        return {
                            error: z.error
                        };
                    }

                    if (z.end) {
                        return {
                            end: true
                        };
                    }

                    this.stopped = false;

                    if (z.halt) {
                        this.stopped = true;
                    }

                    if (z.hasOwnProperty("enableInterrupts")) {
                        this.interruptsEnabled = z.enableInterrupts;
                    }
                }
            }
        } else if (this.stopped) {
            return {
                error: "waiting for disabled interrupts"
            };
        }

        return {
            error: null
        };
    }

    processByte(byte) {
        byte = new int8(byte);
        var dret = {
            error: null
        };

        switch ((byte.value & 0b11000000) >> 6) {
            case 0b00: {
                var l3 = byte.value & 0b00000111;

                switch (l3) {
                    case 0b000: // nop
                        return dret;
                    case 0b001: { // lxi, dad
                        var rpi = (byte.value & 0b00110000) >> 4; // 0-3
                        var rp = this.resolveRegisterPair(rpi, this.registers.SP);
                        if (rp.error) {
                            return { error: rp.error };
                        }
                        rp = rp.register;

                        if (byte.getBit(3)) { // dad
                            this.setFlag(i8080.flagMasks.carry, (this.registers.HL.value + rp.value) > 0xFF);
                            this.registers.HL.value += rp.value;
                        } else { // lxi
                            this.registers.PC.value++;
                            rp.value = this.memory.getWord(this.registers.PC.value);
                            this.registers.PC.value++;
                        }
                        return dret;
                    }
                    case 0b010: { // stax, ldax, directthis.registers.PC
                        if (byte.getBit(5)) { // direct this.registers.PC
                            var op = (byte.value & 0b00011000) >> 3;
                            switch (op) {
                                case 0b00: { // shld
                                    this.registers.PC.value++;
                                    var a = this.memory.getWord(this.registers.PC.value);
                                    this.memory.setWord(a, this.registers.HL.value);
                                    this.registers.PC.value++;
                                    break;
                                }
                                case 0b01: { // lhld
                                    this.registers.PC.value++;
                                    var a = this.memory.getWord(this.registers.PC.value);
                                    this.registers.HL.value = this.memory.getWord(a);
                                    this.registers.PC.value++;
                                    break;
                                }
                                case 0b10: { // sta
                                    this.registers.PC.value++;
                                    var a = this.memory.getWord(this.registers.PC.value);
                                    this.memory.setByte(a, this.registers.A.value);
                                    this.registers.PC.value++;
                                    break;
                                }
                                case 0b11: { // lda
                                    this.registers.PC.value++;
                                    var a = this.memory.getWord(this.registers.PC.value);
                                    this.registers.A.value = this.memory.getByte(a);
                                    this.registers.PC.value++;
                                    break;
                                }
                            }
                        } else { // stax, ldax
                            var rpi = (byte.value & 0b00010000) >> 4;
                            var rp = this.resolveRegisterPair(rpi, this.registers.SP);
                            if (rp.error) {
                                return { error: rp.error };
                            }
                            rp = rp.register;

                            if (byte.getBit(3)) { // ldax
                                this.registers.A.value = this.memory.getByte(rp.value);
                            } else { // stax
                                this.memory.setByte(rp.value, this.registers.A.value);
                            }
                        }
                        return dret;
                    }
                    case 0b011: { // inx, dcx
                        var rpi = (byte.value & 0b00110000) >> 4;
                        var rp = this.resolveRegisterPair(rpi, this.registers.SP);
                        if (rp.error) {
                            return { error: rp.error };
                        }
                        rp = rp.register;

                        if (byte.getBit(3)) { // dcx
                            rp.value--;
                        } else { // inx
                            rp.value++;
                        }
                        return dret;
                    }
                    case 0b100: { // inr
                        var regi = (byte.value & 0b00111000) >> 3;
                        var reg = this.resolveRegister8(regi);
                        if (reg.error) {
                            return { error: reg.error };
                        }
                        reg = reg.register;
                        var auxBit = reg.int8.getBit(3);
                        reg.value++;
                        this.setFlag(i8080.flagMasks.auxCarry, (auxBit === 1 && reg.int8.getBit(3) === 0));
                        this.setZSP(reg.int8);
                        return dret;
                    }
                    case 0b101: { // dcr
                        var regi = (byte.value & 0b00111000) >> 3;
                        var reg = this.resolveRegister8(regi);
                        if (reg.error) {
                            return { error: reg.error };
                        }
                        reg = reg.register;
                        var auxBit = reg.int8.getBit(3);
                        reg.value--;
                        this.setFlag(i8080.flagMasks.auxCarry, (auxBit === 1 && reg.int8.getBit(3) === 0));
                        this.setZSP(reg.int8);
                        return dret;
                    }
                    case 0b110: { // mvi
                        var regi = (byte.value & 0b00111000) >> 3;
                        var reg = this.resolveRegister8(regi);
                        if (reg.error) {
                            return { error: reg.error };
                        }
                        reg = reg.register;
                        this.registers.PC.value++;
                        reg.value = this.memory.getByte(this.registers.PC.value);
                        return dret;
                    }
                    case 0b111: { // carry ops, cma, daa, rot ops
                        if (byte.getBit(5)) { // carry ops, cma, daa
                            if (byte.getBit(4)) { // carry ops
                                if (byte.getBit(3)) { // cmc
                                    this.setFlag(i8080.flagMasks.carry, this.getFlag(i8080.flagMasks.carry) ^ 1);
                                } else { // stc
                                    this.setFlag(i8080.flagMasks.carry, 1);
                                }
                            } else { // cma, daa
                                if (byte.getBit(3)) { // cma
                                    this.registers.A.value ^= 0xFF;
                                } else { // daa
                                    var lobits = (this.registers.A.value & 0b00001111);
                                    if (lobits > 9 || this.getFlag(i8080.flagMasks.auxCarry)) {
                                        this.registers.A.value += 6;
                                        this.setFlag(i8080.flagMasks.auxCarry, lobits > 9);
                                    }
                                    var hibits = (this.registers.A.value & 0b11110000) >> 4;
                                    if (hibits > 9 || this.getFlag(i8080.flagMasks.carry)) {
                                        hibits += 6;
                                        this.setFlag(i8080.flagMasks.carry, hibits > 0b1111);
                                        hibits &= 0b00001111;
                                    }
                                    this.registers.A.value &= 0b00001111;
                                    this.registers.A.value |= hibits << 4;
                                    this.setZSP(this.registers.A.value);
                                }
                            }
                        } else { // rot ops
                            var op = (byte & 0b00011000) >> 3;
                            var hibit = this.registers.A.int8.getBit(7);
                            var lobit = this.registers.A.int8.getBit(0);
                            var cbit = this.getFlag(i8080.flagMasks.carry);

                            switch (op) {
                                case 0b00: { // rlc
                                    this.setFlag(i8080.flagMasks.carry, hibit);
                                    this.registers.A.value <<= 1;
                                    this.registers.A.int8.setBit(0, hibit);
                                }
                                case 0b01: { // rrc
                                    this.setFlag(i8080.flagMasks.carry, lobit);
                                    this.registers.A.value >>= 1;
                                    this.registers.A.int8.setBit(7, lobit);
                                }
                                case 0b10: { // ral
                                    this.setFlag(i8080.flagMasks.carry, hibit);
                                    this.registers.A.value <<= 1;
                                    this.registers.A.int8.setBit(0, cbit);
                                }
                                case 0b11: { // rar
                                    this.setFlag(i8080.flagMasks.carry, lobit);
                                    this.registers.A.value >>= 1;
                                    this.registers.A.int8.setBit(7, cbit);
                                }
                            }
                        }
                        return dret;
                    }
                } // switch l3
                return dret;
            } // case 0b00
            case 0b01: { // hlt, mov
                var src = this.resolveRegister8(byte.value & 0b00000111);
                if (src.error) return { error: src.error };
                src = src.register;

                var dest = this.resolveRegister8((byte.value & 0b00111000) >> 3);
                if (dest.error) return { error: dest.error };
                dest = dest.register;

                if (src === this.registers.M && dest === this.registers.M) { // hlt
                    return {
                        halt: true
                    };
                } else { // mov
                    dest.value = src.value;
                }

                return dret;
            }
            case 0b10: { // ->A ops
                var op = (byte.value & 0b00111000) >> 3;
                var reg = this.resolveRegister8(byte.value & 0b00000111);
                if (reg.error) {
                    return {
                        error: reg.error
                    };
                }
                reg = reg.register;
                switch (op) {
                    case 0b000: // add
                    case 0b001: { // adc
                        var newVal = this.registers.A.value + reg.value + (op & this.getFlag(i8080.flagMasks.carry));
                        this.setFlag(i8080.flagMasks.carry, newVal > 0xFF);
                        var auxBit = this.registers.A.int8.getBit(3);
                        this.registers.A.value = newVal;
                        this.setFlag(i8080.flagMasks.auxCarry, auxBit === 1 && this.registers.A.int8.getBit(3) === 0);
                        this.setZSP(this.registers.A.int8);
                        return dret;
                    }
                    case 0b111: // cmp
                    case 0b010:  // sub
                    case 0b011: { // sbb
                        var og = this.registers.A.value;
                        var newVal = this.registers.A.value + reg.int8.twosCompliment.value + ((op === 0b011) & this.getFlag(i8080.flagMasks.carry));
                        this.setFlag(i8080.flagMasks.carry, newVal <= 0xFF);
                        var auxBit = this.registers.A.int8.getBit(3);
                        this.registers.A.value = newVal;
                        this.setFlag(i8080.flagMasks.auxCarry, auxBit === 1 && this.registers.A.int8.getBit(3) === 0);
                        this.setZSP(this.registers.A.int8);

                        if (op === 0b111) {
                            this.registers.A.value = og;
                        }
                        return dret;
                    }
                    case 0b100: { // ana
                        this.setFlag(i8080.flagMasks.carry, 0);
                        this.registers.A.value &= reg.value;
                        this.setZSP(this.registers.A.int8);
                        return dret;
                    }
                    case 0b101: { // xra
                        this.setFlag(i8080.flagMasks.carry, 0);
                        var auxBit = this.registers.A.int8.getBit(3);
                        this.registers.A.value ^= reg.value;
                        this.setFlag(i8080.flagMasks.auxCarry, auxBit === 1 && this.registers.A.int8.getBit(3) === 0);
                        this.setZSP(this.registers.A.int8);
                        return dret;
                    }
                    case 0b110: { // ora
                        this.setFlag(i8080.flagMasks.carry, 0);
                        this.registers.A.value |= reg.value;
                        this.setZSP(this.registers.A.int8);
                        return dret;
                    }
                }
                return dret;
            } // case 0b10
            case 0b11: { // god help me
                var l3 = (byte.value & 0b00000111);
                switch (l3) {
                    case 0b000: { // returns
                        var op = (byte.value & 0b00111000) >> 3;
                        var flags = [
                            i8080.flagMasks.zero,
                            i8080.flagMasks.carry,
                            i8080.flagMasks.parity,
                            i8080.flagMasks.sign
                        ];
                        var mask = flags[parseInt(op / 2)];
                        var val = op & 1;

                        if (this.getFlag(mask) === val) {
                            this.registers.PC.value = this.stack.pop().value - 1;
                        }
                        return dret;
                    }
                    case 0b001: { // pop, sphl, ret, pchl
                        if (byte.getBit(3)) { // sphl, ret, pchl
                            var op = (byte.value & 0b00111000) >> 3;
                            switch (op) {
                                case 0b001: { // ret
                                    this.registers.PC.value = this.stack.pop().value - 1;
                                    return dret;
                                }
                                case 0b101: { // pchl
                                    this.registers.PC.value = this.registers.HL.value - 1; // will be incremented to start at HL
                                    return dret;
                                }
                                case 0b111: { // sphl
                                    this.registers.SP.value = this.registers.HL.value;
                                    return dret;
                                }
                            }
                        } else { // pop
                            var rpi = (byte.value & 0b00110000) >> 4; // 0-3
                            var rp = this.resolveRegisterPair(rpi, this.registers.P);
                            if (rp.error) {
                                return { error: rp.error };
                            }
                            rp = rp.register;
                            
                            rp.value = this.stack.pop().value;
                        }
                        return dret;
                    }
                    case 0b010: { // jumps
                        var op = (byte.value & 0b00111000) >> 3;
                        this.registers.PC.value++;
                        var addr = this.memory.getWord(this.registers.PC.value);
                        this.registers.PC.value++;
                        var flags = [
                            i8080.flagMasks.zero,
                            i8080.flagMasks.carry,
                            i8080.flagMasks.parity,
                            i8080.flagMasks.sign
                        ];
                        var mask = flags[parseInt(op / 2)];
                        var val = op & 1;

                        if (this.getFlag(mask) === val) {
                            this.registers.PC.value = addr.value - 1;
                        }
                        return dret;
                    }
                    case 0b011: { // xchg, xthl, jmp, flipflops, io
                        var op = (byte.value & 0b00110000) >> 4;
                        switch (op) {
                            case 0b00: { // jmp
                                this.registers.PC.value++;
                                this.registers.PC.value = this.memory.getWord(this.registers.PC.value) - 1;
                                return dret;
                            }
                            case 0b01: { // io
                                if (byte.getBit(3) === 1) { // in
                                    this.registers.PC.value++;
                                    var exp = this.memory.getByte(this.registers.PC.value);
                                    var device = this.getDevice(exp);

                                    if (device) {
                                        this.registers.A.value = device.requestByte();
                                    } else {
                                        return {
                                            error: "device not connected: " + exp.value
                                        };
                                    }
                                } else { // out
                                    this.registers.PC.value++;
                                    var exp = this.memory.getByte(this.registers.PC.value);
                                    var device = this.getDevice(exp);

                                    if (device) {
                                        device.sendByte(this.registers.A.int8);
                                    } else {
                                        return {
                                            error: "device not connected: " + exp.value
                                        };
                                    }
                                }
                                return dret;
                            }
                            case 0b10: { // xchg, xthl
                                if (byte.getBit(3) === 1) { // xchg
                                    var temp = this.registers.DE.value;
                                    this.registers.DE.value = this.registers.HL.value;
                                    this.registers.HL.value = temp;
                                } else { // xthl
                                    var temp = this.registers.HL.value;
                                    this.registers.HL.value = this.memory.getWord(this.registers.SP.value);
                                    this.memory.setWord(this.registers.SP.value, temp);
                                }
                                return dret;
                            }
                            case 0b11: { // flip flop
                                if (byte.getBit(3) === 1) { // enable
                                    return {
                                        enableInterrupts: true
                                    };
                                } else {
                                    return {
                                        enableInterrupts: false
                                    };
                                }
                                return dret;
                            }
                        }
                        return dret;
                    }
                    case 0b100: { // calls-
                        var op = (byte.value & 0b00111000) >> 3;
                        this.registers.PC.value++;
                        var addr = this.memory.getWord(this.registers.PC.value);
                        this.registers.PC.value++;
                        var flags = [
                            i8080.flagMasks.zero,
                            i8080.flagMasks.carry,
                            i8080.flagMasks.parity,
                            i8080.flagMasks.sign
                        ];
                        var mask = flags[parseInt(op / 2)];
                        var val = op & 1;

                        if (this.getFlag(mask) === val) {
                            this.stack.push(this.registers.PC.value + 1);
                            this.registers.PC.value = addr.value - 1;
                        }
                        return dret;
                    }
                    case 0b101: { // push, call
                        if (byte.getBit(3) === 0) { // push
                            var rpi = (byte.value & 0b00110000) >> 4; // 0-3
                            var rp = this.resolveRegisterPair(rpi, this.registers.PSW);
                            if (rp.error) {
                                return { error: rp.error };
                            }
                            rp = rp.register;
                            
                            this.stack.push(rp.int16);
                        } else { // call
                            this.registers.PC.value++;
                            var addr = this.memory.getWord(this.registers.PC.value);
                            this.registers.PC.value++;

                            this.stack.push(this.registers.PC.value + 1);
                            this.registers.PC.value = addr.value - 1;
                        }
                        return dret;
                    }
                    case 0b110: { // immediate
                        // these match acc exactly except they read from mem, so we will just hack it a lil bit //
                        // so we r putting the immediate value into register b and calling the correlating modify-A-from-B operation //
                        var op = (byte.value & 0b00111000);
                        this.registers.PC.value++;
                        var data = this.memory.getByte(this.registers.PC.value);
                        var newByte = new int8(0b10000000 | op); // 000 trail means register B
                        var temp = this.registers.B.value;
                        this.registers.B.value = data;
                        var z = this.processByte(newByte);
                        if (z.error) {
                            return { error: z.error };
                        }
                        this.registers.B.value = temp;
                        return dret;
                    }
                    case 0b111: { // rst
                        var exp = (byte.value & 0b00111000) >> 3;
                        this.registers.PC.value = exp - 1;
                        return dret;
                    }
                }
                return dret;
            }
        } // bigswitch

        return {
            error: "instruction not recognized: " + byte.toHexString()
        };
    } // function

    resolveRegister8(i8) {
        if (typeof(i8) === "string") {
            i8 = parseInt(i8);
        }
        if (typeof(i8) === "number") {
            i8 = new int8(i8);
        }

        if (i8.value >= this.register8Array.length) {
            return {
                error: "invalid register: " + i8.value
            };
        }

        return {
            error: null,
            register: this.register8Array[i8.value]
        };
    }

    resolveRegisterPair(i8, lastRegisterPair) {
        if (typeof(i8) === "string") {
            i8 = parseInt(i8);
        }
        if (typeof(i8) === "number") {
            i8 = new int8(i8);
        }
        
        if (i8.value > 0b11) {
            return {
                error: "invalid register pair: " + i8.value
            };
        }

        switch (i8.value) {
            case 0b00: return { register: this.registers.BC };
            case 0b01: return { register: this.registers.DE };
            case 0b10: return { register: this.registers.HL };
            case 0b11: return { register: lastRegisterPair };
        }
    }
};

class Memory {
    constructor(max) {
        this.length = max + 1;
        this.array = new Array(max + 1);
    }

    getByte(index16) {
        return this.array[coerceInt(index16)] || new int8(0);
    }

    setByte(index16, value8) {
        index16 = coerceInt(index16);
        value8 = coerceInt(value8);

        if (!this.array[index16]) {
            this.array[index16] = new int8(value8);
        } else {
            this.array[index16] = new int8(value8); // TODO: make faster
        }
    }

    getWord(index16) {
        index16 = coerceInt(index16);
        return int16.construct(this.getByte(index16 + 1), this.getByte(index16));
    }

    setWord(index16, value16) {
        index16 = coerceInt(index16);
        value16 = new int16(value16);

        this.setByte(index16, value16.lowBits);
        this.setByte(index16 + 1, value16.highBits);
    }

    toString(startRow, lenRows) {
        if (startRow === undefined) startRow = 0;
        if (lenRows === undefined) lenRows = this.length / 8;

        var ret = "";

        for (var i = startRow; i < (startRow + lenRows); i++) {
            ret += (i * 8).toString(16).toUpperCase().padStart(4, "0");
            
            for (var j = 0; j < 8; j++) {
                ret += " " + (this.getByte(i * 8 + j).value.toString(16).toUpperCase().padStart(2, "0"));
                if (j === 3) {
                    ret += "|";
                }
            }

            ret += "\n";
        }

        return ret;
    }
    
    toInt8Array(startRow, lenRows) {
        if (startRow === undefined) startRow = 0;
        if (lenRows === undefined) lenRows = this.length / 8;

        //var ret = this.array.slice(startRow * 8, startRow * 8 + lenRows * 8);

        var ret = [];
        var end = startRow * 8 + lenRows * 8;
        
        for (var i = startRow * 8; i < end; i++) {
            ret.push(this.getByte(i));
        }

        return ret;
    }

    clear(startRow, lenRows) {
        if (startRow === undefined && lenRows === undefined) {
            this.array = [];
            return;
        }

        if (startRow === undefined) startRow = 0;
        if (lenRows === undefined) lenRows = this.length / 8;

        for (var i = startRow; i < (startRow + lenRows); i++) {
            for (var j = 0; j < 8; j++) {
                //console.log(i * 8 + j);
                delete this.array[i * 8 + j];
            }
        }
    }

    reset(...args) {
        return this.clear(...args);
    }

    toBlob() {
        return array_copy(this.array);
    }

    static copyBlobElement(be) {
        return {
            start: be.start,
            length: be.length,
            array: be.array.map((o) => {
                return o.copy();
            })
        };
    }

    static copyBlob(blob) {
        //return blob.map(be => copyBlobElement(be));
        return array_copy(blob);
    }
}

class MemoryStack {
    constructor(memory, register16) {
        this.memory = memory;
        this.register = register16;
        this.depth = 0;
    }

    reset() {
        this.depth = 0;
    }

    clear(...args) {
        return this.reset(...args);
    }

    push(i16) {
        i16 = new int16(i16);
        this.memory.setByte(this.register.minus(1).value, i16.highBits);
        this.memory.setByte(this.register.minus(2).value, i16.lowBits);
        this.register.value -= 2;
        this.depth++;
    }

    pop() {
        var ret = new int16(0);
        ret.highBits = this.memory.getByte(this.register.plus(1).value);
        ret.lowBits = this.memory.getByte(this.register.value);
        this.register.value += 2;
        this.depth--;
        return ret;
    }

    peek(depth) {
        depth = coerceInt(depth);
        var ret = new int16(0);
        ret.highBits = this.memory.getByte(this.register.plus(depth * 2 + 1).value);
        ret.lowBits = this.memory.getByte(this.register.plus(depth * 2));
        return ret;
    }

    toArray() {
        var ret = [];
        for (var i = 0; i < this.depth; i++) {
            ret.push(this.peek(i).value);
        }

        return ret;
    }
}
