import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { SearchBase } from "./search-base";

@customElement("zb-search-inline")
export class ZbSearchInline extends SearchBase {
  /**
   * @property dropdownStyle - The style of the dropdown.
   */
  @property({ type: String })
  dropdownStyle = 'default';

  /**
   * @property isStudio - If true, the search will not open.
   */
  @property({ type: Boolean, attribute: 'data-is-studio' })
  isStudio = false;

  /**
   * @property isBuilderMobile - If true, the search will not open.
   */
  @property({ type: Boolean, attribute: 'is-builder-mobile' })
  isBuilderMobile = false;

  /** 
   * Highlight parts of text that match/don't match query.
   */
  private highlightMatch(text: string, query: string) {
    if (!query) return html`<span>${text}</span>`;

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
                  this.handleSuggestionClick(suggestion.name, suggestion.url)}
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
                this.handleSuggestionClick(product.name, product.url)}
            >
              ${
                product.image
                  ? html`<img src=${product.image} @error=${this.handleImageError} alt=${product.name} class="product-image" />`
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
   * Render list only dropdown
   */
  private renderListOnlyDropdown() {
      const allItems = [
          ...(this.results.suggestions || []).map(s => ({...s, type: 'suggestion'})),
          ...(this.results.products || []).map(p => ({...p, type: 'product'}))
      ];

      return html`
        <div class="dropdown list-only ${this.open ? 'open' : ''}">
             ${this.renderLoading()}
             ${!this.loading && allItems.length ? html`
                 <div class="list-only-items">
                    ${allItems.map(item => html`
                        <div class="list-item" @click=${() => this.handleSuggestionClick(item.name, item.url)}>
                            ${this.highlightMatch(item.name, this.searchQuery)}
                        </div>
                    `)}
                 </div>
             ` : (this.loading ? '' : this.renderEmpty())}
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
    if (this.loading || !this.searchQuery || this.results.suggestions?.length || this.results.products?.length) {
      return null;
    }
    return html`
      <div class="empty-state">
        <span>No results found for "${this.searchQuery}"</span>
      </div>
    `;
  }

  /**
   * Toggle search
   */
  private toggleSearch() {
    this.open = !this.open;
    if (this.open) {
      setTimeout(() => this.focusInput(), 100);
      this.results = {} as any;
      this.searchQuery = "";
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }

  /**
   * Render search
   */
  render() {
    const isOpen = this.open;

    return html`
      <div class="wrapper ${isOpen ? 'open' : ''} ${this.isBuilderMobile ? 'is-builder-mobile' : ''}">
        ${isOpen ? html`<div class="host-overlay" @click="${() => this.handleClose(true, true)}"></div>` : ''}
        
        <!-- Mobile Trigger / Desktop Icon -->
        <div class="search-trigger" @click="${(this.isStudio || this.isBuilderMobile) ? '' : this.toggleSearch}">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
        </div>

        <!-- Search Overlay / Container -->
        <div class="search-container">
            <div class="search-header">
                <button class="close-button" @click="${this.handleClose}">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <div class="input-wrapper">
                     <div class="search-icon-input">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                    <input
                        type="text"
                        class="search-input"
                        placeholder="${this.placeholder}"
                        .value="${this.searchQuery}"
                        @input="${this.handleInput}"
                        @focus="${() => this.open = true}"
                        @keydown="${(e: KeyboardEvent) => e.key === 'Enter' && this.handleSubmit(e)}"
                        style="pointer-events: ${this.isStudio ? 'none' : 'auto'}"
                        autocomplete="off"
                        enterkeyhint="search"
                        spellcheck="false"
                    />
                    ${this.searchQuery ? html`
                        <button class="clear-button" @click="${this.handleClear}">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    ` : ''}
                </div>
            </div>
            
            ${isOpen && this.searchQuery.trim().length >= this.minSearchLength && (this.results.suggestions?.length || this.results.products?.length || this.loading || (this.searchQuery && !this.loading)) ? 
                (this.dropdownStyle === 'list-only' ? 
                    this.renderListOnlyDropdown() : 
                    html`
                        <div class="dropdown ${this.open ? 'open' : ''}">
                            ${this.renderLoading()}
                            ${this.renderSuggestions()}
                            ${this.renderProducts()}
                            ${this.renderEmpty()}
                        </div>
                    `
                )
             : ''}
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      --zb-search-accent: #000;
      --zb-search-text: #333;
      --zb-search-text-muted: #666;
      --zb-search-bg: #fff;
      --zb-search-bg-hover: #f5f5f5;
      --zb-search-border: #e0e0e0;
      --zb-search-focus-ring: rgba(0, 0, 0, 0.1);
      --zb-search-icon: #000;
      --zb-search-input-border-radius: 8px;
    }

    /* Modern Reset */
    * {
        box-sizing: border-box;
    }

    .wrapper {
        position: relative;
        width: 100%;
        height: 100%;
    }

    .host-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.4);
        z-index: 998;
        display: block;
        animation: fadeOverlay 0.2s ease-in;
    }

    @keyframes fadeOverlay {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    /* Initial State: Just the icon on mobile, Input on desktop */
    .search-trigger {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        cursor: pointer;
        color: var(--zb-search-icon);
    }

    .search-container {
        display: none; /* Hidden by default on mobile */
        background: var(--zb-search-bg);
        width: 100%;
        height: 100%;
        position: relative;
    }
    
    .dropdown {
        background: var(--zb-search-bg);
        max-height: 400px;
        overflow-y: auto;
        border-top: 1px solid var(--zb-search-border);
        display: none;
    }

    .dropdown.open {
        display: block;
    }

    /* List Only Dropdown Styles */
    .dropdown.list-only {
        padding: 8px 0;
    }
    
    .list-item {
        padding: 10px 16px;
        font-size: 14px;
        color: var(--zb-search-text);
        cursor: pointer;
        transition: background 0.1s;
    }

    .list-item:hover {
        background-color: var(--zb-search-bg-hover);
    }

    /* Desktop Styles */
    @media (min-width: 769px) {
        .search-trigger {
            display: none; /* Hide trigger icon on desktop */
        }

        .search-container {
            display: block; /* Always show input on desktop */
            z-index: 999; /* Above overlay */
            padding: 3px;
            border-radius: calc(var(--zb-search-input-border-radius) + 3px);
        }

        .wrapper.is-builder-mobile .search-container {
            display: none;
        }

        .wrapper.is-builder-mobile .search-trigger {
            display: flex;
        }

        .search-header {
            display: flex;
            height: 100%;
            align-items: center;
        }

        .input-wrapper {
            display: flex;
            align-items: center;
            width: 100%;
            height: 100%;
            border: 1px solid var(--zb-search-border);
            border-radius: var(--zb-search-input-border-radius);
            padding: 0 12px;
            transition: all 0.2s ease-in;
            background: var(--zb-search-bg);
        }

        .input-wrapper:focus-within {
            // border-color: var(--zb-search-accent);
            box-shadow: 0 0 0 3px var(--zb-search-focus-ring);
        }

        .search-icon-input {
            color: var(--zb-search-text-muted);
            margin-right: 8px;
            display: flex;
        }

        .search-input {
            flex: 1;
            border: none;
            outline: none;
            font-size: 14px;
            background: transparent;
            color: var(--zb-search-text);
            height: 100%;
            pointer-events: none;
        }

        .clear-button {
            background: none;
            border: none;
            padding: 4px;
            cursor: pointer;
            color: var(--zb-search-text-muted);
            display: flex;
            align-items: center;
            opacity: 0.6;
            transition: opacity 0.2s;
        }
        
        .clear-button:hover {
            opacity: 1;
        }

        .close-button {
            display: none; /* No close button on desktop */
        }

        .dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            margin-top: 8px;
            border: 1px solid var(--zb-search-border);
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            z-index: 1000;
        }
    }

    /* Mobile Styles */
    @media (max-width: 768px) {
        .host-overlay {
            display: none;
        }

        .wrapper.open .search-container {
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 9999;
            animation: slideIn 0.25s ease-out;
        }

        @keyframes slideIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .search-header {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid var(--zb-search-border);
            gap: 12px;
        }

        .input-wrapper {
            flex: 1;
            display: flex;
            align-items: center;
            height: 40px;
            background: #f2f2f2;
            border-radius: 8px;
            padding: 0 12px;
        }
        
        .search-icon-input {
            color: var(--zb-search-text-muted);
            margin-right: 8px;
        }

        .search-input {
            flex: 1;
            border: none;
            outline: none;
            background: transparent;
            font-size: 12px;
            color: var(--zb-search-text);
        }

        .clear-button {
            background: #ddd;
            border: none;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
        }

        .close-button {
            background: none;
            border: none;
            font-size: 16px;
            color: var(--zb-search-text);
            font-weight: 500;
            cursor: pointer;
            padding: 0;
            margin-top: 3px;
        }
        
        .dropdown {
            border: none;
            flex: 1;
        }
    }

    /* Shared Content Styles */
    .section-label {
        font-size: 11px;
        font-weight: 600;
        color: var(--zb-search-text-muted);
        letter-spacing: 0.5px;
        padding: 16px 16px 8px;
    }
    .suggestions-section {
        border-bottom: 1px solid var(--zb-search-border);
    }

    .suggestion-item {
        padding: 12px 16px;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        color: var(--zb-search-text);
        transition: background 0.1s;
    }

    .suggestion-item:hover {
        background-color: var(--zb-search-bg-hover);
    }

    .highlight-bold {
        font-weight: 700;
        color: var(--zb-search-accent);
    }

    .products-section {
        margin-top: 8px;
        padding-top: 8px;
    }

    .product-item {
        padding: 10px 16px;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        transition: background 0.1s;
    }

    .product-item:hover {
        background-color: var(--zb-search-bg-hover);
    }

    .product-image {
        width: 48px;
        height: 48px;
        object-fit: cover;
        border-radius: 6px;
        background: #eee;
    }

    .product-name {
        font-size: 14px;
        color: var(--zb-search-text);
        line-height: 1.4;
    }

    .loading-container {
        padding: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: var(--zb-search-text-muted);
    }

    .loading-spinner {
        width: 18px;
        height: 18px;
        border: 2px solid var(--zb-search-border);
        border-top-color: var(--zb-search-accent);
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .empty-state {
        padding: 24px;
        text-align: center;
        color: var(--zb-search-text-muted);
        font-size: 14px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "zb-search-inline": ZbSearchInline;
  }
}
