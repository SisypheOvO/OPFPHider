export interface PageStates {
  [pageId: string]: boolean;
}

export interface I18nStrings {
  [key: string]: {
    [lang: string]: string;
  };
}

export type PageAction = 'collapse' | 'remove';