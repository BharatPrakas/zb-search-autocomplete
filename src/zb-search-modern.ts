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
                    ${this.results.suggestions!.slice(0, 10).map(suggestion => html`
                        <div class="sidebar-item" 
                             @click=${() => this.handleSuggestionClick(suggestion.name, suggestion.url)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
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
            ${this.results.products.slice(0, 8).map(product => html`
                <div class="product-card" @click=${() => this.handleSuggestionClick(product.name, product.url)}>
                    <div class="image-container">
                        ${product.image ? html`<img src="${product.image}" alt="${product.name}">` : html`<div class="placeholder-image"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>`}
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
    if (!this.open) {
        return html`
            <div class="launcher" @click=${() => {this.open = true}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2.2"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="7"></circle>
                <line x1="16.5" y1="16.5" x2="21" y2="21"></line>
                </svg>
            </div>
        `;
    }

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
            
            ${this.results.products?.length || this.results.suggestions?.length ? html`
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

  updated() {
    if(this.open) this.focusInput();
  }

  static styles = css`
    :host {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      --primary-text: #1a1a1a;
      --secondary-text: #666666;
      --border-color: #f0f0f0;
      --accent-color: #000;
      --modal-bg: #ffffff;
      --input-bg: #f5f5f5;
      --hover-bg: #f9f9f9;
      --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      --card-hover-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    .launcher {
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        color: var(--primary-text);
        transition: transform 0.2s;
    }

    .launcher:hover {
        transform: scale(1.1);
    }

    .search-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: var(--modal-bg);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .search-modal {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      background: var(--modal-bg);
    }

    .search-header {
      display: flex;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-color);
      flex-shrink: 0;
      background: #fff;
    }

    .search-icon {
      color: var(--secondary-text);
      margin-right: 16px;
      display: flex;
      align-items: center;
    }

    .search-input {
      flex: 1;
      border: none;
      font-size: 18px;
      outline: none;
      color: var(--primary-text);
      background: transparent;
      padding: 8px 0;
      font-weight: 500;
    }

    .search-input::placeholder {
      color: #999;
      font-weight: 400;
    }

    .close-button {
      background: #f0f0f0;
      border: none;
      cursor: pointer;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-text);
      transition: all 0.2s;
    }

    .close-button:hover {
      background: #e0e0e0;
      transform: scale(1.05);
    }

    .results-container {
      display: flex;
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }

    /* LEFT SIDEBAR */
    .sidebar {
      width: 300px;
      flex-shrink: 0;
      border-right: 1px solid var(--border-color);
      padding: 32px 24px;
      background: #ffffff;
    }

    .sidebar-section {
      margin-bottom: 32px;
    }

    .section-label {
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 16px;
      color: #888;
    }

    .list-items {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .sidebar-item {
      padding: 10px 12px;
      color: var(--primary-text);
      cursor: pointer;
      font-size: 15px;
      transition: all 0.2s;
      border-radius: 6px;
      display: flex;
      align-items: center;
    }
    
    .sidebar-item:hover {
      background: var(--hover-bg);
      color: var(--accent-color);
      padding-left: 16px;
    }

    .sidebar-item svg {
      margin-right: 12px;
      opacity: 0.5;
    }
    
    .highlight-bold {
      font-weight: 700;
      color: var(--primary-text);
    }

    /* RIGHT CONTENT */
    .main-content {
      flex: 1;
      padding: 32px 40px;
      background: #fcfcfc;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .section-title {
      font-weight: 600;
      font-size: 18px;
      color: var(--primary-text);
    }

    .view-all-link {
      font-size: 14px;
      color: var(--primary-text);
      text-decoration: none;
      cursor: pointer;
      font-weight: 500;
      display: flex;
      align-items: center;
      transition: opacity 0.2s;
    }

    .view-all-link:hover {
      opacity: 0.7;
    }

    .view-all-link::after {
      content: '→';
      margin-left: 6px;
      font-family: sans-serif;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 24px;
    }

    .product-card {
      cursor: pointer;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      border: 1px solid transparent;
    }

    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--card-hover-shadow);
      border-color: rgba(0,0,0,0.05);
    }

    .image-container {
      width: 100%;
      aspect-ratio: 1;
      background: #f8f8f8;
      overflow: hidden;
      position: relative;
    }

    .image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }

    .product-card:hover .image-container img {
      transform: scale(1.08);
    }

    .product-info {
      padding: 16px;
    }

    .product-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--primary-text);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .placeholder-image {
      width: 100%;
      height: 100%;
      background-color: #eee;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ccc;
    }

    .loading {
      padding: 40px;
      text-align: center;
      color: var(--secondary-text);
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    @media (max-width: 768px) {
       .search-modal {
           width: 100%;
       }
       
       .search-header {
           padding: 12px 16px;
       }

       .search-input {
           font-size: 14px; /* Prevents zoom on iOS and matches native size */
       }
       
       .section-title {
            font-size: 16px;
       }

       .sidebar-item {
           padding: 12px 14px;
           font-size: 14px;
       }
       
       .section-label {
           font-size: 11px;
       }

       .results-container {
           flex-direction: column;
       }

       .sidebar {
           width: 100%;
           border-right: none;
           border-bottom: 1px solid var(--border-color);
           padding: 20px 16px;
       }

       .main-content {
           padding: 20px 16px;
       }

       .products-grid {
           grid-template-columns: repeat(2, 1fr);
           gap: 16px;
       }
       
       .product-name {
           font-size: 13px;
       }
       
       .close-button {
           width: 32px;
           height: 32px;
       }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "zb-search-modern": ZbSearchModern;
  }
}
