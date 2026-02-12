import { LitElement } from "lit";
import { property, state } from "lit/decorators.js";
import type { CoreAPI, GetSearchSuggestionResponse, SearchSuggestionData, SearchSuggestionProduct } from "./search-adapter.interface";

export class SearchBase extends LitElement {

  @property({ type: Object })
  core?: CoreAPI;

  @property({ type: String })
  placeholder = "Search";

  @property({ type: Number })
  debounceDelay = 300;

  @property({ type: Boolean, reflect: true })
  open = false;

  @state()
  searchQuery = "";

  @state()
  results: SearchSuggestionData = {} as SearchSuggestionData;

  @state()
  loading = false;

  protected debounceTimer: number | null = null;

  protected query = `query I1_getSearchSuggestion($input: i1_GetSearchSuggestionInput) {
    i1_getSearchSuggestion(input: $input) {
      data {
        query
        suggestions {
          name
          id
          url
        }
        products {
          name
          image
          url
        }
        view_all_url
      }
    }
  }`;

  // override connectedCallback() {
  //   super.connectedCallback();
  //   window.addEventListener(
  //     "zb-search-response",
  //     this.handleSearchResponse.bind(this) as EventListener
  //   );
  // }

  // override disconnectedCallback() {
  //   super.disconnectedCallback();
  //   window.removeEventListener(
  //     "zb-search-response",
  //     this.handleSearchResponse.bind(this) as EventListener
  //   );
  // }

  protected handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.searchQuery = input.value;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    if (this.searchQuery.trim()) {
      this.open = true;
      this.debounceTimer = window.setTimeout(() => {
        this.performSearch();
      }, this.debounceDelay);
    } else {
      // this.open = false;
      this.results = {} as SearchSuggestionData;
    }
  }

  protected performSearch() {
    if (!this.searchQuery.trim()) return;
    this.loading = true;
    if (this.core) {
      const storeId = this.core?.store.getStoreId();
      const variables = { input: { params: { storeId }, query: { storeId, limit: 10, offset: 0, searchQuery: this.searchQuery } } };
      this.core?.graphqlClient.executeQuery(this.query, variables).then((res: GetSearchSuggestionResponse) => {
        if (res && res.i1_getSearchSuggestion.data) {
          console.log('Search Response', res.i1_getSearchSuggestion.data);
          this.results = res.i1_getSearchSuggestion.data;
          this.results.products = res.i1_getSearchSuggestion.data.products.map((p: SearchSuggestionProduct) => {
            return {
              ...p,
              image: this.core?.image.buildUrl(p.image || 'assets/images/placeholder.png', {width: 300, height: 300}),
            } as SearchSuggestionProduct;
          });
          this.loading = false;
          this.open = true;
        }
      });
      return;
    }
    // this.dispatchEvent(
    //   new CustomEvent("search-input", {
    //     detail: { query: this.searchQuery },
    //     bubbles: true,
    //     composed: true,
    //   })
    // );
  }

  protected handleSearchResponse(e: CustomEvent) {
    const data = e.detail?.data;
    if (!data) return;

    this.results = data;

    this.loading = false;
    this.open = true;
  }

  public setResults(results: SearchSuggestionData) {
    this.results = results;
    this.loading = false;
  }

  protected handleSubmit(e: Event) {
    e.preventDefault();
    // this.dispatchEvent(
    //   new CustomEvent("search-submit", {
    //     detail: { query: this.searchQuery },
    //     bubbles: true,
    //     composed: true,
    //   })
    // );
  }

  protected handleClear() {
    this.searchQuery = "";
    this.results = {} as SearchSuggestionData;
    // this.open = false;
    // this.dispatchEvent(
    //   new CustomEvent("search-clear", {
    //     bubbles: true,
    //     composed: true,
    //   })
    // );
    this.focusInput();
  }

  protected handleClose() {
    this.open = false;
    this.results = {} as SearchSuggestionData;
    this.searchQuery = "";
    this.loading = false;
    // this.dispatchEvent(
    //   new CustomEvent("search-close", {
    //     bubbles: true,
    //     composed: true,
    //   })
    // );
  }

  protected handleSuggestionClick(suggestion: string, url?: string) {
    this.searchQuery = suggestion;
    this.open = false;
    this.core?.navigation.navigate(url!);
    // this.dispatchEvent(
    //   new CustomEvent("search-close", {
    //     bubbles: true,
    //     composed: true,
    //   })
    // );
    // if (this.router && url) {
    //   const cleanUrl = this.router.getUrlTree(url, this.activatedRoute!);
    //   console.log('cleanUrl',cleanUrl);
    //   this.router.navigate(cleanUrl);
    //   return;
    // }

    // this.dispatchEvent(
    //   new CustomEvent("suggestion-click", {
    //     detail: { suggestion, type, url },
    //     bubbles: true,
    //     composed: true,
    //   })
    // );
  }

  protected focusInput() {
    const input = this.shadowRoot?.querySelector("input");
    input?.focus();
  }
}
