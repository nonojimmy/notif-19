export class EmptyApiResponseException extends Error {
    public readonly date;
    constructor(date: string) {
        super(`No data returned for date ${date}`);
        this.date = date;
    }
}
