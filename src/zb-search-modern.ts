import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { SearchBase } from "./search-base";

@customElement("zb-search-modern")
export class ZbSearchModern extends SearchBase {

  private highlightMatch(text: string, query: string) {
    if (!query) return html`${text}`;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    if (index === -1) return html`<span>${text}</span>`;
    const before = text.substring(0, index);
    const matchStr = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);
    return html`<span>${before}</span><span class="highlight-bold">${matchStr}</span><span>${after}</span>`;
  }



  private renderSuggestions() {
    // Left column content
    const hasSuggestions = this.results.suggestions?.length;

    if (!hasSuggestions) return null;

    return html`
      <div class="sidebar">
        ${hasSuggestions ? html`
            <div class="sidebar-section">
                <div class="section-label">Suggestions</div>
                <div class="list-items">
                    ${this.results.suggestions!.slice(0, 5).map(suggestion => html`
                        <div class="sidebar-item" 
                             @click=${() => this.handleSuggestionClick(suggestion.name, "suggestion", suggestion.url)}>
                            ${this.highlightMatch(suggestion.name, this.searchQuery)}
                        </div>
                    `)}
                </div>
            </div>
        ` : null}


      </div>
    `;
  }

  private renderProducts() {
    if (!this.results.products?.length) return null;

    return html`
      <div class="main-content">
        <div class="section-header">
            <span class="section-title">Products</span>
            <a href="${this.results.view_all_url || '#'}" class="view-all-link">View all products</a>
        </div>
        <div class="products-grid">
            ${this.results.products.slice(0, 4).map(product => html`
                <div class="product-card" @click=${() => this.handleSuggestionClick(product.name, "product", product.url)}>
                    <div class="image-container">
                        ${product.image ? html`<img src="${product.image}" alt="${product.name}">` : html`<div class="placeholder-image"></div>`}
                    </div>
                    <div class="product-info">
                        <div class="product-name">${product.name}</div>
                    </div>
                </div>
            `)}
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <div class="search-overlay">
        <div class="search-modal">
            <div class="search-header">
                <div class="search-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                    autofocus
                >
                <button class="close-button" @click="${this.handleClose}">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            ${this.open && (this.results.products?.length || this.results.suggestions?.length) ? html`
                <div class="results-container">
                    ${this.renderSuggestions()}
                    ${this.renderProducts()}
                </div>
            ` : null}
            
            ${this.loading ? html`<div class="loading">Searching...</div>` : null}
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
        font-family: 'DM Sans', sans-serif; /* Setup font matching later if needed */
        --primary-text: #1a1a1a;
        --secondary-text: #666666;
        --border-color: #e5e5e5;
        --accent-color: #000;
        --modal-bg: #fff;
    }

    .search-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.4);
        display: flex;
        align-items: flex-start;
        justify-content: center;
        z-index: 10000;
        padding-top: 0px; 
    }

    .search-modal {
        width: 100%;
        max-width: 1000px; /* Wider for grid layout */
        background: white;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        margin-top: 60px; /* Spacing from top */
        border-radius: 4px; /* Slight rounding or none? Image looks sharp. Let's do 0 or 2px. */
    }

    .search-header {
        display: flex;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid var(--border-color);
    }

    .search-icon {
        color: var(--primary-text);
        margin-right: 16px;
    }

    .search-input {
        flex: 1;
        border: none;
        font-size: 18px;
        outline: none;
        color: var(--primary-text);
    }

    .close-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px;
        color: var(--secondary-text);
    }

    .results-container {
        display: flex;
        min-height: 400px;
        align-items: stretch;
    }

    /* LEFT SIDEBAR */
    .sidebar {
        width: 250px;
        flex-shrink: 0;
        border-right: 1px solid var(--border-color);
        padding: 24px;
        background: #fafafaab; /* Slight off-white maybe? Looks white in image but sidebar usually distinct */
    }

    .sidebar-section {
        margin-bottom: 32px;
    }

    .section-label {
        font-weight: 700;
        font-size: 14px;
        margin-bottom: 12px;
        color: var(--primary-text);
    }

    .sidebar-item {
        padding: 6px 0;
        color: var(--secondary-text);
        cursor: pointer;
        font-size: 14px;
        transition: color 0.2s;
    }
    
    .sidebar-item:hover {
        color: var(--accent-color);
    }
    
    .highlight-bold {
        font-weight: bold;
        color: var(--primary-text);
    }

    /* RIGHT CONTENT */
    .main-content {
        flex: 1;
        padding: 24px 32px;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: bottom;
        margin-bottom: 20px;
    }

    .section-title {
        font-weight: 700;
        font-size: 14px;
        color: var(--primary-text);
    }

    .view-all-link {
        font-size: 12px;
        color: #0044cc; /* Blue link color */
        text-decoration: underline;
        cursor: pointer;
    }

    .products-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 24px;
    }

    .product-card {
        cursor: pointer;
        text-align: center;
        group: hover;
    }

    .image-container {
        width: 100%;
        aspect-ratio: 1; /* Square images */
        background: #f4f4f4;
        margin-bottom: 12px;
        overflow: hidden;
    }

    .image-container img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s;
    }

    .product-card:hover .image-container img {
        transform: scale(1.05);
    }

    .product-name {
        font-size: 13px;
        font-weight: 600;
        color: #000080; /* Dark Blue title */
        margin-bottom: 4px;
        line-height: 1.4;
    }



    .placeholder-image {
        width: 100%;
        height: 100%;
        background-color: #eee;
    }

    .loading {
        padding: 20px;
        text-align: center;
        color: var(--secondary-text);
    }

    @media (max-width: 768px) {
       .results-container {
           flex-direction: column;
       }
       .sidebar {
           width: 100%;
           border-right: none;
           border-bottom: 1px solid var(--border-color);
       }
       .products-grid {
           grid-template-columns: repeat(2, 1fr);
       }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "zb-search-modern": ZbSearchModern;
  }
}
