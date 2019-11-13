export class AsyncQueue<T> {
    private readonly items: T[];
    private readonly waiters: Array<(item: T) => void>;


    constructor() {
        this.items = [];
        this.waiters = [];
    }

    put(item: T) {
        const waiter = this.waiters.shift();
        if (waiter) {
            waiter(item);
            return;
        }

        this.items.push(item);
    }

    get(): Promise<T> {
        const item = this.items.shift();
        if (item) return Promise.resolve(item);

        return new Promise(res => this.waiters.push(res));
    }
}