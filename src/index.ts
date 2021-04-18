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
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

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

const connectToMongo = async (): Promise<MongoClient> => {
    const mongoClient = new MongoClient(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    await mongoClient.connect();
    return mongoClient;
};

const buildUpdateMessage = (
    summary: ProvinceSummary,
    yesterdaySummary: ProvinceSummary
): string => {
    const { cases } = summary;
    const caseChange = cases - yesterdaySummary.cases;
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

    return `${formatProvinceName(summary.province)}\nNew cases: ${
        cases === 0 ? '0 ✨' : cases
    }\n${caseChangeMessage}`;
};

const formatProvinceName = (prov: Province): string => {
    switch (prov) {
        case Province.AB:
            return 'Alberta';
        case Province.BC:
            return 'British Columbia';
        case Province.MB:
            return 'Manitoba';
        case Province.NB:
            return 'New Brunswick';
        case Province.NL:
            return 'Newfoundland';
        case Province.NS:
            return 'Nova Scotia';
        case Province.NU:
            return 'Nunavut';
        case Province.NWT:
            return 'Northwest Territories';
        case Province.ON:
            return 'Ontario';
        case Province.PEI:
            return 'Prince Edward Island';
        case Province.QC:
            return 'Quebec';
        case Province.SK:
            return 'Saskatchewan';
        case Province.YK:
            return 'Yukon';
        default:
            throw new Error(`Invalid province name: ${prov}`);
    }
};

export const handler = async (): Promise<APIGatewayProxyResult> => {
    let users: User[];
    const mongoClient = await connectToMongo();
    try {
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

    const dateNow = new Date();
    dateNow.setDate(dateNow.getDate() - 1);
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

    const updateMsgByProvince = new Map<Province, string>();
    updateMsgByProvince.set(Province.AB, '');
    updateMsgByProvince.set(Province.BC, '');
    updateMsgByProvince.set(Province.MB, '');
    updateMsgByProvince.set(Province.NB, '');
    updateMsgByProvince.set(Province.NL, '');
    updateMsgByProvince.set(Province.NS, '');
    updateMsgByProvince.set(Province.NU, '');
    updateMsgByProvince.set(Province.NWT, '');
    updateMsgByProvince.set(Province.ON, '');
    updateMsgByProvince.set(Province.PEI, '');
    updateMsgByProvince.set(Province.QC, '');
    updateMsgByProvince.set(Province.SK, '');
    updateMsgByProvince.set(Province.YK, '');

    summaries.forEach((summary) => {
        const { province } = summary;

        if (!Object.values(Province).includes(province)) {
            return;
        }

        const yesterdaySummary = yesterdaySummaries.find(
            (yesterday) => yesterday.province === province
        ) as ProvinceSummary;

        updateMsgByProvince.set(
            province,
            buildUpdateMessage(summary, yesterdaySummary)
        );
    });

    users.forEach((user) => {
        let message = `Hi ${user.firstName} 👋, here is your COVID-19 update for ${todayFormatted}:\n\n`;

        user.subscribedProvinces.forEach((province, i) => {
            message += updateMsgByProvince.get(province);
            message += '\n\n';
            if (i === user.subscribedProvinces.length - 1) {
                message += 'We will get through this! Stay safe ❤️';
            }
        });

        twilioClient.messages
            .create({
                body: message,
                from: twilioPhoneNumber,
                to: user.phoneNumber,
            })
            .catch((err) => console.log(err.message));
    });

    return {
        statusCode: 200,
        body: 'Finished running job',
    };
};
