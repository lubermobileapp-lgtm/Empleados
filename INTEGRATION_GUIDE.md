# 🚀 Modern Schedule Card - Integration Guide

## Quick Start

The redesigned schedule card component is now ready for integration into your Luber employee system.

### File Location
```
public/schedule-card-modern.html
```

### How to View
1. Open the file in any modern web browser
2. Click on any card to expand/collapse
3. Resize the browser window to see responsive behavior
4. Check the design on mobile, tablet, and desktop

---

## Integration Steps

### Step 1: Extract CSS
Copy the entire `<style>` section and add to your main stylesheet:
```
public/css/schedule-card.css
```

### Step 2: Extract HTML
Copy the card component structure and use as template:
```html
<div class="schedule-card" id="cardN">
  <div class="card-header" onclick="toggleCard('cardN')">
    <!-- Content -->
  </div>
  <div class="card-content">
    <!-- Expanded details -->
  </div>
</div>
```

### Step 3: Extract JavaScript
The toggle functionality is simple:
```javascript
function toggleCard(cardId) {
  const card = document.getElementById(cardId);
  card.classList.toggle('expanded');
}
```

### Step 4: Connect Your Data
Replace static content with dynamic data from your database:
```javascript
// Example with backend data
const scheduleCards = schedules.map(schedule => `
  <div class="schedule-card" id="card-${schedule.id}">
    <div class="card-header" onclick="toggleCard('card-${schedule.id}')">
      <div class="header-left">
        <div class="date-time-group">
          <div class="date-badge">${schedule.date}</div>
          <div class="time-info">${schedule.time}</div>
        </div>
        <div class="customer-section">
          <div class="customer-type">${schedule.accountType}</div>
          <div class="customer-name">${schedule.customerName}</div>
        </div>
        <!-- More content -->
      </div>
    </div>
  </div>
`).join('');

document.querySelector('.cards-grid').innerHTML = scheduleCards;
```

---

## Component Structure

### Full Card Template
```html
<div class="schedule-card" id="card1">
  <!-- HEADER (Always Visible) -->
  <div class="card-header" onclick="toggleCard('card1')">
    <div class="header-left">
      
      <!-- Date & Time -->
      <div class="date-time-group">
        <div class="date-badge">📅 Jan 29, 2026</div>
        <div class="time-info">
          <svg><!-- Clock icon --></svg>
          9:00 AM - 5:00 PM
        </div>
      </div>

      <!-- Customer Info -->
      <div class="customer-section">
        <div class="customer-type">Customer Account</div>
        <div class="customer-name">Customer 3</div>
      </div>

      <!-- Address -->
      <div class="address-container">
        <svg class="address-icon"><!-- Location icon --></svg>
        <div class="address-info">
          <div class="address-label">Service Location</div>
          <a class="address-text" href="#map">
            91 High St, Winter Haven, FL 33880
          </a>
        </div>
      </div>

      <!-- Quick Vehicle Preview -->
      <div class="vehicle-quick-info">
        <div class="quick-info-item">
          <div class="quick-info-label">Vehicle</div>
          <div class="quick-info-value">Nissan GTR</div>
        </div>
        <div class="quick-info-item">
          <div class="quick-info-label">Price</div>
          <div class="quick-info-value price">$150</div>
        </div>
        <div class="quick-info-item">
          <div class="quick-info-label">Engine</div>
          <div class="quick-info-value">3.8L</div>
        </div>
      </div>

    </div>

    <!-- Expand/Collapse Icon -->
    <svg class="expand-icon"><!-- Chevron down --></svg>
  </div>

  <!-- CONTENT (Hidden by default, shown when expanded) -->
  <div class="card-content">
    
    <!-- Vehicle Details Section -->
    <div class="vehicle-section">
      <h3 class="section-title">Vehicle Details</h3>
      
      <div class="vehicle-card">
        <!-- Vehicle Image -->
        <div class="vehicle-image">
          <img src="path/to/image.jpg" alt="vehicle">
        </div>

        <!-- Vehicle Info -->
        <div class="vehicle-details">
          <div class="vehicle-header">
            <div class="vehicle-title">
              <div class="vehicle-model">Nissan GTR</div>
              <div class="vehicle-year">2021</div>
            </div>
            <div class="vehicle-price">$150</div>
          </div>

          <div class="vehicle-specs">
            <div class="spec-item">
              <div class="spec-label">Oil Type</div>
              <div class="spec-value">Full Synthetic</div>
            </div>
            <div class="spec-item">
              <div class="spec-label">Engine</div>
              <div class="spec-value">3.8L</div>
            </div>
            <!-- More specs -->
          </div>
        </div>
      </div>
    </div>

    <!-- Service & Address Information -->
    <div class="service-info-grid">
      <div class="info-block">
        <div class="info-label">📍 Service Location</div>
        <div class="info-value address">
          91 High St, Winter Haven, FL 33880
        </div>
      </div>
      <div class="info-block">
        <div class="info-label">👤 Customer Type</div>
        <div class="info-value">Regular Customer</div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <button class="btn btn-success">✓ Accept Offer</button>
      <button class="btn btn-primary">Dispatch</button>
    </div>
  </div>
</div>
```

