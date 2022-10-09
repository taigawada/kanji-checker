import rl from 'readline';
const spin_char = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let spin_count = 0;
export class Spinner {
        msg: string;
        repeater: ReturnType<typeof setTimeout>;
    constructor(msg: string) {
        this.msg = msg;
        this.repeater = setInterval(() => {
            process.stdout.write('\x1B[?25l');
            rl.clearLine(process.stdout, 0);
            rl.moveCursor(process.stdout, -9999, 0);
            process.stdout.write(`\x1b[35m${spin_char[spin_count]} ${this.msg}`);
            spin_count++;
            spin_count >= spin_char.length ? (spin_count = 0) : null;
            return this;
            }, 200);
    }
    stop() {
        clearInterval(this.repeater);
        rl.clearLine(process.stdout, 0);
        rl.moveCursor(process.stdout, -9999, 0);
        process.stderr.write(`\x1b[35m${spin_char[spin_count]} ...done\n`);
        return this;
    }
}
