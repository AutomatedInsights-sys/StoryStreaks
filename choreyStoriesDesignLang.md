Chorey Stories App - Design Language & Style Guide
Updated for Phoenix Logo Brand Identity
Core Design Philosophy
Create a magical, inspiring reading experience that captures the wonder of stories coming to life. The design balances the warmth of firelight with the mystery of twilight, encouraging young readers to embark on imaginative journeys.
Color Palette
Primary Colors

Phoenix Orange: #FF8C42 - Primary brand color, main CTAs and accents
Sunset Gold: #FFB347 - Secondary accent, highlights, and warm touches
Deep Navy: #1A2332 - Primary backgrounds, headers, dark mode base
Twilight Blue: #2D3E50 - Secondary backgrounds, cards on dark

Sky & Magic Colors

Sky Blue: #4FACFE - Active states, links, secondary CTAs
Aqua Glow: #00C9FF - Gradients, magical effects, progress indicators
Soft Cyan: #B8E6F5 - Backgrounds for light mode cards
Starlight: #FFF4E6 - Light backgrounds, reading surfaces

Supporting Colors

Warm Peach: #FFD8B8 - Light mode backgrounds, soft accents
Coral: #FF6B6B - Favorites, hearts, important highlights
Purple Mist: #B794F6 - Category tags, special features
Soft Lavender: #E9D5FF - Alternate card backgrounds

Semantic Colors

Success: #4ADE80 - Achievements, completed
Warning: #FBBF24 - Alerts, attention needed
Text Primary (Dark): #1A2332
Text Primary (Light): #F8FAFC
Text Secondary: #64748B

Typography
Font Families

Primary (Body Text): Inter, SF Pro, or Plus Jakarta Sans - Clean, readable
Headings: Poppins, Nunito, or Fredoka - Warm, friendly, slightly rounded
Story Content: Merriweather, Literata, or Source Serif Pro - Excellent readability
Accent/Magic: Quicksand or Comfortaa - For special moments

Text Hierarchy

App Title: 20-24px, Bold
Section Headers: 18-20px, Semi-bold
Card Titles: 15-17px, Medium/Semi-bold
Body Text (Reading): 17-19px, Regular, 1.7 line height
Metadata: 13-14px, Medium
Captions: 12-13px, Regular

Component Design Patterns
1. Cards
Light Mode Cards

Background: #FFFFFF or #FFF4E6 (starlight)
Border radius: 16-20px
Shadow: 0 4px 16px rgba(26, 35, 50, 0.08)
Border (optional): 1px rgba(255, 140, 66, 0.1)

Dark Mode Cards

Background: #2D3E50 (twilight blue)
Border radius: 16-20px
Shadow: 0 4px 20px rgba(0, 0, 0, 0.3)
Subtle glow: 0 0 20px rgba(79, 172, 254, 0.1)

Featured/Hero Cards