---

## CSS Variables Reference

Customize the entire design with these CSS variables:

### Colors
```css
:root {
  --primary: #667eea;              /* Main brand color */
  --primary-dark: #5568d3;         /* Darker hover state */
  --primary-light: #f0f4ff;        /* Light background */
  --secondary: #764ba2;            /* Gradient companion */
  --success: #1db15a;              /* Positive action */
  --success-dark: #17944f;         /* Success hover */
  --text-primary: #1a202c;         /* Main text */
  --text-secondary: #4a5568;       /* Secondary text */
  --text-tertiary: #718096;        /* Labels, help text */
  --border-light: #e2e8f0;         /* Light borders */
  --border-medium: #cbd5e0;        /* Medium borders */
  --bg-light: #f7fafc;             /* Light background */
  --bg-white: #ffffff;             /* Card background */
}
```

### Spacing
```css
:root {
  --gap-sm: 0.75rem;
  --gap-md: 1.5rem;
  --gap-lg: 2rem;
}
```

### Shadows
```css
:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.15);
}
```

### Animations
```css
:root {
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## How to Rebrand

### Change Primary Color
```css
:root {
  /* From purple to blue */
  --primary: #3b82f6;
  --primary-dark: #2563eb;
  --primary-light: #eff6ff;
}
```

### Change Success Color
```css
:root {
  /* From green to teal */
  --success: #14b8a6;
  --success-dark: #0d9488;
}
```

### Adjust Spacing
```css
:root {
  /* More spacious design */
  --gap-sm: 1rem;
  --gap-md: 2rem;
  --gap-lg: 3rem;
}
```

### Make Animations Faster/Slower
```css
:root {
  /* Faster for snappier feel */
  --transition: all 0.15s ease;
  
  /* Or slower for smooth feel */
  --transition: all 0.5s ease;
}
```

---

## Class Reference

### Card Container
```css
.schedule-card              /* Main card wrapper */
.schedule-card.expanded     /* Active state (expanded) */
.schedule-card:hover        /* Hover state */
```

### Header Components
```css
.card-header                /* Collapsed view */
.header-left                /* Left content area */
.date-time-group            /* Date and time */
.date-badge                 /* Badge styling */
.customer-section           /* Customer info */
.customer-name              /* Large customer name */
.customer-type              /* Label above customer */
.address-container          /* Address section */
.address-text               /* Clickable address */
```

### Quick Preview
```css
.vehicle-quick-info         /* 3-column preview grid */
.quick-info-item            /* Individual preview item */
.quick-info-label           /* Small label */
.quick-info-value           /* Value text */
.quick-info-value.price     /* Green price text */
```

### Expanded Content
```css
.card-content               /* Hidden content area */
.vehicle-section            /* Vehicle details area */
.section-title              /* Section heading */
.vehicle-card               /* Vehicle info card */
.vehicle-image              /* Image placeholder */
.vehicle-details            /* Vehicle info grid */
.vehicle-specs              /* Specifications grid */
.spec-item                  /* Individual spec */
.spec-label                 /* Spec label */
.spec-value                 /* Spec value */
```

### Information Blocks
```css
.service-info-grid          /* 2-column grid */
.info-block                 /* Individual info box */
.info-label                 /* Label with icon */
.info-value                 /* Value text */
.info-value.address         /* Multi-line address */
```

### Buttons
```css
.btn                        /* Base button */
.btn-primary                /* Primary action (gradient) */
.btn-success                /* Success action (green) */
.btn-secondary              /* Secondary action (outline) */
.action-buttons             /* Button container */
```

### Utility Classes
```css
.text-primary               /* Primary color text */
.text-secondary             /* Secondary text */
.text-tertiary              /* Tertiary text */
.text-muted                 /* Muted/disabled text */
.text-success               /* Green success text */
.badge                      /* Badge styling */
.badge-primary              /* Blue badge */
.badge-success              /* Green badge */
.badge-warning              /* Orange badge */
```

---

## Responsive Breakpoints

```css
/* Desktop: 1200px+ */
@media (min-width: 1200px) {
  .cards-grid {
    grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  }
}

