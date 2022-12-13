class Stack {
    constructor() {
        this.stack = [];
    }

    push(x) {
        this.stack.push(x);
    }

    pop() {
        return this.stack.splice(this.stack.length - 1, 1)[0];
    }

    peek() {
        return this.stack[this.stack.length - 1];
    }

    isEmpty() {
        return this.stack.length === 0;
    }
}

class Queue {
    constructor() {
        this.queue = [];
        this.offset = 0;
    }

    push_back(x) {
        this.queue.push(x);
    }

    pop_front(x) {
        var ret = this.queue[this.offset];
        this.queue[0] = undefined;
        this.offset++;

        if (this.offset >= this.queue.length / 2) {
            this.queue.splice(0, this.offset);
            this.offset = 0;
        }

        return ret;
    }
}

class Assembler {
    constructor(i) {
        this.i8080 = i;
        this.ignoringAssembly = false;
        this.macroing = false;

        this.labels = {};
        this.macros = {};
        this.assemblingMacro = false;
        this.currentMacroArgs = null;

        this.equs = {};
        this.sets = {};

        this.commands = {
            // define functions for all the commands

            DB: {
                assemble: (function(addr, label, args) {
                    // addr is int16, label is string (used for special labels only), args is array of string

                    for (var i = 0; i < args.length; i++) {
                        var bytes;
                        
                        if (args[i][0] === "'") {
                            if (args[i][args[i].length - 1] === "'") {
                                // test for even amount of single quotes //
                                if (((args[i].substr(1, args[i].length - 2).match(/'/g) || []).length & 1) === 0) {
                                    // transform string to charcode array //
                                    bytes = {
                                        error: null,
                                        array: args[i].substr(1, args[i].length - 2).replace(/''/g, "'").split("").map(x => x.charCodeAt(0))
                                    };
                                } else {
                                    return {
                                        error: "unescaped ': " + args[i]
                                    }
                                }
                            } else {
                                return {
                                    error: "missing end quote: " + args[i]
                                };
                            }
                        } else {
                            bytes = this.resolveExpression8(args[i], addr);
                            bytes.array = [ bytes.value ];
                        }

                        if (bytes.error) {
                            return {
                                error: bytes.error
                            };
                        }

                        for (var j = 0; j < bytes.array.length; j++) {
                            this.i8080.memory.setByte(addr.value++, bytes.array[j]);
                        }
                    }

                    return {
                        error: null,
                        length: bytes.array.length
                    };
                }).bind(this),
                
                test: (function() {
                    var z = this.assemble(
                        "DB 0FEH\n\
                        X: DB 5\n\
                        DB X"
                    );

                    if (z.error) {
                        console.log("ERROR IN DB TEST: " + z.error);
                    }

                    assert("i.memory.getByte(0).value === 0xFE");
                    assert("i.memory.getByte(1).value === 5");
                    assert("i.memory.getByte(2).value === 1");
                }).bind(this),

                shallowAssemble: (function(args, addr) {
                    for (var i = 0; i < args.length; i++) {
                        var bytes;
                        
                        if (args[i][0] === "'") {
                            if (args[i][args[i].length - 1] === "'") {
                                // test for even amount of single quotes //
                                if (((args[i].substr(1, args[i].length - 2).match(/'/g) || []).length & 1) === 0) {
                                    // transform string to charcode array //
                                    bytes = {
                                        error: null,
                                        array: args[i].substr(1, args[i].length - 2).replace(/''/g, "'").split("").map(x => x.charCodeAt(0))
                                    };
                                } else {
                                    return {
                                        error: "unescaped ': " + args[i]
                                    }
                                }
                            } else {
                                return {
                                    error: "missing end quote: " + args[i]
                                };
                            }
                        } else {
                            bytes = this.resolveExpression8(args[i], addr);
                            bytes.array = [ bytes.value ];
                        }

                        if (bytes.error) {
                            return {
                                error: bytes.error
                            };
                        }
                        
                        return {
                            error: null,
                            length: bytes.array.length
                        }
                    }
                }).bind(this)
            },

            DW: {
                assemble: (function(addr, label, args) {
                    for (var i = 0; i < args.length; i++) {
                        var word = this.resolveExpression16(args[i], addr);

                        if (word.error) {
                            return {
                                error: word.error
                            };
                        }

                        this.i8080.memory.setWord(addr, word.value);
                        addr.value += 2;
                    }

                    return {
                        error: null,
                        length: args.length * 2
                    };
                }).bind(this),

                test: (function() {
                    var z = this.assemble(
                        "dw 0FEC7H\n\
                        dw 101B"
                    );

                    if (z.error) {
                        console.log("ERROR IN DW TEST: " + z.error);
                    }

                    assert("i.memory.getWord(0).value === 0xFEC7");
                    assert("i.memory.getByte(3).value === 0x00");
                    assert("i.memory.getByte(2).value === 5");
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: args.length * 2
                    };
                }).bind(this)
            },

            DS: {
                assemble: (function(addr, label, args) {
                    var z = this.resolveExpression16(args[0], addr);
                    if (z.error) {
                        return {
                            error: z.error
                        };
                    }

                    var numBytes = new int16(z.value);

                    for (var i = 0; i < numBytes.value; i++) {
                        addr.value++;
                    }

                    return {
                        error: null,
                        length: numBytes.value
                    };
                }).bind(this),

                test: (function() {
                    i.memory.clear();
                    var z = this.assemble(
                        "ds 4\n\
                        db 0FEH"
                    );

                    assert("i.memory.toString(0, 1) === \"0000 00 00 00 00| FE 00 00 00\\n\"");
                }).bind(this),

                shallowAssemble: (function(args, addr) {
                    var z = this.resolveExpression16(args[0], addr);
                    if (z.error) {
                        return {
                            error: z.error
                        };
                    }

                    var numBytes = new int16(z.value);

                    return {
                        error: null,
                        length: numBytes.value
                    };
                }).bind(this)
            },

            CMC: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0x3F);
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                test: (function() {
                    i.memory.clear(0, 1);
                    var z = this.assemble(
                        "dw 0FEH\n\
                        CMC"
                    );

                    assert("i.memory.toString(0, 1) === \"0000 FE 00 3F 00| 00 00 00 00\\n\"");
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            STC: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0x37);
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                test: (function() {

                }).bind(this),

                test: (function() {
                    i.memory.clear(0, 1);
                    var z = this.assemble(
                        "dw 0FEH\n\
                        STC"
                    );

                    assert("i.memory.toString(0, 1) === \"0000 FE 00 37 00| 00 00 00 00\\n\"");
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            INR: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0X04);
                    
                    var z = this.resolveExpression8(args[0], addr);
                    if (z.error) {
                        return {
                            error: z.error
                        };
                    }

                    byte.value |= z.value << 3;
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            DCR: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0X05);
                    
                    var z = this.resolveExpression8(args[0], addr);
                    if (z.error) {
                        return {
                            error: z.error
                        };
                    }

                    byte.value |= z.value << 3;
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            CMA: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0x2F);
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            DAA: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0x27);
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            NOP: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0x00);
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            MOV: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0x40);
                    
                    var dst = this.resolveExpression8(args[0], addr);
                    if (dst.error) {
                        return {
                            error: dst.error
                        };
                    }

                    var src = this.resolveExpression8(args[1], addr);
                    if (src.error) {
                        return {
                            error: src.error
                        };
                    }

                    byte.value |= dst.value << 3;
                    byte.value |= src.value;
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            STAX: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0x02);
                    var rp;

                    if (args.length === 0) {
                        return {
                            error: "no argument specified for STAX, need B or D"
                        };
                    }
                    
                    switch (args[0].toUpperCase()) {
                        case "B":
                            rp = 0x00;
                            break;
                        case "D":
                            rp = 0x01;
                            break;
                        default:
                            return {
                                error: "invalid register pair for STAX (need B or D): " + args[0]
                            };
                    }

                    byte.value |= rp << 4;

                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            LDAX: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0x0A);
                    var rp;

                    if (args.length === 0) {
                        return {
                            error: "no argument specified for LDAX, need B or D"
                        };
                    }
                    
                    switch (args[0].toUpperCase()) {
                        case "B":
                            rp = 0x00;
                            break;
                        case "D":
                            rp = 0x01;
                            break;
                        default:
                            return {
                                error: "invalid register pair for LDAX (need B or D): " + args[0]
                            };
                    }

                    byte.value |= rp << 4;

                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            ADD: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0x80);
                    
