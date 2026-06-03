# Family Tree Mini Program - All Features Implementation Plan

## Feature 1: Search with Autocomplete
- Modify: miniprogram/pages/search/index.js
- Modify: miniprogram/pages/search/index.wxml
- Modify: miniprogram/pages/search/index.wxss
- Add: Cloud function searchMembers (fuzzy search)
- Add: Debounced input handler
- Add: Recent searches cache

## Feature 2: Member Statistics Dashboard
- Create: miniprogram/pages/statistics/index.js
- Create: miniprogram/pages/statistics/index.wxml
- Create: miniprogram/pages/statistics/index.wxss
- Create: miniprogram/pages/statistics/index.json
- Add: Cloud function getStatistics
- Add: Charts using wx-charts or canvas

## Feature 3: Export Family Tree to PDF/Image
- Create: miniprogram/utils/export-util.js
- Modify: miniprogram/pages/family/tree.js
- Add: Export button in UI
- Add: Canvas-to-image conversion
- Add: wx.cloud.uploadFile for sharing

## Feature 4: Multi-Family Support
- Modify: miniprogram/app.js (family context)
- Create: miniprogram/pages/family/select.js
- Add: Cloud function family CRUD
- Modify: All pages to use currentFamilyId

## Feature 5: Timeline View
- Create: miniprogram/pages/family/timeline.js
- Create: miniprogram/pages/family/timeline.wxml
- Create: miniprogram/pages/family/timeline.wxss
- Create: miniprogram/pages/family/timeline.json
- Add: Sort members by birth year
- Add: Era markers and generation grouping
