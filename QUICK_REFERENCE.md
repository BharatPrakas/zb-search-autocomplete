# ZB-Search-Autocomplete - Quick Reference

## Installation

```bash
# Build the component
npm run build

# Copy to Angular project
cp dist/zb-search-autocomplete.js ../zb-storefront/src/assets/web-components/
```

## Basic Usage

```html
<zb-search-autocomplete
  placeholder="Search..."
  (search-input)="onSearchInput($event)"
  (search-submit)="onSearchSubmit($event)"
></zb-search-autocomplete>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `placeholder` | string | "Search" | Input placeholder text |
| `api-endpoint` | string | "" | API endpoint URL (optional) |
| `debounce-delay` | number | 300 | Debounce delay in ms |
| `open` | boolean | false | Dropdown open state |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `search-input` | `{ query: string }` | User types in search |
| `search-submit` | `{ query: string }` | User submits search |
| `search-clear` | `{}` | User clears search |
| `search-close` | `{}` | User closes dropdown |
| `suggestion-click` | `{ suggestion: string, type: string }` | User clicks suggestion |

## Methods

```typescript
// Set search results
searchComponent.nativeElement.setResults({
  suggestions: ['apple', 'apricot'],
  products: [
    { name: 'Apple iPhone', image: '...', url: '/products/iphone' }
  ],
  pages: [
    { name: 'Apple Store', url: '/pages/apple' }
  ]
});

// Open/close dropdown
searchComponent.nativeElement.open = true;
```

## API Response Format

```json
{
  "suggestions": ["text suggestion 1", "text suggestion 2"],
  "products": [
    {
      "name": "Product Name",
      "image": "https://...",
      "url": "/products/..."
    }
  ],
  "pages": [
    {
      "name": "Page Name",
      "url": "/pages/..."
    }
  ]
}
```

## Angular Integration

### 1. Enable Custom Elements

```typescript
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
```

### 2. Handle Events

```typescript
onSearchInput(event: CustomEvent) {
  const query = event.detail.query;
  this.searchService.search(query).subscribe(results => {
    this.searchComponent.nativeElement.setResults(results);
  });
}

onSearchSubmit(event: CustomEvent) {
  const query = event.detail.query;
  this.router.navigate(['/search'], { queryParams: { q: query } });
}
```

### 3. Styling

```css
zb-search-autocomplete {
  --primary-color: #0066cc;
  --border-color: #e0e0e0;
  --hover-bg: #f5f5f5;
  --text-primary: #333;
  --text-secondary: #666;
  --text-tertiary: #999;
}
```

## Common Patterns

### Modal/Overlay Pattern

```html
<div class="search-overlay" [class.active]="searchOpen">
  <div class="search-modal">
    <zb-search-autocomplete
      (search-close)="searchOpen = false"
    ></zb-search-autocomplete>
  </div>
</div>
```

### Inline Pattern

```html
<div class="header-search">
  <zb-search-autocomplete
    placeholder="Search products..."
  ></zb-search-autocomplete>
</div>
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Component not recognized | Add `CUSTOM_ELEMENTS_SCHEMA` |
| Events not firing | Use `(event-name)` syntax |
| Styles not applying | Use CSS custom properties |
| TypeScript errors | Add type definitions |

## Resources

- [Full Documentation](./README.md)
- [Angular Integration Guide](./ANGULAR_INTEGRATION.md)
- [Live Demo](http://localhost:5173)
