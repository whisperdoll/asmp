class IODevice {
    constructor(processor) {
        this.processor = processor;
    }

    sendByte(byte) {
        byte = new int8(byte);
    }

    requestByte() {
        return new int8(0);
    }
}

class IO_SumRequester extends IODevice {
    constructor(processor) {
        super(processor);
        this.bytesToSend = [
            int8.random(),
            int8.random()
        ];
        this.bytesSent = 0;
        this.lastReceived = null;
        
        this.$element = document.createElement("div");
        this.$element.className = "device sumRequester";

        this.$inner = document.createElement("div");
        this.$inner.className = "sumRequester-inner";
        this.$element.appendChild(this.$inner);

        this.$inner.innerText = this.bytesToSend.map(i8 => i8.toDecString()).join(" ");

        this.$sum = document.createElement("div");
        this.$sum.className = "sumRequester-sum";
        this.$sum.innerText = "Sum: -";
        this.$element.appendChild(this.$sum);
    }

    reset() {
        this.bytesToSend = [
            int8.random(),
            int8.random()
        ];
        this.bytesSent = 0;
        this.lastReceived = null;
        this.$inner.innerText = this.bytesToSend.map(i8 => i8.toDecString()).join(" ");
        this.$sum.innerText = "Sum: -";
    }

    sendByte(byte) {
        this.lastReceived = byte.copy();
        this.$sum.innerText = "Sum: " + byte.toDecString();
    }

    requestByte() {
        if (this.bytesSent < 2) {
            return this.bytesToSend[this.bytesSent++].copy();
        } else {
            return new int8(0);
        }
    }
}

class IO_Screen extends IODevice {
    constructor(processor, resX, resY) {
        super(processor);
        
        this.$element = document.createElement("div");
        this.$element.className = "device screen";
        
        this.$canvas = document.createElement("canvas");
        this.$canvas.className = "screen-canvas";
        this.$canvas.getContext("2d").fillStyle = "#0F380F";
        this.$element.appendChild(this.$canvas);

        this.resX = resX || 9;
        this.resY = resY || 9;

        this.awaiting = false;
        this.array = [];

        this.reset();
    }

    set resX(resX) {
        this.$canvas.width = resX;
    }

    get resX() {
        return this.$canvas.width;
    }

    set resY(resY) {
        this.$canvas.height = resY;
    }

    get resY() {
        return this.$canvas.height;
    }

    reset() {
        this.awaiting = false;
        this.awaitingIndex = 0;
        this.$canvas.getContext("2d").clearRect(0, 0, this.$canvas.width, this.$canvas.height);
        for (var i = 0; i < this.resX * this.resY; i++) {
            this.array[i] = 0;
        }
        this.$canvas.getContext("2d").fillStyle = "#0F380F";
    }

    sendByte(byte) {
        byte = coerceInt(byte);

        if (!this.awaiting) {
            var index = byte % (this.resX * this.resY);
            this.awaitingIndex = index;
            this.awaiting = true;
        } else {
            if (byte === 0) {
                this.clearIndex(this.awaitingIndex);
            } else {
                this.fillIndex(this.awaitingIndex);
            }

            this.awaiting = false;
        }
    }

    requestByte() {
        if (this.awaiting) {
            this.awaiting = false;
            return new int8(this.array[this.awaitingIndex]);
        } else {
            return new int8(255);
        }
    }

    fillIndex(index) {
        this.array[index] = 1;
        this.$canvas.getContext("2d").fillRect(index % this.resX, ~~(index / this.resX), 1, 1);
    }

    clearIndex(index) {
        this.array[index] = 0;
        this.$canvas.getContext("2d").clearRect(index % this.resX, ~~(index / this.resX), 1, 1);
    }

    setArray(arr) {
        for (var i = 0; i < arr.length; i++) {
            let val = coerceInt(arr[i]);
            i %= this.resX * this.resY;
            if (val === 0) {
                this.clearIndex(i);
            } else {
                this.fillIndex(i);
            }
        }
    }
}

class IO_TouchPad extends IODevice {
    constructor (processor) {
        super(processor);

        this.$element = document.createElement("div");
        this.$element.className = "touchpad";
        
        this.$inner = document.createElement("div");
        this.$inner.className = "touchpad-inner";
        this.$inner.addEventListener("mouseDown", this.onDown.bind(this));
        this.$inner.addEventListener("mouseUp", this.onUp.bind(this));
        this.$element.appendChild(this.$inner);

        this._interruptByte = new int8(0b11001111);

        this.reset();
    }

    reset() {
        this.active = false;
    }

    sendByte(byte) {
        byte = coerceInt(byte);
        if (byte) {
            this.onDown();
        } else {
            this.onUp();
        }
    }

    requestByte() {
        if (this.active) {
            return new int8(1);
        } else {
            return new int8(0);
        }
    }

    onDown() {
        this.active = true;
        this.$inner.classList.add("touchpad-inner-active");
        this.pendingInterrupt = true;
    }

    onUp() {
        this.active = false;
        this.$inner.classList.remove("touchpad-inner-active");
        this._interruptByte = this.requestByte();
        this.pendingInterrupt = true;
    }

    get interruptByte() {
        this.pendingInterrupt = false;
        return this._interruptByte;
    }
}