import { Province, ProvinceSummary } from './types/OpenCovidResponse';

export const apiBaseUrl = 'https://api.opencovid.ca';

const formattedProvinceNameMap = {
    [Province.AB]: 'Alberta',
    [Province.BC]: 'British Columbia',
    [Province.MB]: 'Manitoba',
    [Province.NB]: 'New Brunswick',
    [Province.NL]: 'Newfoundland',
    [Province.NS]: 'Nova Scotia',
    [Province.NU]: 'Nunavut',
    [Province.NWT]: 'Northwest Territories',
    [Province.ON]: 'Ontario',
    [Province.PEI]: 'Prince Edward Island',
    [Province.QC]: 'Quebec',
    [Province.SK]: 'Saskatchewan',
    [Province.YK]: 'Yukon',
};

export const buildUpdateMessage = (
    yesterdaySummary: ProvinceSummary,
    previousDaySummary: ProvinceSummary
): string => {
    const { cases } = yesterdaySummary;
    const caseChange = cases - previousDaySummary.cases;
    let caseChangeMessage: string;
    if (caseChange > 0) {
        caseChangeMessage = `New cases were up ${caseChange} from the day before - be careful.`;
    } else if (caseChange < 0) {
        caseChangeMessage = `New cases were down ${
            caseChange * -1
        } from the day before.`;
    } else {
        caseChangeMessage = `The amount of new cases stayed at ${cases} - the same from the day before.`;
    }

    return `${
        formattedProvinceNameMap[yesterdaySummary.province]
    }\nNew cases: ${cases === 0 ? '0' : cases}\n${caseChangeMessage}`;
};

export const getPreviousDate = (date: number): Date => {
    const datePreviousDay = new Date(date);
    datePreviousDay.setDate(datePreviousDay.getDate() - 1);

    return datePreviousDay;
};

export const createUpdateMessageMap = (): Map<Province, string> => {
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

    return updateMsgByProvince;
};