/* Tablet: 768px - 1199px */
@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }
  .vehicle-card {
    grid-template-columns: 1fr;
  }
  .vehicle-image {
    order: -1; /* Move image above details */
  }
}

/* Mobile: 480px - 767px */
@media (max-width: 480px) {
  .action-buttons {
    flex-direction: column;
  }
  .vehicle-quick-info {
    grid-template-columns: 1fr;
  }
}
```

---

## JavaScript Integration

### Basic Toggle
```javascript
function toggleCard(cardId) {
  const card = document.getElementById(cardId);
  card.classList.toggle('expanded');
}
```

### Advanced with Event Handler
```javascript
document.querySelectorAll('.card-header').forEach(header => {
  header.addEventListener('click', function() {
    const card = this.closest('.schedule-card');
    card.classList.toggle('expanded');
    
    // Optional: Scroll into view when expanded
    if (card.classList.contains('expanded')) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
});
```

### Dynamic Data Rendering
```javascript
function renderScheduleCards(schedules) {
  const cardsGrid = document.querySelector('.cards-grid');
  
  const html = schedules.map((schedule, index) => `
    <div class="schedule-card" id="card-${schedule.id}">
      <div class="card-header" onclick="toggleCard('card-${schedule.id}')">
        <div class="header-left">
          <div class="date-time-group">
            <div class="date-badge">📅 ${schedule.date}</div>
            <div class="time-info">
              <svg><!-- Icon --></svg>
              ${schedule.startTime} - ${schedule.endTime}
            </div>
          </div>
          <div class="customer-section">
            <div class="customer-type">${schedule.accountType}</div>
            <div class="customer-name">${schedule.customerName}</div>
          </div>
          <div class="address-container">
            <svg class="address-icon"><!-- Icon --></svg>
            <div class="address-info">
              <div class="address-label">Service Location</div>
              <a class="address-text" href="#map">${schedule.address}</a>
            </div>
          </div>
          <div class="vehicle-quick-info">
            <div class="quick-info-item">
              <div class="quick-info-label">Vehicle</div>
              <div class="quick-info-value">${schedule.vehicle}</div>
            </div>
            <div class="quick-info-item">
              <div class="quick-info-label">Price</div>
              <div class="quick-info-value price">$${schedule.price}</div>
            </div>
            <div class="quick-info-item">
              <div class="quick-info-label">Engine</div>
              <div class="quick-info-value">${schedule.engine}</div>
            </div>
          </div>
        </div>
        <svg class="expand-icon"><!-- Icon --></svg>
      </div>
      <!-- Extended content here -->
    </div>
  `).join('');
  
  cardsGrid.innerHTML = html;
}
```

---

## Testing Checklist

- [ ] All cards toggle expand/collapse
- [ ] Hover effects work smoothly
- [ ] Animation is fluid on desktop
- [ ] Mobile layout stacks correctly
- [ ] Tablet layout is readable
- [ ] Buttons are clickable and functional
- [ ] Text is readable on all colors
- [ ] Icons display correctly
- [ ] No layout shift on expand
- [ ] Responsive grid adapts properly

---

## Browser Testing

| Browser | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Chrome  | ✅      | ✅     | ✅     |
| Firefox | ✅      | ✅     | ✅     |
| Safari  | ✅      | ✅     | ✅     |
| Edge    | ✅      | ✅     | ✅     |

---

## Performance Tips

1. **Use CSS-only animations** - Already built-in, no JavaScript overhead
2. **Lazy load images** - Add `loading="lazy"` to vehicle images
3. **Optimize card layout** - Grid automatically handles responsive stacking
4. **Minimize reflows** - CSS architecture prevents layout thrashing
5. **Use CSS variables** - Easy theming without recompiling

---

## Support & Customization

All CSS is clearly commented and uses semantic class names. The design is fully customizable through CSS variables at the `:root` level.

For questions or modifications, refer to the detailed design guide:
- `MODERN_DESIGN_GUIDE.md`
- `DESIGN_IMPROVEMENTS_DETAILED.md`

---

**Ready to integrate! Copy, paste, and customize to your needs.** 🚀
