// utils/export-util.js

/**
 * @fileoverview Utility for exporting family tree as a PNG image using canvas.
 */

/** @const {number} */
const NODE_WIDTH = 160;

/** @const {number} */
const NODE_HEIGHT = 60;

/** @const {number} */
const LEVEL_GAP = 100;

/** @const {number} */
const SIBLING_GAP = 40;

/** @const {number} */
const PADDING = 40;

/** @const {number} */
const FONT_SIZE = 24;

/** @const {number} */
const TITLE_FONT_SIZE = 32;

/** @const {string} */
const MALE_COLOR = '#3b82f6';

/** @const {string} */
const FEMALE_COLOR = '#ec4899';

/** @const {string} */
const LINE_COLOR = '#999999';

/** @const {string} */
const BG_COLOR = '#ffffff';

/** @const {string} */
const TEXT_COLOR = '#333333';

/** @const {string} */
const BORDER_COLOR = '#dddddd';

/**
 * Flattens tree data into generation groups.
 * @param {Object} treeData The root tree node.
 * @return {Array<{generation: number, members: Array<Object>}>}
 */
function flattenByGeneration(treeData) {
  const generationMap = {};

  /**
   * Recursively collects nodes by generation.
   * @param {Object} node The current node.
   * @param {number} gen The generation level.
   */
  function collect(node, gen) {
    if (!node) return;
    if (!generationMap[gen]) {
      generationMap[gen] = [];
    }
    generationMap[gen].push(node);
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        collect(child, gen + 1);
      }
    }
  }

  collect(treeData, treeData.generation || 1);

  return Object.keys(generationMap)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
    .map((gen) => ({
      generation: parseInt(gen, 10),
      members: generationMap[gen],
    }));
}

/**
 * Measures text width approximately.
 * @param {string} text The text to measure.
 * @param {number} fontSize The font size.
 * @return {number}
 */
function measureTextWidth(text, fontSize) {
  let width = 0;
  for (const char of String(text)) {
    width += (char.charCodeAt(0) > 127) ? fontSize : fontSize * 0.6;
  }
  return width;
}

/**
 * Draws a rounded rectangle.
 * @param {Object} ctx Canvas 2D context.
 * @param {number} x X coordinate.
 * @param {number} y Y coordinate.
 * @param {number} w Width.
 * @param {number} h Height.
 * @param {number} r Corner radius.
 */
function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * Draws a single member node on canvas.
 * @param {Object} ctx Canvas 2D context.
 * @param {Object} member The member data.
 * @param {number} x X coordinate.
 * @param {number} y Y coordinate.
 */
function drawMemberNode(ctx, member, x, y) {
  const genderColor = member.gender === 'male' ? MALE_COLOR : FEMALE_COLOR;

  // Node background
  ctx.fillStyle = '#ffffff';
  drawRoundRect(ctx, x, y, NODE_WIDTH, NODE_HEIGHT, 8);
  ctx.fill();

  // Node border
  ctx.strokeStyle = genderColor;
  ctx.lineWidth = 2;
  drawRoundRect(ctx, x, y, NODE_WIDTH, NODE_HEIGHT, 8);
  ctx.stroke();

  // Gender indicator bar on left
  ctx.fillStyle = genderColor;
  ctx.fillRect(x, y + 8, 4, NODE_HEIGHT - 16);

  // Name text
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = `bold ${FONT_SIZE}px sans-serif`;
  ctx.textBaseline = 'middle';
  const nameX = x + 16;
  const nameY = y + NODE_HEIGHT / 2 - 6;
  ctx.fillText(member.name || '未知', nameX, nameY);

  // Generation label
  ctx.fillStyle = '#888888';
  ctx.font = `18px sans-serif`;
  const genText = `第${member.generation || '-'}代`;
  ctx.fillText(genText, nameX, y + NODE_HEIGHT / 2 + 16);
}

/**
 * Draws connecting lines between parent and children.
 * @param {Object} ctx Canvas 2D context.
 * @param {number} parentX Parent center X.
 * @param {number} parentY Parent bottom Y.
 * @param {number} childX Child center X.
 * @param {number} childY Child top Y.
 */
function drawConnection(ctx, parentX, parentY, childX, childY) {
  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = 2;
  ctx.beginPath();

  const midY = parentY + (childY - parentY) / 2;

  ctx.moveTo(parentX, parentY);
  ctx.lineTo(parentX, midY);
  ctx.lineTo(childX, midY);
  ctx.lineTo(childX, childY);

  ctx.stroke();
}