                    var r = this.resolveExpression8(args[0], addr);
                    if (r.error) {
                        return {
                            error: r.error
                        };
                    }

                    byte.value |= r.value;
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            ADC: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0x88);
                    
                    var r = this.resolveExpression8(args[0], addr);
                    if (r.error) {
                        return {
                            error: r.error
                        };
                    }

                    byte.value |= r.value;
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            SUB: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0x90);
                    
                    var r = this.resolveExpression8(args[0], addr);
                    if (r.error) {
                        return {
                            error: r.error
                        };
                    }

                    byte.value |= r.value;
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            SBB: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0x98);
                    
                    var r = this.resolveExpression8(args[0], addr);
                    if (r.error) {
                        return {
                            error: r.error
                        };
                    }

                    byte.value |= r.value;
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            ANA: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0xA0);
                    
                    var r = this.resolveExpression8(args[0], addr);
                    if (r.error) {
                        return {
                            error: r.error
                        };
                    }

                    byte.value |= r.value;
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            XRA: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0xA8);
                    
                    var r = this.resolveExpression8(args[0], addr);
                    if (r.error) {
                        return {
                            error: r.error
                        };
                    }

                    byte.value |= r.value;
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            ORA: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0xB0);
                    
                    var r = this.resolveExpression8(args[0], addr);
                    if (r.error) {
                        return {
                            error: r.error
                        };
                    }

                    byte.value |= r.value;
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            CMP: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0xB8);
                    
                    var r = this.resolveExpression8(args[0], addr);
                    if (r.error) {
                        return {
                            error: r.error
                        };
                    }

                    byte.value |= r.value;
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            RLC: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0x07);
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            RRC: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0x0F);
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            RAL: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0x17);
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            RAR: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0x1F);
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            PUSH: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0xC5);
                    var rp;

                    if (args.length === 0) {
                        return {
                            error: "no argument specified for PUSH, need B, D, H, or PSW"
                        };
                    }
                    
                    switch (args[0].toUpperCase()) {
                        case "B":
                            rp = 0x00;
                            break;
                        case "D":
                            rp = 0x01;
                            break;
                        case "H":
                            rp = 0x02;
                            break;
                        case "PSW":
                            rp = 0x03;
                            break;
                        default:
                            return {
                                error: "invalid register pair for PUSH (need B, D, H, or PSW): " + args[0]
                            };
                    }

                    byte.value |= rp << 4;

                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            POP: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0xC1);
                    var rp;

                    if (args.length === 0) {
                        return {
                            error: "no argument specified for POP, need B, D, H, or PSW"
                        };
                    }
                    
                    switch (args[0].toUpperCase()) {
                        case "B":
                            rp = 0x00;
                            break;
                        case "D":
                            rp = 0x01;
                            break;
                        case "H":
                            rp = 0x02;
                            break;
                        case "PSW":
                            rp = 0x03;
                            break;
                        default:
                            return {
                                error: "invalid register pair for POP (need B, D, H, or PSW): " + args[0]
                            };
                    }

                    byte.value |= rp << 4;

                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            DAD: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0x09);
                    var rp;

                    if (args.length === 0) {
                        return {
                            error: "no argument specified for DAD, need B, D, H, or SP"
                        };
                    }
                    
                    switch (args[0].toUpperCase()) {
                        case "B":
                            rp = 0x00;
                            break;
                        case "D":
                            rp = 0x01;
                            break;
                        case "H":
                            rp = 0x02;
                            break;
                        case "SP":
                            rp = 0x03;
                            break;
                        default:
                            return {
                                error: "invalid register pair for DAD (need B, D, H, or SP): " + args[0]
                            };
                    }

                    byte.value |= rp << 4;

                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            INX: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0x03);
                    var rp;

                    if (args.length === 0) {
                        return {
                            error: "no argument specified for INX, need B, D, H, or SP"
                        };
                    }
                    
                    switch (args[0].toUpperCase()) {
                        case "B":
                            rp = 0x00;
                            break;
                        case "D":
                            rp = 0x01;
                            break;
                        case "H":
                            rp = 0x02;
                            break;
                        case "SP":
                            rp = 0x03;
                            break;
                        default:
                            return {
                                error: "invalid register pair for INX (need B, D, H, or SP): " + args[0]
                            };
                    }

                    byte.value |= rp << 4;

                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            DCX: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0x0B);
                    var rp;

                    if (args.length === 0) {
                        return {
                            error: "no argument specified for DCX, need B, D, H, or SP"
                        };
                    }
                    
                    switch (args[0].toUpperCase()) {
                        case "B":
                            rp = 0x00;
                            break;
                        case "D":
                            rp = 0x01;
                            break;
                        case "H":
                            rp = 0x02;
                            break;
                        case "SP":
                            rp = 0x03;
                            break;
                        default:
                            return {
                                error: "invalid register pair for DCX (need B, D, H, or SP): " + args[0]
                            };
                    }

                    byte.value |= rp << 4;

                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            XCHG: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0xEB);
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            XTHL: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0xE3);
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            SPHL: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0xF9);
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            LXI: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0x01);
                    var rp;

                    if (args.length === 0) {
                        return {
                            error: "no argument specified for LXI, need B, D, H, or SP"
                        };
                    }
                    
                    switch (args[0].toUpperCase()) {
                        case "B":
                            rp = 0x00;
                            break;
                        case "D":
                            rp = 0x01;
                            break;
                        case "H":
                            rp = 0x02;
                            break;
                        case "SP":
                            rp = 0x03;
                            break;
                        default:
                            return {
                                error: "invalid register pair for LXI (need B, D, H, or SP): " + args[0]
                            };
                    }

                    byte.value |= rp << 4;

                    var data = this.resolveExpression16(args[1], addr);

                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                test: (function() {
                    i.memory.clear(0, 1);
                    this.assemble(
                        "lxi d,0FEC7H"
                    );

                    assert("i.memory.toString(0, 1) === \"0000 11 C7 FE 00| 00 00 00 00\\n\"");
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            MVI: {
                assemble: (function(addr, label, args) {
                    // 2 bytes
                    var byte = new int8(0x06);
                    
                    var r = this.resolveExpression8(args[0], addr);
                    if (r.error) {
                        return {
                            error: r.error
                        };
                    }

                    var data = this.resolveExpression8(args[1], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    byte.value |= r.value << 3;
                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setByte(addr.value++, data.value);

                    return {
                        error: null,
                        length: 2
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 2
                    };
                }).bind(this)
            },

            ADI: {
                assemble: (function(addr, label, args) {
                    // 2 bytes
                    var byte = new int8(0xC6);

                    var data = this.resolveExpression8(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setByte(addr.value++, data.value);

                    return {
                        error: null,
                        length: 2
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 2
                    };
                }).bind(this)
            },

            ACI: {
                assemble: (function(addr, label, args) {
                    // 2 bytes
                    var byte = new int8(0xCE);

                    var data = this.resolveExpression8(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setByte(addr.value++, data.value);

                    return {
                        error: null,
                        length: 2
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 2
                    };
                }).bind(this)
            },

            SUI: {
                assemble: (function(addr, label, args) {
                    // 2 bytes
                    var byte = new int8(0xD6);

                    var data = this.resolveExpression8(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setByte(addr.value++, data.value);

                    return {
                        error: null,
                        length: 2
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 2
                    };
                }).bind(this)
            },

            SBI: {
                assemble: (function(addr, label, args) {
                    // 2 bytes
                    var byte = new int8(0xDE);

                    var data = this.resolveExpression8(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setByte(addr.value++, data.value);

                    return {
                        error: null,
                        length: 2
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 2
                    };
                }).bind(this)
            },

            ANI: {
                assemble: (function(addr, label, args) {
                    // 2 bytes
                    var byte = new int8(0b11000110 | (0b100 << 3));

                    var data = this.resolveExpression8(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setByte(addr.value++, data.value);

                    return {
                        error: null,
                        length: 2
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 2
                    };
                }).bind(this)
            },

            XRI: {
                assemble: (function(addr, label, args) {
                    // 2 bytes
                    var byte = new int8(0b11000110 | (0b101 << 3));

                    var data = this.resolveExpression8(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setByte(addr.value++, data.value);

                    return {
                        error: null,
                        length: 2
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 2
                    };
                }).bind(this)
            },

            ORI: {
                assemble: (function(addr, label, args) {
                    // 2 bytes
                    var byte = new int8(0b11000110 | (0b110 << 3));

                    var data = this.resolveExpression8(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setByte(addr.value++, data.value);

                    return {
                        error: null,
                        length: 2
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 2
                    };
                }).bind(this)
            },

            CPI: {
                assemble: (function(addr, label, args) {
                    // 2 bytes
                    var byte = new int8(0b11000110 | (0b111 << 3));

                    var data = this.resolveExpression8(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setByte(addr.value++, data.value);

                    return {
                        error: null,
                        length: 2
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 2
                    };
                }).bind(this)
            },

            STA: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0b00100010 | (0b10 << 3));

                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            LDA: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0b00100010 | (0b11 << 3));

                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            SHLD: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0b00100010 | (0b00 << 3));

                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            LHLD: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0b00100010 | (0b01 << 3));

                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            PCHL: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0b11101001);
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            JMP: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0b11000011 | (0b000 << 3));

                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            JC: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0b11000010 | (0b011 << 3));

                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            JNC: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0b11000010 | (0b010 << 3));

                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            JZ: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0b11000010 | (0b001 << 3));

                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            JNZ: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0b11000010 | (0b000 << 3));

                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            JM: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0b11000010 | (0b111 << 3));

                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            JP: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0b11000010 | (0b110 << 3));

                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            JPE: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0b11000010 | (0b101 << 3));

                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            JPO: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0b11000010 | (0b100 << 3));

                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            CALL: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0b11000101 | (0b001 << 3));

                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            CC: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0b11000100 | (0b011 << 3));

                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            CNC: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0b11000100 | (0b010 << 3));

                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            CZ: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0b11000100 | (0b001 << 3));

                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            CNZ: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0b11000100 | (0b000 << 3));

                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            CM: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0b11000100 | (0b111 << 3));

                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            CP: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0b11000100 | (0b110 << 3));

                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            CPE: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0b11000100 | (0b101 << 3));

                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            CPO: {
                assemble: (function(addr, label, args) {
                    // 3 bytes
                    var byte = new int8(0b11000100 | (0b100 << 3));

                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setWord(addr.value++, data.value);
                    addr.value++;

                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 3
                    };
                }).bind(this)
            },

            RET: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0b11000001 | (0b001 << 3));
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            RNZ: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0b11000000 | (0b000 << 3));
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            RZ: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0b11000000 | (0b001 << 3));
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            RNC: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0b11000000 | (0b010 << 3));
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            RC: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0b11000000 | (0b0011<< 3));
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            RPO: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0b11000000 | (0b100 << 3));
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            RPE: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0b11000000 | (0b101 << 3));
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            RP: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0b11000000 | (0b110 << 3));
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            RM: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0b11000000 | (0b111 << 3));
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            RST: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0b11000111);

                    var data = this.resolveExpression8(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    // TODO: error?

                    byte.value |= (data.value & 0b111) << 3;

                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            EI: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0b11110011 | (0b1 << 3));
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            DI: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0b11110011 | (0b0 << 3));
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            IN: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0b11010011 | (0b1 << 3));

                    var data = this.resolveExpression8(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setByte(addr.value++, data.value);

                    return {
                        error: null,
                        length: 2
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 2
                    };
                }).bind(this)
            },

            OUT: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0b11010011 | (0b0 << 3));

                    var data = this.resolveExpression8(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    this.i8080.memory.setByte(addr.value++, byte);
                    this.i8080.memory.setByte(addr.value++, data.value);

                    return {
                        error: null,
                        length: 2
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 2
                    };
                }).bind(this)
            },

            HLT: {
                assemble: (function(addr, label, args) {
                    // 1 byte
                    var byte = new int8(0b01110110);
                    this.i8080.memory.setByte(addr.value++, byte);

                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 1
                    };
                }).bind(this)
            },

            ORG: {
                assemble: (function(addr, label, args) {
                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    addr.value = data.value;

                    return {
                        error: null,
                        length: 0
                    };
                }).bind(this),

                shallowAssemble: (function(args, addr) {
                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    addr.value = data.value;
                    
                    return {
                        error: null,
                        length: 0
                    };
                }).bind(this)
            },

            EQU: {
                assemble: (function(addr, label, args) {
                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }
                    
                    if (label) {
                        label = label.toUpperCase();
                    } else {
                        return {
                            error: "EQU requires name"
                        };
                    }

                    if (this.equs.hasOwnProperty(label)) {
                        return {
                            error: "redefinition of EQU: " + label
                        };
                    } else {
                        this.equs[label] = data.value;
                    }

                    return {
                        error: null,
                        length: 0
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 0
                    };
                }).bind(this)
            },

            SET: {
                assemble: (function(addr, label, args) {
                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }
                    
                    if (label) {
                        label = label.toUpperCase();
                    } else {
                        return {
                            error: "SET requires name"
                        };
                    }

                    if (this.equs.hasOwnProperty(label)) {
                        return {
                            error: "redefinition of EQU: " + label
                        };
                    } else {
                        this.sets[label] = data.value;
                    }

                    return {
                        error: null,
                        length: 0
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 0
                    };
                }).bind(this)
            },

            END: {
                assemble: (function(addr, label, args) {
                    return {
                        error: null,
                        end: true
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 0,
                        end: true
                    };
                }).bind(this)
            },

            IF: {
                assemble: (function(addr, label, args) {
                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    return {
                        error: null,
                        length: 0,
                        ifResult: data.value.value !== 0
                    };
                }).bind(this),

                shallowAssemble: (function(args, addr) {
                    var data = this.resolveExpression16(args[0], addr);
                    if (data.error) {
                        return {
                            error: data.error
                        };
                    }

                    return {
                        error: null,
                        length: 0,
                        ifResult: data.value.value !== 0
                    };
                }).bind(this)
            },

            ENDIF: {
                assemble: (function(addr, label, args) {
                    return {
                        error: null,
                        endif: true,
                        length: 0
                    };
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 0,
                        endif: true
                    };
                }).bind(this)
            },

            MACRO: {
                assemble: (function(addr, label, args) {
                    return {
                        error: "im not odin macros rn sry"
                    };

                    /*if (!label) {
                        return {
                            error: "MACRO requires name"
                        };
                    }

                    if (this.macroing) {
                        return {
                            error: "nested macro: " + label
                        };
                    }

                    if (this.macros.hasOwnProperty(label)) {
                        return {
                            error: "redeclaration of macro: " + label
                        };
                    }

                    this.macros[label] = {
                        args: args,
                        statements: []
                    };

                    this.macroing = true;
                    this.currentMacro = label;

                    return {
                        error: null,
                        length: 0
                    };*/
                }).bind(this),

                shallowAssemble: (function(args) {
                    return {
                        error: null,
                        length: 0
                    };
                }).bind(this)
            },
        }
    }

    constructArgsArray(str) {
        var asciis = [];
        
        str = str.replace(/('(.+?)[^']'),/g, function(match, p1) {
            // p1 = 'asijofsi'
            // return val,

            asciis.push(p1);
            return "ASCIIP" + (asciis.length - 1) + ",";
        });

        str = str.split(",").map(function(x) {
            if (x.substr(0, 6) === "ASCIIP" && x.length > 6) {
                return asciis[parseInt(x.substr(6))];
            }

            return x;
        });

        return {
            error: null,
            array: str
        };
    }

    hasLabel(label) {
        label = label.toUpperCase();
        if (label.substr(label.length - 1) === ":") {
            label = label.substr(0, label.length - 1);
        }

        return this.labels.hasOwnProperty(label);
    }

    setLabel(label, val) {
        val = new int16(val);

        label = label.toUpperCase();
        if (label.substr(label.length - 1) === ":") {
            label = label.substr(0, label.length - 1);
        }

        if (label.length > 5) {
            label = label.substr(0, 5);
        }

        if (this.commands.hasOwnProperty(label)) {
            return {
                error: "Invalid label. Labels may not take the name of an instruction."
            };
        }

        if (this.i8080.registers.hasOwnProperty(label)) {
            return {
                error: "Invalid label. Labels may not take the name of a register."
            };
        }

        for (var i = 0; i < label.length; i++) {
            if (i === 0) {
                if ("ABCDEFGHIJKLMNOPQRSTUVWXYZ@?".indexOf(label[i]) === -1) {
                    return {
                        error: "Invalid label. First character of label must be a letter A-Z, @, or ?"
                    };
                }
            } else {
                if ("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".indexOf(label[i]) === -1) {
                    return {
                        error: "Invalid label. Characters after the first must be alphanumeric."
                    };
                }
            }
        }

        this.labels[label] = val;

        return {
            error: null
        };
    }

    getLabel(label) {
        label = label.toUpperCase();
        if (label.substr(label.length - 1) === ":") {
            label = label.substr(0, label.length - 1);
        }

        return this.labels[label];
    }

    hasCommand(cmd) {
        return this.commands.hasOwnProperty(cmd.toUpperCase());
    }

    getCommand(cmd) {
        return this.commands[cmd.toUpperCase()];
    }

    assembleCommand(cmd, addr, label, args) {
        // cmd is string, addr is int16, label is string, args is array of string
        // returns { error }
        cmd = cmd.toUpperCase();
        if (label) label = label.toUpperCase().substr(0, 5);

        if (!this.ignoringAssembly) {
            return this.getCommand(cmd).assemble(addr, label, args);
        } else if (cmd === "ENDIF") {
            this.ignoringAssembly = false;
            return {
                error: null
            };
        }

        return {
            error: null
        };
    }

    assemble(str) {
        this.labels = {};

        this.equs = {};
        this.sets = {
            B: new int16(0),
            C: new int16(1),
            D: new int16(2),
            E: new int16(3),
            H: new int16(4),
            L: new int16(5),
            M: new int16(6),
            A: new int16(7)
        };

        var assembledLength = 0;
        var lines = str.replace(/\r/g, "").replace(/\t/g, " ").split("\n");
        var addr = new int16(0x0000);

        var ended = false;

        var myAwesomeVar = {};

        for (var i = 0; i < lines.length; i++) {
            if (/(add|sub|adc|sbb|ana|ora|xra|cmp) [^abcdehlmABCDEHLM]/.test(lines[i])) {
                widgets.console.warn("[warning line " + i + "]: expected register argument, got immediate value");
            }

            if (lines[i].trim().length === 0) {
                /*lines.splice(i, 1);
                i--;*/
                continue;
            }

            if (lines[i].indexOf(";") !== -1) {
                lines[i] = lines[i].substr(0, lines[i].indexOf(";"));
            }

            var z = this.assembleLine(lines[i], addr, null, null, true);
            if (z.error) {
                return {
                    error: "[error line " + i + "]: " + z.error
                };
            }

            if (z.newStr) {
                lines[i] = z.newStr;
            }

            if (z.end) {
                assembledLength = addr.value;
                ended = true;
                break;
            }

            if (z.hasOwnProperty("ifResult")) {
                if (z.ifResult === false) {
                    this.ignoringAssembly = true;
                }
            }
        }

        if (!ended) {
            /*return {
                error: "Expected END statement, instead got no END statement"
            };*/
            assembledLength = addr.value;
        }

        addr.value = 0x0000;

        for (var i = 0; i < lines.length; i++) {
            if (lines[i].trim().length === 0) {
                /*lines.splice(i, 1);
                i--;*/
                continue;
            }

            var og = addr.value;
            var z = this.assembleLine(lines[i], addr); // expected to directly manip addr
            if (z.error) {
                return {
                    error: "[error line " + i + "]: " + z.error
                };
            }

            if (z.end) {
                break;
            }

            if (z.hasOwnProperty("ifResult")) {
                if (z.ifResult === false) {
                    this.ignoringAssembly = true;
                }
            }

            if (z.length !== 0) {
                // we have an instruction that occupies space,
                // so we need to attrib that space to that instr
                myAwesomeVar[og] = {
                    line: i,
                    length: z.length
                };
            }
        }

        this.i8080.programLength = assembledLength;
        array_clear(this.i8080.lengthArray);
        
        for (var index in myAwesomeVar) {
            this.i8080.lengthArray[coerceInt(index)] = myAwesomeVar[index];
        }

        return {
            error: null,
            length: assembledLength,
            lengthArray: this.i8080.lengthArray
        };
    }

    assembleLine(str, addr, label, macroPass, labelPass) {
        // return { error: null | errorStr, addr: new mem address to continue asm from }
        // label: opcode args comment

        if (str === "") {
            return { error: null };
        }

        str = str.trim();

        var firstWord = str.split(" ")[0];

        // shallow assembly //
        if (labelPass) {
            var n = null;
            var labelSet = null;
            // set labels //
            if (firstWord.substr(firstWord.length - 1) === ":") {
                labelSet = firstWord;
                n = str.substr(firstWord.length).trim();
                str = n;

                firstWord = str.split(" ")[0];
            }

            // shallow assemble command if it exists //
            if (this.hasCommand(firstWord)) {
                if (firstWord.toUpperCase() === "ENDIF") {
                    this.ignoringAssembly = false;
                } else if (!this.ignoringAssembly) {
                    var args = str.substr(firstWord.length).trim();

                    if (args.length > 0) {
                        args = this.constructArgsArray(args);
                        if (args.error) {
                            return {
                                error: args.error
                            };
                        }

                        args = args.array;
                    } else {
                        args = [];
                    }

                    var z = this.getCommand(firstWord).shallowAssemble(args, addr);

                    if (z.error) {
                        return {
                            error: z.error
                        };
                    }

                    if (labelSet) {
                        if (z.length === 0) {
                            return {
                                error: "labels on zero-length instructions are forbidden"
                            };
                        }

                        var sl = this.setLabel(labelSet, addr);
                        if (sl.error) return { error: sl.error };
                    }

                    addr.value += z.length;
                    
                    z.newStr = n;
                    return z;
                }
            }

            return {
                error: null,
                length: 0
            };
        }

        if (!this.hasCommand(firstWord) && !macroPass) {
            // test for special labels //
            var secondWord = str.substr(firstWord.length).trim().split(" ")[0];
            if (this.hasCommand(secondWord) || this.macros.hasOwnProperty(secondWord.toUpperCase())) {
                return this.assembleLine(str.substr(firstWord.length), addr, firstWord);
            } else {
                var badWord = firstWord[firstWord.length - 1] === ":" ? secondWord : firstWord;
                return {
                    error: badWord === "" ? "missing instruction after label" : "instruction not recognized: " + badWord
                };
            }
        } else if (this.macros.hasOwnProperty(firstWord.toUpperCase()) && !macroPass) {
            // macro shit who cares i hate macros //
            this.assemblingMacro = true;
            this.currentMacro = firstWord.toUpperCase();
            var statements = this.macros[firstWord.toUpperCase()].statements;

            var args = str.substr(firstWord.length).trim();

            if (args.length > 0) {
                args = this.constructArgsArray(args);
                if (args.error) {
                    return {
                        error: args.error
                    };
                }
                
                args = args.array;
            } else {
                args = [];
            }

            this.currentMacroArgs = args;

            for (var i = 0; i < statements.length; i++) {
                var z = assembleLine(...statements[i]);
                if (z.error) {
                    return z.error;
                }
            }

            this.assemblingMacro = false;

            return {
                error: null
            };
        } else {
            // normal assembly finally //
            if (this.macroing) {
                if (cmd === "ENDM") {
                    this.macroing = false;
                } else {
                    this.macros[this.currentMacro].push([ str, addr, label ]);
                }

                return {
                    error: null
                };
            }

            var args = str.substr(firstWord.length).trim();

            if (args.length > 0) {
                args = this.constructArgsArray(args);
                if (args.error) {
                    return {
                        error: args.error
                    };
                }
    
                args = args.array;

                if (this.assemblingMacro) {
                    for (var i = 0; i < args.length; i++) {
                        let ind = this.macros[this.currentMacro].args.indexOf(args[i]);
                        if (ind !== -1) {
                            args[i] = this.currentMacroArgs[ind];
                        }
                    }
                }
            } else {
                args = [];
            }

            var z = {
                error: null
            };

            if ((firstWord === "MACRO" && macroPass) || !macroPass) {
                z = this.assembleCommand(firstWord, addr, label, args);
            }
                
            return z;
        }
    }

    resolveExpression16(e, addr) {
        //console.log("resolving: " + e);
        if (addr === undefined) {
            return {
                error: "provide addr to resolveExpression PLEASE THANKS"
            };
        }

        if (e === undefined) {
            return {
                error: "Invalid expression. Are you missing arguments?"
            };
        }

        // returns { error, array<int16> } //
        var og = e;
        var ret = [];

        e = e.toString().trim();

        if (e[0] === "'" && e[e.length - 1] === "'") {
            /*e = e.substr(1, e.length - 2).replace(/''/g, "'"); // remove leading and trailing quotes, deal with '' escape char
            for (var i = 0; i < e.length; i++) {
                // convert ascii to words
                ret.push(new int16(e.charCodeAt(i)));
            }

            return {
                error: null,
                array: ret
            };*/

            return {
                error: "illegal ascii literal: " + e
            }
        }

        e = e.toUpperCase();

        var pcount = 0;

        var prioMap = {
            "(": 0,
            ")": 0,
            "OR": 1,
            "XOR": 1,
            "AND": 2,
            "NOT": 3,
            "+": 4,
            "-": 4,
            "*": 5,
            "/": 5,
            "MOD": 5,
            "SHL": 5,
            "SHR": 5
        };

        for (var i = 0; i < e.length; i++) {
            if (e[i] === "(") {
                pcount = 0;
                for (var j = i; j < e.length; j++) {
                    if (e[j] === "(") {
                        pcount++;
                    } else if (e[j] === ")") {
                        pcount--;
                    }

                    if (pcount === 0) {
                        var z = this.resolveExpression16(e.substr(i + 1, (j - i) - 1), addr);
                        if (z.error) {
                            return {
                                error: z.error
                            };
                        }

                        e = e.substr(0, i) + z.value.value + e.substr(j + 1);
                        break;
                    }

                    if ((j === e.length - 1 && ++j)) {
                        return {
                            error: "missing closing parenthesis"
                        };
                    }
                }
            }
        }

        var nextIs = function(i, x) {
            for (var j = 0; j < x.length; j++) {
                if (i + x[j].length <= e.length && e.substr(i, x[j].length) === x[j]) {
                    return e.substr(i, x[j].length);
                }
            }

            return false;
        }

        var mindex = function(...args) {
            var max = -1;
            var op = "";
            var found = false;

            for (var i = 0; i < args.length; i++) {
                var ind = e.lastIndexOf(args[i]);
                if (ind > max) {
                    max = ind;
                    op = args[i];
                    found = true;
                }
            }

            return {
                index: max,
                op: op,
                found: found
            };
        }
        
        var z;

        // OR, XOR //
        z = mindex(" OR ", " XOR ");

        if (z.found) {
            if (z.op === " OR ") {
                var lhs = this.resolveExpression16(e.substr(0, z.index), addr);
                if (lhs.error) return { error: lhs.error };

                var rhs = this.resolveExpression16(e.substr(z.index + z.op.length), addr);
                if (rhs.error) return { error: rhs.error };

                e = lhs.value.or(rhs.value).toString();
            } else {
                var lhs = this.resolveExpression16(e.substr(0, z.index), addr);
                if (lhs.error) return { error: lhs.error };

                var rhs = this.resolveExpression16(e.substr(z.index + z.op.length), addr);
                if (rhs.error) return { error: rhs.error };

                e = lhs.value.xor(rhs.value).toString();}
        }

        // AND //
        z = mindex(" AND ");

        if (z.found) {
            var lhs = this.resolveExpression16(e.substr(0, z.index), addr);
            if (lhs.error) return { error: lhs.error };

            var rhs = this.resolveExpression16(e.substr(z.index + z.op.length), addr);
            if (rhs.error) return { error: rhs.error };

            e = lhs.value.and(rhs.value).toString();
        }

        // NOT //
        if (e.length > 3 && e.substr(0, 4) === "NOT ") {
            e = " " + e;
        }

        var ind = e.indexOf(" NOT ");

        if (ind !== -1) {
            var lhs = e.substr(0, ind);

            var rhs = this.resolveExpression16(e.substr(ind + 5), addr);
            if (rhs.error) return { error: rhs.error };

            e = (rhs.value.value ^ 0xFFFF).toString();
        }

        // + - //
        z = mindex("+", "-");

        if (z.found) {
            if (z.op === "+") {
                var lhs = this.resolveExpression16(e.substr(0, z.index).trim() || "0", addr);
                if (lhs.error) return { error: lhs.error };

                var rhs = this.resolveExpression16(e.substr(z.index + z.op.length), addr);
                if (rhs.error) return { error: rhs.error };

                e = lhs.value.plus(rhs.value).toString();
            } else {
                var lhs = this.resolveExpression16(e.substr(0, z.index).trim() || "0", addr);
                if (lhs.error) return { error: lhs.error };

                var rhs = this.resolveExpression16(e.substr(z.index + z.op.length), addr);
                if (rhs.error) return { error: rhs.error };

                e = lhs.value.minus(rhs.value).toString();}
        }

        // * / MOD SHL SHR //
        z = mindex("*", "/", " MOD ", " SHL ", " SHR ");

        if (z.found) {
            var lhs = this.resolveExpression16(e.substr(0, z.index), addr);
            if (lhs.error) return { error: lhs.error };

            var rhs = this.resolveExpression16(e.substr(z.index + z.op.length), addr);
            if (rhs.error) return { error: rhs.error };
            
            switch(z.op) {
                case "*":     e = lhs.value.times(rhs.value).toString(); break;
                case "/":     e = lhs.value.dividedBy(rhs.value).toString(); break;
                case " MOD ": e = (lhs.value.value % rhs.value.value).toString(); break;
                case " SHL ": e = (lhs.value.value << rhs.value.value).toString(); break;
                case " SHR ": e = (lhs.value.value >> rhs.value.value).toString(); break;
            }
        }


        if (this.equs.hasOwnProperty(e)) {
            return {
                error: null,
                value: this.equs[e]
            };
        }

        if (this.sets.hasOwnProperty(e)) {
            return {
                error: null,
                value: this.sets[e]
            };
        }

        if (this.hasLabel(e)) {
            e = this.getLabel(e);
            return {
                error: null,
                value: e
            };
        }

        // numbers //
        if (e[e.length - 1] === "H") {
            if (e[0] !== "0") {
                return {
                    error: "hex literals must begin with 0"
                };
            }

            e = e.substr(1, e.length - 2);

            for (var i = 0; i < e.length; i++) {
                var p = parseInt(e[i], 16);
                if (isNaN(p)) {
                    return {
                        error: "invalid hex numeral: " + og
                    };
                }
            }

            e = parseInt(e, 16);
            if (isNaN(e)) {
                return {
                    error: "invalid hex numeral: " + og
                };
            }

            return {
                error: null,
                value: new int16(e)
            };
        }

        if (e[e.length - 1] === "O" || e[e.length - 1] === "Q") {
            e = e.substr(0, e.length - 1);

            for (var i = 0; i < e.length; i++) {
                var p = parseInt(e[i], 8);
                if (isNaN(p)) {
                    return {
                        error: "invalid octal numeral: " + og
                    };
                }
            }

            e = parseInt(e, 8);
            if (isNaN(e)) {
                return {
                    error: "invalid octal numeral: " + og
                };
            }

            return {
                error: null,
                value: new int16(e)
            };
        }

        if (e[e.length - 1] === "B") {
            e = e.substr(0, e.length - 1);

            for (var i = 0; i < e.length; i++) {
                var p = parseInt(e[i], 2);
                if (isNaN(p)) {
                    return {
                        error: "invalid binary numeral: " + og
                    };
                }
            }

            e = parseInt(e, 2);
            if (isNaN(e)) {
                return {
                    error: "invalid binary numeral: " + og
                };
            }

            return {
                error: null,
                value: new int16(e)
            };
        }

        if (e === "$") {
            return {
                error: null,
                value: addr.copy()
            };
        }

        var dec = false;

        if (e[e.length - 1] === "D") {
            e = e.substr(0, e.length - 1);
            dec = true;
        }
    

        for (var i = 0; i < e.length; i++) {
            var p = parseInt(e[i], 10);
            if (isNaN(p)) {
                return {
                    error: (dec ? "invalid decimal numeral: " : "invalid expression: ") + og
                };
            }
        }

        e = parseInt(e, 10);
        if (isNaN(e)) {
            return {
                error: (dec ? "invalid decimal numeral: " : "invalid expression: ") + og
            };
        }
        
        return {
            error: null,
            value: new int16(e)
        };
    }

    resolveExpression8(e, addr) {
        var ret = this.resolveExpression16(e, addr);
        if (!ret.value) {
            ret.value = new int16(0);
        }
        //console.log(ret);
        return {
            error: ret.error,
            value: ret.value.toInt8()
        };
    }
}