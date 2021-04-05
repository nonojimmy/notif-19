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
    const { active_cases, cases, date, deaths } = quebec;

    const yesterday = (
        await axios.get('https://api.opencovid.ca/summary?date=03-04-2021')
    ).data.summary as ProvinceSummary[];

    const yesterdayQuebec = yesterday.find(
        (province) => province.province === Province.QC
    ) as ProvinceSummary;
    const { cases: yesterdayCases } = yesterdayQuebec;

    const caseChange = cases - yesterdayCases;

    let caseChangeMessage: string;
    if (caseChange > 0) {
        caseChangeMessage = `New cases are up ${caseChange} from yesterday.`;
    } else if (caseChange < 0) {
        caseChangeMessage = `New cases are down ${
            caseChange * -1
        } from yesterday.`;
    } else {
        caseChangeMessage = `There are the same amount of new cases today as yesterday.`;
    }

    const message = `Good morning 👋, here is your Quebec COVID-19 update for ${date}:\n\nNew cases: ${
        cases === 0 ? '0 ✨' : cases
    }\n${caseChangeMessage}\n\nWe will get through this - stay safe and stay hopeful ❤️`;

    const twilioClient = require('twilio')(accountSid, authToken);

    twilioClient.messages.create({
        body: message,
        from: '+14159660125',
        to: '+14389218184',
    });
};

main();
