export type Samochod = {
    userid: string;
    autoid: string;
    orgid?: string;
    buyerid?: string;
    timestamp: number;
    VIN: string;
    dokumenty?: string[];
    m_status: string;
    num_kontenera: string;
    m_data: string;
    rocznik: string;
    marka_i_model: string;
    title_status: string;
    data_zakupu: string;
    notatka: string;
    zdjecia_glowne: [string];
    zdjecia_laweta: [string];
}

export type GetSamochodyParams = {
getSamochodyInput: {
    nextToken?: string;
    autoid?: string;
    orgid?: string;
    buyerid?: string;
}
}

export type AddSamochodyParams = {
addSamochodyInput: {
    userid: string;
    buyerid?: string;
    VIN: string;
    m_status: string;
    num_kontenera: string;
    m_data: string;
    rocznik: string;
    marka_i_model: string;
    title_status: string;
    data_zakupu: string;
    notificate: Boolean;
    notatka: string;
    zdjecia_glowne: [string];
    zdjecia_laweta: [string];
};
};

export type DeleteSamochodyParams = {
deleteSamochodyInput: {
    autoid: string;
    }
}

export type UpdateSamochodyParams = {
    updateSamochodyInput: {
        autoid: string;
        buyerid?: string;
        VIN?: string;
        m_status?: string;
        num_kontenera?: string;
        m_data?: string;
        rocznik?: string;
        dokumenty?: [string];
        marka_i_model?: string;
        notificate?: Boolean
        title_status?: string;
        data_zakupu?: string;
        notatka?: string;
        zdjecia_glowne?: [string];
        zdjecia_laweta?: [string];
    }
  }