/**
 * Calculates layout positions for all nodes in the tree.
 * @param {Object} treeData The root tree node.
 * @return {Object} Layout with positions and dimensions.
 */
function calculateLayout(treeData) {
  const generationGroups = flattenByGeneration(treeData);
  const positions = new Map();
  let maxWidth = 0;

  for (let i = 0; i < generationGroups.length; i++) {
    const group = generationGroups[i];
    const members = group.members;
    const rowWidth = members.length * NODE_WIDTH + (members.length - 1) * SIBLING_GAP;
    maxWidth = Math.max(maxWidth, rowWidth);

    let startX = PADDING;
    if (rowWidth < maxWidth) {
      startX = PADDING + (maxWidth - rowWidth) / 2;
    }

    for (let j = 0; j < members.length; j++) {
      const member = members[j];
      const x = startX + j * (NODE_WIDTH + SIBLING_GAP);
      const y = PADDING + TITLE_FONT_SIZE + 20 + i * (NODE_HEIGHT + LEVEL_GAP);
      positions.set(member._id || member.id, {
        x,
        y,
        member,
      });
    }
  }

  const totalHeight = PADDING + TITLE_FONT_SIZE + 20 +
    generationGroups.length * (NODE_HEIGHT + LEVEL_GAP) - LEVEL_GAP + PADDING;

  return {
    positions,
    width: maxWidth + PADDING * 2,
    height: totalHeight,
    generationGroups,
  };
}

/**
 * Draws the complete family tree on a canvas.
 * @param {Object} ctx Canvas 2D context.
 * @param {Object} treeData The root tree node.
 * @param {string} familyName The family name for title.
 * @return {Object} The layout dimensions.
 */
