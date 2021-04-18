export interface OpenCovidResponse {
    summary: ProvinceSummary[];
}

export interface ProvinceSummary {
    active_cases: number;
    active_cases_change: number;
    avaccine: number;
    cases: number;
    cumulative_avaccine: number;
    cumulative_cases: number;
    cumulative_cvaccine: number;
    cumulative_deaths: number;
    cumulative_dvaccine: number;
    cumulative_recovered: number;
    cumulative_testing: number;
    cvaccine: number;
    date: string;
    deaths: number;
    dvaccine: number;
    province: Province;
    recovered: number;
    testing: number;
    testing_info: string;
}

export enum Province {
    NAB = 'Alberta',
    BC = 'BC',
    MB = 'Manitoba',
    NB = 'New Brunswick',
    NL = 'NL',
    NS = 'Nova Scotia',
    NU = 'Nunavut',
    NWT = 'NWT',
    ON = 'Ontario',
    PEI = 'PEI',
    QC = 'Quebec',
    SK = 'Saskatchewan',
    YK = 'Yukon',
}
