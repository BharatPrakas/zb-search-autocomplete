import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export interface SearchSuggestion {
  text: string;
  type: 'suggestion' | 'product' | 'page';
}

export interface ProductSuggestion {
  name: string;
  image?: string;
  url?: string;
}

export interface PageSuggestion {
  name: string;
  url?: string;
}

export interface SearchResults {
  suggestions?: string[];
  products?: ProductSuggestion[];
  pages?: PageSuggestion[];
}

/**
 * Search Autocomplete Web Component
 * 
 * A reusable search autocomplete dropdown that can be integrated into any application.
 * 
 * @fires search-input - Fired when user types in the search box
 * @fires search-submit - Fired when user submits the search
 * @fires search-clear - Fired when user clears the search
 * @fires search-close - Fired when user closes the dropdown
 * @fires suggestion-click - Fired when user clicks a suggestion
 */
@customElement('zb-search-autocomplete')
export class ZbSearchAutocomplete extends LitElement {
  /**
   * Placeholder text for the search input
   */
  @property({ type: String })
  placeholder = 'Search';

  /**
   * API endpoint for fetching search results
   */
  @property({ type: String })
  apiEndpoint = '';

  /**
   * Debounce delay in milliseconds
   */
  @property({ type: Number })
  debounceDelay = 300;

  /**
   * Whether the dropdown is open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Current search query
   */
  @state()
  private searchQuery = '';

  /**
   * Search results
   */
  @state()
  private results: SearchResults = {};

  /**
   * Loading state
   */
  @state()
  private loading = false;

  private debounceTimer: number | null = null;

  /**
   * Handle input changes
   */
  private handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.searchQuery = input.value;

    // Clear previous timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Dispatch input event
    this.dispatchEvent(
      new CustomEvent('search-input', {
        detail: { query: this.searchQuery },
        bubbles: true,
        composed: true,
      })
    );

