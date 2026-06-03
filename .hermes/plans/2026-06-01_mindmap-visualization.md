# Mindmap Visualization Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Implement mindmap (brain map) visualization for family tree using AntV F6

**Architecture:** 
- Use AntV F6 graph engine for mindmap layout
- Create data adapter to transform treeData → F6 graph data
- Add mindmap view mode alongside existing tree/list views
- Keep changes minimal and focused

**Tech Stack:** WeChat Mini Program, AntV F6, JavaScript

---

## Task 1: Install F6 Dependency

**Objective:** Add @antv/f6-wx to the project

**Files:**
- Modify: `miniprogram/package.json` (create if not exists)

**Step 1:** Check if package.json exists
**Step 2:** Add `@antv/f6-wx` dependency
**Step 3:** Run npm install (or document manual install for WeChat)

**Verification:**
- `miniprogram/node_modules/@antv/f6-wx/` exists

---

## Task 2: Create Mindmap Data Adapter

**Objective:** Transform treeData format to F6 graph format

**Files:**
- Create: `miniprogram/utils/mindmap-adapter.js`

**Step 1:** Write failing test
```javascript
// tests/mindmap-adapter.test.js (or manual verification)
const { treeToMindmap } = require('../utils/mindmap-adapter')

const treeData = {
  id: '1',
  name: '张三',
  generation: 1,
  children: [
    { id: '2', name: '张四', generation: 2, children: [] }
  ]
}

const result = treeToMindmap(treeData)
assert(result.id === '1')
assert(result.label === '张三')
assert(result.children.length === 1)
assert(result.children[0].label === '张四')
```

**Step 2:** Run test to verify failure
**Step 3:** Implement adapter
```javascript
function treeToMindmap(node) {
  return {
    id: node.id,
    label: node.name,
    generation: node.generation,
    children: (node.children || []).map(treeToMindmap)
  }
}
```

**Step 4:** Run test to verify pass
**Step 5:** Commit

---

## Task 3: Implement Mindmap Component

**Objective:** Create mindmap visualization component using F6

**Files:**
- Create: `miniprogram/components/mindmap/mindmap.js`
- Create: `miniprogram/components/mindmap/mindmap.wxml`
- Create: `miniprogram/components/mindmap/mindmap.wxss`
- Create: `miniprogram/components/mindmap/mindmap.json`

**Step 1:** Write component structure
**Step 2:** Initialize F6 graph in attached lifecycle
**Step 3:** Render mindmap layout
**Step 4:** Handle node tap events
**Step 5:** Add zoom/pan controls

**Verification:**
- Component renders without errors
- Nodes display with names
- Clicking node triggers event

---

## Task 4: Integrate Mindmap into Tree Page

**Objective:** Connect mindmap component to existing tree page

**Files:**
- Modify: `miniprogram/pages/family/tree.wxml`
- Modify: `miniprogram/pages/family/tree.js`
- Modify: `miniprogram/app.json` (register component)

**Step 1:** Add mindmap component registration
**Step 2:** Add view mode switching UI
**Step 3:** Pass treeData to mindmap component
**Step 4:** Handle mindmap node tap

**Verification:**
- Switching to mindmap mode shows visualization
- Data flows correctly from page to component
- Node clicks navigate to detail page

---

## Task 5: Final Integration Test

**Objective:** Verify all view modes work together

**Files:**
- All modified files

**Step 1:** Test tree view still works
**Step 2:** Test list view still works
**Step 3:** Test mindmap view works
**Step 4:** Test view mode switching
**Step 5:** Verify no console errors

**Commit:** Final commit with all changes
