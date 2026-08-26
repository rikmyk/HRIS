// HRIS Mobile Design System Tokens (ADR-008 & 11-DESIGN-SYSTEM.md)

export const getThemeColors = (isDark: boolean) => ({
  ink: isDark ? '#F8FAFC' : '#1B2430',          // Text color
  darkInk: isDark ? '#F8FAFC' : '#1B2430',      // Alias
  primary: '#2F6F5E',      // Forest green
  forestGreen: '#2F6F5E',  // Alias
  primaryDark: '#204F42',  // Dark green
  accent: '#E8A33D',       // Amber
  bg: isDark ? '#0F172A' : '#FFFFFF',           // Screen background (Dark navy vs Pure white)
  creamBg: isDark ? '#0F172A' : '#FFFFFF',      // Alias
  surface: isDark ? '#1E293B' : '#FFFFFF',      // Cards & Sheets
  cardBg: isDark ? '#1E293B' : '#FFFFFF',
  subCardBg: isDark ? '#334155' : '#F8FAFC',
  danger: '#E11D48',
  muted: isDark ? '#94A3B8' : '#6B7280',        // Secondary text label
  mutedText: isDark ? '#94A3B8' : '#6B7280',    // Alias
  line: isDark ? '#334155' : '#E2E8F0',         // Border line
  lineBorder: isDark ? '#334155' : '#E2E8F0',   // Alias
  headerBg: isDark ? '#1E293B' : '#FFFFFF',
  tabBarBg: isDark ? '#1E293B' : '#FFFFFF',
  modalBg: isDark ? '#1E293B' : '#FFFFFF',
});

export const Colors = getThemeColors(false);

export const Typography = {
  fontFamilyRegular: 'System',
  fontFamilyBold: 'System',
};

export const Radius = {
  default: 14,
  pill: 999,
  card: 16,
  md: 12,
  lg: 16,
};
