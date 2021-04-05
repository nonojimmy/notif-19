import axios from 'axios';
import { ProvinceSummary, Province } from './types/OpenCovidResponse';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
    throw new Error('Credentials not found');
}

const main = async (): Promise<void> => {
    const res = (await axios.get('https://api.opencovid.ca/summary')).data
        .summary as ProvinceSummary[];

    const quebec = res.find(
        (province) => province.province === Province.QC
    ) as ProvinceSummary;
    const { active_cases, active_cases_change, date } = quebec;

    const message = `Here is your Quebec COVID-19 update for ${date}:\nChange In Active Cases: ${active_cases_change}\nTotal Active Cases: ${active_cases}`;

    const twilioClient = require('twilio')(accountSid, authToken);

    twilioClient.messages.create({
        body: message,
        from: '+14159660125',
        to: '+14389218184',
    });
};

main();
