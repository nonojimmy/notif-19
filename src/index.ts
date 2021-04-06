import axios from 'axios';
import { MongoClient } from 'mongodb';
import dateformat from 'dateformat';
import twilio from 'twilio';
import {
    ProvinceSummary,
    Province,
    OpenCovidResponse,
} from './types/OpenCovidResponse';
import { User } from './types/User';
import { EmptyApiResponseException } from './exceptions/EmptyApiResponseException';

const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
const mongoDbName = process.env.MONGO_DB_NAME;

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!twilioAccountSid || !twilioAuthToken) {
    throw new Error('Twilio credentials not found');
}

if (!mongoUser || !mongoPass || !mongoDbName) {
    throw new Error('Mongo user credentials not found');
}

if (!twilioPhoneNumber) {
    throw new Error('Twilio phone number not found');
}

const twilioClient = twilio(twilioAccountSid, twilioAuthToken);

const mongoUri = `mongodb+srv://${mongoUser}:${mongoPass}@cluster0.mmhb4.mongodb.net/${mongoDbName}?retryWrites=true&w=majority`;
const mongoClient = new MongoClient(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const main = async (): Promise<void> => {
    let users: User[];
    try {
        await mongoClient.connect();
        users = await mongoClient
            .db(mongoDbName)
            .collection('notif19_users')
            .find()
            .toArray();
    } catch (e) {
        throw new Error(`Error connecting to DB: ${e.message}`);
    } finally {
        await mongoClient.close();
    }

    const subscribersByProvince = new Map<Province, User[]>();
    subscribersByProvince.set(Province.AB, []);
    subscribersByProvince.set(Province.BC, []);
    subscribersByProvince.set(Province.MB, []);
    subscribersByProvince.set(Province.NB, []);
    subscribersByProvince.set(Province.NL, []);
    subscribersByProvince.set(Province.NS, []);
    subscribersByProvince.set(Province.NU, []);
    subscribersByProvince.set(Province.NWT, []);
    subscribersByProvince.set(Province.ON, []);
    subscribersByProvince.set(Province.PEI, []);
    subscribersByProvince.set(Province.QC, []);
    subscribersByProvince.set(Province.SK, []);
    subscribersByProvince.set(Province.YK, []);

    users.forEach((user) => {
        user.subscribedProvinces.forEach((prov: Province) => {
            subscribersByProvince.get(prov)?.push(user);
        });
    });

    const dateNow = new Date();
    const dateYesterday = new Date(dateNow);
    dateYesterday.setDate(dateNow.getDate() - 1);
    const todayFormatted = dateformat(dateNow, 'dd-mm-yyyy');
    const yesterdayFormatted = dateformat(dateYesterday, 'dd-mm-yyyy');

    const summaries = (
        await axios.get<OpenCovidResponse>(
            `https://api.opencovid.ca/summary?date=${todayFormatted}`
        )
    ).data.summary;

    if (summaries.length < 1) {
        throw new EmptyApiResponseException(todayFormatted);
    }

    const yesterdaySummaries = (
        await axios.get<OpenCovidResponse>(
            `https://api.opencovid.ca/summary?date=${yesterdayFormatted}`
        )
    ).data.summary;

    summaries.forEach((summary) => {
        const { province, cases, date } = summary;
        const { cases: yesterdayCases } = yesterdaySummaries.find(
            (summary) => summary.province === province
        ) as ProvinceSummary;

        const caseChange = cases - yesterdayCases;
        let caseChangeMessage: string;
        if (caseChange > 0) {
            caseChangeMessage = `New cases are up ${caseChange} from yesterday.`;
        } else if (caseChange < 0) {
            caseChangeMessage = `New cases are down ${
                caseChange * -1
            } from yesterday.`;
        } else {
            caseChangeMessage = `The amount of new cases has not changed from yesterday to today.`;
        }

        const subscribers = subscribersByProvince.get(province);
        subscribers?.forEach((sub) => {
            const message = `Hi ${
                sub.firstName
            } 👋, here is your ${province} COVID-19 update for ${date}:\n\nNew cases: ${
                cases === 0 ? '0 ✨' : cases
            }\n${caseChangeMessage}\n\nWe will get through this - stay safe and stay hopeful ❤️`;
            twilioClient.messages.create({
                body: message,
                from: twilioPhoneNumber,
                to: sub.phoneNumber,
            });
        });
    });

    console.log('Finished running job');
};

main();
