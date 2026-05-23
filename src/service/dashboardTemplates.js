/*
 * Shared dashboard layout templates. Used by:
 *   - BeginnerDashboard.vue          — the "Pre-made" section of the
 *                                      layout settings dropdown.
 *   - LayoutChooserStep.vue          — first-boot wizard step where
 *                                      the user picks a starting layout.
 *   - Welcome.vue                    — applies the chosen template to
 *                                      localStorage on wizard finish.
 *
 * Each template's `cols` may be either a legacy string[] (flat column,
 * widget keys) OR the new { widgets, subCols } shape. BeginnerDashboard's
 * normalizeColumn handles both.
 */

export const TEMPLATES = [
  {
    key: 'builtin-default',
    name: 'Default',
    description: 'Clock + weather, apps in the middle, family on the side.',
    cols: [
      { widgets: ['clock', 'weather'], subCols: null },
      { widgets: ['apps', 'search', 'addDevice'], subCols: null },
      { widgets: ['tips', 'family', 'files'], subCols: null },
    ],
    weights: [0.75, 1.75, 0.7],
  },
  {
    key: 'builtin-essential-1',
    name: 'Essential 1',
    description: 'Clock + recent on the left, search and apps in the middle.',
    cols: [
      ['clock', 'recent'],
      ['search', 'apps', 'sysInfo'],
      ['weather', 'files', 'family', 'addDevice'],
    ],
    weights: [0.75, 1.63, 0.62],
  },
  {
    key: 'builtin-minimalist-1',
    name: 'Minimalist 1',
    description: 'Two-column setup with the essentials only.',
    cols: [
      ['search', 'clock', 'weather', 'addDevice'],
      ['apps', 'files', 'family'],
    ],
    weights: [1, 1],
  },
  {
    key: 'builtin-simple-1',
    name: 'Simple 1',
    description: 'Search + apps on the left, time + weather on the right.',
    cols: [
      ['search', 'apps'],
      ['clock', 'weather'],
    ],
    weights: [1, 1],
  },
  {
    key: 'builtin-full-1',
    name: 'Full 1',
    description: 'Clock + weather, the search/family stack, and an app shortcuts column.',
    cols: [
      ['clock', 'weather'],
      ['search', 'family', 'addDevice', 'files'],
      ['app:immich', 'app:jellyfin', 'app:filebrowser', 'app:homeassistant', 'app:pihole'],
    ],
    weights: [1, 1, 1],
  },
  {
    key: 'builtin-full-2',
    name: 'Full 2',
    description: 'Four-column dashboard — everything turned on.',
    cols: [
      { widgets: ['clock', 'weather', 'sysInfo'], subCols: null },
      { widgets: ['recent', 'family'], subCols: null },
      { widgets: ['search', 'apps', 'tips'], subCols: null },
      { widgets: ['appsRunning', 'files', 'addDevice', 'storage', 'network'], subCols: null },
    ],
    weights: [1, 1, 1, 1],
  },
]

export function templateByKey(key) {
  return TEMPLATES.find(t => t.key === key) || null
}
