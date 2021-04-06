import { Province } from './OpenCovidResponse';

export interface User {
    _id: string;
    subscribedProvinces: Province[];
    phoneNumber: string;
    firstName: string;
}
