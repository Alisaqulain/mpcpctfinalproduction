# Hand Images for Keyboard Typing Practice

This document describes the hand images needed for the enhanced keyboard typing practice feature.

## Required Hand Images

The following hand images should be placed in the `/public` directory:

### Left Hand Finger Positions
- `hand-pinky-left.png` - Hand showing pinky finger highlighted for left hand
- `hand-ring-left.png` - Hand showing ring finger highlighted for left hand  
- `hand-middle-left.png` - Hand showing middle finger highlighted for left hand
- `hand-index-left.png` - Hand showing index finger highlighted for left hand
- `hand-thumb-left.png` - Hand showing thumb highlighted for left hand

### Right Hand Finger Positions
- `hand-pinky-right.png` - Hand showing pinky finger highlighted for right hand
- `hand-ring-right.png` - Hand showing ring finger highlighted for right hand
- `hand-middle-right.png` - Hand showing middle finger highlighted for right hand
- `hand-index-right.png` - Hand showing index finger highlighted for right hand
- `hand-thumb-right.png` - Hand showing thumb highlighted for right hand

### Special Positions
- `hand-thumb-both.png` - Hand showing both thumbs for space bar
- `hand.png` - Default hand image (already exists)

## Image Specifications

- **Format**: PNG with transparency
- **Size**: Recommended 200x300 pixels or similar aspect ratio
- **Style**: Should match the existing hand.png style
- **Highlighting**: The appropriate finger should be highlighted in a different color (e.g., yellow, green, or red)
- **Background**: Transparent or matching the keyboard background

## Fallback Behavior

If any specific finger image is missing, the system will automatically fall back to the default `hand.png` image. The finger position indicator (colored circle) will still show the correct position even if the hand image doesn't change.

## Current Implementation

The keyboard practice page now includes:

1. **Dynamic Hand Display**: Shows different hand images based on which finger should be used
2. **Finger Mapping**: Comprehensive mapping of all keyboard keys to their corresponding fingers
3. **Visual Indicators**: Color-coded keyboard keys showing which finger to use
4. **Practice Mode**: Allows free typing to see finger movements for any key
5. **Animation**: Hand image scales and pulses when keys are pressed
6. **Finger Guide**: Visual guide showing which fingers are used for which keys

## Usage

1. Toggle "Hand" to show/hide the hand display
2. Toggle "Practice" to enter practice mode (any key shows finger movement)
3. In normal mode, follow the highlighted keys sequence
4. Watch the hand image change to show the correct finger position
5. Use the finger guide to learn proper finger placement

