# Content Cards Block

## Overview

The Content Cards block renders a responsive collection of editorial cards in either a solid blue topic-card layout or an article/report-card layout. Each item is authored as a separate child row and is converted into a list item during decoration.

This block is used for feature highlights, article teasers, topic summaries, and CTA-driven content modules inside the Universal Editor.

## Integration

### Block Configuration

This block reads its visual variant from the block-level `classes` field.

| Configuration Key | Type | Default | Description | Required | Side Effects |
|-------------------|------|---------|-------------|----------|--------------|
| `classes` | select | `""` | Chooses the card style: default blue topic cards or `article-cards` for article/report layout | No | Switches the block rendering variant |

### Authoring Model Fields

#### Block Fields
| Field | Type | Effect |
|-------|------|--------|
| `classes` | select | Chooses between the default blue cards and the article/report cards variant. |

#### Card Item Fields
| Field | Type | Effect |
|-------|------|--------|
| `meta` | text | Stores the category, topic, publication date, and title information. The first line is treated as the category and the remaining lines are used as the heading content in the article layout. |
| `description` | richtext | Renders the supporting text or summary for the card. |
| `stats` | richtext | Renders author or metadata details in the footer or stats area. |
| `buttonLink` | aem-content | Supplies the CTA link for the card button. |

### URL Parameters

This block does not use URL query parameters.

### Local Storage

This block does not use `localStorage`.

### Events

The block does not listen for or emit custom events.

## Behavior Patterns

### Page Context Detection

- The block checks the block class list for `article-cards` to decide which layout to render.
- If a row contains no content, it is skipped.
- The decorator creates an unordered list wrapper and then turns each authored row into a card item.

### User Interaction Flows

1. The author adds a Content Cards block and selects a variant.
2. Each child row is treated as one card item.
3. The block parses the authored `meta` text and maps it into tags, dates, or headline content.
4. The `description`, `stats`, and CTA link are appended to the card structure.
5. The rendered output is displayed as a grid of cards with consistent spacing and layout.

### Error Handling

- Missing `meta` text simply results in no meta badge/date area being shown.
- Missing `description` or `stats` content results in no corresponding section being rendered.
- A missing CTA link is ignored without breaking the card rendering.
- Empty rows are skipped instead of causing a render failure.
