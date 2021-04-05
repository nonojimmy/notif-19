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
    province: string;
    recovered: number;
    testing: number;
    testing_info: string;
}

export enum Province {
    AB = 'Alberta',
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