function drawTreeOnCanvas(ctx, treeData, familyName) {
  const layout = calculateLayout(treeData);
  const {positions, width, height} = layout;

  // Clear background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, width, height);

  // Draw title
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = `bold ${TITLE_FONT_SIZE}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const title = familyName ? `${familyName}家谱` : '家族谱系图';
  ctx.fillText(title, width / 2, PADDING);
  ctx.textAlign = 'left';

  // Draw connections first (behind nodes)
  /**
   * Recursively draws connections from a node to its children.
   * @param {Object} node The current node.
   */
  function drawNodeConnections(node) {
    if (!node || !node.children || node.children.length === 0) return;

    const parentPos = positions.get(node._id || node.id);
    if (!parentPos) return;

    const parentX = parentPos.x + NODE_WIDTH / 2;
    const parentY = parentPos.y + NODE_HEIGHT;

    for (const child of node.children) {
      const childPos = positions.get(child._id || child.id);
      if (childPos) {
        const childX = childPos.x + NODE_WIDTH / 2;
        const childY = childPos.y;
        drawConnection(ctx, parentX, parentY, childX, childY);
      }
      drawNodeConnections(child);
    }
  }

  drawNodeConnections(treeData);

  // Draw nodes
  for (const [, pos] of positions) {
    drawMemberNode(ctx, pos.member, pos.x, pos.y);
  }

  return {width, height};
}

/**
 * Exports the family tree as a PNG image.
 * @param {Object} treeData The root tree node.
 * @param {string} familyName Optional family name for title.
 * @return {Promise<string>} Resolves with temp file path.
 */
function exportTreeAsImage(treeData, familyName) {
  return new Promise((resolve, reject) => {
    if (!treeData) {
      reject(new Error('No tree data provided'));
      return;
    }

    // Create offscreen canvas
    const query = wx.createSelectorQuery();
    query.select('#exportCanvas')
      .fields({node: true, size: true})
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          // Fallback: create canvas without selector
          createCanvasAndExport(treeData, familyName, resolve, reject);
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');

        // Calculate layout first to determine canvas size
        const layout = calculateLayout(treeData);
        const dpr = wx.getSystemInfoSync().pixelRatio;

        canvas.width = layout.width * dpr;
        canvas.height = layout.height * dpr;
        ctx.scale(dpr, dpr);

        drawTreeOnCanvas(ctx, treeData, familyName);

        // Export to temp file
        wx.canvasToTempFilePath({
          canvas,
          success: (result) => {
            resolve(result.tempFilePath);
          },
          fail: (err) => {
            reject(err);
          },
        });
      });
  });
}

/**
 * Creates a canvas programmatically and exports the tree.
 * @param {Object} treeData The root tree node.
 * @param {string} familyName The family name.
 * @param {Function} resolve Promise resolve.
 * @param {Function} reject Promise reject.
 */
function createCanvasAndExport(treeData, familyName, resolve, reject) {
  try {
    // Use offscreen canvas API
    const dpr = wx.getSystemInfoSync().pixelRatio;
    const layout = calculateLayout(treeData);

    const canvas = wx.createOffscreenCanvas({
      type: '2d',
      width: Math.ceil(layout.width * dpr),
      height: Math.ceil(layout.height * dpr),
    });

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    drawTreeOnCanvas(ctx, treeData, familyName);

    wx.canvasToTempFilePath({
      canvas,
      success: (result) => {
        resolve(result.tempFilePath);
      },
      fail: (err) => {
        reject(err);
      },
    });
  } catch (err) {
    reject(err);
  }
}

/**
 * Saves an image to the device photo album.
 * @param {string} filePath The temp file path.
 * @return {Promise<Object>}
 */
function saveImageToAlbum(filePath) {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: resolve,
      fail: (err) => {
        if (err.errMsg && err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '需要授权',
            content: '请允许保存图片到相册',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting({
                  success: (settingRes) => {
                    if (settingRes.authSetting['scope.writePhotosAlbum']) {
                      wx.saveImageToPhotosAlbum({
                        filePath,
                        success: resolve,
                        fail: reject,
                      });
                    } else {
                      reject(new Error('User denied album permission'));
                    }
                  },
                });
              } else {
                reject(new Error('User cancelled save'));
              }
            },
          });
        } else {
          reject(err);
        }
      },
    });
  });
}

/**
 * Shares an image via WeChat.
 * @param {string} filePath The temp file path.
 * @param {string} title Optional share title.
 * @return {Promise<Object>}
 */
function shareImage(filePath, title) {
  return new Promise((resolve, reject) => {
    wx.shareAppMessage({
      title: title || '家族谱系图',
      imageUrl: filePath,
      success: resolve,
      fail: reject,
    });
  });
}

/**
 * Shows an action sheet to choose save or share.
 * @param {string} filePath The temp file path.
 * @param {string} familyName The family name.
 * @return {Promise<Object>}
 */
function showExportOptions(filePath, familyName) {
  return new Promise((resolve) => {
    wx.showActionSheet({
      itemList: ['保存到相册', '分享给好友'],
      success: (res) => {
        if (res.tapIndex === 0) {
          saveImageToAlbum(filePath)
            .then(() => {
              wx.showToast({
                title: '已保存到相册',
                icon: 'success',
              });
              resolve({action: 'save', success: true});
            })
            .catch((err) => {
              wx.showToast({
                title: '保存失败',
                icon: 'none',
              });
              resolve({action: 'save', success: false, error: err});
            });
        } else if (res.tapIndex === 1) {
          shareImage(filePath, familyName ? `${familyName}家谱` : '家族谱系图')
            .then(() => {
              resolve({action: 'share', success: true});
            })
            .catch((err) => {
              wx.showToast({
                title: '分享失败',
                icon: 'none',
              });
              resolve({action: 'share', success: false, error: err});
            });
        }
      },
      fail: () => {
        resolve({action: 'cancel', success: false});
      },
    });
  });
}

/**
 * Main export function: generates image and presents options.
 * @param {Object} treeData The root tree node.
 * @param {string} familyName Optional family name.
 * @return {Promise<Object>}
 */
async function exportFamilyTree(treeData, familyName) {
  wx.showLoading({
    title: '生成图片中...',
    mask: true,
  });

  try {
    const filePath = await exportTreeAsImage(treeData, familyName);
    wx.hideLoading();
    const result = await showExportOptions(filePath, familyName);
    return {success: true, filePath, ...result};
  } catch (err) {
    wx.hideLoading();
    wx.showToast({
      title: '导出失败',
      icon: 'none',
    });
    return {success: false, error: err};
  }
}

module.exports = {
  exportFamilyTree,
  exportTreeAsImage,
  saveImageToAlbum,
  shareImage,
  showExportOptions,
  drawTreeOnCanvas,
  calculateLayout,
};