    // Debounce search
    if (this.searchQuery.trim()) {
      this.open = true;
      this.debounceTimer = window.setTimeout(() => {
        this.performSearch();
      }, this.debounceDelay);
    } else {
      this.open = false;
      this.results = {};
    }
  }

  /**
   * Perform search via API or custom event
   */
  private async performSearch() {
    if (!this.searchQuery.trim()) return;

    this.loading = true;

    try {
      if (this.apiEndpoint) {
        // Fetch from API
        const response = await fetch(
          `${this.apiEndpoint}?q=${encodeURIComponent(this.searchQuery)}`
        );
        const data = await response.json();
        this.results = data;
      } else {
        // Allow parent to handle search via event listener
        // Parent should listen to 'search-input' and call setResults()
      }
    } catch (error) {
      console.error('Search error:', error);
      this.results = {};
    } finally {
      this.loading = false;
    }
  }

  /**
   * Public method to set search results (for external API integration)
   */
  public setResults(results: SearchResults) {
    this.results = results;
    this.loading = false;
  }

  /**
   * Handle search submit
   */
  private handleSubmit(e: Event) {
    e.preventDefault();
    this.dispatchEvent(
      new CustomEvent('search-submit', {
        detail: { query: this.searchQuery },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Clear search
   */
  private handleClear() {
    this.searchQuery = '';
    this.results = {};
    this.open = false;
    this.dispatchEvent(
      new CustomEvent('search-clear', {
        bubbles: true,
        composed: true,
      })
    );
    this.focusInput();
  }

  /**
   * Close dropdown
   */
  private handleClose() {
    this.open = false;
    this.dispatchEvent(
      new CustomEvent('search-close', {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle suggestion click
   */
  private handleSuggestionClick(suggestion: string, type: string) {
    this.searchQuery = suggestion;
    this.dispatchEvent(
      new CustomEvent('suggestion-click', {
        detail: { suggestion, type },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Focus the search input
   */
  private focusInput() {
    const input = this.shadowRoot?.querySelector('input');
    input?.focus();
  }

  /**
   * Render text suggestions
   */
  private renderSuggestions() {
    if (!this.results.suggestions?.length) return null;

    return html`
      <div class="suggestions-section">
        <div class="section-label">SUGGESTIONS</div>
        <div class="suggestions-list">
          ${this.results.suggestions.map(
            (suggestion) => html`
              <div
                class="suggestion-item"
                @click=${() => this.handleSuggestionClick(suggestion, 'suggestion')}
              >
                <span class="suggestion-text">${suggestion}</span>
              </div>
            `
          )}
        </div>
      </div>
    `;
  }

  /**
   * Render product suggestions
   */
  private renderProducts() {
    if (!this.results.products?.length) return null;

    return html`
      <div class="products-section">
        ${this.results.products.map(
          (product) => html`
            <a
              href=${product.url || '#'}
              class="product-item"
              @click=${() => this.handleSuggestionClick(product.name, 'product')}
            >
              ${product.image
                ? html`<img src=${product.image} alt=${product.name} class="product-image" />`
                : null}
              <span class="product-name">${product.name}</span>
            </a>
          `
        )}
      </div>
    `;
  }

  /**
   * Render page suggestions
   */
  private renderPages() {
    if (!this.results.pages?.length) return null;

    return html`
      <div class="pages-section">
        <div class="section-label">PAGES</div>
        <div class="pages-list">
          ${this.results.pages.map(
            (page) => html`
              <a
                href=${page.url || '#'}
                class="page-item"
                @click=${() => this.handleSuggestionClick(page.name, 'page')}
              >
                <span class="page-name">${page.name}</span>
              </a>
            `
          )}
        </div>
      </div>
    `;
  }

  /**
   * Render loading state
   */
  private renderLoading() {
    if (!this.loading) return null;

    return html`
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <span>Searching...</span>
      </div>
    `;
  }

  /**
   * Render empty state
   */
  private renderEmpty() {
    if (
      this.loading ||
      !this.searchQuery ||
      this.results.suggestions?.length ||
      this.results.products?.length ||
      this.results.pages?.length
    ) {
      return null;
    }

    return html`
      <div class="empty-state">
        <span>No results found for "${this.searchQuery}"</span>
      </div>
    `;
  }

  render() {
    return html`
      <div class="search-container">
        <form @submit=${this.handleSubmit} class="search-form">
          <div class="search-input-wrapper">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <input
              type="text"
              class="search-input"
              placeholder=${this.placeholder}
              .value=${this.searchQuery}
              @input=${this.handleInput}
              autocomplete="off"
              spellcheck="false"
            />
            ${this.searchQuery
              ? html`
                  <button
                    type="button"
                    class="clear-button"
                    @click=${this.handleClear}
                    aria-label="Clear search"
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M18 6L6 18M6 6L18 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                `
              : null}
            <button
              type="button"
              class="close-button"
              @click=${this.handleClose}
              aria-label="Close search"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        </form>

        ${this.open
          ? html`
              <div class="dropdown">
                ${this.renderLoading()} ${this.renderSuggestions()} ${this.renderProducts()}
                ${this.renderPages()} ${this.renderEmpty()}
              </div>
            `
          : null}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
        sans-serif;
      --primary-color: #333;
      --border-color: #e0e0e0;
      --hover-bg: #f5f5f5;
      --text-primary: #333;
      --text-secondary: #666;
      --text-tertiary: #999;
      --shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .search-container {
      position: relative;
      width: 100%;
    }

    .search-form {
      width: 100%;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 0 12px;
      transition: all 0.2s ease;
    }

    .search-input-wrapper:focus-within {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(51, 51, 51, 0.1);
    }

    .search-icon {
      width: 20px;
      height: 20px;
      color: var(--text-tertiary);
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      padding: 12px 12px;
      font-size: 14px;
      color: var(--text-primary);
      background: transparent;
    }

    .search-input::placeholder {
      color: var(--text-tertiary);
    }

    .clear-button,
    .close-button {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-tertiary);
      transition: color 0.2s ease;
      flex-shrink: 0;
    }

    .clear-button:hover,
    .close-button:hover {
      color: var(--text-primary);
    }

    .clear-button svg,
    .close-button svg {
      width: 18px;
      height: 18px;
    }

    .dropdown {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      right: 0;
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      box-shadow: var(--shadow-lg);
      max-height: 400px;
      overflow-y: auto;
      z-index: 1000;
      animation: slideDown 0.2s ease;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .section-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-tertiary);
      letter-spacing: 0.5px;
      padding: 12px 16px 8px;
      text-transform: uppercase;
    }

    .suggestions-section,
    .products-section,
    .pages-section {
      border-bottom: 1px solid var(--border-color);
    }

    .suggestions-section:last-child,
    .products-section:last-child,
    .pages-section:last-child {
      border-bottom: none;
    }

    .suggestions-list,
    .pages-list {
      padding: 0 8px 8px;
    }

    .suggestion-item,
    .page-item {
      display: block;
      padding: 10px 12px;
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.15s ease;
      text-decoration: none;
      color: var(--text-primary);
    }

    .suggestion-item:hover,
    .page-item:hover {
      background-color: var(--hover-bg);
    }

    .suggestion-text,
    .page-name {
      font-size: 14px;
      display: block;
    }

    .products-section {
      padding: 8px;
    }

    .product-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.15s ease;
      text-decoration: none;
      color: var(--text-primary);
    }

    .product-item:hover {
      background-color: var(--hover-bg);
    }

    .product-image {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .product-name {
      font-size: 14px;
      font-weight: 500;
    }

    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 24px;
      color: var(--text-secondary);
    }

    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--border-color);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .empty-state {
      padding: 24px;
      text-align: center;
      color: var(--text-secondary);
      font-size: 14px;
    }

    /* Scrollbar styling */
    .dropdown::-webkit-scrollbar {
      width: 8px;
    }

    .dropdown::-webkit-scrollbar-track {
      background: transparent;
    }

    .dropdown::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 4px;
    }

    .dropdown::-webkit-scrollbar-thumb:hover {
      background: var(--text-tertiary);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'zb-search-autocomplete': ZbSearchAutocomplete;
  }
}
