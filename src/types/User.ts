import { Province } from './OpenCovidResponse';

export interface User {
    _id: string;
    email: string;
    subscribedProvinces: Province[];
    phoneNumber: string;
}
