import { LitElement } from "lit";
import { property, state } from "lit/decorators.js";
import type { CoreAPI, GetSearchSuggestionResponse, SearchSuggestionData, SearchSuggestionProduct } from "./search-adapter.interface";

export class SearchBase extends LitElement {
  /**
   * Core API
   */
  @property({ type: Object })
  core?: CoreAPI;

  /**
   * Placeholder text
   */
  @property({ type: String })
  placeholder = "Search";

  /**
   * Debounce delay
   */
  @property({ type: Number })
  debounceDelay = 300;

  /**
   * Search limit
   */
  @property({ type: Number })
  searchLimit = 10;

  /**
   * Minimum search length
   */
  @property({ type: Number })
  minSearchLength = 3;

  /**
   * Open state
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Search query
   */
  @state()
  searchQuery = "";

  /**
   * Search results
   */
  @state()
  results: SearchSuggestionData = {} as SearchSuggestionData;

  /**
   * Loading state
   */
  @state()
  loading = false;

  /**
   * Debounce timer
   */
  protected debounceTimer: number | null = null;

  /**
   * Current URL
   */
  private _currentUrl = location.href;

  /**
   * URL check interval
   */
  private _urlCheckInterval: number | null = null;

  /**
   * Skip next URL change
   */
  private _skipNextUrlChange = false;

  /**
   * GraphQL query
   */
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

  /**
   * Handle input
   */
  protected handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.searchQuery = input.value;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    if (this.searchQuery.trim().length >= this.minSearchLength) {
      this.open = true;
      // Set loading to true immediately to show loader during debounce
      this.loading = true;
      this.debounceTimer = window.setTimeout(() => {
        this.performSearch();
      }, this.debounceDelay);
    } else {
      this.loading = false;
      this.results = {} as SearchSuggestionData;
    }
  }

  /**
   * Perform search
   */
  protected performSearch() {
    if (this.searchQuery.trim().length < this.minSearchLength) return;
    this.loading = true;
    if (this.core) {
      const storeId = this.core?.store.getStoreId();
      const variables = { input: { params: { storeId }, query: { storeId, limit: this.searchLimit, offset: 0, searchQuery: this.searchQuery } } };
      this.core?.graphqlClient.executeQuery(this.query, variables).then((res: GetSearchSuggestionResponse) => {
        if (res && res.i1_getSearchSuggestion.data) {
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
  }

  /**
   * Handle search response
   */
  protected handleSearchResponse(e: CustomEvent) {
    const data = e.detail?.data;
    if (!data) return;

    this.results = data;

    this.loading = false;
    this.open = true;
  }

  /**
   * Set results
   */
  public setResults(results: SearchSuggestionData) {
    this.results = results;
    this.loading = false;
  }

  /**
   * Handle submit
   */
  protected handleSubmit(e: Event) {
    e.preventDefault();
    if (this.searchQuery.trim() && this.results.products.length > 0) {
      this.handleSuggestionClick(this.searchQuery, `/products/all-products/0?searchText=${this.searchQuery}`);
      this.handleClose(true);
    }
  }

  /**
   * Handle clear
   */
  protected handleClear() {
    this.searchQuery = "";
    this.results = {} as SearchSuggestionData;
    this.focusInput();
  }

  /**
   * Handle close
   */
  protected handleClose(isKeepSearchQuery = false, isKeepResults = false) {
    this.open = false;
    if (!isKeepResults) {
      this.results = {} as SearchSuggestionData;
    }
    if (!isKeepSearchQuery) {
      this.searchQuery = "";
    }
    this.loading = false;
    if (document.body.style.overflow === "hidden") {
      document.body.style.overflow = "auto";
    }
  }

  /**
   * Handle suggestion click
   */
  protected handleSuggestionClick(suggestion: string, url?: string) {
    this.searchQuery = suggestion;
    this.open = false;
    // Flag: skip the next URL change so the polling doesn't clear the search query
    this._skipNextUrlChange = true;
    this.core?.navigation.navigate(url!);
    if (document.body.style.overflow === "hidden") {
      document.body.style.overflow = "auto";
    }
  }

  /**
   * Focus input
   */
  protected focusInput() {
    const input = this.shadowRoot?.querySelector("input");
    input?.focus();
  }

  /**
   * Handle pop state
   */
  private _handlePopState = () => {
  // Clear search when user navigates back/forward
  this.searchQuery = '';
  this.results = {} as SearchSuggestionData;
  this.open = false;
  this.loading = false;
  if (document.body.style.overflow === "hidden") {
    document.body.style.overflow = "auto";
  }
};

/**
 * Handle image error
 */
handleImageError(e:Event) {
  const img = e.target as HTMLImageElement;
  if (!img.dataset.fallback) {
    img.dataset.fallback = 'true';
    img.src = '/assets/image-not-found.jpg';
  }
}

/**
 * Connected callback
 */
connectedCallback() {
  super.connectedCallback();
  window.addEventListener('popstate', this._handlePopState);

  // Poll for URL changes (catches Angular router navigation)
  this._urlCheckInterval = window.setInterval(() => {
    if (location.href !== this._currentUrl) {
      this._currentUrl = location.href;
      if (this._skipNextUrlChange) {
        // Navigation was triggered by a suggestion click — don't clear
        this._skipNextUrlChange = false;
      } else {
        this._handlePopState();
      }
    }
  }, 300);
}

/**
 * Disconnected callback
 */
disconnectedCallback() {
  super.disconnectedCallback();
  window.removeEventListener('popstate', this._handlePopState);
  if (this._urlCheckInterval) clearInterval(this._urlCheckInterval);
}
}
