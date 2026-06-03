/**
 * @fileoverview Tests for mindmap-adapter.js
 */

const {treeToMindmap} = require('../miniprogram/utils/mindmap-adapter');

describe('treeToMindmap', () => {
  test('transforms single node correctly', () => {
    const treeData = {
      id: '1',
      name: '张三',
      generation: 1,
      children: [],
    };

    const expected = {
      id: '1',
      label: '张三',
      generation: 1,
      children: [],
    };

    expect(treeToMindmap(treeData)).toEqual(expected);
  });

  test('transforms node with children recursively', () => {
    const treeData = {
      id: '1',
      name: '张三',
      generation: 1,
      children: [
        {
          id: '2',
          name: '张四',
          generation: 2,
          children: [],
        },
      ],
    };

    const expected = {
      id: '1',
      label: '张三',
      generation: 1,
      children: [
        {
          id: '2',
          label: '张四',
          generation: 2,
          children: [],
        },
      ],
    };

    expect(treeToMindmap(treeData)).toEqual(expected);
  });

  test('transforms deeply nested tree', () => {
    const treeData = {
      id: '1',
      name: '张三',
      generation: 1,
      children: [
        {
          id: '2',
          name: '张四',
          generation: 2,
          children: [
            {
              id: '3',
              name: '张五',
              generation: 3,
              children: [],
            },
          ],
        },
      ],
    };

    const expected = {
      id: '1',
      label: '张三',
      generation: 1,
      children: [
        {
          id: '2',
          label: '张四',
          generation: 2,
          children: [
            {
              id: '3',
              label: '张五',
              generation: 3,
              children: [],
            },
          ],
        },
      ],
    };

    expect(treeToMindmap(treeData)).toEqual(expected);
  });

  test('preserves empty children array', () => {
    const treeData = {
      id: '1',
      name: '张三',
      generation: 1,
      children: [],
    };

    const result = treeToMindmap(treeData);

    expect(result.children).toEqual([]);
    expect(Array.isArray(result.children)).toBe(true);
  });
});
