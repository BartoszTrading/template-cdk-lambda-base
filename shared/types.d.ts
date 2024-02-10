export type CDKContext = {
  appName: string;
  region: string;
  accountNumber: string;
  environment: string;
  branchname: string;
  vpc: {
      id: string;
      cidr: string;
      privateSubnets: string[];
  };
}


export type LambdaDefinition = {
  name: string;
  memoryMB?: number;
  timeoutMins?: number;
  environment?: {
      [key: string]: string;
  };
  isPrivate?: boolean;

}

export type DynamoDefinition = {
  name: string;
  partitionKeyName: string;
  sortKeyName?: string;
  secondaryIndexes?: {
      indexName: string;
      partitionKeyName: string;
      sortKeyName?: string;
  }[];
}

export type LogInput = {
  objecttype: string;
  objectAction: string;
  userid: string;
  objectid?: string;
}

export type SqsDefinition = {
  queueName: string;
  contentBasedDeduplication?: boolean;
  fifo?:boolean;
  visibilityTimeout?: any;

  

}


export type User = {
  itemType: string
  firstName: string
  lastName: string
  email: string
  gender: string
  jobTitle: string
  country: string
}

export type Org = {
  userid: string
  orgid: string
  name?: string
  email: string
  prevorgid?: string

}

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

export type Kupujacy = {
  buyerid: string;
  orgid: string;
  imie: string;
  nazwisko: string;
  email: string;
  telefon: string;
  auta: [string];
}



export type GetUsersParams = {
  getUsersInput: {
    nextToken?: string;
    email?: string;
  }
}
export type GetSamochodyParams = {
  getSamochodyInput: {
      nextToken?: string;
      autoid?: string;
      orgid?: string;
      buyerid?: string;
  }
}

export type GetKupujacyParams = {
  getKupujacyInput: {
    nextToken?: string;
    buyerid?: string;
    orgid?: string;
  }
}
type Dokument  = {
  docid: String
  name: String
  url: String
}



export type GetDokumentyParams = {
  getDokumentyInput: {
    ids: [string];
  }
}


export type AddUserParams = {
  addUserInput : {
      email: string;
      firstName: string;
      lastName: string;
      gender: string;
      jobTitle: string;
      country: string;
  }
}

export type AddOrgParams = {
  addOrgInput: {
    userid: string;
    name: string;
    email: string;
  }
}
export type GetOrgsParams = {
  getOrgsInput: {
    userid?: string;
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
      notatka: string;
      zdjecia_glowne: [string];
      zdjecia_laweta: [string];
    };
  };

export type AddKupujacyParams = {
  addKupujacyInput: {
    buyerid: string;
    orgid: string;
    imie: string;
    nazwisko: string;
    email: string;
    telefon: string;
    auta: [string];
  }
}


export type DeleteSamochodyParams = {
  deleteSamochodyInput: {
      autoid: string;
    }
  }
  
export type DeleteUserParams = {
  deleteUserInput: {
      email: string;
  }
}

export type DeleteKupujacyParams = {
  deleteKupujacyInput: {
    buyerid: string;
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
      title_status?: string;
      data_zakupu?: string;
      notatka?: string;
      zdjecia_glowne?: [string];
      zdjecia_laweta?: [string];
  }
}

export type UpdateOrgParams = {
  updateOrgInput: {
      userid: string;
      name: string;
  }
}

export type DeleteOrgParams = {
  deleteOrgInput: {
      userid: string;
  }
}

export type AddFileParams = {
  inputValidateFile: {
    key: string;
    userid: string;
    autoid: string;
    name: string;
  }
}

export type UpdateUserParams = {
  updateUserInput: {
      email: string;
      firstName?: string;
      lastName?: string;
      gender?: string;
      jobTitle?: string;
      country?: string;
  }}

export type UpdateKupujacyParams = {
  updateKupujacyInput: {
    buyerid: string;
    imie?: string;
    nazwisko?: string;
    email?: string;
    telefon?: string;
    auta: [string];
  }
}