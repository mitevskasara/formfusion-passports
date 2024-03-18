declare module "@formfusion/passports" {
  type Passports = {
    AM: string;
    AR: string;
    AT: string;
    AU: string;
    AZ: string;
    BE: string;
    BG: string;
    BR: string;
    BY: string;
    CA: string;
    CH: string;
    CN: string;
    CY: string;
    CZ: string;
    DE: string;
    DK: string;
    DZ: string;
    EE: string;
    ES: string;
    FI: string;
    FR: string;
    GB: string;
    GR: string;
    HR: string;
    HU: string;
    IE: string;
    IN: string;
    ID: string;
    IR: string;
    IS: string;
    IT: string;
    JM: string;
    JP: string;
    KR: string;
    KZ: string;
    LI: string;
    LT: string;
    LU: string;
    LV: string;
    LY: string;
    MT: string;
    MZ: string;
    MY: string;
    MX: string;
    NL: string;
    NZ: string;
    PH: string;
    PK: string;
    PL: string;
    PT: string;
    RO: string;
    RU: string;
    SE: string;
    SL: string;
    SK: string;
    TH: string;
    TR: string;
    UA: string;
    US: string;
    ZA: string;
  };

  type LowercaseKeys<T> = {
    [K in keyof T as K extends string ? Lowercase<K> : never]: T[K];
  };

  type passports = LowercaseKeys<Passports>;

  export = passports;
}
