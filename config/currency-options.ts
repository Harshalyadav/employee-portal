import { CurrencyEnum } from "@/types";

export const EMPLOYEE_CURRENCY_OPTIONS: Array<{
    value: CurrencyEnum;
    label: string;
}> = [
        { value: CurrencyEnum.AED, label: "United Arab Emirates (AED)" },
        { value: CurrencyEnum.USD, label: "United States (USD)" },
        { value: CurrencyEnum.EUR, label: "Eurozone (EUR)" },
        { value: CurrencyEnum.GBP, label: "United Kingdom (GBP)" },
        { value: CurrencyEnum.INR, label: "India (INR)" },
        { value: CurrencyEnum.SAR, label: "Saudi Arabia (SAR)" },
        { value: CurrencyEnum.QAR, label: "Qatar (QAR)" },
        { value: CurrencyEnum.OMR, label: "Oman (OMR)" },
        { value: CurrencyEnum.KWD, label: "Kuwait (KWD)" },
        { value: CurrencyEnum.BHD, label: "Bahrain (BHD)" },
    ];
