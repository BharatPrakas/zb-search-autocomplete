export interface ImageConfig {
  height?: number;
  width?: number;
  quality?: number;
  format?: string;
}
export interface SearchAdapter {
  getSuggestion(query: string): Promise<SearchSuggestionData>;
  navigate(url: string): void;
}
export interface CoreAPI {
  navigation: NavigationAPI;
  image: ImageAPI;
  graphqlClient: GraphqlClient;
  store: StoreAPI;
}

export interface NavigationAPI {
  navigate(url: string, options?: { replace?: boolean }): void;
  back(): void;
}

export interface ImageAPI {
  buildUrl(path: string, config?: ImageConfig): string;
}

export interface SearchSuggestionData {
  query: string;
  suggestions: SearchSuggestionCategory[];
  products: SearchSuggestionProduct[];
  view_all_url: string;
}
export interface GetSearchSuggestionResponse {
    i1_getSearchSuggestion: GetSearchSuggestionResponseData
}
export interface GetSearchSuggestionResponseData {
    data: SearchSuggestionData;
}
export interface SearchSuggestionCategory {
  name: string;
  id: number;
  url: string;
}
export interface SearchSuggestionProduct {
  name: string;
  image: string | null;
  url: string;
}

export interface GraphqlClient {
  executeQuery(query: string, variables?: any): Promise<any>;
}

export interface StoreAPI {
  getStoreId(): number;
}

export interface SearchConfig {
  searchLimit: number;
  debounceDelay: number;
  placeholder: string;
}