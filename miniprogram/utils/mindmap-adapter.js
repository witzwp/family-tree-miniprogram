/**
 * @fileoverview Adapter to transform treeData format to F6 graph format.
 */

/**
 * Transforms a treeData node into F6 mindmap graph format.
 * Converts `name` to `label` and recursively processes children.
 *
 * @param {Object} node A treeData node.
 * @param {string} node.id Unique identifier.
 * @param {string} node.name Display name.
 * @param {number} node.generation Generation level.
 * @param {Array<Object>} node.children Child nodes.
 * @return {Object} F6 graph format node.
 */
const treeToMindmap = (node) => {
  return {
    id: node.id,
    label: node.name,
    generation: node.generation,
    children: node.children.map(treeToMindmap),
  };
};

module.exports = {
  treeToMindmap,
};
