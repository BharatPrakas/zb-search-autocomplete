import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { SearchBase } from "./search-base";

@customElement("zb-search-autocomplete")
export class ZbSearchAutocomplete extends SearchBase {
  
  /**
   * Highlight parts of text that match/don't match query.
   */
  private highlightMatch(text: string, query: string) {
    if (!query) return html`${text}`;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) {
      return html`<span>${text}</span>`;
    }

    const before = text.substring(0, index);
    const matchStr = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);

    return html`
      <span>${before}</span><span class="highlight-bold">${matchStr}</span><span>${after}</span>
    `;
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
                @click=${() =>
                  this.handleSuggestionClick(suggestion.name, "suggestion", suggestion.url)}
              >
                <span class="suggestion-text">
                  ${this.highlightMatch(suggestion.name, this.searchQuery)}
                </span>
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
        <div class="section-label">PRODUCTS</div>
        ${this.results.products.map(
          (product) => html`
            <div
              class="product-item"
              @click=${() =>
                this.handleSuggestionClick(product.name, "product", product.url)}
            >
              ${
                product.image
                  ? html`<img src=${product.image} alt=${product.name} class="product-image" />`
                  : null
              }
              <span class="product-name">
                 ${this.highlightMatch(product.name, this.searchQuery)}
              </span>
            </div>
          `
        )}
      </div>
    `;
  }

  /**
   * Render page suggestions
   */


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
      this.results.products?.length
      // this.results.pages?.length
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
    <div class="search-overlay">
    <div class="search-modal">
      <div class="search-container">
        <form @submit=${this.handleSubmit} class="search-form">
            <div class="search-input-wrapper">
              <div class="input-content">
                  <label class="search-label">${this.placeholder}</label>
                  <input
                    type="text"
                    class="search-input"
                    .value=${this.searchQuery}
                    @input=${this.handleInput}
                    autocomplete="off"
                    spellcheck="false"
                  />
              </div>
              <div class="actions-container">
                ${
                  this.searchQuery
                    ? html`
                      <button
                        type="button"
                        class="clear-button"
                        @click=${this.handleClear}
                        aria-label="Clear search"
                      >
                       <!-- Circle with X -->
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                           <circle cx="12" cy="12" r="9" fill="#e0e0e0" /> 
                           <path d="M15 9L9 15M9 9L15 15" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                    `
                    : null
                }
                <div class="search-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                        d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        />
                    </svg>
                </div>
              </div>
            
              ${
                this.open
                  ? html`
                    <div class="dropdown">
                      ${this.renderLoading()} ${this.renderSuggestions()} ${this.renderProducts()}
                      ${this.renderEmpty()}
                    </div>
                  `
                  : null
              }
            </div>
        </form>
        
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
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

      </div>
    </div>
    </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
        sans-serif;
      --primary-color: #000;
      --border-color: #e0e0e0;
      --hover-bg: #f8f9fa;
      --text-primary: #333;
      --text-secondary: #666;
      --text-tertiary: #999;
      --shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .search-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      animation: fadeIn 0.2s ease;
    }

    .search-modal {
      width: 100%;
      background: white;
      padding: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      animation: slideDown 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .search-container {
      position: relative;
      width: 50%;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .search-form {
      flex: 1;
      position: relative;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 4px; /* Square with slight roundness */
      padding: 0 12px;
      height: 48px;
      width: 100%;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }

    .search-input-wrapper:focus-within {
      border-color: var(--border-color);
    }

    .input-content {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      overflow: hidden;
    }

    .search-label {
      font-size: 10px;
      color: var(--text-tertiary);
      font-weight: 500;
      margin-bottom: 0px;
      line-height: 1;
      padding-top: 4px;
    }

    .search-input {
      border: none;
      outline: none;
      padding: 0;
      font-size: 16px;
      color: var(--text-primary);
      background: transparent;
      line-height: 20px;
      height: 24px;
    }

    .actions-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .search-icon {
      width: 20px;
      height: 20px;
      color: var(--text-secondary);
      flex-shrink: 0;
      cursor: pointer;
    }

    .clear-button {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      transition: color 0.2s ease;
      flex-shrink: 0;
    }

    .clear-button svg {
      width: 16px;
      height: 16px;
    }

    .clear-button:hover {
      color: var(--text-secondary);
    }

    /* Outer close button */
    .close-button {
      background: none;
      border: none;
      padding: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      transition: color 0.2s ease;
      flex-shrink: 0;
    }

    .close-button:hover {
      color: var(--primary-color);
    }

    .close-button svg {
      width: 24px;
      height: 24px;
    }

    .dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid var(--border-color);
      border-top: none; 
      margin-top: -1px;
      border-radius: 0 0 4px 4px;
      box-shadow: var(--shadow);
      max-height: 400px;
      overflow-y: auto;
      z-index: 1000;
    }

    .section-label {
      font-size: 10px;
      font-weight: 700;
      color: var(--text-tertiary);
      letter-spacing: 1px;
      padding: 16px 16px 8px;
      text-transform: uppercase;
    }

    .suggestions-list {
      padding: 0;
    }

    .suggestion-item {
      display: block;
      padding: 10px 16px;
      cursor: pointer;
      background-color: white;
      text-decoration: none;
      color: var(--text-primary);
    }

    .suggestion-item:hover {
      background-color: var(--hover-bg);
    }

    .suggestion-text {
      font-size: 14px;
      display: block;
      line-height: 1.4;
    }
    
    .highlight-bold {
      font-weight: 700;
    }

    .products-section {
      padding: 8px 0;
      border-top: 1px solid var(--border-color);
    }

    .product-item {
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
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
      display: block;
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
      width: 6px;
    }

    .dropdown::-webkit-scrollbar-track {
      background: transparent;
    }

    .dropdown::-webkit-scrollbar-thumb {
      background: #eee;
      border-radius: 3px;
    }
    @media (max-width: 768px) {
      .search-overlay {
        background: white; /* Full screen white background */
        align-items: flex-start;
      }

      .search-modal {
        width: 100%;
        height: 100%;
        padding: 0;
        box-shadow: none;
        flex-direction: column;
        justify-content: flex-start;
        animation: none;
      }

      .search-container {
        width: 100%;
        padding: 12px 10px;
        gap: 12px;
        border-bottom: 1px solid var(--border-color);
        box-sizing: border-box;
      }

      .close-button {
        padding: 4px;
        margin-right: 4px;
      }
      
      .search-form {
        flex: 1;
      }

      .search-input-wrapper {
        border-radius: 10px;
        background-color: white;
        border: 1px solid var(--border-color);
      }

      .dropdown {
        position: fixed;
        top: 73px; /* Approximate header height (padding + input height) */
        left: 0;
        right: 0;
        bottom: 0;
        max-height: none;
        border: none;
        box-shadow: none;
        margin-top: 0;
        z-index: 999;
      }

      .suggestion-item, .product-item {
        padding: 14px 20px; /* Larger touch targets */
        font-size: 16px; 
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "zb-search-autocomplete": ZbSearchAutocomplete;
  }
}