Gradient backgrounds: linear-gradient(135deg, #FF8C42 0%, #FFB347 100%)
Or blue gradient: linear-gradient(135deg, #4FACFE 0%, #00C9FF 100%)

2. Illustrations

Style: Soft, dreamy, gradient-rich like the logo
Color Treatment: Warm oranges/golds blend with cool blues
Effects: Subtle glows, starlight sparkles, gradient overlays
Background: Often feature radial gradients (dark center to light)

3. Buttons & Interactive Elements
Primary Action Buttons

Background: linear-gradient(135deg, #FF8C42, #FFB347)
Color: White
Border radius: 12-16px (rounded) or 32px (pill)
Shadow: 0 4px 16px rgba(255, 140, 66, 0.3)
Hover: Slightly brighter, scale(1.02)
Size: 48-56px height for main CTAs

Secondary Buttons

Background: #4FACFE or rgba(79, 172, 254, 0.1) (light)
Color: #1A2332 (dark text) or #FFFFFF
Border radius: 12px
Border (light variant): 1px solid #4FACFE

Icon Buttons (Floating)

Circular: 48-56px diameter
Background: White with shadow or gradient
Icon color: #FF8C42 or #1A2332
Shadow: 0 4px 12px rgba(0, 0, 0, 0.15)

Toggle Pills

Active: #FF8C42 background, white text
Inactive: rgba(255, 140, 66, 0.1) background, #64748B text
Border radius: 24px
Height: 36-40px

4. Navigation
Top Bar (Light Mode)

Background: White or gradient to transparent
Icons: #1A2332
Shadow: 0 2px 8px rgba(0, 0, 0, 0.04)

Top Bar (Dark Mode)

Background: #1A2332 or transparent over dark
Icons: #FFFFFF
Subtle bottom border: 1px solid rgba(255, 255, 255, 0.1)

Bottom Navigation (if used)

Background: White (light) or #2D3E50 (dark)
Active icon: #FF8C42
Inactive icon: #94A3B8
Top border or shadow for elevation

5. Author Avatars & Profile Images

Circular: 48-56px diameter
Border: 3px white or 2px gradient border
Can use gradient borders: border-image: linear-gradient(135deg, #FF8C42, #4FACFE) 1
Glow effect on hover/active

6. Progress Indicators
Reading Progress Bar

Track: rgba(79, 172, 254, 0.2)
Fill: linear-gradient(90deg, #FF8C42, #FFB347)
Height: 6-8px
Border radius: 8px
Thumb (if draggable): Circular, white with shadow

Circular Progress

Track: Light gray or transparent
Fill: Gradient stroke from #FF8C42 to #4FACFE

Stats Badges

Background: rgba(255, 140, 66, 0.1)
Text: #FF8C42
Border radius: 8px or full round
Icon + number format

7. Text Selection/Highlighting

Highlight Color: rgba(255, 140, 66, 0.25) (warm orange glow)
Alternative: rgba(79, 172, 254, 0.25) (cool blue)
Border bottom: 2px solid #FF8C42 for underline effect
Animation: Gentle sparkle particles (like stars from logo)

8. Magical Effects
Sparkles/Stars (like in logo background)

Small star icons in #FFB347, #FFF4E6, #4FACFE
Animated floating or twinkling
Used sparingly for special moments

Gradients

Sunset: linear-gradient(135deg, #FF8C42 0%, #FFB347 50%, #FFD8B8 100%)
Sky: linear-gradient(180deg, #1A2332 0%, #2D3E50 50%, #4FACFE 100%)
Magic: linear-gradient(135deg, #FF8C42 0%, #4FACFE 100%)

Glows

Box shadows with color: 0 0 40px rgba(255, 140, 66, 0.3)
Used on hover states, featured content

Layout Principles
Spacing System

Base Unit: 4px
Micro: 8px
Small: 12-16px
Medium: 24px
Large: 32-40px
XL: 48-64px

Backgrounds
Light Mode

Primary: #FFFFFF
Secondary: #FFF4E6 (starlight)
Accent areas: linear-gradient(135deg, #FFD8B8, #B8E6F5)

Dark Mode

Primary: #1A2332 (deep navy)
Secondary: #2D3E50 (twilight blue)
Accent areas: Subtle gradient linear-gradient(180deg, #1A2332, #2D3E50)

Interaction Patterns
Animations

Duration: 200-350ms
Easing: cubic-bezier(0.4, 0.0, 0.2, 1) (Material)
Micro-interactions:

Button press: Scale(0.96), brightness increase
Card hover: Translate Y(-4px), shadow increase, subtle glow
Page transitions: Fade + slide
Loading: Shimmer gradient or pulsing phoenix animation



Magical Moments

Story unlock: Phoenix animation flying in
Achievement: Sparkle burst effect
Level up: Gradient pulse from center
Reading milestone: Floating stars

Reading Experience Specifics
Chapter/Reading View (Light Mode)

Background: Soft gradient linear-gradient(180deg, #B8E6F5, #FFF4E6)
Text Container:

White card with #1A2332 text
Border radius: 20px
Padding: 32px
Shadow: 0 8px 32px rgba(26, 35, 50, 0.08)
Max width: 680px



Chapter/Reading View (Dark Mode)

Background: linear-gradient(180deg, #1A2332, #2D3E50)
Text Container:

#2D3E50 background
#F8FAFC text
Subtle glow: 0 0 40px rgba(79, 172, 254, 0.1)



Controls

Play button: Large circular, orange gradient
Size controls: + / - in corners
Mode toggles: Pills at top
Navigation: Subtle arrows or swipe gestures

Accessibility Considerations

Contrast Ratios:

Dark text on light: #1A2332 on #FFFFFF = 14.7:1 ✓
Light text on dark: #F8FAFC on #1A2332 = 14.3:1 ✓
Orange on white: #FF8C42 on #FFFFFF = 3.5:1 (use for accents, not body text)


Focus States: 2px solid #4FACFE outline with 2px offset
Touch Targets: Minimum 44x44px
Reduced Motion: Respect prefers-reduced-motion

Icon Style

Design: Rounded, friendly, optimistic
Weight: Medium (2px stroke)
Library: Lucide React (rounded variants) or Heroicons
Colors:

Primary actions: #FF8C42
Secondary: #4FACFE
Neutral: #64748B



Quick Reference Color Codes
css/* Brand Colors */
--phoenix-orange: #FF8C42;
--sunset-gold: #FFB347;
--deep-navy: #1A2332;
--twilight-blue: #2D3E50;

/* Sky & Magic */
--sky-blue: #4FACFE;
--aqua-glow: #00C9FF;
--soft-cyan: #B8E6F5;
--starlight: #FFF4E6;

/* Accents */
--warm-peach: #FFD8B8;
--coral: #FF6B6B;
--purple-mist: #B794F6;

/* Gradients */
--gradient-sunset: linear-gradient(135deg, #FF8C42 0%, #FFB347 100%);
--gradient-sky: linear-gradient(135deg, #4FACFE 0%, #00C9FF 100%);
--gradient-magic: linear-gradient(135deg, #FF8C42 0%, #4FACFE 100%);
--gradient-bg-light: linear-gradient(180deg, #B8E6F5, #FFF4E6);
--gradient-bg-dark: linear-gradient(180deg, #1A2332, #2D3E50);

/* Shadows */
--shadow-sm: 0 2px 8px rgba(26, 35, 50, 0.08);
--shadow-md: 0 4px 16px rgba(26, 35, 50, 0.12);
--shadow-lg: 0 8px 32px rgba(26, 35, 50, 0.16);
--shadow-glow-orange: 0 0 40px rgba(255, 140, 66, 0.3);
--shadow-glow-blue: 0 0 40px rgba(79, 172, 254, 0.2);

/* Text */
--text-dark: #1A2332;
--text-light: #F8FAFC;
--text-muted: #64748B;