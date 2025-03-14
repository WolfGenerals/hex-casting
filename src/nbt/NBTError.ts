// NBT error class

export default class NBTError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NBTError';
    }
}
